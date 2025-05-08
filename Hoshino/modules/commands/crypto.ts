// DO NOT REMOVE HoshinoLia.Command, do not add types on async deploy ctx
const command: HoshinoLia.Command = {
  manifest: {
    name: "crypto",
    aliases: ["cry"],
    version: "1.0",
    developer: "Francis Loyd Raval",
    description:
      "Manage your crypto coins: mine coins, check your balance, or convert to money. Mining may incur costs.",
    category: "Economy",
    usage: "crypto mine | crypto info | crypto convert <amount>",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "〘 💸 〙 CRYPTO",
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
          subcommand: "mine",
          aliases: ["start", "m"],
          description: "Start mining crypto coins (1 coin per minute, may incur costs).",
          usage: "crypto mine",
          async deploy({ chat, event, hoshinoDB }) {
            const userID = event.senderID;
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (userData.miningStartTime) {
              return await chat.reply("You are already mining crypto coins!");
            }
            await hoshinoDB.set(userID, {
              ...userData,
              miningStartTime: Date.now(),
              miningCosts: 0, 
            });
            await chat.reply("Started mining crypto coins! Earn 1 coin per minute. Note: Mining may deduct 10-50 balance per minute (20% chance).");
          },
        },
        {
          subcommand: "info",
          aliases: ["i", "status"],
          description: "Check your crypto coin balance, mining status, and costs.",
          usage: "crypto info",
          async deploy({ chat, event, hoshinoDB }) {
            const userID = event.senderID;
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const {
              cryptoCoins = 0,
              miningStartTime = null,
              miningCosts = 0,
              balance = 0,
              username,
            } = userData;
            let miningStatus = "Not mining.";
            let pendingCoins = 0;
            let newCosts = miningCosts;
            let newBalance = balance;
            if (miningStartTime) {
              const minutesElapsed = Math.floor((Date.now() - miningStartTime) / 60000);
              pendingCoins = minutesElapsed;
              
              for (let i = 0; i < minutesElapsed; i++) {
                if (Math.random() < 0.2 && newBalance >= 10) {
                  const cost = Math.floor(Math.random() * 41) + 10; 
                  newCosts += cost;
                  newBalance -= cost;
                }
              }
              miningStatus = `Mining for ${minutesElapsed} minute(s). Pending: ${pendingCoins} coin(s). Costs: $${newCosts.toLocaleString("en-US")}.`;
            }
            const formattedCoins = cryptoCoins.toLocaleString("en-US");
            const formattedBalance = newBalance.toLocaleString("en-US");
            const info = [
              `Username: ${username}`,
              `Crypto Coins: 🪙${formattedCoins}`,
              `Balance: $${formattedBalance}`,
              `Mining Status: ${miningStatus}`,
            ].join("\n");
            if (pendingCoins > 0 || newCosts > miningCosts) {
              await hoshinoDB.set(userID, {
                ...userData,
                cryptoCoins: cryptoCoins + pendingCoins,
                balance: newBalance,
                miningStartTime: null,
                miningCosts: 0, 
              });
              if (pendingCoins > 0) {
                info += `\nCollected ${pendingCoins} coin(s) from mining!`;
              }
              if (newCosts > miningCosts) {
                info += `\nIncurred $${(newCosts - miningCosts).toLocaleString("en-US")} in mining costs.`;
              }
            }
            await chat.reply(info);
          },
        },
        {
          subcommand: "convert",
          aliases: ["conv", "exchange"],
          description: "Convert crypto coins to balance money.",
          usage: "crypto convert <amount>",
          async deploy({ chat, args, event, hoshinoDB }) {
            const userID = event.senderID;
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (args.length < 1 || isNaN(args[0])) {
              return await chat.reply(
                "Please provide a valid amount. Usage: crypto convert <amount>"
              );
            }
            const amount = parseInt(args[0], 10);
            if (amount <= 0) {
              return await chat.reply("Amount must be greater than 0.");
            }
            const {
              cryptoCoins = 0,
              balance = 0,
              miningStartTime = null,
              miningCosts = 0,
            } = userData;
            let pendingCoins = 0;
            let newCosts = miningCosts;
            let newBalance = balance;
            if (miningStartTime) {
              const minutesElapsed = Math.floor((Date.now() - miningStartTime) / 60000);
              pendingCoins = minutesElapsed;
              
              for (let i = 0; i < minutesElapsed; i++) {
                if (Math.random() < 0.2 && newBalance >= 10) {
                  const cost = Math.floor(Math.random() * 41) + 10;
                  newCosts += cost;
                  newBalance -= cost;
                }
              }
            }
            const totalCoins = cryptoCoins + pendingCoins;
            if (amount > totalCoins) {
              return await chat.reply(
                `You only have ${totalCoins} crypto coin(s) available!`
              );
            }
            let remainingCoins = amount;
            const exchangeRates = [
              { coins: 1000, balance: 1500000 },
              { coins: 500, balance: 1000 },
              { coins: 50, balance: 100 },
              { coins: 10, balance: 20 },
            ];
            for (const rate of exchangeRates) {
              while (remainingCoins >= rate.coins) {
                const conversions = Math.floor(remainingCoins / rate.coins);
                newBalance += conversions * rate.balance;
                remainingCoins -= conversions * rate.coins;
              }
            }
            
            if (remainingCoins > 0) {
              newBalance += remainingCoins * 2;
            }
            await hoshinoDB.set(userID, {
              ...userData,
              cryptoCoins: totalCoins - amount,
              balance: newBalance,
              miningStartTime: miningStartTime ? Date.now() : null, 
              miningCosts: 0, 
            });
            const costMessage = newCosts > miningCosts ? ` Incurred $${(newCosts - miningCosts).toLocaleString("en-US")} in mining costs.` : "";
            await chat.reply(
              `Converted ${amount} crypto coin(s) to $${(newBalance - balance).toLocaleString("en-US")} balance!${costMessage}`
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