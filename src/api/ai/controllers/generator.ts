"use strict";

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

/* ------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------ */

function normalizeFields(fields = []) {
  return fields.map((f) =>
    typeof f === "string" ? { name: f, type: "string" } : f,
  );
}

function buildFieldInstructions(fields) {
  return fields
    .map((field) => {
      let instruction = `- "${field.name}": Must be a ${field.type || "string"}.`;

      if (field.maxLength) {
        instruction += ` Maximum ${field.maxLength} characters.`;
      }

      if (field.type === "blocks" || field.name === "content") {
        instruction += ` Return as an ARRAY of Strapi Block objects.`;
      }

      return instruction;
    })
    .join("\n");
}

function buildPrompt(topic, fieldInstructions) {
  return `
You generate CMS content for Strapi.

Topic:
${topic}

Fields:
${fieldInstructions}

RULES:
- Return ONLY a raw JSON object.
- Use EXACT field names.
- If a field is "content", return an ARRAY of Strapi Block objects.

BLOCK FORMAT EXAMPLE:
[
  {
    "type": "heading",
    "level": 2,
    "children": [{ "type": "text", "text": "Title" }]
  },
  {
    "type": "paragraph",
    "children": [{ "type": "text", "text": "Body text" }]
  }
]
`.trim();
}

function cleanJson(text) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

function parseAIResponse(raw) {
  try {
    return JSON.parse(cleanJson(raw));
  } catch (err) {
    throw new Error(`Invalid AI JSON: ${raw}`);
  }
}

function transformBlocks(data) {
  const result = {};

  Object.keys(data).forEach((key) => {
    if (key === "content") {
      if (Array.isArray(data[key])) {
        result[key] = data[key];
      } else if (typeof data[key] === "string") {
        result[key] = data[key].split("\n\n").map((p) => ({
          type: "paragraph",
          children: [{ type: "text", text: p }],
        }));
      }
    } else {
      result[key] = data[key];
    }
  });

  return result;
}

/* ------------------------------------------------ */
/* Controller */
/* ------------------------------------------------ */

module.exports = {
  async generate(ctx) {
    try {
      const { topic, fields } = ctx.request.body;

      if (!topic || !fields) {
        ctx.throw(400, "Topic and fields are required");
      }

      const normalizedFields = normalizeFields(fields);

      const fieldInstructions = buildFieldInstructions(normalizedFields);

      const prompt = buildPrompt(topic, fieldInstructions);

      const response = await client.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const raw = response.choices?.[0]?.message?.content || "{}";

      const parsed = parseAIResponse(raw);

      const result = transformBlocks(parsed);

      ctx.body = result;
    } catch (error) {
      strapi.log.error("AI Generation Error:", error);
      ctx.throw(500, `AI generation failed: ${error.message}`);
    }
  },
};
