function generateGameID() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const randomLetter = letters[Math.floor(Math.random() * letters.length)];
  const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
  return `${randomLetter}${randomNumber}`;
}

const manifest: HoshinoLia.CommandManifest = {
  name: "profile",
  aliases: ["pf", "pf"],
  description:
    "Check your profile info (balance, diamonds, gameid), register, change your username, or fix user data (admin only).",
  author: "Francis Loyd Raval",
  version: "1.0.0",
  category: "Economy",
  cooldown: 5,
  developer: "Francis Loyd Raval",
  config: {
    admin: false,
    moderator: false,
  },
};

const style: HoshinoLia.Command["style"] = {
  title: `〘 👤 〙 PROFILE`,
  footer: "Made with 🤍 by **Francis Loyd Raval**",
  type: "lines1",
};

const font: HoshinoLia.Command["font"] = {
  title: "bold",
  content: "sans",
  footer: "sans",
};

export async function deploy(ctx) {
  const home = new ctx.HoshinoHM([
    {
      subcommand: "register",
      description: "Register with a username to use the economy system.",
      usage: "profile register <username>",
      aliases: ["reg", "signup"],
      async deploy({ chat, args, event, hoshinoDB, HoshinoUser, HoshinoEXP }) {
        if (args.length < 1 || !args[0]) {
          return chat.reply(
            "📋 | Please provide a username. Usage: profile register <username>"
          );
        }
        const username = args[0].trim();
        if (username.length < 1 || username.length > 20) {
          return chat.reply("📋 | Username must be 1-20 characters long.");
        }
        const allUsers = await hoshinoDB.getAll();
        const usernameExists = Object.values(allUsers).some(
          (user) => user.username && user.username.toLowerCase() === username.toLowerCase()
        );
        if (usernameExists) {
          return chat.reply("📋 | This username is already taken! Please choose another one.");
        }
        const userData = await hoshinoDB.get(event.senderID);
        if (userData && userData.username) {
          return chat.reply("📋 | You are already registered!");
        }
        const gameid = generateGameID();
        const exp = new HoshinoEXP({ exp: 0, mana: 100, health: 100 });
        await hoshinoDB.set(event.senderID, {
          username,
          gameid,
          balance: 0,
          diamonds: 0,
          expData: exp.raw(),
          isAdmin: false,
          isModerator: false,
        });
        return chat.reply(
          `💌 | Successfully registered as **${username}**! Your Game ID: **${gameid}**`
        );
      },
    },
    {
      subcommand: "info",
      description: "Check your balance, diamonds, and gameid.",
      usage: "profile info",
      aliases: ["me", "i"],
      async deploy({ chat, args, event, hoshinoDB, HoshinoUser, HoshinoEXP }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply(
            "📋 | You need to register first! Use: profile register <username>"
          );
        }
        const {
          balance = 0,
          diamonds = 0,
          username,
          gameid = "N/A",
          expData = { exp: 0, mana: 100, health: 100 },
        } = userData;
        const exp = new HoshinoEXP(expData);
        const texts = [
          `👤 | **Name**: ${username}`,
          `🎲 | **Game ID**: ${gameid}`,
          `🪙 | **Balance**: ${formatCash(balance, true)}`,
          `💎 | **Diamonds**: ${formatCash(diamonds, "💎", true)}`,
          `📊 | **Level**: ${exp.getLevel()}`,
          `🏆 | **Rank**: ${exp.getRankString()}`,
          `📈 | **EXP**: ${exp.getEXP()} (Next: ${exp.getNextRemaningEXP()})`,
          `🪄 | **Mana**: ${exp.getMana()}/${exp.getMaxMana()}`,
          `❤️ | **Health**: ${exp.getHealth()}/${exp.getMaxHealth()}`,
        ];
        return chat.reply(texts.join("\n"));
      },
    },
    {
      subcommand: "changeusername",
      description: "Change your username for 5,000.",
      usage: "profile changeusername <newusername>",
      aliases: ["rename", "chname"],
      async deploy({ chat, args, event, hoshinoDB, HoshinoUser, HoshinoEXP }) {
        if (args.length < 2 || !args[1]) {
          return chat.reply(
            "📋 | Please provide a new username. Usage: profile changeusername <newusername>"
          );
        }
        const newUsername = args[1].trim();
        if (newUsername.length < 1 || newUsername.length > 20) {
          return chat.reply("📋 | New username must be 1-20 characters long.");
        }
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply(
            "📋 | You need to register first! Use: profile register <username>"
          );
        }
        const allUsers = await hoshinoDB.getAll();
        const usernameExists = Object.values(allUsers).some(
          (user) => user.username && user.username.toLowerCase() === newUsername.toLowerCase()
        );
        if (usernameExists) {
          return chat.reply("📋 | This username is already taken! Please choose another one.");
        }
        if (userData.balance < 5000) {
          return chat.reply(
            `📋 | You need ${formatCash(5000, true)} to change your username!`
          );
        }
        await hoshinoDB.set(event.senderID, {
          ...userData,
          username: newUsername,
          balance: userData.balance - 5000,
          diamonds: userData.diamonds || 0,
          gameid: userData.gameid || generateGameID(),
          isAdmin: userData.isAdmin || false,
          isModerator: userData.isModerator || false,
        });
        return chat.reply(
          `💌 | Username changed to **${newUsername}**! ${formatCash(
            5000,
            true
          )} has been deducted from your balance.`
        );
      },
    },
    {
      subcommand: "fix",
      description: "Fix a user's data without altering existing values (admin only).",
      usage: "profile fix <userID>",
      aliases: ["repair", "reset"],
      async deploy({ chat, args, event, hoshinoDB, HoshinoUser, HoshinoEXP }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.isAdmin) {
          return chat.reply("📋 | You need to be an admin to use this command!");
        }
        if (args.length < 1 || !args[0]) {
          return chat.reply(
            "📋 | Please provide a user ID. Usage: profile fix <userID>"
          );
        }
        const targetUserID = args[0].trim();
        const targetUserData = await hoshinoDB.get(targetUserID);
        if (!targetUserData) {
          return chat.reply("📋 | No user found with that ID!");
        }
        const allUsers = await hoshinoDB.getAll();
        let fixedUsername = targetUserData.username;
        if (!fixedUsername || typeof fixedUsername !== "string" || fixedUsername.length < 1 || fixedUsername.length > 20) {
          fixedUsername = `User_${targetUserID.slice(0, 8)}`;
          let counter = 1;
          while (Object.values(allUsers).some(
            (user) => user.username && user.username.toLowerCase() === fixedUsername.toLowerCase()
          )) {
            fixedUsername = `User_${targetUserID.slice(0, 8)}_${counter}`;
            counter++;
          }
        }
        const fixedGameID = targetUserData.gameid && typeof targetUserData.gameid === "string" && targetUserData.gameid.match(/^[A-Z]\d{8}$/)
          ? targetUserData.gameid
          : generateGameID();
        const fixedBalance = typeof targetUserData.balance === "number" && targetUserData.balance >= 0
          ? targetUserData.balance
          : 0;
        const fixedDiamonds = typeof targetUserData.diamonds === "number" && targetUserData.diamonds >= 0
          ? targetUserData.diamonds
          : 0;
        const fixedExpData = targetUserData.expData && typeof targetUserData.expData === "object"
          ? {
              exp: typeof targetUserData.expData.exp === "number" && targetUserData.expData.exp >= 0 ? targetUserData.expData.exp : 0,
              mana: typeof targetUserData.expData.mana === "number" && targetUserData.expData.mana >= 0 ? targetUserData.expData.mana : 100,
              health: typeof targetUserData.expData.health === "number" && targetUserData.expData.health >= 0 ? targetUserData.expData.health : 100,
            }
          : { exp: 0, mana: 100, health: 100 };
        const fixedIsAdmin = typeof targetUserData.isAdmin === "boolean" ? targetUserData.isAdmin : false;
        const fixedIsModerator = typeof targetUserData.isModerator === "boolean" ? targetUserData.isModerator : false;
        await hoshinoDB.set(targetUserID, {
          username: fixedUsername,
          gameid: fixedGameID,
          balance: fixedBalance,
          diamonds: fixedDiamonds,
          expData: fixedExpData,
          isAdmin: fixedIsAdmin,
          isModerator: fixedIsModerator,
        });
        return chat.reply(
          `💌 | Successfully fixed data for user ID **${targetUserID}**! Username set to **${fixedUsername}**.`
        );
      },
    },
  ],
  "➥",
  "Welcome to **Profile**, here are the available commands:",
);
  return home.runInContext(ctx);
}

export function formatCash(
  number: number = 0,
  emoji: string | boolean = "💵",
  bold = false
) {
  if (typeof emoji === "boolean") {
    bold = emoji;
    emoji = "💵";
  }
  return `${bold ? "**" : ""}$${Number(number).toLocaleString()}${
    emoji || "💵"
  }${bold ? "**" : ""}`;
}

export default {
  manifest,
  style,
  deploy,
  font,
} as HoshinoLia.Command;