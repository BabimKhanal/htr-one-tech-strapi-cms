import fs from "fs";
import path from "path";

export default async function createContentType(data: any) {
  const { name, displayName, attributes } = data;

  // Strapi creation expects a specific format
  const contentType = {
    displayName,
    singularName: name,
    pluralName: `${name}s`,
    kind: "collectionType",
    attributes,
  };

  const result = await strapi
    .plugin("content-type-builder")
    .services["content-types"]
    .createContentType({
      contentType,
    });

  return result;
}
