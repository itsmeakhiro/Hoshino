const { cleanUserID } = global.Hoshino.utils;

// Trash items with individual values
const TRASH_ITEMS = [
  { name: "Old Newspaper", emoji: "📰", value: 2 },
  { name: "Plastic Bottle", emoji: "🥤", value: 3 },
  { name: "Cardboard Box", emoji: "📦", value: 4 },
  { name: "Tin Can", emoji: "🥫", value: 2.5 },
  { name: "Scrap Metal", emoji: "🧷", value: 5 },
  { name: "Worn Glove", emoji: "🧤", value: 1.5 },
  { name: "Torn Paper", emoji: "📄", value: 1 },
  { name: "Used Battery", emoji: "🔋", value: 3.5 },
  { name: "Broken Toy", emoji: "🧩", value: 2 },
  { name: "Old Shoe", emoji: "🥾", value: 4.5 },
];

// DO NOT REMOVE HoshinoLia.Command, do not add types on async deploy ctx
const command: HoshinoLia.Command = {
  manifest: {
    name: "sweep",
    aliases: ["swp"],
    version: "1.0",
    developer: "Francis Loyd Raval & YhanDeva ( Yhander )",
    description:
      "Earn balance money by collecting random trash items. Sweeping is always active after starting; check progress, collect earnings, or upgrade to boost earnings.",
    category: "Economy",
    usage: "sweep start | sweep status | sweep collect | sweep upgrade",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "〘 🧹 〙 SWEEP",
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
          description: "Start collecting trash items to earn balance money (remains active).",
          usage: "sweep start",
          async deploy({ chat, event, hoshinoDB }) {
            const userID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (userData.sweepStartTime) {
              return await chat.reply(
                "Sweeping is already active! Use 'sweep status' to check progress or 'sweep collect' to claim earnings."
              );
            }
            await hoshinoDB.set(userID, {
              ...userData,
              sweepStartTime: Date.now(),
              sweepItems: {
                newspaper: 0,
                plasticBottle: 0,
                cardboardBox: 0,
                tinCan: 0,
                scrapMetal: 0,
                wornGlove: 0,
                tornPaper: 0,
                usedBattery: 0,
                brokenToy: 0,
                oldShoe: 0,
              },
              sweepLevel: userData.sweepLevel || 0,
              sweepUpgradeCost: userData.sweepUpgradeCost || 50,
            });
            await chat.reply(
              "Started sweeping trash! Collect items like newspapers ($2 each) and bottles ($3 each) to earn balance (30% chance per minute). Sweeping will continue until you collect earnings."
            );
          },
        },
        {
          subcommand: "status",
          aliases: ["info", "i"],
          description: "Check your trash collection progress and pending earnings.",
          usage: "sweep status",
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
              sweepStartTime = null,
              sweepItems = {
                newspaper: 0,
                plasticBottle: 0,
                cardboardBox: 0,
                tinCan: 0,
                scrapMetal: 0,
                wornGlove: 0,
                tornPaper: 0,
                usedBattery: 0,
                brokenToy: 0,
                oldShoe: 0,
              },
              sweepLevel = 0,
              username,
              gameid = "N/A",
            } = userData;
            if (!sweepStartTime) {
              return await chat.reply(
                "You are not sweeping trash. Start with: sweep start"
              );
            }
            const minutesElapsed = Math.floor(
              (Date.now() - sweepStartTime) / 60000
            );
            const itemsCollected = { ...sweepItems };
            for (let i = 0; i < minutesElapsed; i++) {
              if (Math.random() < 0.3) {
                const item = TRASH_ITEMS[Math.floor(Math.random() * TRASH_ITEMS.length)];
                const key = item.name.toLowerCase().replace(/\s+/g, "");
                itemsCollected[key] = (itemsCollected[key] || 0) + 1;
              }
            }
            let totalValue = 0;
            const itemLines: string[] = [];
            TRASH_ITEMS.forEach((item) => {
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
              itemLines.push("No trash items collected yet.");
            }
            const multiplier = 1 + sweepLevel * 0.5;
            const boostedValue = totalValue * multiplier;
            const infoLines: string[] = [
              `Username: ${username}`,
              `Game ID: ${gameid}`,
              `Balance: $${balance.toLocaleString("en-US")}`,
              `Sweeping for ${minutesElapsed} minute(s).`,
              `Sweep Level: ${sweepLevel} (x${multiplier.toFixed(1)} earnings)`,
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
          description: "Collect your pending balance and reset earnings for continued sweeping.",
          usage: "sweep collect",
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
              sweepStartTime = null,
              sweepItems = {
                newspaper: 0,
                plasticBottle: 0,
                cardboardBox: 0,
                tinCan: 0,
                scrapMetal: 0,
                wornGlove: 0,
                tornPaper: 0,
                usedBattery: 0,
                brokenToy: 0,
                oldShoe: 0,
              },
              sweepLevel = 0,
            } = userData;
            if (!sweepStartTime) {
              return await chat.reply(
                "You are not sweeping trash. Start with: sweep start"
              );
            }
            const minutesElapsed = Math.floor(
              (Date.now() - sweepStartTime) / 60000
            );
            const itemsCollected = { ...sweepItems };
            for (let i = 0; i < minutesElapsed; i++) {
              if (Math.random() < 0.3) {
                const item = TRASH_ITEMS[Math.floor(Math.random() * TRASH_ITEMS.length)];
                const key = item.name.toLowerCase().replace(/\s+/g, "");
                itemsCollected[key] = (itemsCollected[key] || 0) + 1;
              }
            }
            let totalValue = 0;
            const itemLines: string[] = [];
            TRASH_ITEMS.forEach((item) => {
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
            const multiplier = 1 + sweepLevel * 0.5;
            const boostedValue = totalValue * multiplier;
            const infoLines: string[] = [];
            if (totalValue > 0) {
              infoLines.push(
                `Collected $${boostedValue.toLocaleString(
                  "en-US"
                )} from sweeping!`
              );
              infoLines.push("Items collected:");
              infoLines.push(...itemLines);
            } else {
              infoLines.push("No balance was earned from sweeping.");
            }
            infoLines.push("Sweeping continues for the next earnings!");
            await hoshinoDB.set(userID, {
              ...userData,
              balance: balance + boostedValue,
              sweepStartTime: Date.now(),
              sweepItems: {
                newspaper: 0,
                plasticBottle: 0,
                cardboardBox: 0,
                tinCan: 0,
                scrapMetal: 0,
                wornGlove: 0,
                tornPaper: 0,
                usedBattery: 0,
                brokenToy: 0,
                oldShoe: 0,
              },
            });
            await chat.reply(infoLines.join("\n"));
          },
        },
        {
          subcommand: "upgrade",
          aliases: ["up", "u"],
          description: "Upgrade your sweeping to boost earnings multiplier.",
          usage: "sweep upgrade",
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
              sweepLevel = 0,
              sweepUpgradeCost = 50,
            } = userData;
            if (balance < sweepUpgradeCost) {
              return await chat.reply(
                `You need $${sweepUpgradeCost.toLocaleString(
                  "en-US"
                )} to upgrade your sweeping! Current balance: $${balance.toLocaleString(
                  "en-US"
                )}.`
              );
            }
            const newLevel = sweepLevel + 1;
            const newCost = sweepUpgradeCost * 2;
            const newMultiplier = 1 + newLevel * 0.5;
            await hoshinoDB.set(userID, {
              ...userData,
              balance: balance - sweepUpgradeCost,
              sweepLevel: newLevel,
              sweepUpgradeCost: newCost,
            });
            await chat.reply(
              `Upgraded sweeping to level ${newLevel}! Earnings multiplier increased to x${newMultiplier.toFixed(
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
