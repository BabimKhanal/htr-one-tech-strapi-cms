import { text } from "stream/consumers";

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

module.exports = {
  async generate(ctx) {
    const { topic, fields } = ctx.request.body;

    const prompt = `
You are generating CMS content.

Topic: ${topic}

Fields to generate:
${fields.join(", ")}

Rules:
- Return ONLY valid JSON
- Use EXACT field names provided
- Do NOT add extra fields
- If the field is "question", generate a short FAQ question
- If the field is "answer", generate a helpful explanation
If the field is "content":

Return content in Strapi Blocks rich text format.

Use this structure:

[
  {
    "type": "heading",
    "level": 2,
    "children": [
      { "type": "text", "text": "Section title" }
    ]
  },
  {
    "type": "paragraph",
    "children": [
      { "type": "text", "text": "Paragraph text here." }
    ]
  },
  {
    "type": "list",
    "format": "unordered",
    "children": [
      {
        "type": "list-item",
        "children": [
          { "type": "text", "text": "Bullet point text" }
        ]
      }
    ]
  }
]

Example output:

{
  "question": "What is your return policy?",
  "answer": "You can return any item within 30 days of purchase for a full refund."
}
`;

    const response = await client.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.choices[0].message.content;
    console.log(text);

    const parsed = JSON.parse(text);

    let blocks = [];

    if (parsed.content) {
      // If AI returned an array, assume it's already an array of valid Slate blocks
      if (Array.isArray(parsed.content)) {
        blocks = parsed.content;
      }
      // If AI returned a string, wrap each separated paragraph in a Slate block
      else if (typeof parsed.content === "string") {
        const paragraphs = parsed.content.split("\n\n");
        blocks = paragraphs.map((p: any) => ({
          type: "paragraph",
          children: [
            {
              type: "text",
              text: p,
            },
          ],
        }));
      }
    }

    const result = {};

    Object.keys(parsed).forEach((key) => {
      if (key === "content") {
        result[key] = blocks;
      } else {
        result[key] = parsed[key];
      }
    });

    ctx.body = result;
  },
};
