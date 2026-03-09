"use strict";

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

module.exports = {
  async generate(ctx) {
    const { topic, fields } = ctx.request.body;
    console.log(fields);
    const fieldInstructions = fields
      .map((f) => {
        // If f is a string (e.g., "question"), create a default object
        const field = typeof f === "string" ? { name: f, type: "string" } : f;

        let instruction = `- "${field.name}": Must be a ${field.type || "string"}.`;
        if (field.maxLength)
          instruction += ` Maximum ${field.maxLength} characters.`;

        // Logic for blocks
        if (field.type === "blocks" || field.name === "content") {
          instruction += ` Return as an ARRAY of Strapi Block objects.`;
        }
        return instruction;
      })
      .join("\n      ");
    console.log(fieldInstructions);
    // 1. Enhanced Prompt for Strapi Blocks
    const prompt = `
      You are generating CMS content for Strapi.
      Topic: ${topic}
      Fields to generate: ${fieldInstructions}


      RULES:
      - Return ONLY a raw JSON object. 
      - Use EXACT field names.
      - If the field is "content", return an ARRAY of Strapi Block objects.
      
      BLOCK FORMAT EXAMPLE for "content":
      [
        { "type": "heading", "level": 2, "children": [{ "type": "text", "text": "Title" }] },
        { "type": "paragraph", "children": [{ "type": "text", "text": "Body text" }] }
      ]
      
      
    `;
    console.log(prompt);
    try {
      const response = await client.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }, // Forces JSON mode if the model supports it
      });

      let rawText = response.choices[0].message.content;

      // 2. Clean the AI output (removes ```json ... ``` blocks)
      const cleanJson = rawText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleanJson);

      const result = {};

      // 3. Process Fields
      Object.keys(parsed).forEach((key) => {
        if (key === "content") {
          if (Array.isArray(parsed[key])) {
            result[key] = parsed[key];
          } else if (typeof parsed[key] === "string") {
            result[key] = parsed[key].split("\n\n").map((p) => ({
              type: "paragraph",
              children: [{ type: "text", text: p }],
            }));
          }
        } else {
          result[key] = parsed[key];
        }
      });

      ctx.body = result;
      console.log(result)
    } catch (error) {
      console.error("AI Generation Error:", error);
      ctx.throw(500, `AI Failed: ${error.message}`);
    }
  },
};
