/**
 * @type {HoshinoLia.Command}
 */
const command = {
  manifest: {
    name: "aria",
    aliases: ["aibrowser"],
    version: "1.0.0",
    developer: "Francis Loyd Raval",
    description: "Meet Aria AI from Opera Browser developed by Kenneth Panio.",
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
    title: "☄︎ ARIA AI",
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
      const { answer } = await chat.req(
        "https://haji-mix.up.railway.app/api/aria",
        {
          ask,
          stream: "false",
        }
      );
      chat.reply(answer);
    } catch (error) {
      chat.reply(error instanceof Error ? String(error.stack) : String(error));
    }
  },
};

export default command;
