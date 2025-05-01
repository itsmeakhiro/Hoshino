/**
 * @type {HoshinoLia.Command}
 */

const command = {
  manifest: {
    name: "beefarm",
    aliases: ["bee", "farm"],
    version: "1.0",
    developer: "Francis Loyd Raval",
    description:
      "Manage a bee farm to earn money by collecting honey, upgrading land, and recruiting helpers. Top farmer gets a trophy with 3x earnings!",
    category: "Simulation",
    usage: "beefarm start | beefarm collect | beefarm buy | beefarm recruit | beefarm status | beefarm upgrade | beefarm leaderboard",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "〘 🐝 〙 BEE FARM",
    footer: "**Developed by**: Francis Loyd Raval",
  },
  font: {
    title: "bold",
    content: "sans",
    footer: "sans",
  },
  async deploy(ctx) {
    const lands = {
      none: { name: "No Land", cost: 0, honeys: [], minYield: 0, maxYield: 0, multiplier: 0 },
      starter: { name: "Starter Farm", cost: 1000, honeys: ["common"], minYield: 100, maxYield: 200, multiplier: 1 },
      small: { name: "Small Farm", cost: 5000, honeys: ["common", "golden"], minYield: 150, maxYield: 300, multiplier: 1.5 },
      medium: { name: "Medium Farm", cost: 20000, honeys: ["common", "golden"], minYield: 200, maxYield: 400, multiplier: 2 },
      large: { name: "Large Farm", cost: 50000, honeys: ["common", "golden", "royal"], minYield: 300, maxYield: 600, multiplier: 3 },
      estate: { name: "Bee Estate", cost: 100000, honeys: ["common", "golden", "royal"], minYield: 400, maxYield: 800, multiplier: 5 },
    };
    const honeys = {
      common: { name: "Common Honey", value: 5, emoji: "🍯" },
      golden: { name: "Golden Honey", value: 50, emoji: "✨" },
      royal: { name: "Royal Honey", value: 200, emoji: "👑" },
    };
    const landOrder = ["starter", "small", "medium", "large", "estate"];
    const home = new ctx.HoshinoHM(
      [
        {
          subcommand: "buy",
          aliases: ["purchase", "land"],
          description: "Buy a land to start your bee farm (50% chance of success).",
          usage: "beefarm buy",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (userData.beefarm?.land && userData.beefarm.land !== "none") {
              return await chat.reply(
                `You already own a ${lands[userData.beefarm.land].name}! Use 'beefarm upgrade' to get a better farm.`
              );
            }
            const cost = lands.starter.cost;
            const currentBalance = userData.balance || 0;
            if (currentBalance < cost) {
              return await chat.reply(
                `You need $${cost.toLocaleString("en-US")} to buy a Starter Farm, but you only have $${currentBalance.toLocaleString("en-US")}!`
              );
            }
            const success = Math.random() < 0.5;
            if (!success) {
              return await chat.reply(
                "No suitable land found! Try again."
              );
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: currentBalance - cost,
              beefarm: {
                active: false,
                startTime: 0,
                land: "starter",
                helpers: 0,
                collectedHoney: { common: 0, golden: 0, royal: 0 },
                lastCollectionTime: 0,
                totalEarnings: 0,
                hasTrophy: false,
              },
            });
            await chat.reply(
              `Successfully purchased a Starter Farm 🌻 for $${cost.toLocaleString("en-US")}! Use 'beefarm start' to begin farming. Your new balance is $${(currentBalance - cost).toLocaleString("en-US")}.`
            );
          },
        },
        {
          subcommand: "recruit",
          aliases: ["hire", "helper"],
          description: "Recruit a helper to boost earnings (with a salary tax).",
          usage: "beefarm recruit",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.beefarm || userData.beefarm.land === "none") {
              return await chat.reply(
                "You need to buy a farm first! Use 'beefarm buy' to purchase a Starter Farm."
              );
            }
            const currentHelpers = userData.beefarm.helpers || 0;
            if (currentHelpers >= 5) {
              return await chat.reply(
                "You have reached the maximum of 5 helpers!"
              );
            }
            const cost = 500 * (currentHelpers + 1);
            const currentBalance = userData.balance || 0;
            if (currentBalance < cost) {
              return await chat.reply(
                `You need $${cost.toLocaleString("en-US")} to recruit a helper, but you only have $${currentBalance.toLocaleString("en-US")}!`
              );
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: currentBalance - cost,
              beefarm: {
                ...userData.beefarm,
                helpers: currentHelpers + 1,
              },
            });
            await chat.reply(
              `Successfully recruited a helper 👨‍🌾 for $${cost.toLocaleString("en-US")}! You now have ${currentHelpers + 1} helper(s). They boost earnings by 20% each but take a 10% salary tax per helper. Your new balance is $${(currentBalance - cost).toLocaleString("en-US")}.`
            );
          },
        },
        {
          subcommand: "start",
          aliases: ["begin", "go"],
          description: "Start your bee farm to earn honey.",
          usage: "beefarm start",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.beefarm || userData.beefarm.land === "none") {
              return await chat.reply(
                "You need to buy a farm first! Use 'beefarm buy' to purchase a Starter Farm."
              );
            }
            let message = "";
            let userLand = userData.beefarm.land || "starter";
            let userHelpers = userData.beefarm.helpers || 0;
            let totalEarnings = userData.beefarm.totalEarnings || 0;
            let hasTrophy = userData.beefarm.hasTrophy || false;
            if (userData.beefarm.active && userData.beefarm.startTime) {
              const timeElapsed = (Date.now() - userData.beefarm.startTime) / 1000 / 60;
              if (isNaN(timeElapsed) || timeElapsed < 0) {
                message = "Farming session is invalid. Starting a new session.\n";
              } else if (timeElapsed > 0) {
                const availableHoneys = lands[userLand].honeys;
                const collectedHoney = userData.beefarm.collectedHoney || { common: 0, golden: 0, royal: 0 };
                let totalEarned = 0;
                let collectionEvents = Math.floor(timeElapsed / (Math.random() * 29 + 1)) || 1;
                let minYield = lands[userLand].minYield;
                let maxYield = lands[userLand].maxYield;
                let earningsMultiplier = lands[userLand].multiplier * Math.pow(1.2, userHelpers) * (1 - 0.1 * userHelpers);
                if (hasTrophy) {
                  earningsMultiplier *= 3;
                }
                for (let i = 0; i < collectionEvents; i++) {
                  const numHoneys = Math.floor(Math.random() * availableHoneys.length) + 1;
                  const selectedHoneys = availableHoneys.sort(() => Math.random() - 0.5).slice(0, numHoneys);
                  for (const honey of selectedHoneys) {
                    const quantity = Math.floor(Math.random() * (maxYield - minYield + 1)) + minYield;
                    collectedHoney[honey] = (collectedHoney[honey] || 0) + quantity;
                    totalEarned += quantity * honeys[honey].value;
                  }
                }
                totalEarned *= earningsMultiplier;
                const newBalance = (userData.balance || 0) + totalEarned;
                totalEarnings += totalEarned;
                await hoshinoDB.set(event.senderID, {
                  ...userData,
                  balance: newBalance,
                  beefarm: {
                    active: false,
                    startTime: 0,
                    land: userLand,
                    helpers: userHelpers,
                    collectedHoney: { common: 0, golden: 0, royal: 0 },
                    lastCollectionTime: Date.now(),
                    totalEarnings,
                    hasTrophy,
                  },
                });
                const timeDisplay = timeElapsed < 1 ? `${Math.floor(timeElapsed * 60)} seconds` : `${Math.floor(timeElapsed)} minutes`;
                message += `Farmed for ${timeDisplay}:\n` +
                  Object.entries(collectedHoney)
                    .filter(([_, quantity]) => quantity > 0)
                    .map(([honey, quantity]) => `${honeys[honey].name} ${honeys[honey].emoji}: ${quantity} jars worth $${(quantity * honeys[honey].value).toLocaleString("en-US")}`)
                    .join("\n") +
                  `\nTotal: $${totalEarned.toLocaleString("en-US")}${hasTrophy ? " (Trophy Bonus: 3x earnings)" : ""}\n`;
              }
            }
            const startTime = Date.now();
            await hoshinoDB.set(event.senderID, {
              ...userData,
              beefarm: {
                active: true,
                startTime,
                land: userLand,
                helpers: userHelpers,
                collectedHoney: { common: 0, golden: 0, royal: 0 },
                lastCollectionTime: userData.beefarm?.lastCollectionTime || 0,
                totalEarnings,
                hasTrophy,
              },
            });
            message += `Bee farm started with your ${lands[userLand].name} 🌻${userHelpers ? ` and ${userHelpers} helper(s) 👨‍🌾` : ""}${hasTrophy ? " (🏆 Trophy: 3x earnings)" : ""}! Use 'beefarm collect' to gather honey.`;
            await chat.reply(message);
          },
        },
        {
          subcommand: "status",
          aliases: ["info", "progress"],
          description: "Check your bee farm’s progress and estimated earnings.",
          usage: "beefarm status",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.beefarm || userData.beefarm.land === "none") {
              return await chat.reply(
                "You need to buy a farm first! Use 'beefarm buy' to purchase a Starter Farm."
              );
            }
            const userLand = userData.beefarm.land || "starter";
            const userHelpers = userData.beefarm.helpers || 0;
            const hasTrophy = userData.beefarm.hasTrophy || false;
            let message = `Current Farm: ${lands[userLand].name} 🌻${userHelpers ? ` with ${userHelpers} helper(s) 👨‍🌾` : ""}${hasTrophy ? " (🏆 Trophy: 3x earnings)" : ""}\n`;
            if (!userData.beefarm.active || !userData.beefarm.startTime) {
              message += "Status: Not currently farming. Use 'beefarm start' to begin.\n";
              return await chat.reply(message);
            }
            const timeElapsed = (Date.now() - userData.beefarm.startTime) / 1000 / 60;
            if (isNaN(timeElapsed) || timeElapsed < 0) {
              await hoshinoDB.set(event.senderID, {
                ...userData,
                beefarm: {
                  active: false,
                  startTime: 0,
                  land: userLand,
                  helpers: userHelpers,
                  collectedHoney: { common: 0, golden: 0, royal: 0 },
                  lastCollectionTime: userData.beefarm?.lastCollectionTime || 0,
                  totalEarnings: userData.beefarm?.totalEarnings || 0,
                  hasTrophy,
                },
              });
              return await chat.reply(
                "Farming session is invalid. Please start a new session with 'beefarm start'."
              );
            }
            const availableHoneys = lands[userLand].honeys;
            const collectedHoney = { common: 0, golden: 0, royal: 0 };
            let totalEarned = 0;
            let collectionEvents = Math.floor(timeElapsed / (Math.random() * 29 + 1)) || 1;
            let minYield = lands[userLand].minYield;
            let maxYield = lands[userLand].maxYield;
            let earningsMultiplier = lands[userLand].multiplier * Math.pow(1.2, userHelpers) * (1 - 0.1 * userHelpers);
            if (hasTrophy) {
              earningsMultiplier *= 3;
            }
            for (let i = 0; i < collectionEvents; i++) {
              const numHoneys = Math.floor(Math.random() * availableHoneys.length) + 1;
              const selectedHoneys = availableHoneys.sort(() => Math.random() - 0.5).slice(0, numHoneys);
              for (const honey of selectedHoneys) {
                const quantity = Math.floor(Math.random() * (maxYield - minYield + 1)) + minYield;
                collectedHoney[honey] = (collectedHoney[honey] || 0) + quantity;
                totalEarned += quantity * honeys[honey].value;
              }
            }
            totalEarned *= earningsMultiplier;
            message += `Status: Farming for ${timeElapsed < 1 ? `${Math.floor(timeElapsed * 60)} seconds` : `${Math.floor(timeElapsed)} minutes`}\n` +
                      `Estimated Honey:\n` +
                      (Object.keys(collectedHoney).some(h => collectedHoney[h] > 0)
                        ? Object.entries(collectedHoney)
                            .filter(([_, quantity]) => quantity > 0)
                            .map(([honey, quantity]) => `${honeys[honey].name} ${honeys[honey].emoji}: ${quantity} jars worth $${(quantity * honeys[honey].value).toLocaleString("en-US")}`)
                            .join("\n")
                        : "No honey collected yet.") +
                      `\nTotal Earnings: $${totalEarned.toLocaleString("en-US")}${hasTrophy ? " (Trophy Bonus: 3x earnings)" : ""}`;
            await chat.reply(message);
          },
        },
        {
          subcommand: "collect",
          aliases: ["claim", "gather"],
          description: "Collect honey earnings from your bee farm.",
          usage: "beefarm collect",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.beefarm || !userData.beefarm.active || !userData.beefarm.startTime) {
              return await chat.reply(
                "You haven't started farming! Use 'beefarm start' to begin."
              );
            }
            if (userData.beefarm.land === "none") {
              return await chat.reply(
                "You need to buy a farm first! Use 'beefarm buy' to purchase a Starter Farm."
              );
            }
            const timeElapsed = (Date.now() - userData.beefarm.startTime) / 1000 / 60;
            if (isNaN(timeElapsed) || timeElapsed < 0) {
              await hoshinoDB.set(event.senderID, {
                ...userData,
                beefarm: {
                  active: false,
                  startTime: 0,
                  land: userData.beefarm.land,
                  helpers: userData.beefarm.helpers || 0,
                  collectedHoney: { common: 0, golden: 0, royal: 0 },
                  lastCollectionTime: userData.beefarm.lastCollectionTime || 0,
                  totalEarnings: userData.beefarm.totalEarnings || 0,
                  hasTrophy: userData.beefarm.hasTrophy || false,
                },
              });
              return await chat.reply(
                "Farming session is invalid. Please start a new session with 'beefarm start'."
              );
            }
            const lastCollectionTime = userData.beefarm.lastCollectionTime || 0;
            if (Date.now() - lastCollectionTime < 60000) {
              return await chat.reply(
                "No honey collected yet. Come back after a minute or an hour for the collection."
              );
            }
            if (timeElapsed <= 0) {
              return await chat.reply(
                "No honey collected yet. Come back after a minute or an hour for the collection."
              );
            }
            const userLand = userData.beefarm.land;
            const userHelpers = userData.beefarm.helpers || 0;
            const hasTrophy = userData.beefarm.hasTrophy || false;
            const availableHoneys = lands[userLand].honeys;
            const collectedHoney = { common: 0, golden: 0, royal: 0 };
            let totalEarned = 0;
            let collectionEvents = Math.floor(timeElapsed / (Math.random() * 29 + 1)) || 1;
            let minYield = lands[userLand].minYield;
            let maxYield = lands[userLand].maxYield;
            let earningsMultiplier = lands[userLand].multiplier * Math.pow(1.2, userHelpers) * (1 - 0.1 * userHelpers);
            if (hasTrophy) {
              earningsMultiplier *= 3;
            }
            for (let i = 0; i < collectionEvents; i++) {
              const numHoneys = Math.floor(Math.random() * availableHoneys.length) + 1;
              const selectedHoneys = availableHoneys.sort(() => Math.random() - 0.5).slice(0, numHoneys);
              for (const honey of selectedHoneys) {
                const quantity = Math.floor(Math.random() * (maxYield - minYield + 1)) + minYield;
                collectedHoney[honey] = (collectedHoney[honey] || 0) + quantity;
                totalEarned += quantity * honeys[honey].value;
              }
            }
            totalEarned *= earningsMultiplier;
            const newBalance = (userData.balance || 0) + totalEarned;
            const newStartTime = Date.now();
            const totalEarnings = (userData.beefarm.totalEarnings || 0) + totalEarned;
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: newBalance,
              beefarm: {
                active: true,
                startTime: newStartTime,
                land: userLand,
                helpers: userHelpers,
                collectedHoney: { common: 0, golden: 0, royal: 0 },
                lastCollectionTime: newStartTime,
                totalEarnings,
                hasTrophy,
              },
            });
            const timeDisplay = timeElapsed < 1 ? `${Math.floor(timeElapsed * 60)} seconds` : `${Math.floor(timeElapsed)} minutes`;
            const replyMessage = `Farmed for ${timeDisplay}:\n` +
              Object.entries(collectedHoney)
                .filter(([_, quantity]) => quantity > 0)
                .map(([honey, quantity]) => `${honeys[honey].name} ${honeys[honey].emoji}: ${quantity} jars worth $${(quantity * honeys[honey].value).toLocaleString("en-US")}`)
                .join("\n") +
              `\nTotal: $${totalEarned.toLocaleString("en-US")}${hasTrophy ? " (Trophy Bonus: 3x earnings)" : ""}\nYour new balance is $${newBalance.toLocaleString("en-US")}.`;
            await chat.reply(replyMessage);
          },
        },
        {
          subcommand: "upgrade",
          aliases: ["expand", "improve"],
          description: "Upgrade your farm for more space and higher earnings.",
          usage: "beefarm upgrade",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.beefarm || userData.beefarm.land === "none") {
              return await chat.reply(
                "You need to buy a farm first! Use 'beefarm buy' to purchase a Starter Farm."
              );
            }
            const currentLand = userData.beefarm.land;
            if (currentLand === "estate") {
              return await chat.reply(
                "You already own the ultimate Bee Estate! No further upgrades available."
              );
            }
            const currentIndex = landOrder.indexOf(currentLand);
            const nextLand = landOrder[currentIndex + 1];
            let cost = lands[nextLand].cost;
            if (userData.beefarm.helpers > 0) {
              cost *= 2;
            }
            const currentBalance = userData.balance || 0;
            if (currentBalance < cost) {
              return await chat.reply(
                `You need $${cost.toLocaleString("en-US")} to upgrade to a ${lands[nextLand].name}, but you only have $${currentBalance.toLocaleString("en-US")}!`
              );
            }
            const newBalance = currentBalance - cost;
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: newBalance,
              beefarm: {
                ...userData.beefarm,
                land: nextLand,
              },
            });
            await chat.reply(
              `Successfully upgraded to a ${lands[nextLand].name} 🌻 for $${cost.toLocaleString("en-US")}! You can now produce: ${lands[nextLand].honeys.map(h => `${honeys[h].name} ${honeys[h].emoji}`).join(", ")}. Your new balance is $${newBalance.toLocaleString("en-US")}.`
            );
          },
        },
        {
          subcommand: "leaderboard",
          aliases: ["top", "rank"],
          description: "View the top 10 bee farmers by total earnings. Top farmer gets a trophy with 3x earnings!",
          usage: "beefarm leaderboard",
          async deploy({ chat, event, hoshinoDB, fonts }) {
            const allUsers = await hoshinoDB.getAll();
            const rankedUsers = Object.entries(allUsers)
              .filter(([_, user]) => user.beefarm?.totalEarnings > 0)
              .sort((a, b) => (b[1].beefarm?.totalEarnings || 0) - (a[1].beefarm?.totalEarnings || 0))
              .slice(0, 10);
            if (rankedUsers.length === 0) {
              return await chat.reply(
                "No bee farmers have earned money yet! Be the first to start with 'beefarm start'."
              );
            }
            const topUserId = rankedUsers[0]?.[0];
            for (const [uid, user] of Object.entries(allUsers)) {
              if (user.beefarm) {
                await hoshinoDB.set(uid, {
                  ...user,
                  beefarm: {
                    ...user.beefarm,
                    hasTrophy: uid === topUserId,
                  },
                });
              }
            }
            const message = "🏆 Bee Farm Leaderboard (Top 10) 🏆\n\n" +
              rankedUsers
                .map(([uid, user], index) => 
                  `${index + 1}. ${index === 0 ? fonts.outline(user.username || "Unknown") : user.username || "Unknown"} ${index === 0 ? "🏆" : ""} - $${(user.beefarm?.totalEarnings || 0).toLocaleString("en-US")}`
                )
                .join("\n") +
              (topUserId ? `\n\n${rankedUsers[0][1].username} holds the trophy and enjoys 3x earnings!` : "");
            await chat.reply(message);
          },
        },
      ],
      "◆"
    );
    await home.runInContext(ctx);
  },
};

export default command;