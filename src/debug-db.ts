import type { Core } from "@strapi/strapi";

export default {
  async register() {},
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    try {
      const knex = strapi.db.connection;
      const columns = await knex("services").columnInfo();
      console.log("Services Columns:", Object.keys(columns));
    } catch (e) {
      console.error("Error checking columns:", e);
    }
    process.exit(0);
  },
};
