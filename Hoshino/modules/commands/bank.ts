export function formatCash(
  number: number = 0,
  emoji: string | boolean = "💵",
  bold = false
) {
  if (typeof emoji === "boolean") {
    bold = emoji;
    emoji = "💵";
  }
  if (number < 0) {
    return `${bold ? "**" : ""}-$${Math.abs(number).toLocaleString()}${emoji}${bold ? "**" : ""}`;
  }
  return `${bold ? "**" : ""}$${Number(number).toLocaleString()}${emoji}${bold ? "**" : ""}`;
}

const manifest: HoshinoLia.CommandManifest = {
  name: "bank",
  aliases: ["b", "vault"],
  description: "Manage your bank account: deposit, withdraw, or check your balance.",
  version: "1.0.0",
  category: "Economy",
  cooldown: 5,
  developer: "Francis Loyd Raval",
  usage: "bank [ balance | deposit <amount> | withdraw <amount> ]",
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
        try {
          const userData = await hoshinoDB.get(event.senderID);
          if (!userData || !userData.username) {
            return chat.reply(
              "📋 | You need to register first! Use: profile register <username>"
            );
          }
          const { balance = 0, bankBalance = 0, username } = userData;
          const texts = [
            `👤 | **Name**: ${username}`,
            `🪙 | **Wallet**: ${formatCash(balance, true)}`,
            `🏦 | **Bank**: ${formatCash(bankBalance, true)}`,
            `💰 | **Total**: ${formatCash(balance + bankBalance, true)}`,
          ];
          return chat.reply(texts.join("\n"));
        } catch (error) {
          console.error("Error in bank balance:", error);
          return chat.reply("❌ | An error occurred. Please try again later.");
        }
      },
    },
    {
      subcommand: "deposit",
      description: "Deposit money from your wallet to your bank account.",
      usage: "bank deposit <amount>",
      icon: "⬆️",
      aliases: ["dep", "save"],
      async deploy({ chat, args, event, hoshinoDB }) {
        if (args.length < 1 || !args[0]) {
          return chat.reply(
            "📋 | Please provide an amount. Usage: bank deposit <amount>"
          );
        }
        const amount = parseFloat(args[0]);
        if (isNaN(amount) || amount <= 0) {
          return chat.reply("📋 | Please provide a valid amount greater than 0.");
        }
        try {
          const userData = await hoshinoDB.get(event.senderID);
          if (!userData || !userData.username) {
            return chat.reply(
              "📋 | You need to register first! Use: profile register <username>"
            );
          }
          const { balance = 0, bankBalance = 0 } = userData;
          if (balance < amount) {
            return chat.reply(
              `📋 | Insufficient wallet funds! You have ${formatCash(balance, true)}.`
            );
          }
          await hoshinoDB.set(event.senderID, {
            ...userData,
            balance: balance - amount,
            bankBalance: bankBalance + amount,
          });
          return chat.reply(
            `💸 | Successfully deposited ${formatCash(amount, true)} to your bank!`
          );
        } catch (error) {
          console.error("Error in bank deposit:", error);
          return chat.reply("❌ | An error occurred. Please try again later.");
        }
      },
    },
    {
      subcommand: "withdraw",
      description: "Withdraw money from your bank account to your wallet.",
      usage: "bank withdraw <amount>",
      icon: "⬇️",
      aliases: ["wd", "take"],
      async deploy({ chat, args, event, hoshinoDB }) {
        if (args.length < 1 || !args[0]) {
          return chat.reply(
            "📋 | Please provide an amount. Usage: bank withdraw <amount>"
          );
        }
        const amount = parseFloat(args[0]);
        if (isNaN(amount) || amount <= 0) {
          return chat.reply("📋 | Please provide a valid amount greater than 0.");
        }
        try {
          const userData = await hoshinoDB.get(event.senderID);
          if (!userData || !userData.username) {
            return chat.reply(
              "📋 | You need to register first! Use: profile register <username>"
            );
          }
          const { balance = 0, bankBalance = 0 } = userData;
          if (bankBalance < amount) {
            return chat.reply(
              `📋 | Insufficient bank funds! You have ${formatCash(bankBalance, true)} in your bank.`
            );
          }
          await hoshinoDB.set(event.senderID, {
            ...userData,
            balance: balance + amount,
            bankBalance: bankBalance - amount,
          });
          return chat.reply(
            `💸 | Successfully withdrew ${formatCash(amount, true)} from your bank!`
          );
        } catch (error) {
          console.error("Error in bank withdraw:", error);
          return chat.reply("❌ | An error occurred. Please try again later.");
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