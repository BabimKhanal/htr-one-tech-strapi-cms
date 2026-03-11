module.exports = {
  routes: [
    {
      method: "GET",
      path: "/ai/settings",
      handler: "settings.getSettings",
    },
    {
      method: "POST",
      path: "/ai/settings",
      handler: "settings.updateSettings",
    },
  ],
};
