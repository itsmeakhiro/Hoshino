const { cleanUserID } = global.Hoshino.utils;

const MINE_ITEMS = [
  { name: "Coal Lump", emoji: "⚫", value: 100, tier: "low" },
  { name: "Iron Ore", emoji: "🪨", value: 150, tier: "low" },
  { name: "Tin Nugget", emoji: "🪐", value: 500, tier: "low" },
  { name: "Copper Nugget", emoji: "🟠", value: 1000, tier: "mid" },
  { name: "Sulfur Chunk", emoji: "🟡", value: 200, tier: "mid" },
  { name: "Silver Vein", emoji: "⚪", value: 1500, tier: "mid" },
  { name: "Quartz Crystal", emoji: "🔮", value: 300, tier: "mid" },
  { name: "Gold Nugget", emoji: "🟡", value: 2500, tier: "high" },
  { name: "Sapphire Chip", emoji: "💙", value: 3000, tier: "high" },
  { name: "Ruby Fragment", emoji: "❤️", value: 3500, tier: "high" },
  { name: "Obsidian Sliver", emoji: "⚫", value: 400, tier: "high" },
  { name: "Emerald Shard", emoji: "💚", value: 4000, tier: "rare" },
  { name: "Diamond Dust", emoji: "💎", value: 5000, tier: "rare" },
  { name: "Amethyst Cluster", emoji: "💜", value: 2000, tier: "rare" },
  { name: "Platinum Grain", emoji: "⚪", value: 4500, tier: "rare" },
  { name: "Mythril Shard", emoji: "✨", value: 1000000, tier: "legendary" },
  { name: "Dragonstone", emoji: "🐉", value: 2000000, tier: "legendary" },
  { name: "Starlight Gem", emoji: "🌟", value: 3500000, tier: "legendary" },
  { name: "Void Crystal", emoji: "🌀", value: 5000000, tier: "legendary" },
];

const PICKAXE_TIERS = {
  wooden: { cost: 0, maxDurability: 0, accessibleTiers: ["low"] },
  stone: { cost: 5000, maxDurability: 100, accessibleTiers: ["low", "mid"] },
  iron: { cost: 25000, maxDurability: 200, accessibleTiers: ["low", "mid", "high"] },
  diamond: { cost: 75000, maxDurability: 400, accessibleTiers: ["low", "mid", "high", "rare"] },
  netherite: { cost: 150000, maxDurability: 600, accessibleTiers: ["low", "mid", "high", "rare"] },
  // Added Asgardian Pickaxe
  asgardian: { cost: 100000000000, maxDurability: 1000, accessibleTiers: ["low", "mid", "high", "rare", "legendary"] },
};

