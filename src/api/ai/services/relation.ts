export default async function addRelationToContentType({
  sourceUid,
  attributeName,
  targetUid,
  relation,
}: {
  sourceUid: string;
  attributeName: string;
  targetUid: string;
  relation: "oneToOne" | "oneToMany" | "manyToOne" | "manyToMany";
}) {
  const source = strapi.contentTypes[sourceUid];
  const target = strapi.contentTypes[targetUid];

  if (!source || !target) {
    throw new Error("Source or target content type not found");
  }

  const updatedAttributes = {
    ...source.attributes,
    [attributeName]: {
      type: "relation",
      relation,
      target: targetUid,
    },
  };

  return await strapi
    .plugin("content-type-builder")
    .services["content-types"]
    .editContentType(sourceUid, {
      contentType: {
        ...source,
        attributes: updatedAttributes,
      },
    });
}
