import fs from "fs";
import path from "path";

export default {
  async generate(ctx) {
    const { name, displayName, attributes } = ctx.request.body;

    if (!name || !attributes) {
      return ctx.badRequest("Invalid schema");
    }

    const safeName = name.toLowerCase();

    const basePath = path.join(
      process.cwd(),
      "src/api",
      safeName,
      "content-types",
      safeName,
    );

    if (fs.existsSync(basePath)) {
      return ctx.badRequest("Content type already exists");
    }

    fs.mkdirSync(basePath, { recursive: true });

    const schema = {
      kind: "collectionType",
      collectionName: `${safeName}s`,
      info: {
        singularName: safeName,
        pluralName: `${safeName}s`,
        displayName: displayName,
      },
      options: {
        draftAndPublish: true,
      },
      attributes,
    };

    fs.writeFileSync(
      path.join(basePath, "schema.json"),
      JSON.stringify(schema, null, 2),
    );

    ctx.send({
      message: "Content type created successfully",
    });
  },
};
