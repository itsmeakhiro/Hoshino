/**
  * @type {HoshinoLia.Command} 
*/

const command = {
  manifest: {
    name: "Profile",
    aliases: ["prof"],
    version: "1.0",
    developer: "Francis Loyd Raval",
    description: "Check your profile balance.",
    category: "Economy",
    usage: "profile balance",
    config: {
      admin: false,
      moderator: false,
    },
  },
  async deploy(ctx) {
    const home = new ctx.HoshinoHM(
      [
        {
          subcommand: "balance",
          description: "Check your balance.",
          async deploy({ chat, args, event }) {
            let { balance = 0 } = await hoshinoDB.get(event.senderID);
            await chat.send(`Your balance is $${balance}.`);
          },
        },
      ],
      "◆"
    );
    await home.runInContext(ctx);
  },
};

module.exports = command;
