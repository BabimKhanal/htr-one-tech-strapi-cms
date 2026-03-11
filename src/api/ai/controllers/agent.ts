import OpenAI from "openai";
import dotenv from "dotenv";
import createContentType from "../services/createContentType";
import addRelationToContentType from "../services/relation";
import {
  generateEntriesFromSchema,
  bulkInsertEntries,
} from "../services/entry";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const SYSTEM_PROMPT = `
You are a highly capable Strapi CMS AI Copilot and Content Engineer.

Your goal is to satisfy the user's request efficiently and accurately by using the available tools.
You can perform multiple steps, such as creating a content type, then immediately adding relations, and finally populating it with data.

REASONING RULES:
1. Always "think" before acting. Analyze the request and plan your steps.
2. If you need information you don't have (like a schema), use 'get_schema' or 'get_all_schemas' first.
3. Be proactive: if a user wants a "Blog system", create the 'Post', 'Category', and 'Author' types, link them, and maybe add some sample data.
4. When creating relations, ensure both sides exist or create them first.
5. Use 'final_response' to provide a human-friendly summary of what you've done once the task is finished.

SAFETY RULES:
1. Never modify internal Strapi types (starting with 'admin::' or 'strapi::').
2. Always assert that UIDs start with 'api::'.
3. If an error occurs, try to fix it or explain it in your final response.
`;

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "list_content_types",
      description: "List all user-defined content types (UIDs).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_all_schemas",
      description: "Get the full schema for all user-defined content types.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_schema",
      description: "Get the schema for a specific content type UID.",
      parameters: {
        type: "object",
        properties: {
          uid: { type: "string", description: "The UID of the content type (e.g., api::article.article)" },
        },
        required: ["uid"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_content_type",
      description: "Create a new content type.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Singular name (e.g., 'article')" },
          displayName: { type: "string", description: "Human readable name (e.g., 'Article')" },
          attributes: { type: "object", description: "Strapi attributes object" },
        },
        required: ["name", "displayName", "attributes"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_relation",
      description: "Add a relation attribute between two content types.",
      parameters: {
        type: "object",
        properties: {
          sourceUid: { type: "string" },
          attributeName: { type: "string" },
          targetUid: { type: "string" },
          relation: {
            type: "string",
            enum: ["oneToOne", "oneToMany", "manyToOne", "manyToMany"],
          },
        },
        required: ["sourceUid", "attributeName", "targetUid", "relation"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "insert_entry",
      description: "Insert a single entry into a content type.",
      parameters: {
        type: "object",
        properties: {
          uid: { type: "string" },
          data: { type: "object" },
        },
        required: ["uid", "data"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "bulk_insert_entries",
      description: "Insert multiple entries into a content type.",
      parameters: {
        type: "object",
        properties: {
          uid: { type: "string" },
          entries: { type: "array", items: { type: "object" } },
        },
        required: ["uid", "entries"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_entries",
      description: "Use AI to generate realistic entries based on a schema and a prompt.",
      parameters: {
        type: "object",
        properties: {
          uid: { type: "string" },
          prompt: { type: "string", description: "Description of what kind of data to generate" },
          count: { type: "number", default: 5 },
        },
        required: ["uid", "prompt"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_entries",
      description: "List entries for a specific content type UID.",
      parameters: {
        type: "object",
        properties: {
          uid: { type: "string" },
          limit: { type: "number", default: 20 },
        },
        required: ["uid"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_content_type",
      description: "Update an existing content type's schema.",
      parameters: {
        type: "object",
        properties: {
          uid: { type: "string" },
          displayName: { type: "string" },
          attributes: { type: "object" },
        },
        required: ["uid", "attributes"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "final_response",
      description: "Call this when you have finished the task to provide a summary to the user.",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "Summary of actions taken and results." },
        },
        required: ["message"],
      },
    },
  },
];

function getUserContentTypes() {
  return Object.entries(strapi.contentTypes)
    .filter(([uid]) => uid.startsWith("api::"))
    .reduce(
      (acc, [uid, schema]) => {
        acc[uid] = {
          uid,
          info: (schema as any).info,
          attributes: (schema as any).attributes,
        };
        return acc;
      },
      {} as Record<string, any>,
    );
}

function assertSafeUID(uid: string) {
  if (uid && !uid.startsWith("api::")) {
    throw new Error(`Restricted UID: ${uid}. Only 'api::' UIDs are allowed.`);
  }
}

async function runAction(name: string, args: any) {
  if (args.uid) assertSafeUID(args.uid);
  if (args.sourceUid) assertSafeUID(args.sourceUid);
  if (args.targetUid) assertSafeUID(args.targetUid);

  switch (name) {
    case "list_content_types":
      return { success: true, data: Object.keys(getUserContentTypes()) };

    case "get_all_schemas":
      return { success: true, data: getUserContentTypes() };

    case "get_schema":
      return { success: true, schema: strapi.contentTypes[args.uid] };

    case "create_content_type": {
      const schema = await createContentType(args);
      return { success: true, schema };
    }

    case "update_content_type": {
      const updated = await strapi
        .plugin("content-type-builder")
        .services["content-types"].editContentType(args.uid, {
          contentType: args,
        });
      return { success: true, data: updated };
    }

    case "create_relation": {
      const result = await addRelationToContentType(args);
      return { success: true, data: result };
    }

    case "insert_entry": {
      const entry = await (strapi.entityService as any).create(args.uid, { data: args.data });
      return { success: true, entry };
    }

    case "bulk_insert_entries": {
      const results = await bulkInsertEntries(args.uid, args.entries);
      return { success: true, results };
    }

    case "generate_entries": {
      const entries = await generateEntriesFromSchema({
        uid: args.uid,
        prompt: args.prompt,
        count: args.count,
        callAI: async (msgs) => {
          const res = await openai.chat.completions.create({
            model: "openai/gpt-4o-mini",
            messages: msgs,
            response_format: { type: "json_object" },
          });
          const content = res.choices[0].message.content || "{}";
          return JSON.parse(content);
        },
      });
      return { success: true, data: entries };
    }

    case "list_entries": {
      const entries = await (strapi.entityService as any).findMany(args.uid, {
        limit: args.limit || 20,
        populate: "*",
      });
      return { success: true, data: entries };
    }

    default:
      throw new Error(`Tool ${name} not implemented.`);
  }
}

async function runAgentLoop(userMessage: string) {
  const messages: any[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "system", content: `Current CMS context (summary): ${JSON.stringify(Object.keys(getUserContentTypes()))}` },
    { role: "user", content: userMessage },
  ];

  const timeline: string[] = [];
  const results: any[] = [];
  let responseMessage = "";

  for (let i = 0; i < 10; i++) {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages,
      tools: TOOLS,
      tool_choice: "auto",
    });

    const aiMsg = response.choices[0].message;
    messages.push(aiMsg);

    if (aiMsg.content) {
      timeline.push(`AI: ${aiMsg.content}`);
    }

    if (!aiMsg.tool_calls || aiMsg.tool_calls.length === 0) {
      if (aiMsg.content) {
        responseMessage = aiMsg.content;
        break;
      }
      continue;
    }

    for (const toolCall of aiMsg.tool_calls) {
      if (toolCall.type !== "function") continue;
      
      const name = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      if (name === "final_response") {
        responseMessage = args.message;
        timeline.push(`Task Completed: ${args.message}`);
        return { success: true, timeline, results, message: responseMessage };
      }

      timeline.push(`Executing ${name}...`);

      try {
        const result = await runAction(name, args);
        results.push({ tool: name, args, ...result });
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
        timeline.push(`Success: ${name}`);
      } catch (error: any) {
        results.push({ tool: name, args, success: false, error: error.message });
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({ success: false, error: error.message }),
        });
        timeline.push(`Error in ${name}: ${error.message}`);
      }
    }
  }

  return {
    success: results.every((r) => r.success),
    timeline,
    results,
    message: responseMessage || "Agent finished execution.",
  };
}

export default {
  async agent(ctx) {
    const { message } = ctx.request.body;

    if (!message) {
      return ctx.badRequest("Message is required");
    }

    try {
      const agentResult = await runAgentLoop(message);

      return ctx.send({
        ...agentResult,
        notify: {
          type: agentResult.success ? "success" : "warning",
          message: agentResult.message,
        },
      });
    } catch (error: any) {
      console.error("AI Agent Error:", error);
      return ctx.send({
        success: false,
        error: error.message,
        notify: {
          type: "danger",
          message: `AI operation failed: ${error.message}`,
        },
      });
    }
  },
};
