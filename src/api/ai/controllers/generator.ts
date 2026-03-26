"use strict";

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

/* ------------------------------------------------ */
/* Field Utilities */
/* ------------------------------------------------ */

function normalizeFields(fields = []) {
  return fields.map((field) =>
    typeof field === "string"
      ? { name: field, type: "string" }
      : {
          name: field.name,
          type: field.type || "string",
          maxLength: field.maxLength || null,
        },
  );
}

function isBlockField(field) {
  return field.type === "blocks" || field.type === "richtext";
}

function buildFieldInstructions(fields) {
  return fields
    .map((field) => {
      let instruction = `- "${field.name}": ${field.type}`;

      if (field.maxLength) {
        instruction += ` (max ${field.maxLength} characters)`;
      }

      if (isBlockField(field)) {
        instruction += ` → Return as ARRAY of Strapi Block objects`;
      }

      return instruction;
    })
    .join("\n");
}

/* ------------------------------------------------ */
/* Prompt */
/* ------------------------------------------------ */

function buildPrompt(topic, fields) {
  const instructions = buildFieldInstructions(fields);

  return `
You generate structured CMS content for Strapi.

TOPIC:
${topic}

FIELDS:
${instructions}

RULES:
- Return ONLY valid JSON
- Use EXACT field names
- No explanations
- If a field requires blocks, return an array of Strapi Block objects.

BLOCK FORMAT:
[
  {
    "type": "heading",
    "level": 2,
    "children": [{ "type": "text", "text": "Heading text" }]
  },
  {
    "type": "paragraph",
    "children": [{ "type": "text", "text": "Paragraph text" }]
  }
]
`.trim();
}

/* ------------------------------------------------ */
/* JSON Handling */
/* ------------------------------------------------ */

function cleanJSON(text = "") {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

function parseJSON(text) {
  try {
    return JSON.parse(cleanJSON(text));
  } catch (err) {
    throw new Error("AI returned invalid JSON");
  }
}

/* ------------------------------------------------ */
/* Block Transform */
/* ------------------------------------------------ */

function stringToBlocks(text) {
  return text.split("\n\n").map((paragraph) => ({
    type: "paragraph",
    children: [{ type: "text", text: paragraph }],
  }));
}

function transformOutput(data, fields) {
  const result = {};

  fields.forEach((field) => {
    const value = data[field.name];

    if (value === undefined) return;

    if (isBlockField(field)) {
      if (Array.isArray(value)) {
        result[field.name] = value;
      } else if (typeof value === "string") {
        result[field.name] = stringToBlocks(value);
      } else {
        result[field.name] = [];
      }
    } else {
      result[field.name] = value;
    }
  });

  return result;
}

/* ------------------------------------------------ */
/* AI Request */
/* ------------------------------------------------ */

async function generateContent(prompt) {
  const response = await client.chat.completions.create({
    model: "openai/gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return response.choices?.[0]?.message?.content || "{}";
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

      const prompt = buildPrompt(topic, normalizedFields);

      const raw = await generateContent(prompt);

      const parsed = parseJSON(raw);

      const result = transformOutput(parsed, normalizedFields);

      ctx.body = result;
    } catch (error) {
      strapi.log.error("AI generation error:", error);
      ctx.throw(500, `AI generation failed: ${error.message}`);
    }
  },
};
