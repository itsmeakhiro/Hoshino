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
            const principal = bankBalance;
            const annualRate = 0.05; 
            const compoundsPerYear = 12; 
            const years = minutesElapsed / (60 * 24 * 365);
            const interestMultiplier = Math.pow(1 + annualRate / compoundsPerYear, compoundsPerYear * years);
            let collectibleInterest = principal * (interestMultiplier - 1);
            const interestCap = 10_000_000;
            const isCapped = collectibleInterest > interestCap;
            collectibleInterest = Math.min(Math.floor(collectibleInterest), interestCap);

            const formattedBalance = balance.toLocaleString("en-US");
            const formattedBankBalance = bankBalance.toLocaleString("en-US");
            const formattedInterest = collectibleInterest.toLocaleString("en-US");
            const bankInfo = [
              `Username: ${username}`,
              `Available Balance: $${formattedBalance}`,
              `Bank Balance: $${formattedBankBalance}`,
              `Collectible Interest: $${formattedInterest}${isCapped ? " (capped)" : ""} (${minutesElapsed} min elapsed)`,
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
            console.log(`Deposit args: ${JSON.stringify(args)}`);

            const amountInput = args[1] || args[0];
            const amount = Number(amountInput?.trim());

            if (!amountInput || isNaN(amount) || amount <= 0) {
              return await chat.reply(
                "Please provide a valid positive amount to deposit. Usage: bank deposit <amount>"
              );
            }
            const flooredAmount = Math.floor(amount);
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (userData.balance < flooredAmount) {
              return await chat.reply(
                "You don't have enough balance to deposit that amount!"
              );
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: userData.balance - flooredAmount,
              bankBalance: (userData.bankBalance || 0) + flooredAmount,
            });
            const formattedAmount = flooredAmount.toLocaleString("en-US");
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
            console.log(`Withdraw args: ${JSON.stringify(args)}`);

            const amountInput = args[1] || args[0];
            const amount = Number(amountInput?.trim());

            if (!amountInput || isNaN(amount) || amount <= 0) {
              return await chat.reply(
                "Please provide a valid positive amount to withdraw. Usage: bank withdraw <amount>"
              );
            }
            const flooredAmount = Math.floor(amount);
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if ((userData.bankBalance || 0) < flooredAmount) {
              return await chat.reply(
                "You don't have enough money in your bank account to withdraw that amount!"
              );
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: userData.balance + flooredAmount,
              bankBalance: (userData.bankBalance || 0) - flooredAmount,
            });
            const formattedAmount = flooredAmount.toLocaleString("en-US");
            await chat.reply(
              `Successfully withdrew $${formattedAmount} from your bank account!`
            );
          },
        },
        {
          subcommand: "collect",
          aliases: ["claim", "interest"],
          description: "Collect interest based on your bank balance (5% annual, compounded monthly).",
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
            const principal = bankBalance;
            const annualRate = 0.05;
            const compoundsPerYear = 12; 
            const years = minutesElapsed / (60 * 24 * 365); 
            const interestMultiplier = Math.pow(1 + annualRate / compoundsPerYear, compoundsPerYear * years);
            let interestEarned = principal * (interestMultiplier - 1);
            const interestCap = 10_000_000;
            const isCapped = interestEarned > interestCap;
            interestEarned = Math.min(Math.floor(interestEarned), interestCap);

            await hoshinoDB.set(event.senderID, {
              ...userData,
              bankBalance: bankBalance + interestEarned,
              lastInterestCollect: Date.now(),
            });
            const formattedInterest = interestEarned.toLocaleString("en-US");
            await chat.reply(
              `Successfully collected $${formattedInterest}${isCapped ? " (capped)" : ""} in interest! Your bank balance has been updated.`
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
