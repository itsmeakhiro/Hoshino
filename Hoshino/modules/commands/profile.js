/**
 * @type {HoshinoLia.Command}
 */
const command = {
  manifest: {
    name: "profile",
    aliases: ["prof"],
    version: "1.0",
    developer: "Francis Loyd Raval",
    description:
      "Check your profile info (balance, diamonds), register, or change your username.",
    category: "Economy",
    usage:
      "profile info | profile register <username> | profile changeusername <newusername>",
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
          aliases: ["reg", "signup"],
          description: "Register with a username to use the economy system.",
          usage: "profile register <username>",
          async deploy({ chat, args, event, hoshinoDB, HoshinoUser, HoshinoEXP }) {
            if (args.length < 1) {
              return await chat.reply(
                "Please provide a username. Usage: profile register <username>"
              );
            }
            const username = args.slice(1).join(" ").trim();
            if (username.length < 1 || username.length > 20) {
              return await chat.reply("Username must be 1-20 characters long.");
            }
            const userData = await hoshinoDB.get(event.senderID);
            if (userData && userData.username) {
              return await chat.reply("You are already registered!");
            }
            const exp = new HoshinoEXP({ exp: 0, mana: 100, health: 100 });
            await hoshinoDB.set(event.senderID, {
              username,
              balance: 0,
              diamonds: 0, // Initialize diamonds to 0
              expData: exp.raw(),
            });
            await chat.reply(`Successfully registered as ${username}!`);
          },
        },
        {
          subcommand: "info",
          aliases: ["me", "i"],
          description: "Check your balance and diamonds.",
          usage: "profile info",
          async deploy({ chat, args, event, hoshinoDB, HoshinoUser, HoshinoEXP }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const { balance = 0, diamonds = 0, username, expData = { exp: 0, mana: 100, health: 100 } } = userData;
            const exp = new HoshinoEXP(expData);
            const formattedBalance = balance.toLocaleString("en-US");
            const formattedDiamonds = diamonds.toLocaleString("en-US");
            const profileInfo = [
              `Username: ${username}`,
              `Balance: $${formattedBalance}`,
              `Diamonds: 💎${formattedDiamonds}`, 
              `Level: ${exp.getLevel()}`,
              `Rank: ${exp.getRankString()}`,
              `EXP: ${exp.getEXP()} (Next: ${exp.getNextRemaningEXP()})`,
              `Mana: ${exp.getMana()}/${exp.getMaxMana()}`,
              `Health: ${exp.getHealth()}/${exp.getMaxHealth()}`,
            ].join("\n");
            await chat.reply(profileInfo);
          },
        },
        {
          subcommand: "changeusername",
          aliases: ["rename", "chname"],
          description: "Change your username for 5,000.",
          usage: "profile changeusername <newusername>",
          async deploy({ chat, args, event, hoshinoDB, HoshinoUser, HoshinoEXP }) {
            if (args.length < 1) {
              return await chat.reply(
                "Please provide a new username. Usage: profile changeusername <newusername>"
              );
            }
            const newUsername = args.join(" ").trim();
            if (newUsername.length < 1 || newUsername.length > 20) {
              return await chat.reply(
                "New username must be 1-20 characters long."
              );
            }
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (userData.balance < 5000) {
              return await chat.reply(
                "You need 5,000 to change your username!"
              );
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              username: newUsername,
              balance: userData.balance - 5000,
              diamonds: userData.diamonds || 0, 
            });
            await chat.reply(
              `Username changed to ${newUsername}! 5,000 has been deducted from your balance.`
            );
          },
        },
      ],
      "◆"
    );
    await home.runInContext(ctx);
  },
};

export default command;
