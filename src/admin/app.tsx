import GenerateContent from "./components/GenerateContent";
import AiSettings from "./pages/AIConfiguration";

export default {
  config: {
    head: {
      title: "HTR ONE TECH",
      favicon: "./favicon.ico",
    },

  },

  register(
    app: any
  ) {
    app.addMenuLink({
      icon: () => "🦾",
      label: "AI Configuration",
      to: "/ai-configuration",
      component: AiSettings,
    })
  },

  bootstrap(app: any) {
    const contentManager = app.getPlugin("content-manager");

    contentManager.injectComponent("editView", "right-links", {
      name: "ai-generate-content",
      Component: GenerateContent
    });
  },
};