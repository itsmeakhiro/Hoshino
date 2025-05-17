const { cleanUserID } = global.Hoshino.utils;

const BEE_ITEMS = [
  { name: "Honey Jar", emoji: "🍯", value: 15 },
  { name: "Beeswax Chunk", emoji: "🕯️", value: 12 },
  { name: "Pollen Clump", emoji: "🌼", value: 10 },
  { name: "Royal Jelly", emoji: "👑", value: 20 },
  { name: "Propolis Drop", emoji: "💧", value: 14 },
  { name: "Bee Bread", emoji: "🍞", value: 18 },
  { name: "Comb Fragment", emoji: "🍮", value: 13 },
  { name: "Nectar Vial", emoji: "🧪", value: 11 },
  { name: "Wax Moth Larva", emoji: "🐛", value: 16 },
  { name: "Hive Dust", emoji: "💨", value: 10 },
  { name: "Queen Pheromone", emoji: "🐝", value: 22 },
  { name: "Stinger Shard", emoji: "🗡️", value: 17 },
  { name: "Mite Carcass", emoji: "🕷️", value: 13 },
  { name: "Flower Petal", emoji: "🌸", value: 19 },
  { name: "Cappings Scrap", emoji: "🧈", value: 25 },
];

// DO NOT REMOVE HoshinoLia.Command, do not add types on async deploy ctx
const command: HoshinoLia.Command = {
  manifest: {
    name: "beefarm",
    aliases: ["bfarm"],
    version: "1.0.0",
    developer: "Francis Loyd Raval",
    description:
      "Manage a bee farm to earn balance money by collecting bee-related items like honey jars and beeswax. Farming is always active after starting; check progress, collect earnings, or upgrade to boost earnings.",
    category: "Economy",
    usage: "beefarm start | beefarm status | beefarm collect | beefarm upgrade",
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
    const home = new ctx.HoshinoHM(
      [
        {
          subcommand: "start",
          aliases: ["begin", "s"],
          description: "Start managing your bee farm to earn balance money (remains active).",
          usage: "beefarm start",
          async deploy({ chat, event, hoshinoDB }) {
            const userID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (userData.beeFarmStartTime) {
              return await chat.reply(
                "Bee farming is already active! Use 'beefarm status' to check progress or 'beefarm collect' to claim earnings."
              );
            }
            await hoshinoDB.set(userID, {
              ...userData,
              beeFarmStartTime: Date.now(),
              beeFarmItems: {
                honeyJar: 0,
                beeswaxChunk: 0,
                pollenClump: 0,
                royalJelly: 0,
                propolisDrop: 0,
                beeBread: 0,
                combFragment: 0,
                nectarVial: 0,
                waxMothLarva: 0,
                hiveDust: 0,
                queenPheromone: 0,
                stingerShard: 0,
                miteCarcass: 0,
                flowerPetal: 0,
                cappingsScrap: 0,
              },
              beeFarmLevel: userData.beeFarmLevel || 0,
              beeFarmUpgradeCost: userData.beeFarmUpgradeCost || 50,
            });
            await chat.reply(
              "Started your bee farm! Collect items like honey jars ($15 each) and beeswax chunks ($12 each) to earn balance (30% chance per minute). Farming will continue until you collect earnings."
            );
          },
        },
        {
          subcommand: "status",
          aliases: ["info", "i"],
          description: "Check your bee farm progress and pending earnings.",
          usage: "beefarm status",
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
              beeFarmStartTime = null,
              beeFarmItems = {
                honeyJar: 0,
                beeswaxChunk: 0,
                pollenClump: 0,
                royalJelly: 0,
                propolisDrop: 0,
                beeBread: 0,
                combFragment: 0,
                nectarVial: 0,
                waxMothLarva: 0,
                hiveDust: 0,
                queenPheromone: 0,
                stingerShard: 0,
                miteCarcass: 0,
                flowerPetal: 0,
                cappingsScrap: 0,
              },
              beeFarmLevel = 0,
              username,
              gameid = "N/A",
            } = userData;
            if (!beeFarmStartTime) {
              return await chat.reply(
                "You are not farming bees. Start with: beefarm start"
              );
            }
            const minutesElapsed = Math.floor(
              (Date.now() - beeFarmStartTime) / 60000
            );
            const itemsCollected = { ...beeFarmItems };
            for (let i = 0; i < minutesElapsed; i++) {
              if (Math.random() < 0.3) {
                const item = BEE_ITEMS[Math.floor(Math.random() * BEE_ITEMS.length)];
                const key = item.name.toLowerCase().replace(/\s+/g, "");
                itemsCollected[key] = (itemsCollected[key] || 0) + 1;
              }
            }
            let totalValue = 0;
            const itemLines: string[] = [];
            BEE_ITEMS.forEach((item) => {
              const key = item.name.toLowerCase().replace(/\s+/g, "");
              const count = itemsCollected[key] || 0;
              const itemValue = count * item.value;
              totalValue += itemValue;
              if (count > 0) {
                itemLines.push(
                  `${item.emoji} ${item.name}: ${count} ($${itemValue.toLocaleString("en-US")})`
                );
              }
            });
            if (itemLines.length === 0) {
              itemLines.push("No items collected yet.");
            }
            const multiplier = 1 + beeFarmLevel * 0.5;
            const boostedValue = totalValue * multiplier;
            const infoLines: string[] = [
              `Username: ${username}`,
              `Game ID: ${gameid}`,
              `Balance: $${balance.toLocaleString("en-US")}`,
              `Farming for ${minutesElapsed} minute(s).`,
              `Bee Farm Level: ${beeFarmLevel} (x${multiplier.toFixed(1)} earnings)`,
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
          usage: "beefarm collect",
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
              beeFarmStartTime = null,
              beeFarmItems = {
                honeyJar: 0,
                beeswaxChunk: 0,
                pollenClump: 0,
                royalJelly: 0,
                propolisDrop: 0,
                beeBread: 0,
                combFragment: 0,
                nectarVial: 0,
                waxMothLarva: 0,
                hiveDust: 0,
                queenPheromone: 0,
                stingerShard: 0,
                miteCarcass: 0,
                flowerPetal: 0,
                cappingsScrap: 0,
              },
              beeFarmLevel = 0,
            } = userData;
            if (!beeFarmStartTime) {
              return await chat.reply(
                "You are not farming bees. Start with: beefarm start"
              );
            }
            const minutesElapsed = Math.floor(
              (Date.now() - beeFarmStartTime) / 60000
            );
            const itemsCollected = { ...beeFarmItems };
            for (let i = 0; i < minutesElapsed; i++) {
              if (Math.random() < 0.3) {
                const item = BEE_ITEMS[Math.floor(Math.random() * BEE_ITEMS.length)];
                const key = item.name.toLowerCase().replace(/\s+/g, "");
                itemsCollected[key] = (itemsCollected[key] || 0) + 1;
              }
            }
            let totalValue = 0;
            const itemLines: string[] = [];
            BEE_ITEMS.forEach((item) => {
              const key = item.name.toLowerCase().replace(/\s+/g, "");
              const count = itemsCollected[key] || 0;
              const itemValue = count * item.value;
              totalValue += itemValue;
              if (count > 0) {
                itemLines.push(
                  `${item.emoji} ${item.name}: ${count} ($${itemValue.toLocaleString("en-US")})`
                );
              }
            });
            const multiplier = 1 + beeFarmLevel * 0.5;
            const boostedValue = totalValue * multiplier;
            const infoLines: string[] = [];
            if (totalValue > 0) {
              infoLines.push(
                `Collected $${boostedValue.toLocaleString(
                  "en-US"
                )} from bee farming!`
              );
              infoLines.push("Items collected:");
              infoLines.push(...itemLines);
            } else {
              infoLines.push("No balance was earned from bee farming.");
            }
            infoLines.push("Bee farming continues for the next earnings!");
            await hoshinoDB.set(userID, {
              ...userData,
              balance: balance + boostedValue,
              beeFarmStartTime: Date.now(),
              beeFarmItems: {
                honeyJar: 0,
                beeswaxChunk: 0,
                pollenClump: 0,
                royalJelly: 0,
                propolisDrop: 0,
                beeBread: 0,
                combFragment: 0,
                nectarVial: 0,
                waxMothLarva: 0,
                hiveDust: 0,
                queenPheromone: 0,
                stingerShard: 0,
                miteCarcass: 0,
                flowerPetal: 0,
                cappingsScrap: 0,
              },
            });
            await chat.reply(infoLines.join("\n"));
          },
        },
        {
          subcommand: "upgrade",
          aliases: ["up", "u"],
          description: "Upgrade your bee farm to boost earnings multiplier.",
          usage: "beefarm upgrade",
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
              beeFarmLevel = 0,
              beeFarmUpgradeCost = 50,
            } = userData;
            if (balance < beeFarmUpgradeCost) {
              return await chat.reply(
                `You need $${beeFarmUpgradeCost.toLocaleString(
                  "en-US"
                )} to upgrade your bee farm! Current balance: $${balance.toLocaleString(
                  "en-US"
                )}.`
              );
            }
            const newLevel = beeFarmLevel + 1;
            const newCost = beeFarmUpgradeCost * 2;
            const newMultiplier = 1 + newLevel * 0.5;
            await hoshinoDB.set(userID, {
              ...userData,
              balance: balance - beeFarmUpgradeCost,
              beeFarmLevel: newLevel,
              beeFarmUpgradeCost: newCost,
            });
            await chat.reply(
              `Upgraded bee farm to level ${newLevel}! Earnings multiplier increased to x${newMultiplier.toFixed(
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
