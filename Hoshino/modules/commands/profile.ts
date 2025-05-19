function generateGameID() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const randomLetter = letters[Math.floor(Math.random() * letters.length)];
  const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
  return `${randomLetter}${randomNumber}`;
}

const manifest: HoshinoLia.CommandManifest = {
  name: "profile",
  aliases: ["p", "pf"],
  description:
    "Check your profile info (balance, diamonds, gameid), register, or change your username.",
  version: "1.0.0",
  category: "Economy",
  cooldown: 5,
  developer: "Francis Loyd Raval",
  usage: "profile [ register | info | changeusername ]",
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
      icon: "®️",
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
      icon: "ℹ️",
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
      icon: "🔁",
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
          isAdmin: false,
          isModerator: false,
        });
        return chat.reply(
          `💌 | Username changed to **${newUsername}**! ${formatCash(
            5000,
            true
          )} has been deducted from your balance.`
        );
      },
    },
  ],
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