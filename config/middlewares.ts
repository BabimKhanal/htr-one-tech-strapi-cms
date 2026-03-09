import type { Core } from "@strapi/strapi";

const config: Core.Config.Middlewares = [
  "strapi::logger",
  "strapi::errors",
  "strapi::security",
  "strapi::cors",
  "strapi::poweredBy",
  "strapi::query",

  {
    name: "strapi::body",
    config: {
      formLimit: "50mb",
      jsonLimit: "50mb",
      textLimit: "50mb",
      formidable: {
        maxFileSize: 50 * 1024 * 1024, // 50MB per file
        multiples: true, // important for multiple file uploads
      },
    },
  },
  {
    name: "strapi::cors",
    config: {
      origin: [
        "http://localhost:1337",
        "https://htr-one-tech-strapi-cms.onrender.com",
      ],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
      headers: ["Content-Type", "Authorization", "Origin", "Accept"],
      keepHeaderCase: true,
    },
  },

  "strapi::session",
  "strapi::favicon",
  "strapi::public",
];

export default config;
