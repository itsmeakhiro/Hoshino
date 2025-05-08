const { cleanUserID } = global.Hoshino.utils;

// DO NOT REMOVE HoshinoLia.Command, do not add types on async deploy ctx
const command: HoshinoLia.Command = {
  manifest: {
    name: "hscn",
    aliases: ["hc"],
    version: "1.0",
    developer: "Francis Loyd Raval & MrkimstersDev",
    description:
      "Manage your Hcoins: earn coins, check balance and gameid, convert to money, or collect earnings. Earning may incur costs.",
    category: "Economy",
    usage:
      "hscn earn | hscn info | hscn convert <amount> | hscn collect",
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
            const userID = cleanUserID(event.senderID);
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
          description: "Check your Hcoin balance, earning status, costs, and gameid.",
          usage: "hscn info",
          async deploy({ chat, event, hoshinoDB }) {
            const userID = cleanUserID(event.senderID);
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
              gameid = "N/A",
            } = userData;
            let earningStatus = "Not earning.";
            let pendingCoins = 0;
            let newCosts = earningCosts;
            let newBalance = balance;
            if (earningStartTime) {
              const minutesElapsed = Math.floor(
                (Date.now() - earningStartTime) / 60000
              );
              pendingCoins = minutesElapsed;
              for (let i = 0; i < minutesElapsed; i++) {
                if (Math.random() < 0.2 && newBalance >= 10) {
                  const cost = Math.floor(Math.random() * 41) + 10;
                  newCosts += cost;
                  newBalance -= cost;
                }
              }
              earningStatus = `Earning for ${minutesElapsed} minute(s). Pending: ${pendingCoins} coin - 1 coin(s). Costs: $${newCosts.toLocaleString(
                "en-US"
              )}.`;
            }
            const formattedCoins = hcoins.toLocaleString("en-US");
            const formattedBalance = newBalance.toLocaleString("en-US");
            const infoLines = [
              `Username: ${username}`,
              `Game ID: ${gameid}`,
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
                infoLines.push(
                  `Collected ${pendingCoins} coin(s) from earning!`
                );
              }
              if (newCosts > earningCosts) {
                infoLines.push(
                  `Incurred $${(newCosts - earningCosts).toLocaleString(
                    "en-US"
                  )} in earning costs.`
                );
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
            const userID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!args || args.length === 0) {
              return await chat.reply(
                "Please provide an amount. Usage: hscn convert <amount>"
              );
            }
            const amountStr = args.join(" ").trim();
            if (!/^\d+$/.test(amountStr)) {
              return await chat.reply(
                "Amount must be a positive number without spaces, letters, or symbols. Usage: hscn convert <amount>"
              );
            }
            const amount = parseInt(amountStr, 10);
            if (isNaN(amount) || amount <= 0) {
              return await chat.reply(
                "Amount must be a positive integer. Usage: hscn convert <amount>"
              );
            }
            const {
              hcoins = 0,
              balance = 0,
              earningStartTime = null,
              earningCosts = 0,
              gameid = "N/A",
            } = userData;
            let pendingCoins = 0;
            let newCosts = earningCosts;
            let newBalance = balance;
            if (earningStartTime) {
              const minutesElapsed = Math.floor(
                (Date.now() - earningStartTime) / 60000
              );
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
            let addedBalance = 0;
            const exchangeRates = [
              { coins: 1000, balance: 1500000 },
              { coins: 500, balance: 1000 },
              { coins: 50, balance: 100 },
              { coins: 10, balance: 20 },
            ];
            for (const rate of exchangeRates) {
              const conversions = Math.floor(remainingCoins / rate.coins);
              if (conversions > 0) {
                addedBalance += conversions * rate.balance;
                remainingCoins -= conversions * rate.coins;
              }
            }
            if (remainingCoins > 0) {
              addedBalance += remainingCoins * 2;
              remainingCoins = 0;
            }
            newBalance += addedBalance;
            await hoshinoDB.set(userID, {
              ...userData,
              hcoins: totalCoins - amount,
              balance: newBalance,
              earningStartTime: earningStartTime ? Date.now() : null,
              earningCosts: 0,
            });
            const costMessage =
              newCosts > earningCosts
                ? ` Incurred $${(newCosts - earningCosts).toLocaleString(
                    "en-US"
                  )} in earning costs.`
                : "";
            await chat.reply(
              `Converted ${amount} Hcoin(s) to $${addedBalance.toLocaleString(
                "en-US"
              )} balance!${costMessage}`
            );
          },
        },
        {
          subcommand: "collect",
          aliases: ["claim", "c"],
          description: "Collect your pending Hcoins from earning.",
          usage: "hscn collect",
          async deploy({ chat, event, hoshinoDB }) {
            const userID = cleanUserID(event.senderID);
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
            } = userData;
            if (!earningStartTime) {
              return await chat.reply(
                "You are not earning Hcoins. Start earning with: hscn earn"
              );
            }
            const minutesElapsed = Math.floor(
              (Date.now() - earningStartTime) / 60000
            );
            let pendingCoins = minutesElapsed;
            let newCosts = earningCosts;
            let newBalance = balance;
            for (let i = 0; i < minutesElapsed; i++) {
              if (Math.random() < 0.2 && newBalance >= 10) {
                const cost = Math.floor(Math.random() * 41) + 10;
                newCosts += cost;
                newBalance -= cost;
              }
            }
            const infoLines: string[] = [];
            if (pendingCoins > 0) {
              infoLines.push(
                `Collected ${pendingCoins} Hcoin(s) from earning!`
              );
            } else {
              infoLines.push("No Hcoins were pending to collect.");
            }
            if (newCosts > earningCosts) {
              infoLines.push(
                `Incurred $${(newCosts - earningCosts).toLocaleString(
                  "en-US"
                )} in earning costs.`
              );
            }
            await hoshinoDB.set(userID, {
              ...userData,
              hcoins: hcoins + pendingCoins,
              balance: newBalance,
              earningStartTime: null,
              earningCosts: 0,
            });
            await chat.reply(infoLines.join("\n"));
          },
        },
      ],
      "◆"
    );
    await home.runInContext(ctx);
  },
};

export default command;
