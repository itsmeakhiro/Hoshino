/**
 * @type {HoshinoLia.Command} 
*/

const command = {
  manifest: {
    name: "profile",
    aliases: ["prof"],
    version: "1.0",
    developer: "Francis Loyd Raval",
    description: "Check your profile info (balance), register, or change your username.",
    category: "Economy",
    usage: "profile info | profile register <username> | profile changeusername <newusername>",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "〘 👤 〙 PROFILE",
    footer: "**Developed by**: Francis Loyd Raval",
  },
  font: {
    title: "bold",
    content: "sans",
    footer: "sans",
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
            const username = args.slice(1).join(" ").trim();
            if (username.length < 1 || username.length > 20) {
              return await chat.reply("Username must be 1-20 characters long.");
            }
            const userData = await hoshinoDB.get(event.senderID);
            if (userData && userData.username) {
              return await chat.reply("You are already registered!");
            }
            await hoshinoDB.set(event.senderID, { 
              username, 
              balance: 0
            });
            await chat.reply(`Successfully registered as ${username}!`);
          },
        },
        {
          subcommand: "info",
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
        {
          subcommand: "changeusername",
          description: "Change your username for 5,000.",
          async deploy({ chat, args, event, hoshinoDB }) {
            if (args.length < 1) {
              return await chat.reply("Please provide a new username. Usage: profile changeusername <newusername>");
            }
            const newUsername = args.join(" ").trim();
            if (newUsername.length < 1 || newUsername.length > 20) {
              return await chat.reply("New username must be 1-20 characters long.");
            }
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply("You need to register first! Use: profile register <username>");
            }
            if (userData.balance < 5000) {
              return await chat.reply("You need 5,000 to change your username!");
            }
            await hoshinoDB.set(event.senderID, { 
              ...userData, 
              username: newUsername, 
              balance: userData.balance - 5000 
            });
            await chat.reply(`Username changed to ${newUsername}! 5,000 has been deducted from your balance.`);
          },
        },
      ],
      "◆"
    );
    await home.runInContext(ctx);
  },
};

module.exports = command;
