/**
 * @type {HoshinoLia.Command}
 */

const command = {
    manifest: {
      name: "restart",
      aliases: ["reboot", "rs"],
      version: "1.0.0",
      developer: "Francis Loyd Raval",
      description: "Restarts the bot process",
      category: "admin",
      cooldown: 0,
      usage: "restart",
      config: {
        admin: true,
        moderator: false,
      },
    },
    style: {
      type: "lines1",
      title: "⏤͟͟͞͞ RESTART",
      footer: `Developed by: Francis Loyd Raval`,
    },
    font: {
      title: "bold",
      content: "sans",
      footer: "sans",
    },
    async deploy({ chat, fonts }) {
      await chat.send(fonts.bold("Restarting bot..."));
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    },
  };
  
  module.exports = command;