// DO NOT REMOVE HoshinoLia.Command, do not add types on async deploy ctx
const command: HoshinoLia.Command = {
  manifest: {
    name: "mines",
    aliases: ["mine"],
    version: "1.3",
    developer: "Francis Loyd Raval",
    description:
      "Manage a mining operation to earn balance money by collecting high-value ores like gold and diamonds, priced closer to real-world markets. Buy better pickaxes to mine premium ores; pickaxes have durability and revert to wooden when broken.",
    category: "Economy",
    usage: "mines start | mines status | mines collect | mines upgrade | mines buy <pickaxe>",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "〘 ⛏️ 〙 MINES",
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
          description: "Start your mining operation to earn balance money (remains active).",
          usage: "mines start",
          async deploy({ chat, event, hoshinoDB }) {
            const userID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (userData.mineStartTime) {
              return await chat.reply(
                "Mining is already active! Use 'mines status' to check progress or 'mines collect' to claim earnings."
              );
            }
            await hoshinoDB.set(userID, {
              ...userData,
              mineStartTime: Date.now(),
              mineItems: {
                coalLump: 0,
                ironOre: 0,
                tinNugget: 0,
                copperNugget: 0,
                sulfurChunk: 0,
                silverVein: 0,
                quartzCrystal: 0,
                goldNugget: 0,
                sapphireChip: 0,
                rubyFragment: 0,
                obsidianSliver: 0,
                emeraldShard: 0,
                diamondDust: 0,
                amethystCluster: 0,
                platinumGrain: 0,
                // Added legendary ore keys
                mythrilShard: 0,
                dragonstone: 0,
                starlightGem: 0,
                voidCrystal: 0,
              },
              mineLevel: userData.mineLevel || 0,
              mineUpgradeCost: userData.mineUpgradeCost || 50,
              pickaxeType: userData.pickaxeType || "wooden",
              pickaxeDurability: userData.pickaxeDurability || 0,
            });
            await chat.reply(
              "Started your mining operation with a wooden pickaxe! Collect ores like coal ($100) and iron ($150) to earn balance (30% chance per minute). Buy better pickaxes to mine premium ores like gold ($2,500) and diamonds ($5,000)."
            );
          },
        },
        {
          subcommand: "status",
          aliases: ["info", "i"],
          description: "Check your mining progress and pending earnings.",
          usage: "mines status",
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
              mineStartTime = null,
              mineItems = {
                coalLump: 0,
                ironOre: 0,
                tinNugget: 0,
                copperNugget: 0,
                sulfurChunk: 0,
                silverVein: 0,
                quartzCrystal: 0,
                goldNugget: 0,
                sapphireChip: 0,
                rubyFragment: 0,
                obsidianSliver: 0,
                emeraldShard: 0,
                diamondDust: 0,
                amethystCluster: 0,
                platinumGrain: 0,
                // Added legendary ore keys
                mythrilShard: 0,
                dragonstone: 0,
                starlightGem: 0,
                voidCrystal: 0,
              },
              mineLevel = 0,
              pickaxeType = "wooden",
              pickaxeDurability = 0,
              username,
              gameid = "N/A",
            } = userData;
            if (!mineStartTime) {
              return await chat.reply(
                "You are not mining. Start with: mines start"
              );
            }
            const accessibleTiers = PICKAXE_TIERS[pickaxeType].accessibleTiers;
            const availableItems = MINE_ITEMS.filter((item) =>
              accessibleTiers.includes(item.tier)
            );
            const minutesElapsed = Math.floor(
              (Date.now() - mineStartTime) / 60000
            );
            const itemsCollected = { ...mineItems };
            let currentDurability = pickaxeDurability;
            let currentPickaxeType = pickaxeType;
            for (let i = 0; i < minutesElapsed; i++) {
              if (Math.random() < 0.3) {
                const item =
                  availableItems[Math.floor(Math.random() * availableItems.length)];
                const key = item.name.toLowerCase().replace(/\s+/g, "");
                itemsCollected[key] = (itemsCollected[key] || 0) + 1;
                if (currentPickaxeType !== "wooden") {
                  currentDurability--;
                  if (currentDurability <= 0) {
                    currentPickaxeType = "wooden";
                    currentDurability = 0;
                    await hoshinoDB.set(userID, {
                      ...userData,
                      pickaxeType: "wooden",
                      pickaxeDurability: 0,
                    });
                  }
                }
              }
            }
            let totalValue = 0;
            const itemLines: string[] = [];
            MINE_ITEMS.forEach((item) => {
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
            const multiplier = 1 + mineLevel * 0.5;
            const boostedValue = totalValue * multiplier;
            const accessibleItems = MINE_ITEMS.filter((item) =>
              accessibleTiers.includes(item.tier)
            ).map((item) => `${item.emoji} ${item.name} ($${item.value.toLocaleString("en-US")})`);
            const durabilityText =
              pickaxeType === "wooden"
                ? "Wooden (Unlimited uses)"
                : `${pickaxeType.charAt(0).toUpperCase() + pickaxeType.slice(1)} (${pickaxeDurability}/${PICKAXE_TIERS[pickaxeType].maxDurability} uses left)`;
            const infoLines: string[] = [
              `Username: ${username}`,
              `Game ID: ${gameid}`,
              `Balance: $${balance.toLocaleString("en-US")}`,
              `Mining for ${minutesElapsed} minute(s).`,
              `Mine Level: ${mineLevel} (x${multiplier.toFixed(1)} earnings)`,
              `Pickaxe: ${durabilityText}`,
              `Accessible Resources: ${accessibleItems.join(", ")}`,
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
          description: "Collect your pending balance and reset earnings for continued mining.",
          usage: "mines collect",
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
              mineStartTime = null,
              mineItems = {
                coalLump: 0,
                ironOre: 0,
                tinNugget: 0,
                copperNugget: 0,
                sulfurChunk: 0,
                silverVein: 0,
                quartzCrystal: 0,
                goldNugget: 0,
                sapphireChip: 0,
                rubyFragment: 0,
                obsidianSliver: 0,
                emeraldShard: 0,
                diamondDust: 0,
                amethystCluster: 0,
                platinumGrain: 0,
                mythrilShard: 0,
                dragonstone: 0,
                starlightGem: 0,
                voidCrystal: 0,
              },
              mineLevel = 0,
              pickaxeType = "wooden",
              pickaxeDurability = 0,
            } = userData;
            if (!mineStartTime) {
              return await chat.reply(
                "You are not mining. Start with: mines start"
              );
            }
            const accessibleTiers = PICKAXE_TIERS[pickaxeType].accessibleTiers;
            const availableItems = MINE_ITEMS.filter((item) =>
              accessibleTiers.includes(item.tier)
            );
            const minutesElapsed = Math.floor(
              (Date.now() - mineStartTime) / 60000
            );
            const itemsCollected = { ...mineItems };
            let currentDurability = pickaxeDurability;
            let currentPickaxeType = pickaxeType;
            let breakMessage = "";
            for (let i = 0; i < minutesElapsed; i++) {
              if (Math.random() < 0.3) {
                const item =
                  availableItems[Math.floor(Math.random() * availableItems.length)];
                const key = item.name.toLowerCase().replace(/\s+/g, "");
                itemsCollected[key] = (itemsCollected[key] || 0) + 1;
                if (currentPickaxeType !== "wooden") {
                  currentDurability--;
                  if (currentDurability <= 0) {
                    currentPickaxeType = "wooden";
                    currentDurability = 0;
                    breakMessage = `Your ${pickaxeType} pickaxe broke! Reverted to wooden pickaxe.`;
                  }
                }
              }
            }
            let totalValue = 0;
            const itemLines: string[] = [];
            MINE_ITEMS.forEach((item) => {
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
            const multiplier = 1 + mineLevel * 0.5;
            const boostedValue = totalValue * multiplier;
            const infoLines: string[] = [];
            if (totalValue > 0) {
              infoLines.push(
                `Collected $${boostedValue.toLocaleString(
                  "en-US"
                )} from mining!`
              );
              infoLines.push("Items collected:");
              infoLines.push(...itemLines);
            } else {
              infoLines.push("No balance was earned from mining.");
            }
            if (breakMessage) {
              infoLines.push(breakMessage);
            }
            infoLines.push("Mining continues for the next earnings!");
            await hoshinoDB.set(userID, {
              ...userData,
              balance: balance + boostedValue,
              mineStartTime: Date.now(),
              mineItems: {
                coalLump: 0,
                ironOre: 0,
                tinNugget: 0,
                copperNugget: 0,
                sulfurChunk: 0,
                silverVein: 0,
                quartzCrystal: 0,
                goldNugget: 0,
                sapphireChip: 0,
                rubyFragment: 0,
                obsidianSliver: 0,
                emeraldShard: 0,
                diamondDust: 0,
                amethystCluster: 0,
                platinumGrain: 0,
                mythrilShard: 0,
                dragonstone: 0,
                starlightGem: 0,
                voidCrystal: 0,
              },
              pickaxeType: currentPickaxeType,
              pickaxeDurability: currentDurability,
            });
            await chat.reply(infoLines.join("\n"));
          },
        },
        {
          subcommand: "upgrade",
          aliases: ["up", "u"],
          description: "Upgrade your mining operation to boost earnings multiplier.",
          usage: "mines upgrade",
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
              mineLevel = 0,
              mineUpgradeCost = 50,
            } = userData;
            if (balance < mineUpgradeCost) {
              return await chat.reply(
                `You need $${mineUpgradeCost.toLocaleString(
                  "en-US"
                )} to upgrade your mining operation! Current balance: $${balance.toLocaleString(
                  "en-US"
                )}.`
              );
            }
            const newLevel = mineLevel + 1;
            const newCost = mineUpgradeCost * 2;
            const newMultiplier = 1 + newLevel * 0.5;
            await hoshinoDB.set(userID, {
              ...userData,
              balance: balance - mineUpgradeCost,
              mineLevel: newLevel,
              mineUpgradeCost: newCost,
            });
            await chat.reply(
              `Upgraded mining operation to level ${newLevel}! Earnings multiplier increased to x${newMultiplier.toFixed(
                1
              )}. Next upgrade cost: $${newCost.toLocaleString("en-US")}.`
            );
          },
        },
        {
          subcommand: "buy",
          aliases: ["purchase", "b"],
          description: "Buy a better pickaxe to mine higher-value ores.",
          usage: "mines buy <stone|iron|diamond|netherite|asgardian>",
          async deploy({ chat, event, hoshinoDB, args }) {
            const userID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const { balance = 0, pickaxeType = "wooden" } = userData;
            const pickaxe = (args[1] || "").trim().toLowerCase();
            if (!pickaxe) {
              return await chat.reply(
                "Please specify a pickaxe to buy! Use: mines buy <stone|iron|diamond|netherite|asgardian>\n" +
                  "Available pickaxes:\n" +
                  "- Stone Pickaxe: $5,000 (100 uses, mines copper, silver, etc.)\n" +
                  "- Iron Pickaxe: $25,000 (200 uses, mines gold, sapphires, etc.)\n" +
                  "- Diamond Pickaxe: $75,000 (400 uses, mines emeralds, diamonds, etc.)\n" +
                  "- Netherite Pickaxe: $150,000 (600 uses, mines all ores)\n" +
                  "- Asgardian Pickaxe: $100,000,000,000 (1000 uses, mines legendary ores like mythril, void crystal)"
              );
            }
            if (!["stone", "iron", "diamond", "netherite", "asgardian"].includes(pickaxe)) {
              return await chat.reply(
                `Invalid pickaxe: ${pickaxe}! Use: mines buy <stone|iron|diamond|netherite|asgardian>\n` +
                  "Available pickaxes:\n" +
                  "- Stone Pickaxe: $5,000 (100 uses, mines copper, silver, etc.)\n" +
                  "- Iron Pickaxe: $25,000 (200 uses, mines gold, sapphires, etc.)\n" +
                  "- Diamond Pickaxe: $75,000 (400 uses, mines emeralds, diamonds, etc.)\n" +
                  "- Netherite Pickaxe: $150,000 (600 uses, mines all ores)\n" +
                  "- Asgardian Pickaxe: $100,000,000,000 (1000 uses, mines legendary ores like mythril, void crystal)"
              );
            }
            const pickaxeData = PICKAXE_TIERS[pickaxe];
            const currentPickaxeIndex = Object.keys(PICKAXE_TIERS).indexOf(pickaxeType);
            const newPickaxeIndex = Object.keys(PICKAXE_TIERS).indexOf(pickaxe);
            if (newPickaxeIndex <= currentPickaxeIndex) {
              return await chat.reply(
                `You already have a ${pickaxeType} pickaxe or better! Choose a higher-tier pickaxe.`
              );
            }
            if (balance < pickaxeData.cost) {
              return await chat.reply(
                `You need $${pickaxeData.cost.toLocaleString(
                  "en-US"
                )} to buy a ${pickaxe} pickaxe! Current balance: $${balance.toLocaleString(
                  "en-US"
                )}.`
              );
            }
            await hoshinoDB.set(userID, {
              ...userData,
              balance: balance - pickaxeData.cost,
              pickaxeType: pickaxe,
              pickaxeDurability: pickaxeData.maxDurability,
            });
            const accessibleItems = MINE_ITEMS.filter((item) =>
              pickaxeData.accessibleTiers.includes(item.tier)
            ).map((item) => `${item.emoji} ${item.name} ($${item.value.toLocaleString("en-US")})`);
            await chat.reply(
              `Purchased a ${pickaxe} pickaxe for $${pickaxeData.cost.toLocaleString(
                "en-US"
              )} with ${pickaxeData.maxDurability} uses! You can now mine: ${accessibleItems.join(", ")}.`
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
