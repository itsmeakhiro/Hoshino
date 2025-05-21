export function formatCash(
  number: number = 0,
  emoji: string = "💵",
  bold: boolean = false
) {
  return `${bold ? "**" : ""}$${number.toLocaleString()}${emoji}${bold ? "**" : ""}`;
}

function formatCooldown(ms: number): string {
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  ms %= 24 * 60 * 60 * 1000;
  const hours = Math.floor(ms / (60 * 60 * 1000));
  ms %= 60 * 60 * 1000;
  const minutes = Math.floor(ms / (60 * 1000));
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
  return parts.length > 0 ? parts.join(", ") : "less than a minute";
}

const manifest: HoshinoLia.CommandManifest = {
  name: "appleshot",
  aliases: ["archery", "shoot"],
  description: "Gamble in an archery game: buy a bow, train your aim, and shoot to win money.",
  version: "1.0.0",
  category: "Gambling",
  cooldown: 5,
  developer: "Francis Loyd Raval",
  usage: "appleshot [ buy <huntersmark | crescentmoon | stormchaser | phoenixfeather | dragonsbreath | starforge> | train | shoot <bet> | status ]",
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
  huntersmark: { cost: 10000, accuracy: 0.05, initialAccuracy: 0.025, quality: "Hunter’s Mark" },
  crescentmoon: { cost: 25000, accuracy: 0.075, initialAccuracy: 0.0375, quality: "Crescent Moon" },
  stormchaser: { cost: 50000, accuracy: 0.1, initialAccuracy: 0.05, quality: "Stormchaser" },
  phoenixfeather: { cost: 100000, accuracy: 0.125, initialAccuracy: 0.0625, quality: "Phoenix Feather" },
  dragonsbreath: { cost: 150000, accuracy: 0.15, initialAccuracy: 0.075, quality: "Dragon’s Breath" },
  starforge: { cost: 250000, accuracy: 0.175, initialAccuracy: 0.0875, quality: "Starforge" },
};

const BASE_WIN_CHANCE = 0.3;
const ACCURACY_BOOST = 0.02;
const MAX_ACCURACY = 0.5;
const BASE_TRAINING_COST = 5000;
const MIN_BET = 100;
const TRAINING_COOLDOWN = 2 * 24 * 60 * 60 * 1000;

const WIN_MESSAGES: string[] = [
  "🍎 | Bullseye! **{username}** **nailed** the apple with their **{bow}**!",
  "🏹 | Perfect shot! **{username}** **split** the apple with their **{bow}**!",
  "🎯 | **{username}** **nailed** it! Their **{bow}**’s aim is legendary!",
  "🔥 | Straight through! **{username}** **scorched** the apple with their **{bow}**!"
];

const LOSS_MESSAGES: string[] = [
  "💨 | Aw fam, **{username}** **missed**! The arrow hit **{randomuser}**’s hat, who took their {bet}!",
  "😅 | Oops! **{username}** **missed** and startled **{randomuser}**, who claimed their {bet}!",
  "🏹 | **{username}** **missed**! The arrow landed in **{randomuser}**’s backyard, who took their {bet}!",
  "😬 | Yikes! **{username}** **missed** and nearly hit **{randomuser}**, who grabbed their {bet}!"
];

