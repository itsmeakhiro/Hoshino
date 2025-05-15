const { cleanUserID } = global.Hoshino.utils;

// Mining-related items with higher values reflecting real-world ore prices
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
];

const PICKAXE_TIERS = {
  wooden: { cost: 0, maxDurability: 0, accessibleTiers: ["low"] },
  stone: { cost: 5000, maxDurability: 100, accessibleTiers: ["low", "mid"] },
  iron: { cost: 25000, maxDurability: 200, accessibleTiers: ["low", "mid", "high"] },
  diamond: { cost: 75000, maxDurability: 400, accessibleTiers: ["low", "mid", "high", "rare"] },
  netherite: { cost: 150000, maxDurability: 600, accessibleTiers: ["low", "mid", "high", "rare"] },
};

const ENCHANTMENTS = {
  efficiency: {
    cost: (level) => 5000 * level,
    maxLevel: 5,
    miningChanceIncrease: (level) => 0.1 * level, // 10% per level
    durabilityDrainMultiplier: (level) => 1 + 0.5 * level, // 1.5x to 3x
  },
  unbreaking: {
    cost: (level) => 7500 * level,
    maxLevel: 5,
    durabilityDrainReduction: (level) => 1 - 0.2 * level, // 0.8x to 0.2x
    earningsMultiplierReduction: (level) => 1 - 0.1 * level, // 0.9x to 0.5x
  },
  fortune: {
    cost: (level) => 10000 * level,
    maxLevel: 5,
    tierChanceIncrease: (level) => 0.1 * level, // 10% per level to rare-tier
    costMultiplierIncrease: (level) => 1 + 0.2 * level, // 1.2x to 2x
  },
};

