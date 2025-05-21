const manifest: HoshinoLia.CommandManifest = {
  name: "mtls",
  aliases: ["mtlslite"],
  description: "Minting Token and Lending Service. (Rework 3.6.0)",
  author: "Liane Cagara",
  version: "4.2.0",
  category: "Finance",
  cooldown: 5,
  config: { 
    admin: false, 
    moderator: false 
  },
};

const style: HoshinoLia.Command["style"] = {
  title: `〘 🪙 〙MTLS LITE`,
  footer: `Made with 🤍 by ${manifest.author}`,
  type: "lines1",
};

const font: HoshinoLia.Command["font"] = {
  title: "bold",
  content: "sans",
  footer: "sans",
};

export function formatCash(number: number = 0, emoji: string | boolean = "💵", bold = false): string {
  if (typeof emoji === "boolean") {
    bold = emoji;
    emoji = "💵";
  }
  return `${bold ? "**" : ""}$${number.toLocaleString()}${emoji}${bold ? "**" : ""}`;
}

export function formatTime(ms: number) {
  if (ms < 0) return "Invalid duration";
  const secs = Math.floor(ms / 1000) % 60;
  const mins = Math.floor(ms / (1000 * 60)) % 60;
  const hrs = Math.floor(ms / (1000 * 60 * 60));
  return hrs > 0 ? `${hrs}h ${mins}m ${secs}s` : `${mins}m ${secs}s`;
}

function isInvalidAm(amount: number, balance: number) {
  return isNaN(amount) || amount < 1 || amount > balance;
}

async function findRecipient(hoshinoDB: any, targTest: string) {
  if (!targTest || targTest === "undefined" || targTest === "Unregistered") {
    return null;
  }
  let recipient;
  if (await hoshinoDB.mongo.containsKey(targTest)) {
    recipient = await hoshinoDB.getCache(targTest);
    if (recipient) recipient.userID = targTest;
  } else {
    const all = await hoshinoDB.getAll();
    const f = Object.entries(all).find((i) => i[1]?.username === targTest);
    if (f) {
      recipient = f[1];
      recipient.userID = f[0];
    }
  }
  return recipient?.username === targTest || recipient?.userID === targTest ? recipient : null;
}

