export function formatCash(
  number: number = 0,
  emoji: string = "💵",
  bold: boolean = false
) {
  return `${bold ? "**" : ""}$${number.toLocaleString()}${emoji}${bold ? "**" : ""}`;
}

const manifest: HoshinoLia.CommandManifest = {
  name: "appleshot",
  aliases: ["archery", "shoot"],
  description: "Gamble in an archery game: buy a bow, train your aim, and shoot to win money.",
  version: "1.0.0",
  category: "Gambling",
  cooldown: 5,
  developer: "Francis Loyd Raval",
  usage: "appleshot [ buy <basic | advanced | master> | train | shoot <bet> | status ]",
  config: {
    admin: false,
    moderator: false,
  },
};

const style: HoshinoLia.Command["style"] = {
  title: `〘 🏹 〙 APPLESHOT`,
  footer: "Made with 🤍 by **Francis Loyd Raval**",
  type: "lines1",
};

const font: HoshinoLia.Command["font"] = {
  title: "bold",
  content: "sans",
  footer: "sans",
};

const BOW_TYPES = {
  basic: { cost: 5000, accuracy: 0.1, initialAccuracy: 0.05, quality: "Basic" },
  advanced: { cost: 15000, accuracy: 0.2, initialAccuracy: 0.1, quality: "Advanced" },
  master: { cost: 30000, accuracy: 0.3, initialAccuracy: 0.15, quality: "Master" },
};

const BASE_WIN_CHANCE = 0.5;
const ACCURACY_BOOST = 0.05;
const MAX_ACCURACY = 0.5;
const BASE_TRAINING_COST = 2000;
const MIN_BET = 100;

const WIN_MESSAGES: string[] = [
  "🍎 | Bullseye! You nailed the apple with precision!",
  "🏹 | Perfect shot! The apple splits clean in half!",
  "🎯 | Nailed it! Your aim is legendary!",
  "🔥 | Straight through the core! What a shot!",
];

const LOSS_MESSAGES: string[] = [
  "💨 | Aw fam, you've missed the shot. The arrow went onto {username}'s hat, and they got your {bet}!",
  "😅 | Oops! Your arrow flew past and startled {username}, who took your {bet}!",
  "🏹 | Missed! The arrow landed in {username}'s backyard, and they claimed your {bet}!",
  "😬 | Yikes! Your shot went wide and nearly hit {username}, who picked up your {bet}!",
];

