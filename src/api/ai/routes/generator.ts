export default {
  routes: [
    {
      method: "POST",
      path: "/ai/generate",
      handler: "generator.generate",
      config: {
        auth: false,
      },
    },
  ],
};
