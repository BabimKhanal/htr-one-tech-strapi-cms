import GenerateContent from "./components/GenerateContent";
import AICmsBuilderPopup from "./pages/AiCMSBuilder";
import { Magic } from "@strapi/icons";

export default {
  config: {
    head: {
      title: "HTR ONE TECH",
      favicon: "./favicon.ico",
    },
  },

  register(app: any) {
    app.addMenuLink({
      to: "/ai-builder",
      icon: Magic,
      intlLabel: {
        id: "ai-builder.label",
        defaultMessage: "AI Builder",
      },
      Component: async () => {
        const component = await import("./pages/AICopilot");
        return component;
      },
      permissions: [],
    });
  },

  bootstrap(app: any) {

    /** Content Manager AI */
    const contentManager = app.getPlugin("content-manager");

    contentManager.injectComponent("editView", "right-links", {
      name: "ai-generate-content",
      Component: GenerateContent,
    });

    /** Content-Type Builder AI */
    const ctBuilder = app.getPlugin("content-type-builder");

    ctBuilder.injectComponent("", "right-links", {
      name: "ai-schema-builder",
      Component: AICmsBuilderPopup,
    });



  },
};