// DO NOT REMOVE HoshinoLia.Command, do not add types on async deploy ctx
const command: HoshinoLia.Command = {
  manifest: {
    name: "mines",
    aliases: ["mine"],
    version: "1.6",
    developer: "Francis Loyd Raval",
    description:
      "Manage a mining operation to earn balance money by collecting high-value ores like gold and diamonds, priced closer to real-world markets. Buy better pickaxes, enchant them with benefits and consequences, and upgrade to boost earnings and enchantment levels. Pickaxes have durability and revert to wooden when broken.",
    category: "Economy",
    usage: "mines start | mines status | mines collect | mines upgrade | mines buy <pickaxe> | mines enchant <pickaxe> <enchantment>",
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
              },
              mineLevel: userData.mineLevel || 0,
              mineUpgradeCost: userData.mineUpgradeCost || 50,
              pickaxeType: userData.pickaxeType || "wooden",
              pickaxeDurability: userData.pickaxeDurability || 0,
              pickaxeEnchantments: userData.pickaxeEnchantments || {
                efficiency: 0,
                unbreaking: 0,
                fortune: 0,
              },
            });
            await chat.reply(
              "Started your mining operation with a wooden pickaxe! Collect ores like coal ($100) and iron ($150) to earn balance (30% chance per minute). Buy better pickaxes to mine premium ores like gold ($2,500) and diamonds ($5,000). Enchant pickaxes and upgrade to boost enchantment levels!"
            );
          },
        },
        {
          subcommand: "status",
          aliases: ["info", "i"],
          description: "Check your mining progress, enchantments, and pending earnings.",
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
              },
              mineLevel = 0,
              pickaxeType = "wooden",
              pickaxeDurability = 0,
              pickaxeEnchantments = { efficiency: 0, unbreaking: 0, fortune: 0 },
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
            const efficiencyLevel = pickaxeEnchantments.efficiency || 0;
            const unbreakingLevel = pickaxeEnchantments.unbreaking || 0;
            const fortuneLevel = pickaxeEnchantments.fortune || 0;
            const miningChance =
              0.3 + (efficiencyLevel * 0.1); // 30% + 10% per level
            const durabilityDrain =
              (1 + efficiencyLevel * 0.5) * (1 - unbreakingLevel * 0.2); // Efficiency increases, Unbreaking decreases
            const earningsMultiplier =
              (1 + mineLevel * 0.5) * (1 - unbreakingLevel * 0.1); // Mine level boosts, Unbreaking reduces
            const tierWeights = {
              low: 1 - fortuneLevel * 0.1,
              mid: 1,
              high: 1 + fortuneLevel * 0.1,
              rare: 1 + fortuneLevel * 0.2, // Favor rare-tier
            };
            const totalWeight = availableItems.reduce(
              (sum, item) => sum + (tierWeights[item.tier] || 1),
              0
            );
            const itemProbabilities = availableItems.map((item) => ({
              ...item,
              probability: (tierWeights[item.tier] || 1) / totalWeight,
            }));
            for (let i = 0; i < minutesElapsed; i++) {
              if (Math.random() < miningChance) {
                let rand = Math.random();
                let cumulative = 0;
                const item = itemProbabilities.find((p) => {
                  cumulative += p.probability;
                  return rand <= cumulative;
                }) || availableItems[0];
                const key = item.name.toLowerCase().replace(/\s+/g, "");
                itemsCollected[key] = (itemsCollected[key] || 0) + 1;
                if (currentPickaxeType !== "wooden") {
                  currentDurability -= durabilityDrain;
                  if (currentDurability <= 0) {
                    currentPickaxeType = "wooden";
                    currentDurability = 0;
                    await hoshinoDB.set(userID, {
                      ...userData,
                      pickaxeType: "wooden",
                      pickaxeDurability: 0,
                      pickaxeEnchantments: { efficiency: 0, unbreaking: 0, fortune: 0 },
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
            const boostedValue = totalValue * earningsMultiplier;
            const accessibleItems = MINE_ITEMS.filter((item) =>
              accessibleTiers.includes(item.tier)
            ).map((item) => `${item.emoji} ${item.name} ($${item.value.toLocaleString("en-US")})`);
            const durabilityText =
              pickaxeType === "wooden"
                ? "Wooden (Unlimited uses)"
                : `${pickaxeType.charAt(0).toUpperCase() + pickaxeType.slice(1)} (${Math.floor(currentDurability)}/${PICKAXE_TIERS[pickaxeType].maxDurability} uses left)`;
            const enchantmentLines = [];
            if (efficiencyLevel > 0) {
              enchantmentLines.push(
                `Efficiency ${efficiencyLevel}: +${efficiencyLevel * 10}% mining chance, ${1 + efficiencyLevel * 0.5}x durability drain`
              );
            }
            if (unbreakingLevel > 0) {
              enchantmentLines.push(
                `Unbreaking ${unbreakingLevel}: ${unbreakingLevel * 20}% less durability drain, ${unbreakingLevel * 10}% less earnings`
              );
            }
            if (fortuneLevel > 0) {
              enchantmentLines.push(
                `Fortune ${fortuneLevel}: +${fortuneLevel * 20}% rare-tier chance, ${20 * fortuneLevel}% higher enchant costs`
              );
            }
            const infoLines: string[] = [
              `Username: ${username}`,
              `Game ID: ${gameid}`,
              `Balance: $${balance.toLocaleString("en-US")}`,
              `Mining for ${minutesElapsed} minute(s).`,
              `Mine Level: ${mineLevel} (x${earningsMultiplier.toFixed(1)} earnings)`,
              `Pickaxe: ${durabilityText}`,
              ...(enchantmentLines.length > 0
                ? ["Enchantments:", ...enchantmentLines]
                : ["Enchantments: None"]),
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
              },
              mineLevel = 0,
              pickaxeType = "wooden",
              pickaxeDurability = 0,
              pickaxeEnchantments = { efficiency: 0, unbreaking: 0, fortune: 0 },
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
            const efficiencyLevel = pickaxeEnchantments.efficiency || 0;
            const unbreakingLevel = pickaxeEnchantments.unbreaking || 0;
            const fortuneLevel = pickaxeEnchantments.fortune || 0;
            const miningChance =
              0.3 + (efficiencyLevel * 0.1); // 30% + 10% per level
            const durabilityDrain =
              (1 + efficiencyLevel * 0.5) * (1 - unbreakingLevel * 0.2); // Efficiency increases, Unbreaking decreases
            const earningsMultiplier =
              (1 + mineLevel * 0.5) * (1 - unbreakingLevel * 0.1); // Mine level boosts, Unbreaking reduces
            const tierWeights = {
              low: 1 - fortuneLevel * 0.1,
              mid: 1,
              high: 1 + fortuneLevel * 0.1,
              rare: 1 + fortuneLevel * 0.2, // Favor rare-tier
            };
            const totalWeight = availableItems.reduce(
              (sum, item) => sum + (tierWeights[item.tier] || 1),
              0
            );
            const itemProbabilities = availableItems.map((item) => ({
              ...item,
              probability: (tierWeights[item.tier] || 1) / totalWeight,
            }));
            for (let i = 0; i < minutesElapsed; i++) {
              if (Math.random() < miningChance) {
                let rand = Math.random();
                let cumulative = 0;
                const item = itemProbabilities.find((p) => {
                  cumulative += p.probability;
                  return rand <= cumulative;
                }) || availableItems[0];
                const key = item.name.toLowerCase().replace(/\s+/g, "");
                itemsCollected[key] = (itemsCollected[key] || 0) + 1;
                if (currentPickaxeType !== "wooden") {
                  currentDurability -= durabilityDrain;
                  if (currentDurability <= 0) {
                    currentPickaxeType = "wooden";
                    currentDurability = 0;
                    breakMessage = `Your ${pickaxeType} pickaxe broke! Reverted to wooden pickaxe.`;
                    await hoshinoDB.set(userID, {
                      ...userData,
                      pickaxeType: "wooden",
                      pickaxeDurability: 0,
                      pickaxeEnchantments: { efficiency: 0, unbreaking: 0, fortune: 0 },
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
            const boostedValue = totalValue * earningsMultiplier;
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
              },
              pickaxeType: currentPickaxeType,
              pickaxeDurability: currentDurability,
              pickaxeEnchantments,
            });
            await chat.reply(infoLines.join("\n"));
          },
        },
        {
          subcommand: "upgrade",
          aliases: ["up", "u"],
          description: "Upgrade your mining operation to boost earnings multiplier and enchantment levels.",
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
              pickaxeEnchantments = { efficiency: 0, unbreaking: 0, fortune: 0 },
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
            const newEnchantments = { ...pickaxeEnchantments };
            const enchantmentUpgrades = [];
            if (newEnchantments.efficiency > 0 && newEnchantments.efficiency < ENCHANTMENTS.efficiency.maxLevel) {
              newEnchantments.efficiency += 1;
              enchantmentUpgrades.push(`Efficiency ${newEnchantments.efficiency}`);
            }
            if (newEnchantments.unbreaking > 0 && newEnchantments.unbreaking < ENCHANTMENTS.unbreaking.maxLevel) {
              newEnchantments.unbreaking += 1;
              enchantmentUpgrades.push(`Unbreaking ${newEnchantments.unbreaking}`);
            }
            if (newEnchantments.fortune > 0 && newEnchantments.fortune < ENCHANTMENTS.fortune.maxLevel) {
              newEnchantments.fortune += 1;
              enchantmentUpgrades.push(`Fortune ${newEnchantments.fortune}`);
            }
            await hoshinoDB.set(userID, {
              ...userData,
              balance: balance - mineUpgradeCost,
              mineLevel: newLevel,
              mineUpgradeCost: newCost,
              pickaxeEnchantments: newEnchantments,
            });
            const outputLines = [
              `Upgraded mining operation to level ${newLevel}! Earnings multiplier increased to x${newMultiplier.toFixed(1)}. Next upgrade cost: $${newCost.toLocaleString("en-US")}.`,
            ];
            if (enchantmentUpgrades.length > 0) {
              outputLines.push(`Enchantments upgraded: ${enchantmentUpgrades.join(", ")}.`);
            }
            await chat.reply(outputLines.join("\n"));
          },
        },
        {
          subcommand: "buy",
          aliases: ["purchase", "b"],
          description: "Buy a better pickaxe to mine higher-value ores.",
          usage: "mines buy <stone|iron|diamond|netherite>",
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
                "Please specify a pickaxe to buy! Use: mines buy <stone|iron|diamond|netherite>\n" +
                  "Available pickaxes:\n" +
                  "- Stone Pickaxe: $5,000 (100 uses, mines copper, silver, etc.)\n" +
                  "- Iron Pickaxe: $25,000 (200 uses, mines gold, sapphires, etc.)\n" +
                  "- Diamond Pickaxe: $75,000 (400 uses, mines emeralds, diamonds, etc.)\n" +
                  "- Netherite Pickaxe: $150,000 (600 uses, mines all ores)"
              );
            }
            if (!["stone", "iron", "diamond", "netherite"].includes(pickaxe)) {
              return await chat.reply(
                `Invalid pickaxe: ${pickaxe}! Use: mines buy <stone|iron|diamond|netherite>\n` +
                  "Available pickaxes:\n" +
                  "- Stone Pickaxe: $5,000 (100 uses, mines copper, silver, etc.)\n" +
                  "- Iron Pickaxe: $25,000 (200 uses, mines gold, sapphires, etc.)\n" +
                  "- Diamond Pickaxe: $75,000 (400 uses, mines emeralds, diamonds, etc.)\n" +
                  "- Netherite Pickaxe: $150,000 (600 uses, mines all ores)"
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
              pickaxeEnchantments: { efficiency: 0, unbreaking: 0, fortune: 0 }, // Reset enchantments
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
        {
          subcommand: "enchant",
          aliases: ["e", "ench"],
          description: "Enchant your pickaxe with benefits and consequences (e.g., Efficiency speeds mining but drains durability).",
          usage: "mines enchant <stone|iron|diamond|netherite> <efficiency|unbreaking|fortune>",
          async deploy({ chat, event, hoshinoDB, args }) {
            console.log("Enchant args:", args); // Debug log to inspect args structure
            const userID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const {
              balance = 0,
              pickaxeType = "wooden",
              pickaxeEnchantments = { efficiency: 0, unbreaking: 0, fortune: 0 },
            } = userData;
            const pickaxe = (args[2] || "").trim().toLowerCase();
            const enchantment = (args[3] || "").trim().toLowerCase();
            if (!pickaxe || !enchantment) {
              return await chat.reply(
                "Please specify a pickaxe and enchantment! Use: mines enchant <stone|iron|diamond|netherite> <efficiency|unbreaking|fortune>\n" +
                  "Available enchantments:\n" +
                  "- Efficiency: +10% mining chance, +50% durability drain (upgrade to increase level)\n" +
                  "- Unbreaking: -20% durability drain, -10% earnings (upgrade to increase level)\n" +
                  "- Fortune: +20% rare-tier chance, +20% enchant costs (upgrade to increase level)"
              );
            }
            if (!["stone", "iron", "diamond", "netherite"].includes(pickaxe)) {
              return await chat.reply(
                `Invalid pickaxe: ${pickaxe}! Use: mines enchant <stone|iron|diamond|netherite> <efficiency|unbreaking|fortune>`
              );
            }
            if (pickaxe !== pickaxeType) {
              return await chat.reply(
                `You have a ${pickaxeType} pickaxe! You can only enchant your current pickaxe.`
              );
            }
            if (!["efficiency", "unbreaking", "fortune"].includes(enchantment)) {
              return await chat.reply(
                `Invalid enchantment: ${enchantment}! Use: mines enchant <stone|iron|diamond|netherite> <efficiency|unbreaking|fortune>`
              );
            }
            if (pickaxeEnchantments[enchantment] > 0) {
              return await chat.reply(
                `Your pickaxe already has ${enchantment} ${pickaxeEnchantments[enchantment]}! Use 'mines upgrade' to increase its level.`
              );
            }
            const level = 1; // Always start at level 1
            const fortuneLevel = pickaxeEnchantments.fortune || 0;
            const costMultiplier = 1 + fortuneLevel * 0.2; // Fortune increases costs
            const enchantCost = Math.round(ENCHANTMENTS[enchantment].cost(level) * costMultiplier);
            if (balance < enchantCost) {
              return await chat.reply(
                `You need $${enchantCost.toLocaleString(
                  "en-US"
                )} to enchant ${pickaxe} with ${enchantment}! Current balance: $${balance.toLocaleString(
                  "en-US"
                )}.`
              );
            }
            const newEnchantments = { ...pickaxeEnchantments, [enchantment]: level };
            await hoshinoDB.set(userID, {
              ...userData,
              balance: balance - enchantCost,
              pickaxeEnchantments: newEnchantments,
            });
            const effects =
              enchantment === "efficiency"
                ? `+${level * 10}% mining chance, ${1 + level * 0.5}x durability drain`
                : enchantment === "unbreaking"
                ? `${level * 20}% less durability drain, ${level * 10}% less earnings`
                : `+${level * 20}% rare-tier chance, ${level * 20}% higher enchant costs`;
            await chat.reply(
              `Enchanted your ${pickaxe} pickaxe with ${enchantment} ${level} for $${enchantCost.toLocaleString(
                "en-US"
              )}! Effects: ${effects}. Use 'mines upgrade' to increase enchantment level.`
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