export async function deploy(ctx: HoshinoLia.EntryObj) {
  const home = new ctx.HoshinoHM([
    {
      subcommand: "lend",
      description: "Lend money and retrieve it later with potential interest.",
      usage: "lend <amount>",
      icon: "💸",
      aliases: ["le"],
      async deploy({ hoshinoDB, event, chat, args }) {
        const userData = await hoshinoDB.get(event.senderID);
        const amount = args[1] ? parseInt(args[1]) : NaN;
        if (isNaN(amount)) {
          return chat.reply("📋 | Please provide a valid amount as the first argument.");
        }
        if (isInvalidAm(amount, userData.balance)) {
          return chat.reply(
            `📋 | The amount must be a valid number, not lower than 1, and not higher than your balance (${formatCash(userData.balance, true)})`
          );
        }
        const newLend = amount;
        const newBal = userData.balance - newLend;
        const lendAmount = userData.lendAmount ?? 0;
        if (lendAmount > 0 && userData.lendTimestamp) {
          return chat.reply(
            `📋 | You cannot lend right now. You already have a valid lend of ${formatCash(lendAmount, true)}, please retrieve it first!`
          );
        }
        try {
          await hoshinoDB.set(event.senderID, {
            lendAmount: newLend,
            balance: newBal,
            lendTimestamp: Date.now(),
          });
          return chat.reply(
            `💌 | Successfully lent ${formatCash(amount, true)}\n\nYour new balance is: ${formatCash(newBal, true)}`
          );
        } catch (error) {
          console.error("Lend failed:", error);
          return chat.reply("❌ | Failed to lend money. Please try again later.");
        }
      },
    },
    {
      subcommand: "retrieve",
      description: "Retrieve lent amount and view earned interest.",
      aliases: ["re"],
      icon: "📥",
      usage: "retrieve [force]",
      async deploy({ hoshinoDB, event, chat, args }) {
        const userData = await hoshinoDB.get(event.senderID);
        const lendAmount = userData.lendAmount ?? 0;
        const isForce = args[0]?.toLowerCase() === "force";
        if (!userData.lendTimestamp || lendAmount <= 0) {
          return chat.reply("❕ | No active lend to retrieve.");
        }
        const now = Date.now();
        const durationInSeconds = Math.max((now - userData.lendTimestamp) / 1000, 0);
        const annualInterestRate = 0.001;
        const secondsInYear = 365 * 24 * 60 * 60;
        const interestNoInflation = lendAmount * (annualInterestRate / secondsInYear) * durationInSeconds;
        const inflationRate = 0;
        const interest = Math.floor(Math.max(0, interestNoInflation * (1 - inflationRate / 1000)));
        const cap = Math.floor(userData.balance * 0.5);
        const interestCapped = Math.min(interest, cap);
        const totalAmount = Math.floor(lendAmount + interestCapped);
        const newBalance = userData.balance + totalAmount;
        if (interestCapped < 1 && !isForce) {
          return chat.reply(
            `📋 | Cannot retrieve: interest (${formatCash(interestCapped, true)}) is too low. Use 'force' to override.`
          );
        }
        try {
          await hoshinoDB.set(event.senderID, {
            balance: newBalance,
            lendTimestamp: null,
            lendAmount: 0,
          });
          return chat.reply(
            `🎉 | Retrieved ${formatCash(totalAmount, true)} (Gain: ${formatCash(interestCapped, true)})\n\nNew balance: ${formatCash(newBalance, true)}`
          );
        } catch (error) {
          console.error("Retrieve failed:", error);
          return chat.reply("❌ | Failed to retrieve lend. Please try again later.");
        }
      },
    },
    {
      subcommand: "send",
      description: "Transfer money to another user at no cost.",
      usage: "send <name|uid> <amount>",
      icon: "📤",
      aliases: ["-tr", "-se", "transfer"],
      async deploy({ hoshinoDB, event, chat, Inventory, args }) {
        const userData = await hoshinoDB.get(event.senderID);
        const targTest = args[1];
        const inventory = new Inventory(userData.inventory);
        if (!targTest) {
          return chat.reply("📋 | Please provide a user name or ID as the first argument.");
        }
        const recipient = await findRecipient(hoshinoDB, targTest);
        if (!recipient) {
          return chat.reply(
            `❕ | Recipient not found. Ensure you are providing the correct user's name or ID.`
          );
        }
        if (recipient.userID === event.senderID) {
          return chat.reply(`❕ | You cannot send money to yourself!`);
        }
        const amount = args[2] ? parseInt(args[2]) : NaN;
        if (isNaN(amount)) {
          return chat.reply("📋 | Please provide a valid amount as the second argument.");
        }
        if (isInvalidAm(amount, userData.balance)) {
          return chat.reply(
            `📋 | The amount must be a valid number, not lower than 1, and not higher than your balance (${formatCash(userData.balance, true)})`
          );
        }
        const newBal = userData.balance - amount;
        const reciBal = recipient.balance + amount;
        try {
          await hoshinoDB.set(event.senderID, { balance: newBal });
          await hoshinoDB.set(recipient.userID, { balance: reciBal });
          return chat.reply(
            `💥 | Successfully sent ${formatCash(amount, true)} to ${recipient.username ?? "Unregistered"}\n\nRemaining Shadow Coins: ${formatCash(inventory.getAmount("shadowCoin"), "🌑", true)}`
          );
        } catch (error) {
          console.error("Transfer failed:", error);
          return chat.reply("❌ | Failed to send money. Please try again later.");
        }
      },
    },
    {
      subcommand: "inspect",
      description: "View financial details of a user by name or ID",
      usage: "inspect <name|uid>",
      icon: "🔍",
      aliases: ["ins"],
      async deploy({ hoshinoDB, chat, args }) {
        const targTest = args[1];
        if (!targTest) {
          return chat.reply("📋 | Please provide a user name or ID as the first argument.");
        }
        const recipient = await findRecipient(hoshinoDB, targTest);
        if (!recipient) {
          return chat.reply(
            `❕ | Target not found. Ensure you are providing the correct user's name or ID.`
          );
        }
        const texts = [
          `👤 | **Name**: ${recipient.username ?? "Unregistered"}`,
          `🪙 | **Balance**: ${formatCash(recipient.balance, true)}`,
          `🎲 | **User ID**: ${recipient.userID}`,
          `📤 | **Lent Amount**: ${formatCash(recipient.lendAmount ?? 0, true)}`,
          `⏳ | **Lent Since**: ${recipient.lendTimestamp ? formatTime(Date.now() - recipient.lendTimestamp) : "No active lend."}`,
        ];
        return chat.reply(texts.join("\n"));
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
