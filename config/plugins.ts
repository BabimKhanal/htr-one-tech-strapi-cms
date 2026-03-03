import type { Core } from "@strapi/strapi";

const config = ({
  env,
}: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  upload: {
    config: {
      security: {
        // Max size PER FILE (bytes)
        maxSize: 10 * 1024 * 1024, // 10MB

        // Allow only these file types
        allowedMimeTypes: [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
          "image/svg+xml",
          "application/pdf",
        ],
      },
    },
  },
});

export default config;
