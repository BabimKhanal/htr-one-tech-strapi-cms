import OpenAI from "openai";
import dotenv from "dotenv";
import createContentType from "../services/createContentType";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

/* ------------------------------------------------ */
/* CONSTANTS */
/* ------------------------------------------------ */

const MAX_AGENT_STEPS = 6;
const MAX_TOOL_CALLS = 4;

const SAFE_ATTRIBUTE_TYPES = [
  "string",
  "text",
  "richtext",
  "integer",
  "biginteger",
  "float",
  "decimal",
  "boolean",
  "date",
  "datetime",
  "json",
  "uid",
  "email",
  "enumeration",
  "relation",
  "media",
];

const PROTECTED_FIELDS = ["id", "createdAt", "updatedAt", "publishedAt"];

/* ------------------------------------------------ */
/* SYSTEM PROMPT */
/* ------------------------------------------------ */

const BASE_PROMPT = `
You are a Strapi CMS AI Copilot.

Capabilities:
- Answer CMS questions
- Inspect schemas
- Generate content types
- Read entries

Safety Rules:
- Only operate on api:: content types
- Never access admin:: or strapi:: models
- Never modify protected fields
- Always validate schemas
`;

/* ------------------------------------------------ */
/* TOOL DEFINITIONS */
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
        properties: {
          uid: { type: "string" },
        },
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
/* VALIDATION */
/* ------------------------------------------------ */

function assertSafe(uid: string) {
  if (!uid.startsWith("api::")) {
    throw new Error(`Access denied for ${uid}`);
  }
}

function validateAttributes(attributes: any) {
  for (const [key, value] of Object.entries(attributes)) {
    const attr: any = value;

    if (PROTECTED_FIELDS.includes(key)) {
      throw new Error(`Field "${key}" is protected`);
    }

    if (!SAFE_ATTRIBUTE_TYPES.includes(attr.type)) {
      throw new Error(`Unsafe attribute type: ${attr.type}`);
    }

    if (attr.target?.startsWith("admin::")) {
      throw new Error("Relations to admin models forbidden");
    }

    if (attr.target?.startsWith("strapi::")) {
      throw new Error("Relations to core models forbidden");
    }
  }
}

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
      validateAttributes(args.attributes);

      return createContentType(args);

    case "update_content_type": {
      assertSafe(args.uid);
      validateAttributes(args.attributes);

      const existing = strapi.contentTypes[args.uid];

      const merged = {
        ...existing.attributes,
        ...args.attributes,
      };

      return strapi
        .plugin("content-type-builder")
        .services["content-types"].editContentType(args.uid, {
          contentType: {
            displayName: existing.info.displayName,
            attributes: merged,
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
  const actions: any[] = [];
  const results: any[] = [];

  let toolCalls = 0;
  let finalMessage = "";

  for (let i = 0; i < MAX_AGENT_STEPS; i++) {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages,
      tools: TOOLS,
      tool_choice: "auto",
    });

    const msg = response.choices[0].message;
    messages.push(msg);

    if (!msg.tool_calls) {
      finalMessage = msg.content || "";
      break;
    }

    for (const call of msg.tool_calls) {
      if (call.type !== "function") continue;

      toolCalls++;
      if (toolCalls > MAX_TOOL_CALLS) {
        throw new Error("Too many tool calls");
      }

      const name = call.function.name;
      const args = JSON.parse(call.function.arguments);

      timeline.push(`Running ${name}`);

      actions.push({ tool: name, args });

      try {
        const result = await runAction(name, args);

        results.push({
          tool: name,
          success: true,
          data: result,
        });

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
    actions,
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

      ctx.send({
        ...result,
        notify: {
          type: result.success ? "success" : "warning",
          message: result.message || "AI execution finished",
        },
      });
    } catch (error: any) {
      ctx.send({
        success: false,
        error: error.message,
      });
    }
  },
};
