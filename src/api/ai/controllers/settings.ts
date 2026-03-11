"use strict";

module.exports = {
  async getSettings(ctx) {
    const store = strapi.store({
      type: "plugin",
      name: "ai-settings",
    });

    const apiKey = await store.get({ key: "openrouterApiKey" });

    ctx.body = {
      apiKey: apiKey || "",
    };
  },

  async updateSettings(ctx) {
    const { apiKey } = ctx.request.body;

    const store = strapi.store({
      type: "plugin",
      name: "ai-settings",
    });

    await store.set({
      key: "openrouterApiKey",
      value: apiKey,
    });

    ctx.body = { success: true };
  },
};
