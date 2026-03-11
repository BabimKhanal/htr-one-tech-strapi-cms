export async function generateEntriesFromSchema({
  uid,
  prompt,
  count = 5,
  callAI,
}: {
  uid: string;
  prompt: string;
  count?: number;
  callAI: (messages: any[]) => Promise<any>;
}) {
  const schema = strapi.contentTypes[uid];

  if (!schema) {
    throw new Error(`Schema not found for ${uid}`);
  }

  const messages = [
    {
      role: "system",
      content: `
You generate valid Strapi entry JSON arrays.
Return JSON only.
Match the schema exactly.
Do not include unknown fields.
Do not include id, createdAt, updatedAt, publishedAt.
`,
    },
    {
      role: "user",
      content: `
Schema for ${uid}:
${JSON.stringify(schema.attributes, null, 2)}

Task:
Generate ${count} realistic entries for: ${prompt}

Return format:
{
  "entries": [ ... ]
}
`,
    },
  ];

  const result = await callAI(messages);
  return result.entries;
}

export async function bulkInsertEntries(uid: string, entries: any[]) {
  const results = [];
  for (const data of entries) {
    try {
      const entry = await (strapi.entityService as any).create(uid, { data });
      results.push({ success: true, entry });
    } catch (error: any) {
      results.push({ success: false, error: error.message });
    }
  }
  return results;
}

export function validateEntryAgainstSchema(uid: string, entry: any) {
  const schema = strapi.contentTypes[uid];
  if (!schema) throw new Error(`Schema not found for ${uid}`);

  const attributes = schema.attributes;
  const errors: string[] = [];

  for (const key of Object.keys(entry)) {
    if (!attributes[key]) {
      errors.push(`Unknown field: ${key}`);
    }
  }

  for (const [key, config] of Object.entries(attributes)) {
    const value = entry[key];
    if (value == null) continue;

    const attr = config as any;
    if (attr.type === "string" && typeof value !== "string") {
      errors.push(`Field ${key} must be a string`);
    }
    if (attr.type === "boolean" && typeof value !== "boolean") {
      errors.push(`Field ${key} must be a boolean`);
    }
    if (
      ["integer", "biginteger", "decimal", "float"].includes(attr.type) &&
      typeof value !== "number"
    ) {
      errors.push(`Field ${key} must be a number`);
    }
  }

  return errors;
}
