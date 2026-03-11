export default {
  routes: [
    {
      method: "POST",
      path: "/ai/generate-schema",
      handler: "schema.generate",
      config: {
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/ai/create-content-type",
      handler: "content-type.generate",
      config: {
        auth: false,
      },
    },
  ],
};
