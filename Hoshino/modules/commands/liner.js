/**
 * @type {HoshinoLia.Command}
 */
const command = {
  manifest: {
    name: "liner",
    aliases: ["line"],
    version: "1.0.0",
    developer: "Francis Loyd Raval",
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
    footer: `Developed by: Francis Loyd Raval`,
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
      const ans = await chat.req(
        "https://haji-mix.up.railway.app/api/liner",
        {
          ask,
          mode: "general",
          deepsearch: "false",
          stream: "false"
        }
      );

      const ans = response.data.answer["llm_response"];
      chat.reply(ans);
    } catch (error) {
      chat.reply(error instanceof Error ? String(error.stack) : String(error));
    }
  },
};

module.exports = command;
