module.exports = {
  routes: [
    {
      method: "POST", // Make sure this is POST
      path: "/ai/generate",
      handler: "generator.generate",
      config: { auth: false },
    },
  ],
};
