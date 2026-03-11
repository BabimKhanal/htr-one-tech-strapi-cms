export default {
  routes: [
    {
      method: "POST",
      path: "/ai/agent",
      handler: "agent.agent",
      config: {
        auth: false,
      },
    },
  ],
};