export async function deploy(ctx) {
  const home = new ctx.HoshinoHM([
    {
      subcommand: "buy",
      description: "Buy a bow (basic, advanced, or master) to start playing.",
      usage: "appleshot buy <basic | advanced | master>",
      icon: "🛒",
      aliases: ["purchase"],
      async deploy({ chat, event, hoshinoDB, args }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply(
            "📋 | You need to register first! Use: profile register <username>"
          );
        }
        if (userData.appleshot) {
          return chat.reply("🏹 | You already own a bow!");
        }
        if (args.length < 2 || !args[1]) {
          return chat.reply(
            "📋 | Please specify a bow type. Usage: appleshot buy <basic | advanced | master>\n" +
            `- Basic ($5,000): +10% win chance, +5% starting accuracy\n` +
            `- Advanced ($15,000): +20% win chance, +10% starting accuracy\n` +
            `- Master ($30,000): +30% win chance, +15% starting accuracy`
          );
        }
        const bowType = args[1].toLowerCase();
        if (!BOW_TYPES[bowType]) {
          return chat.reply(
            "📋 | Invalid bow type! Choose: basic, advanced, or master"
          );
        }
        const { cost, quality, initialAccuracy } = BOW_TYPES[bowType];
        if (userData.balance < cost) {
          return chat.reply(
            `📋 | You need ${formatCash(cost, true)} to buy a ${bowType} bow!`
          );
        }
        await hoshinoDB.set(event.senderID, {
          ...userData,
          balance: userData.balance - cost,
          appleshot: {
            bowType,
            level: 1,
            accuracy: initialAccuracy,
            isShooting: false,
            lastShot: 0,
          },
        });
        const winChance = BASE_WIN_CHANCE + BOW_TYPES[bowType].accuracy + initialAccuracy;
        return chat.reply(
          `🏹 | You bought a ${bowType} bow (${quality}) for ${formatCash(cost, true)}! ` +
          `Starting accuracy: ${(initialAccuracy * 100).toFixed(0)}%. Win chance: ${(winChance * 100).toFixed(0)}%. ` +
          `Use 'appleshot train' to improve your aim or 'appleshot shoot <bet>' to play.`
        );
      },
    },
    {
      subcommand: "train",
      description: "Train to improve your aim, increasing your accuracy and win chance.",
      usage: "appleshot train",
      icon: "🎯",
      aliases: ["practice"],
      async deploy({ chat, event, hoshinoDB }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply(
            "📋 | You need to register first! Use: profile register <username>"
          );
        }
        if (!userData.appleshot) {
          return chat.reply(
            "📋 | You need to buy a bow first! Use: appleshot buy <basic | advanced | master>"
          );
        }
        const { appleshot } = userData;
        const nextLevel = appleshot.level + 1;
        const trainingCost = BASE_TRAINING_COST * Math.pow(2, appleshot.level - 1);
        if (userData.balance < trainingCost) {
          return chat.reply(
            `📋 | You need ${formatCash(trainingCost, true)} to train to level ${nextLevel}!`
          );
        }
        const newAccuracy = Math.min(appleshot.accuracy + ACCURACY_BOOST, MAX_ACCURACY);
        await hoshinoDB.set(event.senderID, {
          ...userData,
          balance: userData.balance - trainingCost,
          appleshot: {
            ...appleshot,
            level: nextLevel,
            accuracy: newAccuracy,
          },
        });
        const winChance = Math.min(BASE_WIN_CHANCE + BOW_TYPES[appleshot.bowType].accuracy + newAccuracy, 0.95);
        return chat.reply(
          `🎯 | You trained to aim level ${nextLevel} for ${formatCash(trainingCost, true)}! ` +
          `Your accuracy is now ${(newAccuracy * 100).toFixed(0)}%, and your win chance is ${(winChance * 100).toFixed(0)}%.`
        );
      },
    },
    {
      subcommand: "shoot",
      description: "Bet money and shoot to win double or triple your bet or lose it to another user.",
      usage: "appleshot shoot <bet>",
      icon: "🔫",
      aliases: ["fire"],
      async deploy({ chat, event, hoshinoDB, args }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply(
            "📋 | You need to register first! Use: profile register <username>"
          );
        }
        if (!userData.appleshot) {
          return chat.reply(
            "📋 | You need to buy a bow first! Use: appleshot buy <basic | advanced | master>"
          );
        }
        const { appleshot } = userData;
        if (!args[1] || isNaN(Number(args[1])) || Number(args[1]) < MIN_BET) {
          return chat.reply(
            `📋 | Please specify a bet of at least ${formatCash(MIN_BET, true)}. Usage: appleshot shoot <bet>`
          );
        }
        const bet = Math.floor(Number(args[1]));
        if (userData.balance < bet) {
          return chat.reply(
            `📋 | You need ${formatCash(bet, true)} to place this bet!`
          );
        }
        const winChance = Math.min(BASE_WIN_CHANCE + BOW_TYPES[appleshot.bowType].accuracy + appleshot.accuracy, 0.95);
        const isWin = Math.random() < winChance;
        const multiplier = isWin ? (Math.random() < 0.5 ? 2 : 3) : 0;
        const winnings = isWin ? bet * multiplier : -bet;
        const newBalance = userData.balance + winnings;

        const allUsers = await hoshinoDB.getAll();
        const userIDs = Object.keys(allUsers).filter(uid => uid !== event.senderID && allUsers[uid].username);
        const randomUserID = userIDs.length > 0 ? userIDs[Math.floor(Math.random() * userIDs.length)] : null;
        const randomUser = randomUserID ? allUsers[randomUserID].username : "nobody";

        if (!isWin && randomUserID) {
          const randomUserData = allUsers[randomUserID];
          await hoshinoDB.set(randomUserID, {
            ...randomUserData,
            balance: randomUserData.balance + bet,
          });
        }
        await hoshinoDB.set(event.senderID, {
          ...userData,
          balance: newBalance,
          appleshot: {
            ...appleshot,
            lastShot: Date.now(),
          },
        });

        if (isWin) {
          const message = WIN_MESSAGES[Math.floor(Math.random() * WIN_MESSAGES.length)];
          return chat.reply(
            `${message} You won ${formatCash(winnings, true)} (+${formatCash(winnings - bet, true)}) ` +
            `with a ${(winChance * 100).toFixed(0)}% win chance!`
          );
        } else {
          const formattedBet = formatCash(bet, true);
          const message = LOSS_MESSAGES[Math.floor(Math.random() * LOSS_MESSAGES.length)]
            .replace("{username}", randomUser)
            .replace("{bet}", formattedBet);
          return chat.reply(
            `${message} You lost ${formattedBet} with a ${(winChance * 100).toFixed(0)}% win chance. Try again!`
          );
        }
      },
    },
    {
      subcommand: "status",
      description: "Check your bow, level, accuracy, and win chance.",
      usage: "appleshot status",
      icon: "ℹ️",
      async deploy({ chat, event, hoshinoDB }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply(
            "📋 | You need to register first! Use: profile register <username>"
          );
        }
        if (!userData.appleshot) {
          return chat.reply(
            "📋 | You need to buy a bow first! Use: appleshot buy <basic | advanced | master>"
          );
        }
        const { appleshot } = userData;
        const winChance = Math.min(BASE_WIN_CHANCE + BOW_TYPES[appleshot.bowType].accuracy + appleshot.accuracy, 0.95);
        return chat.reply(
          `🏹 | **${userData.username}'s Appleshot Stats**\n` +
          `- Bow: ${BOW_TYPES[appleshot.bowType].quality}\n` +
          `- Level: ${appleshot.level}\n` +
          `- Accuracy: ${(appleshot.accuracy * 100).toFixed(0)}%\n` +
          `- Win Chance: ${(winChance * 100).toFixed(0)}%\n` +
          `- Balance: ${formatCash(userData.balance, true)}`
        );
      },
    },
  ]);
  return home.runInContext(ctx);
}

export default {
  manifest,
  style,
  deploy,
  font,
} as HoshinoLia.Command;
