import { formatCash } from global.Hohino.utils;

const manifest: HoshinoLia.CommandManifest = {
  name: "bank",
  aliases: ["b", "vault"],
  description: "Manage your bank account: deposit, withdraw, or check your balance.",
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
  title: `〘 🏦 〙 BANK`,
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
      subcommand: "balance",
      description: "Check your bank balance and wallet balance.",
      usage: "bank balance",
      icon: "ℹ️",
      aliases: ["bal", "check"],
      async deploy({ chat, args, event, hoshinoDB }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply(
            "📋 | You need to register first! Use: profile register <username>"
          );
        }
        const { balance = 0, bankBalance = 0, username } = userData;
        const texts = [
          `👤 | **Name**: ${username}`,
          `🪙 | **Wallet Balance**: ${formatCash(balance, true)}`,
          `🏦 | **Bank Balance**: ${formatCash(bankBalance, "💰", true)}`,
          `💸 | **Total Wealth**: ${formatCash(balance + bankBalance, true)}`,
        ];
        return chat.reply(texts.join("\n"));
      },
    },
    {
      subcommand: "deposit",
      description: "Deposit money from your wallet to your bank.",
      usage: "bank deposit <amount | all>",
      icon: "⬇️",
      aliases: ["dep", "save"],
      async deploy({ chat, args, event, hoshinoDB }) {
        if (args.length < 1 || !args[0]) {
          return chat.reply(
            "📋 | Please specify an amount to deposit. Usage: bank deposit <amount | all>"
          );
        }
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply(
            "📋 | You need to register first! Use: profile register <username>"
          );
        }
        let amount: number;
        if (args[0].toLowerCase() === "all") {
          amount = userData.balance || 0;
        } else {
          amount = parseInt(args[0], 10);
          if (isNaN(amount) || amount <= 0) {
            return chat.reply("📋 | Please provide a valid positive amount.");
          }
        }
        if (amount > (userData.balance || 0)) {
          return chat.reply(
            `📋 | You don't have enough in your wallet! Current balance: ${formatCash(
              userData.balance || 0,
              true
            )}`
          );
        }
        try {
          await hoshinoDB.set(event.senderID, {
            ...userData,
            balance: (userData.balance || 0) - amount,
            bankBalance: (userData.bankBalance || 0) + amount,
          });
          return chat.reply(
            `💰 | Successfully deposited ${formatCash(
              amount,
              true
            )} to your bank! New bank balance: ${formatCash(
              (userData.bankBalance || 0) + amount,
              "💰",
              true
            )}`
          );
        } catch (error) {
          return chat.reply("❌ | Failed to deposit. Please try again later.");
        }
      },
    },
    {
      subcommand: "withdraw",
      description: "Withdraw money from your bank to your wallet.",
      usage: "bank withdraw <amount | all>",
      icon: "⬆️",
      aliases: ["wd", "take"],
      async deploy({ chat, args, event, hoshinoDB }) {
        if (args.length < 1 || !args[0]) {
          return chat.reply(
            "📋 | Please specify an amount to withdraw. Usage: bank withdraw <amount | all>"
          );
        }
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply(
            "📋 | You need to register first! Use: profile register <username>"
          );
        }
        let amount: number;
        if (args[0].toLowerCase() === "all") {
          amount = userData.bankBalance || 0;
        } else {
          amount = parseInt(args[0], 10);
          if (isNaN(amount) || amount <= 0) {
            return chat.reply("📋 | Please provide a valid positive amount.");
          }
        }
        if (amount > (userData.bankBalance || 0)) {
          return chat.reply(
            `📋 | You don't have enough in your bank! Current bank balance: ${formatCash(
              userData.bankBalance || 0,
              "💰",
              true
            )}`
          );
        }
        try {
          await hoshinoDB.set(event.senderID, {
            ...userData,
            balance: (userData.balance || 0) + amount,
            bankBalance: (userData.bankBalance || 0) - amount,
          });
          return chat.reply(
            `💸 | Successfully withdrew ${formatCash(
              amount,
              true
            )} from your bank! New wallet balance: ${formatCash(
              (userData.balance || 0) + amount,
              true
            )}`
          );
        } catch (error) {
          return chat.reply("❌ | Failed to withdraw. Please try again later.");
        }
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