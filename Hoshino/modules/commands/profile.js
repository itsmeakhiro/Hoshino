/**
  * @type {HoshinoLia.Command} 
*/

const command = {
  manifest: {
    name: "Profile",
    aliases: ["prof"],
    version: "1.0",
    developer: "Francis Loyd Raval",
    description: "Check your profile balance or register with a username.",
    category: "Economy",
    usage: "profile balance | profile register <username>",
    config: {
      admin: false,
      moderator: false,
    },
  },
  async deploy(ctx) {
    const home = new ctx.HoshinoHM(
      [
        {
          subcommand: "register",
          description: "Register with a username to use the economy system.",
          async deploy({ chat, args, event, hoshinoDB }) {
            if (args.length < 1) {
              return await chat.reply("Please provide a username. Usage: profile register <username>");
            }
            const username = args.join(" ").trim();
            if (!username || username.length > 20) {
              return await chat.reply("Username must be 1-20 characters long.");
            }
            const userData = await hoshinoDB.get(event.senderID);
            if (userData && userData.username) {
              return await chat.reply("You are already registered!");
            }
            await hoshinoDB.set(event.senderID, { username, balance: 0 });
            await chat.reply(`Successfully registered as ${username}!`);
          },
        },
        {
          subcommand: "balance",
          description: "Check your balance.",
          async deploy({ chat, args, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply("You need to register first! Use: profile register <username>");
            }
            let { balance = 0, username } = userData;
            const formattedBalance = balance.toLocaleString('en-US');
            await chat.reply(`${username}, your balance is $${formattedBalance}.`);
          },
        },
      ],
      "◆"
    );
    await home.runInContext(ctx);
  },
};

module.exports = command;
