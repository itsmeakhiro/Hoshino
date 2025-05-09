const { cleanUserID } = global.Hoshino.utils;

const CHICKEN_ITEMS = {
  common: [
    { name: "Chicken Egg", emoji: "🥚", value: 10 },
    { name: "Feather Pile", emoji: "🪶", value: 12 },
    { name: "Manure Sack", emoji: "💩", value: 10 },
    { name: "Corn Husk", emoji: "🌽", value: 15 },
  ],
  rare: [
    { name: "Pullet Feather", emoji: "🐣", value: 16 },
    { name: "Hen Droppings", emoji: "🐔", value: 18 },
    { name: "Nest Straw", emoji: "🌾", value: 17 },
    { name: "Egg Shell", emoji: "🦴", value: 20 },
  ],
  epic: [
    { name: "Rooster Spur", emoji: "🐓", value: 21 },
    { name: "Chick Down", emoji: "🐥", value: 22 },
    { name: "Fertile Egg", emoji: "🥚", value: 24 },
    { name: "Comb Scrap", emoji: "🧹", value: 25 },
  ],
  legendary: [
    { name: "Rooster Spur", emoji: "🐓", value: 21 },
    { name: "Chick Down", emoji: "🐥", value: 22 },
    { name: "Fertile Egg", emoji: "🥚", value: 24 },
    { name: "Comb Scrap", emoji: "🧹", value: 25 },
    { name: "Golden Egg", emoji: "🥚✨", value: 1000000 },
  ],
};

const RARITY_PROBABILITIES = [
  { rarity: "common", chance: 0.7 },
  { rarity: "rare", chance: 0.2 },
  { rarity: "epic", chance: 0.09 },
  { rarity: "legendary", chance: 0.01 },
];

