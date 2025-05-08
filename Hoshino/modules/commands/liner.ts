// DO NOT REMOVE HoshinoLia.Command, do not add types on async deploy ctx
const command: HoshinoLia.Command = {
  manifest: {
    name: "liner",
    aliases: ["line"],
    version: "1.0.0",
    developer: "Francis Loyd Raval & Kenneth Panio",
    description: "Meet Liner AI from Opera Browser developed by Kenneth Panio.",
    category: "education",
    cooldown: 0,
    config: {
      moderator: false,
      admin: false,
      privateOnly: false,
    },
  },
  style: {
    type: "lines1",
    title: "〘 𖣐 〙 LINER AI",
    footer: `**CREDITS**: Kenneth Panio`,
  },
  font: {
    title: "bold",
    content: "sans",
    footer: "sans",
  },
  async deploy({ chat, args, fonts }) {
    const ask = args.join(" ");
    if (!ask) {
      return chat.reply(fonts.sans("Provide a query."));
    }
    try {
      const { answer } = await chat.req(
        "https://haji-mix.up.railway.app/api/liner",
        {
          ask,
          mode: "general",
          deepsearch: "false",
          stream: "false",
        }
      );
      chat.reply(answer.llm_response);
    } catch (error) {
      chat.reply(error instanceof Error ? String(error.stack) : String(error));
    }
  },
};

export default command;
