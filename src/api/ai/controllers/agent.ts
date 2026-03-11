import OpenAI from "openai";
import dotenv from "dotenv";

import createContentType from "../services/createContentType";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

/* ------------------------------------------------ */
/* SYSTEM PROMPT */
/* ------------------------------------------------ */

const BASE_PROMPT = `
You are a Strapi CMS AI Copilot.

You can:
- answer general questions like ChatGPT
- inspect the CMS using tools
- help users understand schemas and content

Rules:
- Only operate on api:: content types
- Never modify admin:: or strapi:: types
- Use tools when the question requires CMS data
`;

/* ------------------------------------------------ */
/* TOOLS */
/* ------------------------------------------------ */

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "list_content_types",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_schema",
      parameters: {
        type: "object",
        properties: { uid: { type: "string" } },
        required: ["uid"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_content_type",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          displayName: { type: "string" },
          attributes: { type: "object" },
        },
        required: ["name", "displayName", "attributes"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_content_type",
      parameters: {
        type: "object",
        properties: {
          uid: { type: "string" },
          attributes: { type: "object" },
        },
        required: ["uid", "attributes"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_entries",
      parameters: {
        type: "object",
        properties: {
          uid: { type: "string" },
          limit: { type: "number" },
        },
        required: ["uid"],
      },
    },
  },
];

/* ------------------------------------------------ */
/* CMS HELPERS */
/* ------------------------------------------------ */

function getSchemas() {
  return Object.entries(strapi.contentTypes)
    .filter(([uid]) => uid.startsWith("api::"))
    .reduce(
      (acc, [uid, schema]) => {
        acc[uid] = {
          uid,
          attributes: (schema as any).attributes,
        };
        return acc;
      },
      {} as Record<string, any>,
    );
}

function assertSafe(uid: string) {
  if (!uid.startsWith("api::")) {
    throw new Error(`Restricted UID: ${uid}`);
  }
}

/* ------------------------------------------------ */
/* TOOL EXECUTION */
/* ------------------------------------------------ */

async function runAction(name: string, args: any) {
  switch (name) {
    case "list_content_types":
      return Object.keys(getSchemas());

    case "get_schema":
      assertSafe(args.uid);
      return strapi.contentTypes[args.uid];

    case "create_content_type":
      if (!args.attributes || Object.keys(args.attributes).length === 0) {
        args.attributes = {
          title: { type: "string", required: true },
          description: { type: "text" },
        };
      }
      return createContentType(args);

    case "update_content_type": {
      assertSafe(args.uid);

      const existing = strapi.contentTypes[args.uid];

      const mergedAttributes = {
        ...existing.attributes,
        ...(args.attributes || {}),
      };

      return strapi
        .plugin("content-type-builder")
        .services["content-types"].editContentType(args.uid, {
          contentType: {
            displayName: existing.info.displayName,
            attributes: mergedAttributes,
          },
        });
    }

    case "list_entries":
      assertSafe(args.uid);

      return strapi.entityService.findMany(args.uid, {
        limit: args.limit || 20,
        populate: "*",
      });

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/* ------------------------------------------------ */
/* AGENT LOOP */
/* ------------------------------------------------ */

async function runAgent(userMessage: string, customPrompt?: string) {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `
${BASE_PROMPT}

${customPrompt || ""}

Available CMS content types:
${JSON.stringify(Object.keys(getSchemas()))}
`,
    },
    {
      role: "user",
      content: userMessage,
    },
  ];

  const timeline: string[] = [];
  const results: any[] = [];
  let finalMessage = "";

  for (let i = 0; i < 6; i++) {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages,
      tools: TOOLS,
      tool_choice: "auto",
    });

    const msg = response.choices[0].message;
    messages.push(msg);

    /* -------- normal chat response -------- */

    if (!msg.tool_calls) {
      finalMessage = msg.content || "";
      break;
    }

    /* -------- tool execution -------- */

    for (const call of msg.tool_calls) {
      if (call.type !== "function") continue;

      const name = call.function.name;
      const args = JSON.parse(call.function.arguments);

      timeline.push(`Running ${name}`);

      try {
        const result = await runAction(name, args);

        results.push({ tool: name, success: true });

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      } catch (error: any) {
        results.push({
          tool: name,
          success: false,
          error: error.message,
        });

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify({ error: error.message }),
        });
      }
    }
  }

  return {
    success: results.every((r) => r.success),
    timeline,
    results,
    message: finalMessage,
  };
}

/* ------------------------------------------------ */
/* CONTROLLER */
/* ------------------------------------------------ */

export default {
  async agent(ctx) {
    const { message, prompt } = ctx.request.body;

    if (!message) {
      return ctx.badRequest("Message required");
    }

    try {
      const result = await runAgent(message, prompt);

      return ctx.send({
        ...result,
        notify: {
          type: result.success ? "success" : "warning",
          message: result.message || "AI execution finished",
        },
      });
    } catch (error: any) {
      return ctx.send({
        success: false,
        error: error.message,
      });
    }
  },
};
