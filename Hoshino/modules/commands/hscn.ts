const command: HoshinoLia.Command = {
  manifest: {
    name: "hscn",
    aliases: ["hc"],
    version: "1.0",
    developer: "Francis Loyd Raval & MrKimstersDev",
    description:
      "Manage your Hcoins: earn coins, check your balance, or convert to money. Earning may incur costs.",
    category: "Economy",
    usage: "hscn earn | hscn info | hscn convert <amount>",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "〘 💰 〙 HSCN",
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
          subcommand: "earn",
          aliases: ["start", "e"],
          description: "Start earning Hcoins (1 coin per minute, may incur costs).",
          usage: "hscn earn",
          async deploy({ chat, event, hoshinoDB }) {
            const userID = event.senderID;
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (userData.earningStartTime) {
              return await chat.reply("You are already earning Hcoins!");
            }
            await hoshinoDB.set(userID, {
              ...userData,
              earningStartTime: Date.now(),
              earningCosts: 0,
            });
            await chat.reply(
              "Started earning Hcoins! Earn 1 coin per minute. Note: Earning may deduct 10-50 balance per minute (20% chance)."
            );
          },
        },
        {
          subcommand: "info",
          aliases: ["i", "status"],
          description: "Check your Hcoin balance, earning status, and costs.",
          usage: "hscn info",
          async deploy({ chat, event, hoshinoDB }) {
            const userID = event.senderID;
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const {
              hcoins = 0,
              earningStartTime = null,
              earningCosts = 0,
              balance = 0,
              username,
            } = userData;
            let earningStatus = "Not earning.";
            let pendingCoins = 0;
            let newCosts = earningCosts;
            let newBalance = balance;
            if (earningStartTime) {
              const minutesElapsed = Math.floor((Date.now() - earningStartTime) / 60000);
              pendingCoins = minutesElapsed;
              for (let i = 0; i < minutesElapsed; i++) {
                if (Math.random() < 0.2 && newBalance >= 10) {
                  const cost = Math.floor(Math.random() * 41) + 10;
                  newCosts += cost;
                  newBalance -= cost;
                }
              }
              earningStatus = [
                "Earning for ",
                minutesElapsed.toString(),
                " minute(s). Pending: ",
                pendingCoins.toString(),
                " coin(s). Costs: $",
                newCosts.toLocaleString("en-US"),
                "."
              ].join("");
            }
            const formattedCoins = hcoins.toLocaleString("en-US");
            const formattedBalance = newBalance.toLocaleString("en-US");
            const infoLines = [
              `Username: ${username}`,
              `Hcoins: 🪙${formattedCoins}`,
              `Balance: $${formattedBalance}`,
              `Earning Status: ${earningStatus}`,
            ];
            if (pendingCoins > 0 || newCosts > earningCosts) {
              await hoshinoDB.set(userID, {
                ...userData,
                hcoins: hcoins + pendingCoins,
                balance: newBalance,
                earningStartTime: null,
                earningCosts: 0,
              });
              if (pendingCoins > 0) {
                infoLines.push(`Collected ${pendingCoins} coin(s) from earning!`);
              }
              if (newCosts > earningCosts) {
                infoLines.push(`Incurred $${(newCosts - earningCosts).toLocaleString("en-US")} in earning costs.`);
              }
            }
            await chat.reply(infoLines.join("\n"));
          },
        },
        {
          subcommand: "convert",
          aliases: ["conv", "exchange"],
          description: "Convert Hcoins to balance money.",
          usage: "hscn convert <amount>",
          async deploy({ chat, args, event, hoshinoDB }) {
            const userID = event.senderID;
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (args.length < 1) {
              return await chat.reply(
                "Please provide an amount. Usage: hscn convert <amount>"
              );
            }
            const amount = parseInt(args[0], 10);
            if (isNaN(amount) || !Number.isInteger(amount)) {
              return await chat.reply(
                "Please provide a valid integer amount. Usage: hscn convert <amount>"
              );
            }
            if (amount <= 0) {
              return await chat.reply("Amount must be greater than 0.");
            }
            const {
              hcoins = 0,
              balance = 0,
              earningStartTime = null,
              earningCosts = 0,
            } = userData;
            let pendingCoins = 0;
            let newCosts = earningCosts;
            let newBalance = balance;
            if (earningStartTime) {
              const minutesElapsed = Math.floor((Date.now() - earningStartTime) / 60000);
              pendingCoins = minutesElapsed;
              for (let i = 0; i < minutesElapsed; i++) {
                if (Math.random() < 0.2 && newBalance >= 10) {
                  const cost = Math.floor(Math.random() * 41) + 10;
                  newCosts += cost;
                  newBalance -= cost;
                }
              }
            }
            const totalCoins = hcoins + pendingCoins;
            if (amount > totalCoins) {
              return await chat.reply(
                `You only have ${totalCoins} Hcoin(s) available!`
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
              hcoins: totalCoins - amount,
              balance: newBalance,
              earningStartTime: earningStartTime ? Date.now() : null,
              earningCosts: 0,
            });
            const costMessage =
              newCosts > earningCosts
                ? ` Incurred $${(newCosts - earningCosts).toLocaleString("en-US")} in earning costs.`
                : "";
            await chat.reply(
              `Converted ${amount} Hcoin(s) to $${(newBalance - balance).toLocaleString(
                "en-US"
              )} balance!${costMessage}`
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
