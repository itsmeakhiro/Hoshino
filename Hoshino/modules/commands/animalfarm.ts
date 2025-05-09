const { cleanUserID } = global.Hoshino.utils;

const ANIMAL_RESOURCES = [
  { name: "Milk", emoji: "🐄", value: 1.5, unit: "liter" },
  { name: "Eggs", emoji: "🐓", value: 4, unit: "dozen" },
  { name: "Wool", emoji: "🐑", value: 1.5, unit: "pound" },
  { name: "Cheese", emoji: "🐐", value: 15, unit: "pound" },
  { name: "Truffles", emoji: "🐖", value: 50, unit: "ounce" },
];

// DO NOT REMOVE HoshinoLia.Command, do not add types on async deploy ctx
const command: HoshinoLia.Command = {
  manifest: {
    name: "animalfarm",
    aliases: ["afarm"],
    version: "1.0",
    developer: "Francis Loyd Raval",
    description:
      "Earn balance money by collecting resources from farm animals after buying land. Recruit helpers to boost earnings (with salary tax), check progress, collect earnings, or upgrade to boost earnings further. Resource values reflect real-world prices.",
    category: "Economy",
    usage:
      "animalfarm buy | animalfarm recruit | animalfarm start | animalfarm status | animalfarm collect | animalfarm upgrade",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "〘 🚜 〙 ANIMAL FARM",
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
          subcommand: "buy",
          aliases: ["purchase", "b"],
          description: "Buy a farm land to start farming.",
          usage: "animalfarm buy",
          async deploy({ chat, event, hoshinoDB }) {
            const userID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const { balance = 0, hasFarmLand = false } = userData;
            if (hasFarmLand) {
              return await chat.reply(
                "You already own a farm land! Use 'animalfarm start' to begin farming."
              );
            }
            const landCost = 5000;
            if (balance < landCost) {
              return await chat.reply(
                `You need $${landCost.toLocaleString(
                  "en-US"
                )} to buy a farm land! Current balance: $${balance.toLocaleString(
                  "en-US"
                )}.`
              );
            }
            await hoshinoDB.set(userID, {
              ...userData,
              balance: balance - landCost,
              hasFarmLand: true,
            });
            await chat.reply(
              `Purchased a farm land for $${landCost.toLocaleString(
                "en-US"
              )}! You can now start farming with 'animalfarm start'.`
            );
          },
        },
        {
          subcommand: "recruit",
          aliases: ["hire", "r"],
          description: "Recruit a helper to boost farming earnings (adds salary tax).",
          usage: "animalfarm recruit",
          async deploy({ chat, event, hoshinoDB }) {
            const userID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const { balance = 0, hasFarmLand = false, helpers = 0 } = userData;
            if (!hasFarmLand) {
              return await chat.reply(
                "You need to buy a farm land first! Use: animalfarm buy"
              );
            }
            const maxHelpers = 5;
            if (helpers >= maxHelpers) {
              return await chat.reply(
                `You have reached the maximum of ${maxHelpers} helpers!`
              );
            }
            const helperCost = 2000;
            if (balance < helperCost) {
              return await chat.reply(
                `You need $${helperCost.toLocaleString(
                  "en-US"
                )} to recruit a helper! Current balance: $${balance.toLocaleString(
                  "en-US"
                )}.`
              );
            }
            const newHelpers = helpers + 1;
            const helperMultiplier = 1 + newHelpers * 0.2;
            await hoshinoDB.set(userID, {
              ...userData,
              balance: balance - helperCost,
              helpers: newHelpers,
            });
            await chat.reply(
              `Recruited a helper! You now have ${newHelpers} helper(s), boosting earnings to x${helperMultiplier.toFixed(
                1
              )}. Note: Each helper adds $20/minute salary tax.`
            );
          },
        },
        {
          subcommand: "start",
          aliases: ["begin", "s"],
          description: "Start collecting animal resources to earn balance money (remains active).",
          usage: "animalfarm start",
          async deploy({ chat, event, hoshinoDB }) {
            const userID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const { hasFarmLand = false } = userData;
            if (!hasFarmLand) {
              return await chat.reply(
                "You need to buy a farm land first! Use: animalfarm buy"
              );
            }
            if (userData.farmStartTime) {
              return await chat.reply(
                "Farming is already active! Use 'animalfarm status' to check progress or 'animalfarm collect' to claim earnings."
              );
            }
            await hoshinoDB.set(userID, {
              ...userData,
              farmStartTime: Date.now(),
              farmItems: {
                milk: 0,
                eggs: 0,
                wool: 0,
                cheese: 0,
                truffles: 0,
              },
              pendingTax: 0,
              pendingHelperTax: 0,
              farmLevel: userData.farmLevel || 0,
              farmUpgradeCost: userData.farmUpgradeCost || 500,
              helpers: userData.helpers || 0,
            });
            await chat.reply(
              "Started farming! Collect resources like milk ($1.5/liter) and truffles ($50/ounce) to earn balance (30% chance per minute). Note: 50% chance per minute for $10 property tax, plus $20/minute salary tax per helper. Farming continues until you collect earnings."
            );
          },
        },
        {
          subcommand: "status",
          aliases: ["info", "i"],
          description: "Check your farming progress and pending earnings.",
          usage: "animalfarm status",
          async deploy({ chat, event, hoshinoDB }) {
            const userID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const {
              balance = 0,
              hasFarmLand = false,
              farmStartTime = null,
              farmItems = {
                milk: 0,
                eggs: 0,
                wool: 0,
                cheese: 0,
                truffles: 0,
              },
              pendingTax = 0,
              pendingHelperTax = 0,
              farmLevel = 0,
              helpers = 0,
              username,
              gameid = "N/A",
            } = userData;
            if (!hasFarmLand) {
              return await chat.reply(
                "You need to buy a farm land first! Use: animalfarm buy"
              );
            }
            if (!farmStartTime) {
              return await chat.reply(
                "You are not farming. Start with: animalfarm start"
              );
            }
            const minutesElapsed = Math.floor(
              (Date.now() - farmStartTime) / 60000
            );
            const itemsCollected = { ...farmItems };
            let totalTax = pendingTax;
            let totalHelperTax = pendingHelperTax;
            for (let i = 0; i < minutesElapsed; i++) {
              if (Math.random() < 0.3) {
                const item = ANIMAL_RESOURCES[Math.floor(Math.random() * ANIMAL_RESOURCES.length)];
                const key = item.name.toLowerCase();
                itemsCollected[key] = (itemsCollected[key] || 0) + 1;
              }
              if (Math.random() < 0.5) {
                totalTax += 10;
              }
              totalHelperTax += helpers * 20;
            }
            let totalValue = 0;
            const itemLines: string[] = [];
            ANIMAL_RESOURCES.forEach((item) => {
              const key = item.name.toLowerCase();
              const count = itemsCollected[key] || 0;
              const itemValue = count * item.value;
              totalValue += itemValue;
              if (count > 0) {
                itemLines.push(
                  `${item.emoji} ${item.name}: ${count} ${item.unit}(s) ($${itemValue.toLocaleString(
                    "en-US"
                  )})`
                );
              }
            });
            if (itemLines.length === 0) {
              itemLines.push("No resources collected yet.");
            }
            const farmMultiplier = 1 + farmLevel * 0.5;
            const helperMultiplier = 1 + helpers * 0.2;
            const boostedValue = totalValue * farmMultiplier * helperMultiplier;
            const totalTaxes = totalTax + totalHelperTax;
            const netValue = Math.max(0, boostedValue - totalTaxes);
            const infoLines: string[] = [
              `Username: ${username}`,
              `Game ID: ${gameid}`,
              `Balance: $${balance.toLocaleString("en-US")}`,
              `Farm Land: Owned`,
              `Farming for ${minutesElapsed} minute(s).`,
              `Farm Level: ${farmLevel} (x${farmMultiplier.toFixed(1)} earnings)`,
              `Helpers: ${helpers} (x${helperMultiplier.toFixed(1)} earnings)`,
              `Collected Resources:`,
              ...itemLines,
              `Pending Property Tax: $${totalTax.toLocaleString("en-US")}`,
              `Pending Helper Salary Tax: $${totalHelperTax.toLocaleString(
                "en-US"
              )}`,
              `Total Pending Value (after taxes): $${netValue.toLocaleString(
                "en-US"
              )}`,
            ];
            await chat.reply(infoLines.join("\n"));
          },
        },
        {
          subcommand: "collect",
          aliases: ["claim", "c"],
          description: "Collect your pending balance and reset earnings for continued farming.",
          usage: "animalfarm collect",
          async deploy({ chat, event, hoshinoDB }) {
            const userID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const {
              balance = 0,
              hasFarmLand = false,
              farmStartTime = null,
              farmItems = {
                milk: 0,
                eggs: 0,
                wool: 0,
                cheese: 0,
                truffles: 0,
              },
              pendingTax = 0,
              pendingHelperTax = 0,
              farmLevel = 0,
              helpers = 0,
            } = userData;
            if (!hasFarmLand) {
              return await chat.reply(
                "You need to buy a farm land first! Use: animalfarm buy"
              );
            }
            if (!farmStartTime) {
              return await chat.reply(
                "You are not farming. Start with: animalfarm start"
              );
            }
            const minutesElapsed = Math.floor(
              (Date.now() - farmStartTime) / 60000
            );
            const itemsCollected = { ...farmItems };
            let totalTax = pendingTax;
            let totalHelperTax = pendingHelperTax;
            for (let i = 0; i < minutesElapsed; i++) {
              if (Math.random() < 0.3) {
                const item = ANIMAL_RESOURCES[Math.floor(Math.random() * ANIMAL_RESOURCES.length)];
                const key = item.name.toLowerCase();
                itemsCollected[key] = (itemsCollected[key] || 0) + 1;
              }
              if (Math.random() < 0.5) {
                totalTax += 10;
              }
              totalHelperTax += helpers * 20;
            }
            let totalValue = 0;
            const itemLines: string[] = [];
            ANIMAL_RESOURCES.forEach((item) => {
              const key = item.name.toLowerCase();
              const count = itemsCollected[key] || 0;
              const itemValue = count * item.value;
              totalValue += itemValue;
              if (count > 0) {
                itemLines.push(
                  `${item.emoji} ${item.name}: ${count} ${item.unit}(s) ($${itemValue.toLocaleString(
                    "en-US"
                  )})`
                );
              }
            });
            const farmMultiplier = 1 + farmLevel * 0.5;
            const helperMultiplier = 1 + helpers * 0.2;
            const boostedValue = totalValue * farmMultiplier * helperMultiplier;
            const totalTaxes = totalTax + totalHelperTax;
            const netValue = Math.max(0, boostedValue - totalTaxes);
            const infoLines: string[] = [];
            if (totalValue > 0) {
              infoLines.push(
                `Collected $${netValue.toLocaleString(
                  "en-US"
                )} from farming after $${totalTax.toLocaleString(
                  "en-US"
                )} property tax and $${totalHelperTax.toLocaleString(
                  "en-US"
                )} helper salary tax!`
              );
              infoLines.push("Resources collected:");
              infoLines.push(...itemLines);
            } else {
              infoLines.push(
                `No balance was earned from farming. Property tax: $${totalTax.toLocaleString(
                  "en-US"
                )}, Helper salary tax: $${totalHelperTax.toLocaleString("en-US")}.`
              );
            }
            infoLines.push("Farming continues for the next earnings!");
            await hoshinoDB.set(userID, {
              ...userData,
              balance: balance + netValue,
              farmStartTime: Date.now(),
              farmItems: {
                milk: 0,
                eggs: 0,
                wool: 0,
                cheese: 0,
                truffles: 0,
              },
              pendingTax: 0,
              pendingHelperTax: 0,
            });
            await chat.reply(infoLines.join("\n"));
          },
        },
        {
          subcommand: "upgrade",
          aliases: ["up", "u"],
          description: "Upgrade your farm to boost earnings multiplier.",
          usage: "animalfarm upgrade",
          async deploy({ chat, event, hoshinoDB }) {
            const userID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const {
              balance = 0,
              hasFarmLand = false,
              farmLevel = 0,
              farmUpgradeCost = 500,
            } = userData;
            if (!hasFarmLand) {
              return await chat.reply(
                "You need to buy a farm land first! Use: animalfarm buy"
              );
            }
            if (balance < farmUpgradeCost) {
              return await chat.reply(
                `You need $${farmUpgradeCost.toLocaleString(
                  "en-US"
                )} to upgrade your farm! Current balance: $${balance.toLocaleString(
                  "en-US"
                )}.`
              );
            }
            const newLevel = farmLevel + 1;
            const newCost = farmUpgradeCost * 2;
            const newMultiplier = 1 + newLevel * 0.5;
            await hoshinoDB.set(userID, {
              ...userData,
              balance: balance - farmUpgradeCost,
              farmLevel: newLevel,
              farmUpgradeCost: newCost,
            });
            await chat.reply(
              `Upgraded farm to level ${newLevel}! Earnings multiplier increased to x${newMultiplier.toFixed(
                1
              )}. Next upgrade cost: $${newCost.toLocaleString("en-US")}.`
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
