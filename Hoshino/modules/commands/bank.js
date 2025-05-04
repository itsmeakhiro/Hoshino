/**
 * @type {HoshinoLia.Command}
 */
const command = {
  manifest: {
    name: "bank",
    aliases: ["b"],
    version: "1.0",
    developer: "Francis Loyd Raval",
    description:
      "Manage your bank account: deposit, withdraw, check balance, or collect interest.",
    category: "Economy",
    usage:
      "bank info | bank deposit <amount> | bank withdraw <amount> | bank collect",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "〘 🏦 〙 BANK",
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
          subcommand: "info",
          aliases: ["balance", "i"],
          description: "Check your bank balance, available balance, and interest.",
          usage: "bank info",
          async deploy({ chat, args, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const { balance = 0, bankBalance = 0, lastInterestCollect = 0, username } = userData;
            const minutesElapsed = Math.floor((Date.now() - lastInterestCollect) / (1000 * 60));
            const interestMultiplier = Math.pow(2, minutesElapsed);
            const collectibleInterest = bankBalance * (interestMultiplier - 1);
            const formattedBalance = balance.toLocaleString("en-US");
            const formattedBankBalance = bankBalance.toLocaleString("en-US");
            const formattedInterest = Math.floor(collectibleInterest).toLocaleString("en-US");
            const bankInfo = [
              `Username: ${username}`,
              `Available Balance: $${formattedBalance}`,
              `Bank Balance: $${formattedBankBalance}`,
              `Collectible Interest: $${formattedInterest} (${minutesElapsed} min elapsed)`,
            ].join("\n");
            await chat.reply(bankInfo);
          },
        },
        {
          subcommand: "deposit",
          aliases: ["dep", "add"],
          description: "Deposit money from your balance to your bank account.",
          usage: "bank deposit <amount>",
          async deploy({ chat, args, event, hoshinoDB }) {
            if (args.length < 1 || isNaN(args[0]) || args[0] <= 0) {
              return await chat.reply(
                "Please provide a valid amount to deposit. Usage: bank deposit <amount>"
              );
            }
            const amount = Math.floor(Number(args[0]));
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (userData.balance < amount) {
              return await chat.reply(
                "You don't have enough balance to deposit that amount!"
              );
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: userData.balance - amount,
              bankBalance: (userData.bankBalance || 0) + amount,
            });
            const formattedAmount = amount.toLocaleString("en-US");
            await chat.reply(
              `Successfully deposited $${formattedAmount} to your bank account!`
            );
          },
        },
        {
          subcommand: "withdraw",
          aliases: ["wd", "take"],
          description: "Withdraw money from your bank account to your balance.",
          usage: "bank withdraw <amount>",
          async deploy({ chat, args, event, hoshinoDB }) {
            if (args.length < 1 || isNaN(args[0]) || args[0] <= 0) {
              return await chat.reply(
                "Please provide a valid amount to withdraw. Usage: bank withdraw <amount>"
              );
            }
            const amount = Math.floor(Number(args[0]));
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if ((userData.bankBalance || 0) < amount) {
              return await chat.reply(
                "You don't have enough money in your bank account to withdraw that amount!"
              );
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: userData.balance + amount,
              bankBalance: (userData.bankBalance || 0) - amount,
            });
            const formattedAmount = amount.toLocaleString("en-US");
            await chat.reply(
              `Successfully withdrew $${formattedAmount} from your bank account!`
            );
          },
        },
        {
          subcommand: "collect",
          aliases: ["claim", "interest"],
          description: "Collect interest based on your bank balance (doubles every minute).",
          usage: "bank collect",
          async deploy({ chat, args, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const { bankBalance = 0, lastInterestCollect = 0 } = userData;
            if (bankBalance <= 0) {
              return await chat.reply(
                "You need money in your bank account to earn interest!"
              );
            }
            const minutesElapsed = Math.floor((Date.now() - lastInterestCollect) / (1000 * 60));
            if (minutesElapsed < 1) {
              return await chat.reply(
                "No interest available yet. Wait at least 1 minute since your last collection."
              );
            }
            const interestMultiplier = Math.pow(2, minutesElapsed);
            const interestEarned = Math.floor(bankBalance * (interestMultiplier - 1));
            await hoshinoDB.set(event.senderID, {
              ...userData,
              bankBalance: bankBalance + interestEarned,
              lastInterestCollect: Date.now(),
            });
            const formattedInterest = interestEarned.toLocaleString("en-US");
            await chat.reply(
              `Successfully collected $${formattedInterest} in interest! Your bank balance has been updated.`
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
