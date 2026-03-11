import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const systemPrompt = `
You are a Strapi Schema Generator.

Convert the user request into a valid Strapi Content Type schema.

Return ONLY JSON.

Structure must be:

{
  "name": "",
  "displayName": "",
  "attributes": {}
}

Allowed field types:
string
text
richtext
integer
decimal
boolean
media
`;

export default {
  async generate(ctx) {
    const { topic } = ctx.request.body;

    if (!topic) {
      return ctx.badRequest("Topic is required");
    }

    const client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    });

    const response = await client.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: topic },
      ],
    });

    let content = response.choices?.[0]?.message?.content;

    if (!content) {
      return ctx.badRequest("No schema returned from AI");
    }

    content = content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let schema;

    try {
      schema = JSON.parse(content);
    } catch (err) {
      console.error(content);
      return ctx.badRequest("Invalid JSON from AI");
    }

    ctx.send(schema);
  },
};
