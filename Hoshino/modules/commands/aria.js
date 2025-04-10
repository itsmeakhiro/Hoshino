const axios = require("axios").default;

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
    const q = args.join(" ");
    if (!q) {
      return chat.reply(fonts.sans("Provide a query."));
    }
    try {
      const aria = await axios.get(
        `https://haji-mix.up.railway.app/api/aria?ask=${encodeURIComponent(
          q
        )}&stream=false`
      );
      const r = aria.data.answer;
      chat.reply(r);
    } catch (error) {
      chat.reply(error instanceof Error ? String(error.stack) : String(error));
    }
  },
};

module.exports = command;