// DO NOT REMOVE HoshinoLia.Command, do not add types on async deploy ctx
const command: HoshinoLia.Command = {
  manifest: {
    name: "chickenfarm",
    aliases: ["cfarm"],
    version: "1.0",
    developer: "Francis Loyd Raval",
    description:
      "Manage a chicken farm to earn balance money by collecting items like eggs and feathers. Buy land (50% chance), buy chickens (random rarity), and farm to earn. Higher rarity chickens yield better items, with Legendary chickens able to lay Golden Eggs ($1,000,000).",
    category: "Economy",
    usage: "chickenfarm buy-land | chickenfarm buy-chicken | chickenfarm start | chickenfarm status | chickenfarm collect | chickenfarm upgrade",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "〘 🐔 〙 CHICKEN FARM",
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
          subcommand: "buy-land",
          aliases: ["land", "bl"],
          description: "Attempt to buy land for your chicken farm (50% chance, $1000 cost).",
          usage: "chickenfarm buy-land",
          async deploy({ chat, event, hoshinoDB }) {
            const userID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const { balance = 0, hasLand = false } = userData;
            if (hasLand) {
              return await chat.reply(
                "You already own land for your chicken farm!"
              );
            }
            if (balance < 1000) {
              return await chat.reply(
                `You need $1000 to buy land! Current balance: $${balance.toLocaleString("en-US")}.`
              );
            }
            const success = Math.random() < 0.5;
            if (!success) {
              return await chat.reply(
                "The land purchase failed! Better luck next time (50% chance)."
              );
            }
            await hoshinoDB.set(userID, {
              ...userData,
              balance: balance - 1000,
              hasLand: true,
            });
            await chat.reply(
              "Successfully bought land for $1000! You can now buy chickens and start farming."
            );
          },
        },
        {
          subcommand: "buy-chicken",
          aliases: ["chicken", "bc"],
          description: "Buy a chicken for your farm ($500 each, random rarity).",
          usage: "chickenfarm buy-chicken",
          async deploy({ chat, event, hoshinoDB }) {
            const userID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const { balance = 0, hasLand = false, chickens = [] } = userData;
            if (!hasLand) {
              return await chat.reply(
                "You need to own land first! Use: chickenfarm buy-land"
              );
            }
            if (balance < 500) {
              return await chat.reply(
                `You need $500 to buy a chicken! Current balance: $${balance.toLocaleString("en-US")}.`
              );
            }
            let random = Math.random();
            let rarity = "common";
            for (const { rarity: r, chance } of RARITY_PROBABILITIES) {
              if (random < chance) {
                rarity = r;
                break;
              }
              random -= chance;
            }
            const newChickens = [...chickens, { rarity }];
            await hoshinoDB.set(userID, {
              ...userData,
              balance: balance - 500,
              chickens: newChickens,
            });
            await chat.reply(
              `Bought a ${rarity.charAt(0).toUpperCase() + rarity.slice(1)} chicken for $500! You now own ${newChickens.length} chicken(s).`
            );
          },
        },
        {
          subcommand: "start",
          aliases: ["begin", "s"],
          description: "Start farming chickens to earn balance money (remains active).",
          usage: "chickenfarm start",
          async deploy({ chat, event, hoshinoDB }) {
            const userID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const { hasLand = false, chickens = [], chickenFarmStartTime = null } = userData;
            if (!hasLand) {
              return await chat.reply(
                "You need to own land first! Use: chickenfarm buy-land"
              );
            }
            if (chickens.length === 0) {
              return await chat.reply(
                "You need at least one chicken! Use: chickenfarm buy-chicken"
              );
            }
            if (chickenFarmStartTime) {
              return await chat.reply(
                "Chicken farming is already active! Use 'chickenfarm status' to check progress or 'chickenfarm collect' to claim earnings."
              );
            }
            await hoshinoDB.set(userID, {
              ...userData,
              chickenFarmStartTime: Date.now(),
              chickenFarmItems: {
                chickenEgg: 0,
                featherPile: 0,
                manureSack: 0,
                cornHusk: 0,
                pulletFeather: 0,
                henDroppings: 0,
                nestStraw: 0,
                eggShell: 0,
                roosterSpur: 0,
                chickDown: 0,
                fertileEgg: 0,
                combScrap: 0,
                goldenEgg: 0,
              },
              chickenFarmLevel: userData.chickenFarmLevel || 0,
              chickenFarmUpgradeCost: userData.chickenFarmUpgradeCost || 50,
            });
            await chat.reply(
              `Started your chicken farm with ${chickens.length} chicken(s)! Collect items like eggs ($10–$25) or a Golden Egg ($1,000,000 from Legendary chickens) to earn balance (30% chance per minute per chicken). Farming will continue until you collect earnings.`
            );
          },
        },
        {
          subcommand: "status",
          aliases: ["info", "i"],
          description: "Check your chicken farm progress and pending earnings.",
          usage: "chickenfarm status",
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
              hasLand = false,
              chickens = [],
              chickenFarmStartTime = null,
              chickenFarmItems = {
                chickenEgg: 0,
                featherPile: 0,
                manureSack: 0,
                cornHusk: 0,
                pulletFeather: 0,
                henDroppings: 0,
                nestStraw: 0,
                eggShell: 0,
                roosterSpur: 0,
                chickDown: 0,
                fertileEgg: 0,
                combScrap: 0,
                goldenEgg: 0,
              },
              chickenFarmLevel = 0,
              username,
              gameid = "N/A",
            } = userData;
            if (!hasLand) {
              return await chat.reply(
                "You need to own land first! Use: chickenfarm buy-land"
              );
            }
            if (chickens.length === 0) {
              return await chat.reply(
                "You need at least one chicken! Use: chickenfarm buy-chicken"
              );
            }
            if (!chickenFarmStartTime) {
              return await chat.reply(
                "You are not farming chickens. Start with: chickenfarm start"
              );
            }
            const minutesElapsed = Math.floor(
              (Date.now() - chickenFarmStartTime) / 60000
            );
            const itemsCollected = { ...chickenFarmItems };
            for (let i = 0; i < minutesElapsed; i++) {
              for (const { rarity } of chickens) {
                if (Math.random() < 0.3) {
                  const items = CHICKEN_ITEMS[rarity].filter(
                    (item) => item.name !== "Golden Egg"
                  );
                  const item = items[Math.floor(Math.random() * items.length)];
                  const key = item.name.toLowerCase().replace(/\s+/g, "");
                  itemsCollected[key] = (itemsCollected[key] || 0) + 1;
                }
                if (rarity === "legendary" && Math.random() < 0.05) {
                  itemsCollected.goldenEgg = (itemsCollected.goldenEgg || 0) + 1;
                }
              }
            }
            let totalValue = 0;
            const itemLines: string[] = [];
            const allItems = [
              ...CHICKEN_ITEMS.common,
              ...CHICKEN_ITEMS.rare,
              ...CHICKEN_ITEMS.epic,
              ...CHICKEN_ITEMS.legendary,
            ].reduce((acc, item) => {
              acc[item.name] = item;
              return acc;
            }, {});
            Object.keys(itemsCollected).forEach((key) => {
              const count = itemsCollected[key] || 0;
              const item = allItems[key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())];
              if (item && count > 0) {
                const itemValue = count * item.value;
                totalValue += itemValue;
                itemLines.push(
                  `${item.emoji} ${item.name}: ${count} ($${itemValue.toLocaleString("en-US")})`
                );
              }
            });
            if (itemLines.length === 0) {
              itemLines.push("No items collected yet.");
            }
            const multiplier = 1 + chickenFarmLevel * 0.5;
            const boostedValue = totalValue * multiplier;
            const chickenCounts = chickens.reduce((acc, { rarity }) => {
              acc[rarity] = (acc[rarity] || 0) + 1;
              return acc;
            }, {});
            const chickenSummary = Object.entries(chickenCounts)
              .map(([rarity, count]) => `${rarity.charAt(0).toUpperCase() + rarity.slice(1)}: ${count}`)
              .join(", ");
            const infoLines: string[] = [
              `Username: ${username}`,
              `Game ID: ${gameid}`,
              `Balance: $${balance.toLocaleString("en-US")}`,
              `Land Owned: ${hasLand ? "Yes" : "No"}`,
              `Chickens Owned: ${chickens.length} (${chickenSummary || "None"})`,
              `Farming for ${minutesElapsed} minute(s).`,
              `Chicken Farm Level: ${chickenFarmLevel} (x${multiplier.toFixed(1)} earnings)`,
              `Collected Items:`,
              ...itemLines,
              `Total Pending Value: $${boostedValue.toLocaleString("en-US")}`,
            ];
            await chat.reply(infoLines.join("\n"));
          },
        },
        {
          subcommand: "collect",
          aliases: ["claim", "c"],
          description: "Collect your pending balance and reset earnings for continued farming.",
          usage: "chickenfarm collect",
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
              hasLand = false,
              chickens = [],
              chickenFarmStartTime = null,
              chickenFarmItems = {
                chickenEgg: 0,
                featherPile: 0,
                manureSack: 0,
                cornHusk: 0,
                pulletFeather: 0,
                henDroppings: 0,
                nestStraw: 0,
                eggShell: 0,
                roosterSpur: 0,
                chickDown: 0,
                fertileEgg: 0,
                combScrap: 0,
                goldenEgg: 0,
              },
              chickenFarmLevel = 0,
            } = userData;
            if (!hasLand) {
              return await chat.reply(
                "You need to own land first! Use: chickenfarm buy-land"
              );
            }
            if (chickens.length === 0) {
              return await chat.reply(
                "You need at least one chicken! Use: chickenfarm buy-chicken"
              );
            }
            if (!chickenFarmStartTime) {
              return await chat.reply(
                "You are not farming chickens. Start with: chickenfarm start"
              );
            }
            const minutesElapsed = Math.floor(
              (Date.now() - chickenFarmStartTime) / 60000
            );
            const itemsCollected = { ...chickenFarmItems };
            for (let i = 0; i < minutesElapsed; i++) {
              for (const { rarity } of chickens) {
                if (Math.random() < 0.3) {
                  const items = CHICKEN_ITEMS[rarity].filter(
                    (item) => item.name !== "Golden Egg"
                  );
                  const item = items[Math.floor(Math.random() * items.length)];
                  const key = item.name.toLowerCase().replace(/\s+/g, "");
                  itemsCollected[key] = (itemsCollected[key] || 0) + 1;
                }
                if (rarity === "legendary" && Math.random() < 0.05) {
                  itemsCollected.goldenEgg = (itemsCollected.goldenEgg || 0) + 1;
                }
              }
            }
            let totalValue = 0;
            const itemLines: string[] = [];
            const allItems = [
              ...CHICKEN_ITEMS.common,
              ...CHICKEN_ITEMS.rare,
              ...CHICKEN_ITEMS.epic,
              ...CHICKEN_ITEMS.legendary,
            ].reduce((acc, item) => {
              acc[item.name] = item;
              return acc;
            }, {});
            Object.keys(itemsCollected).forEach((key) => {
              const count = itemsCollected[key] || 0;
              const item = allItems[key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())];
              if (item && count > 0) {
                const itemValue = count * item.value;
                totalValue += itemValue;
                itemLines.push(
                  `${item.emoji} ${item.name}: ${count} ($${itemValue.toLocaleString("en-US")})`
                );
              }
            });
            const multiplier = 1 + chickenFarmLevel * 0.5;
            const boostedValue = totalValue * multiplier;
            const infoLines: string[] = [];
            if (totalValue > 0) {
              infoLines.push(
                `Collected $${boostedValue.toLocaleString(
                  "en-US"
                )} from chicken farming!`
              );
              infoLines.push("Items collected:");
              infoLines.push(...itemLines);
            } else {
              infoLines.push("No balance was earned from chicken farming.");
            }
            infoLines.push("Chicken farming continues for the next earnings!");
            await hoshinoDB.set(userID, {
              ...userData,
              balance: balance + boostedValue,
              chickenFarmStartTime: Date.now(),
              chickenFarmItems: {
                chickenEgg: 0,
                featherPile: 0,
                manureSack: 0,
                cornHusk: 0,
                pulletFeather: 0,
                henDroppings: 0,
                nestStraw: 0,
                eggShell: 0,
                roosterSpur: 0,
                chickDown: 0,
                fertileEgg: 0,
                combScrap: 0,
                goldenEgg: 0,
              },
            });
            await chat.reply(infoLines.join("\n"));
          },
        },
        {
          subcommand: "upgrade",
          aliases: ["up", "u"],
          description: "Upgrade your chicken farm to boost earnings multiplier.",
          usage: "chickenfarm upgrade",
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
              hasLand = false,
              chickens = [],
              chickenFarmLevel = 0,
              chickenFarmUpgradeCost = 50,
            } = userData;
            if (!hasLand) {
              return await chat.reply(
                "You need to own land first! Use: chickenfarm buy-land"
              );
            }
            if (chickens.length === 0) {
              return await chat.reply(
                "You need at least one chicken! Use: chickenfarm buy-chicken"
              );
            }
            if (balance < chickenFarmUpgradeCost) {
              return await chat.reply(
                `You need $${chickenFarmUpgradeCost.toLocaleString(
                  "en-US"
                )} to upgrade your chicken farm! Current balance: $${balance.toLocaleString(
                  "en-US"
                )}.`
              );
            }
            const newLevel = chickenFarmLevel + 1;
            const newCost = chickenFarmUpgradeCost * 2;
            const newMultiplier = 1 + newLevel * 0.5;
            await hoshinoDB.set(userID, {
              ...userData,
              balance: balance - chickenFarmUpgradeCost,
              chickenFarmLevel: newLevel,
              chickenFarmUpgradeCost: newCost,
            });
            await chat.reply(
              `Upgraded chicken farm to level ${newLevel}! Earnings multiplier increased to x${newMultiplier.toFixed(
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
