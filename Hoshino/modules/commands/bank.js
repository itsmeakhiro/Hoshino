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
      "Manage your bank account: deposit, withdraw, or check balance with automatic interest.",
    category: "Economy",
    usage: "bank info | bank deposit <amount> | bank withdraw <amount>",
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
  async applyInterest(userData, hoshinoDB, senderID) {
    const { bankBalance = 0, lastInterestUpdate = 0 } = userData;
    if (bankBalance <= 0) return userData; 

    const interestPeriod = 50 * 60 * 1000; 
    const now = Date.now();
    const periodsElapsed = Math.floor((now - lastInterestUpdate) / interestPeriod);
    if (periodsElapsed < 1) return userData; 

    let newBalance = bankBalance;
    const interestRate = 0.05; 
    const maxBalance = 10_000_000; 

    for (let i = 0; i < periodsElapsed; i++) {
      const interest = Math.floor(newBalance * interestRate);
      newBalance += interest;
      if (newBalance >= maxBalance) {
        newBalance = maxBalance;
        break; 
      }
    }

    const updatedData = {
      ...userData,
      bankBalance: newBalance,
      lastInterestUpdate: lastInterestUpdate + periodsElapsed * interestPeriod,
    };
    await hoshinoDB.set(senderID, updatedData);
    return updatedData;
  },
  async deploy(ctx) {
    const home = new ctx.HoshinoHM(
      [
        {
          subcommand: "info",
          aliases: ["balance", "i"],
          description: "Check your bank balance and available balance.",
          usage: "bank info",
          async deploy({ chat, args, event, hoshinoDB }) {
            let userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            userData = await command.applyInterest(userData, hoshinoDB, event.senderID);
            const { balance = 0, bankBalance = 0, lastInterestUpdate = 0, username } = userData;

            const interestPeriod = 50 * 60 * 1000; 
            const nextUpdate = lastInterestUpdate + interestPeriod;
            const minutesUntilNext = Math.ceil((nextUpdate - Date.now()) / (1000 * 60));
            const isCapped = bankBalance >= 10_000_000;

            const formattedBalance = balance.toLocaleString("en-US");
            const formattedBankBalance = bankBalance.toLocaleString("en-US");
            const bankInfo = [
              `Username: ${username}`,
              `Available Balance: $${formattedBalance}`,
              `Bank Balance: $${formattedBankBalance}${isCapped ? " (capped)" : ""}`,
              `Next Interest: ${minutesUntilNext} min`,
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
            console.log(`Deposit event: ${JSON.stringify(event)}`);

            const amountInput = args[1] || args[0] || args.slice(1).join(" ");
            const amount = Number(amountInput?.trim());

            if (!amountInput || isNaN(amount) || amount <= 0) {
              console.log(`Invalid deposit input: amountInput=${amountInput}, amount=${amount}`);
              return await chat.reply(
                `Please provide a valid positive amount to deposit. Usage: bank deposit <amount> (Received: ${amountInput || "none"})`
              );
            }
            const flooredAmount = Math.floor(amount);
            let userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            userData = await command.applyInterest(userData, hoshinoDB, event.senderID);
            if (userData.balance < flooredAmount) {
              console.log(`Insufficient balance: balance=${userData.balance}, attempted=${flooredAmount}`);
              return await chat.reply(
                "You don't have enough balance to deposit that amount!"
              );
            }
            const newBankBalance = (userData.bankBalance || 0) + flooredAmount;
            if (newBankBalance > 10_000_000) {
              return await chat.reply(
                "Deposit would exceed the bank balance cap of $10,000,000!"
              );
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: userData.balance - flooredAmount,
              bankBalance: newBankBalance,
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
            let userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            userData = await command.applyInterest(userData, hoshinoDB, event.senderID);
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
      ],
      "◆"
    );
    await home.runInContext(ctx);
  },
};

export default command;