export async function deploy(ctx) {
  const home = new ctx.HoshinoHM([
    {
      subcommand: "buy",
      description: "Buy a branded bow to start playing.",
      usage: "appleshot buy <huntersmark | crescentmoon | stormchaser | phoenixfeather | dragonsbreath | starforge>",
      icon: "🛒",
      aliases: ["purchase"],
      async deploy({ chat, event, hoshinoDB, args }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply(
            "📋 | **You** need to **register** first! Use: profile register <username>"
          );
        }
        if (userData.appleshot) {
          return chat.reply(`🏹 | **${userData.username}**, you already **own** a bow!`);
        }
        if (args.length < 2 || !args[1]) {
          return chat.reply(
            "📋 | **Please** specify a bow type. Usage: appleshot buy <huntersmark | crescentmoon | stormchaser | phoenixfeather | dragonsbreath | starforge>\n" +
            `- **Hunter’s Mark** ($10,000): +5% win chance, +2.5% starting accuracy\n` +
            `- **Crescent Moon** ($25,000): +7.5% win chance, +3.75% starting accuracy\n` +
            `- **Stormchaser** ($50,000): +10% win chance, +5% starting accuracy\n` +
            `- **Phoenix Feather** ($100,000): +12.5% win chance, +6.25% starting accuracy\n` +
            `- **Dragon’s Breath** ($150,000): +15% win chance, +7.5% starting accuracy\n` +
            `- **Starforge** ($250,000): +17.5% win chance, +8.75% starting accuracy`
          );
        }
        const bowType = args[1].toLowerCase();
        if (!BOW_TYPES[bowType]) {
          return chat.reply(
            `📋 | **Invalid** bow type, **${userData.username}**! Choose: huntersmark, crescentmoon, stormchaser, phoenixfeather, dragonsbreath, starforge`
          );
        }
        const { cost, quality, initialAccuracy } = BOW_TYPES[bowType];
        if (userData.balance < cost) {
          return chat.reply(
            `📋 | **${userData.username}**, you **need** ${formatCash(cost, "💵", true)} to **buy** a **${quality}** bow!`
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
            lastTrained: 0,
          },
        });
        const winChance = BASE_WIN_CHANCE + BOW_TYPES[bowType].accuracy + initialAccuracy;
        return chat.reply(
          `🏹 | **${userData.username}** **bought** a **${quality}** bow for ${formatCash(cost, "💵", true)}! ` +
          `Starting accuracy: ${(initialAccuracy * 100).toFixed(1)}%. Win chance: ${(winChance * 100).toFixed(1)}%. ` +
          `Use 'appleshot train' to **improve** your aim or 'appleshot shoot <bet>' to **play**.`
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
            "📋 | **You** need to **register** first! Use: profile register <username>"
          );
        }
        if (!userData.appleshot) {
          return chat.reply(
            `📋 | **${userData.username}**, you need to **buy** a bow first! Use: appleshot buy <huntersmark | crescentmoon | stormchaser | phoenixfeather | dragonsbreath | starforge>`
          );
        }
        const { appleshot } = userData;
        const timeSinceLastTrain = Date.now() - (appleshot.lastTrained || 0);
        if (timeSinceLastTrain < TRAINING_COOLDOWN) {
          const remainingTime = TRAINING_COOLDOWN - timeSinceLastTrain;
          return chat.reply(
            `📋 | **${userData.username}**, you must **wait** ${formatCooldown(remainingTime)} to **train** again!`
          );
        }
        const nextLevel = appleshot.level + 1;
        const trainingCost = BASE_TRAINING_COST * Math.pow(2, appleshot.level - 1);
        if (userData.balance < trainingCost) {
          return chat.reply(
            `📋 | **${userData.username}**, you **need** ${formatCash(trainingCost, "💵", true)} to **train** to level ${nextLevel}!`
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
            lastTrained: Date.now(),
          },
        });
        const winChance = Math.min(BASE_WIN_CHANCE + BOW_TYPES[appleshot.bowType].accuracy + newAccuracy, 0.8);
        return chat.reply(
          `🎯 | **${userData.username}** **trained** to aim level ${nextLevel} for ${formatCash(trainingCost, "💵", true)}! ` +
          `Your accuracy is now ${(newAccuracy * 100).toFixed(1)}%, and your win chance is ${(winChance * 100).toFixed(1)}%.`
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
            "📋 | **You** need to **register** first! Use: profile register <username>"
          );
        }
        if (!userData.appleshot) {
          return chat.reply(
            `📋 | **${userData.username}**, you need to **buy** a bow first! Use: appleshot buy <huntersmark | crescentmoon | stormchaser | phoenixfeather | dragonsbreath | starforge>`
          );
        }
        const { appleshot } = userData;
        if (!args[1] || isNaN(Number(args[1])) || Number(args[1]) < MIN_BET) {
          return chat.reply(
            `📋 | **${userData.username}**, **specify** a bet of at least ${formatCash(MIN_BET, "💵", true)}. Usage: appleshot shoot <bet>`
          );
        }
        const bet = Math.floor(Number(args[1]));
        if (userData.balance < bet) {
          return chat.reply(
            `📋 | **${userData.username}**, you **need** ${formatCash(bet, "💵", true)} to **place** this bet!`
          );
        }
        const winChance = Math.min(BASE_WIN_CHANCE + BOW_TYPES[appleshot.bowType].accuracy + appleshot.accuracy, 0.8);
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
          const message = WIN_MESSAGES[Math.floor(Math.random() * WIN_MESSAGES.length)]
            .replace("{username}", userData.username)
            .replace("{bow}", BOW_TYPES[appleshot.bowType].quality);
          return chat.reply(
            `${message} **${userData.username}** **won** ${formatCash(winnings, "💵", true)} (+${formatCash(winnings - bet, "💵", true)}) ` +
            `with a ${(winChance * 100).toFixed(1)}% win chance!`
          );
        } else {
          const formattedBet = formatCash(bet, "💵", true);
          const message = LOSS_MESSAGES[Math.floor(Math.random() * LOSS_MESSAGES.length)]
            .replace("{username}", userData.username)
            .replace("{randomuser}", randomUser)
            .replace("{bet}", formattedBet);
          return chat.reply(
            `${message} **${userData.username}** **lost** ${formattedBet} with a ${(winChance * 100).toFixed(1)}% win chance. **Try** again!`
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
            "📋 | **You** need to **register** first! Use: profile register <username>"
          );
        }
        if (!userData.appleshot) {
          return chat.reply(
            `📋 | **${userData.username}**, you need to **buy** a bow first! Use: appleshot buy <huntersmark | crescentmoon | stormchaser | phoenixfeather | dragonsbreath | starforge>`
          );
        }
        const { appleshot } = userData;
        const winChance = Math.min(BASE_WIN_CHANCE + BOW_TYPES[appleshot.bowType].accuracy + appleshot.accuracy, 0.8);
        return chat.reply(
          `🏹 | **${userData.username}**'s **Appleshot Stats**\n` +
          `- Bow: **${BOW_TYPES[appleshot.bowType].quality}**\n` +
          `- Level: ${appleshot.level}\n` +
          `- Accuracy: ${(appleshot.accuracy * 100).toFixed(1)}%\n` +
          `- Win Chance: ${(winChance * 100).toFixed(1)}%\n` +
          `- Balance: ${formatCash(userData.balance, "💵", true)}`
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
