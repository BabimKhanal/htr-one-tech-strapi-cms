import GenerateContent from "./components/GenerateContent";

export default {
  config: {
    head: {
      title: "HTR ONE TECH",
      favicon: "./favicon.ico",
    },

  },

  register(

  ) { },

  bootstrap(app: any) {
    const contentManager = app.getPlugin("content-manager");

    contentManager.injectComponent("editView", "right-links", {
      name: "ai-generate-content",
      Component: GenerateContent
    });
  },
};