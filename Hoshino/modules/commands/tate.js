const axios = require("axios").default;

/**
 * @type {HoshinoLia.Command}
 */
const command = {
  manifest: {
    name: "tate",
    aliases: ["topG"],
    version: "1.0.0",
    developer: "Francis Loyd Raval",
    description: "Meet Andrew Tate or CobraTate, the top G AI bot ver developed by Francis Loyd Raval..",
    category: "character",
    cooldown: 0,
    config: {
      moderator: false,
      admin: false,
      privateOnly: false,
    },
  },
  style: {
    type: "lines1",
    title: "💸 TATE AI",
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
      const { response } = await chat.req(
        "https://hoshino-14v4.onrender.com/tate",
        {
          ask,
        }
      );
      chat.reply(response);
    } catch (error) {
      chat.reply(error instanceof Error ? String(error.stack) : String(error));
    }
  },
};

module.exports = command;
