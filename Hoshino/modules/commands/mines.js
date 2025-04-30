/** 
 * @type {HoshinoLia.Command} 
 */

const command = {
  manifest: {
    name: "mines",
    aliases: ["mine", "mining"],
    version: "1.0",
    developer: "Francis Loyd Raval",
    description:
      "Start a mining simulator to earn money, collect ores, buy better pickaxes, check status, or enchant pickaxes.",
    category: "Economy",
    usage: "mines start | mines collect | mines buy <pickaxe> | mines status | mines enchant <efficiency | unbreaking | fortune | mending | haste>",
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
    const pickaxes = {
      wooden: { name: "Wooden Pickaxe", description: "A basic pickaxe for mining common ores.", cost: 0, ores: ["stone", "coal", "clay"], durability: 59, minYield: 50, maxYield: 150, tier: 1, actualDurability: 59, actualTier: 1 },
      stone: { name: "Stone Pickaxe", description: "A sturdy pickaxe for mining basic and copper ores.", cost: 1000, ores: ["stone", "coal", "clay", "copper"], durability: 131, minYield: 100, maxYield: 200, tier: 2, actualDurability: 131, actualTier: 2 },
      iron: { name: "Iron Pickaxe", description: "A strong pickaxe for mining iron and other ores.", cost: 5000, ores: ["stone", "coal", "clay", "copper", "iron"], durability: 250, minYield: 150, maxYield: 300, tier: 3, actualDurability: 250, actualTier: 3 },
      diamond: { name: "Diamond Pickaxe", description: "A premium pickaxe for mining valuable gems.", cost: 25000, ores: ["stone", "coal", "clay", "copper", "iron", "gold", "emerald"], durability: 1561, minYield: 200, maxYield: 400, tier: 4, actualDurability: 1561, actualTier: 4 },
      netherite: { name: "Netherite Pickaxe", description: "The ultimate pickaxe for mining all ores, including diamonds.", cost: 100000, ores: ["stone", "coal", "clay", "copper", "iron", "gold", "emerald", "diamond"], durability: 2031, minYield: 300, maxYield: 600, tier: 5, actualDurability: 2031, actualTier: 5 },
      golden: { name: "Golden Pickaxe", description: "A luxurious pickaxe forged from pure gold, capable of mining all ores with unmatched durability.", cost: 150000, ores: ["stone", "coal", "clay", "copper", "iron", "gold", "emerald", "diamond"], durability: 2500, minYield: 400, maxYield: 800, tier: 6, actualDurability: 1, actualTier: 1 },
    };
    const ores = {
      stone: { name: "Stone", value: 2, emoji: "🪨" },
      coal: { name: "Coal", value: 5, emoji: "⛏️" },
      clay: { name: "Clay", value: 3, emoji: "🏺" },
      copper: { name: "Copper", value: 100, emoji: "🟠" },
      iron: { name: "Iron", value: 50, emoji: "🔩" },
      gold: { name: "Gold", value: 1000, emoji: "🪙" },
      emerald: { name: "Emerald", value: 2500, emoji: "💚" },
      diamond: { name: "Diamond", value: 5000, emoji: "💎" },
    };
    const enchantments = {
      efficiency: {
        name: "Efficiency",
        description: "Increases mining speed for higher earnings.",
        cost: (tier) => tier * 1000,
      },
      unbreaking: {
        name: "Unbreaking",
        description: "Makes your pickaxe last longer by reducing durability loss.",
        cost: (tier) => tier * 800,
      },
      fortune: {
        name: "Fortune",
        description: "Increases the chance of mining rare ores.",
        cost: (tier) => tier * 1200,
      },
      mending: {
        name: "Mending",
        description: "Restores pickaxe durability over time.",
        cost: (tier) => tier * 1000,
      },
      haste: {
        name: "Haste",
        description: "Speeds up mining sessions for more frequent ore drops.",
        cost: (tier) => tier * 900,
      },
    };
    const home = new ctx.HoshinoHM(
      [
        {
          subcommand: "start",
          aliases: ["begin", "go"],
          description: "Start the mining simulator to earn money over time.",
          usage: "mines start",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            let message = "";
            let userPickaxe = userData.mining?.pickaxe || "wooden";
            let currentDurability = userData.mining?.durability || pickaxes[userPickaxe].durability;
            let userEnchantments = userData.mining?.enchantments || (userData.mining?.enchantment ? [userData.mining.enchantment] : []);
            let nextPickaxeCostMultiplier = userData.mining?.nextPickaxeCostMultiplier || 1;
            if (userData.mining && userData.mining.active && userData.mining.startTime) {
              const timeElapsed = (Date.now() - userData.mining.startTime) / 1000 / 60;
              if (isNaN(timeElapsed) || timeElapsed < 0) {
                message = "Mining session is invalid. Starting a new session.\n";
              } else if (timeElapsed > 0) {
                const availableOres = pickaxes[userPickaxe].ores;
                const collectedOres = userData.mining.collectedOres || {};
                let totalEarned = 0;
                let collectionEvents = Math.floor(timeElapsed / (Math.random() * 29 + 1)) || 1;
                let minYield = pickaxes[userPickaxe].minYield;
                let maxYield = pickaxes[userPickaxe].maxYield;
                let durabilityCost = 1;
                let earningsMultiplier = 1;
                if (userEnchantments.includes("haste")) {
                  collectionEvents = Math.floor(collectionEvents * 1.5);
                }
                if (userEnchantments.includes("unbreaking")) {
                  minYield *= 0.8;
                  maxYield *= 0.8;
                  durabilityCost *= 0.5;
                }
                if (userEnchantments.includes("fortune")) {
                  minYield *= 0.5;
                  maxYield *= 0.5;
                }
                if (userEnchantments.includes("efficiency")) {
                  durabilityCost *= 3;
                  earningsMultiplier *= 2;
                }
                if (userEnchantments.includes("mending")) {
                  earningsMultiplier *= 0.5;
                }
                for (let i = 0; i < collectionEvents; i++) {
                  const numOres = Math.floor(Math.random() * availableOres.length) + 1;
                  let selectedOres = availableOres.sort(() => Math.random() - 0.5).slice(0, numOres);
                  if (userEnchantments.includes("fortune")) {
                    const rareOres = availableOres.filter(o => ["diamond", "emerald", "gold"].includes(o));
                    const commonOres = availableOres.filter(o => !["diamond", "emerald", "gold"].includes(o));
                    selectedOres = [...rareOres.sort(() => Math.random() - 0.5).slice(0, Math.min(rareOres.length, numOres)), ...commonOres.sort(() => Math.random() - 0.5).slice(0, Math.max(0, numOres - rareOres.length))];
                  }
                  for (const ore of selectedOres) {
                    const quantity = Math.floor(Math.random() * (maxYield - minYield + 1)) + minYield;
                    collectedOres[ore] = (collectedOres[ore] || 0) + quantity;
                    totalEarned += quantity * ores[ore].value;
                  }
                }
                totalEarned *= earningsMultiplier;
                currentDurability -= durabilityCost * collectionEvents;
                if (userEnchantments.includes("mending")) {
                  currentDurability = Math.min(currentDurability + collectionEvents, pickaxes[userPickaxe].actualDurability);
                }
                if (currentDurability <= 0) {
                  userPickaxe = "wooden";
                  currentDurability = pickaxes.wooden.durability;
                  userEnchantments = [];
                  nextPickaxeCostMultiplier = 1;
                  message = `Your ${pickaxes[userData.mining.pickaxe].name} broke! Reverted to Wooden Pickaxe.\n`;
                }
                const newBalance = (userData.balance || 0) + totalEarned;
                await hoshinoDB.set(event.senderID, {
                  ...userData,
                  balance: newBalance,
                  mining: {
                    active: false,
                    startTime: 0,
                    earned: 0,
                    pickaxe: userPickaxe,
                    durability: currentDurability,
                    lastCollectionTime: Date.now(),
                    collectedOres: {},
                    enchantments: userEnchantments,
                    nextPickaxeCostMultiplier,
                  },
                });
                const timeDisplay = timeElapsed < 1 ? `${Math.floor(timeElapsed * 60)} seconds` : `${Math.floor(timeElapsed)} minutes`;
                message += `Mined for ${timeDisplay}:\n` +
                  Object.entries(collectedOres)
                    .map(([ore, quantity]) => `${ores[ore].name} ${ores[ore].emoji}: ${quantity} pieces worth $${(quantity * ores[ore].value).toLocaleString("en-US")}`)
                    .join("\n") +
                  `\nTotal: $${totalEarned.toLocaleString("en-US")}\n`;
              }
            }
            const startTime = Date.now();
            await hoshinoDB.set(event.senderID, {
              ...userData,
              mining: {
                active: true,
                startTime,
                earned: 0,
                pickaxe: userPickaxe,
                durability: currentDurability,
                lastCollectionTime: userData.mining?.lastCollectionTime || 0,
                collectedOres: {},
                enchantments: userEnchantments,
                nextPickaxeCostMultiplier,
              },
            });
            message += `Mining started with your ${pickaxes[userPickaxe].name} (Durability: ${currentDurability})${userEnchantments.length ? ` [${userEnchantments.map(e => enchantments[e].name).join(", ")}]` : ""}! Use 'mines collect' to collect your earnings.`;
            await chat.reply(message);
          },
        },
        {
          subcommand: "collect",
          aliases: ["claim", "gather"],
          description: "Collect money earned from mining.",
          usage: "mines collect",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.mining || !userData.mining.active || !userData.mining.startTime) {
              return await chat.reply(
                "You haven't started mining! Use 'mines start' to begin."
              );
            }
            const timeElapsed = (Date.now() - userData.mining.startTime) / 1000 / 60;
            if (isNaN(timeElapsed) || timeElapsed < 0) {
              await hoshinoDB.set(event.senderID, {
                ...userData,
                mining: {
                  active: false,
                  startTime: 0,
                  earned: 0,
                  pickaxe: userData.mining?.pickaxe || "wooden",
                  durability: pickaxes[userData.mining?.pickaxe || "wooden"].durability,
                  lastCollectionTime: userData.mining?.lastCollectionTime || 0,
                  collectedOres: {},
                  enchantments: [],
                  nextPickaxeCostMultiplier: userData.mining?.nextPickaxeCostMultiplier || 1,
                },
              });
              return await chat.reply(
                "Mining session is invalid. Please start a new session with 'mines start'."
              );
            }
            const lastCollectionTime = userData.mining.lastCollectionTime || 0;
            if (Date.now() - lastCollectionTime < 60000) {
              return await chat.reply(
                "No ore's collected on it. Comeback after an minute or an hour for the collection."
              );
            }
            if (timeElapsed <= 0) {
              return await chat.reply(
                "No ore's collected on it. Comeback after an minute or an hour for the collection."
              );
            }
            let userPickaxe = userData.mining.pickaxe || "wooden";
            let currentDurability = userData.mining.durability || pickaxes[userPickaxe].durability;
            let userEnchantments = userData.mining.enchantments || (userData.mining.enchantment ? [userData.mining.enchantment] : []);
            let nextPickaxeCostMultiplier = userData.mining.nextPickaxeCostMultiplier || 1;
            const availableOres = pickaxes[userPickaxe].ores;
            const collectedOres = {};
            let totalEarned = 0;
            let collectionEvents = Math.floor(timeElapsed / (Math.random() * 29 + 1)) || 1;
            let minYield = pickaxes[userPickaxe].minYield;
            let maxYield = pickaxes[userPickaxe].maxYield;
            let durabilityCost = 1;
            let earningsMultiplier = 1;
            if (userEnchantments.includes("haste")) {
              collectionEvents = Math.floor(collectionEvents * 1.5);
            }
            if (userEnchantments.includes("unbreaking")) {
              minYield *= 0.8;
              maxYield *= 0.8;
              durabilityCost *= 0.5;
            }
            if (userEnchantments.includes("fortune")) {
              minYield *= 0.5;
              maxYield *= 0.5;
            }
            if (userEnchantments.includes("efficiency")) {
              durabilityCost *= 3;
              earningsMultiplier *= 2;
            }
            if (userEnchantments.includes("mending")) {
              earningsMultiplier *= 0.5;
            }
            for (let i = 0; i < collectionEvents; i++) {
              const numOres = Math.floor(Math.random() * availableOres.length) + 1;
              let selectedOres = availableOres.sort(() => Math.random() - 0.5).slice(0, numOres);
              if (userEnchantments.includes("fortune")) {
                const rareOres = availableOres.filter(o => ["diamond", "emerald", "gold"].includes(o));
                const commonOres = availableOres.filter(o => !["diamond", "emerald", "gold"].includes(o));
                selectedOres = [...rareOres.sort(() => Math.random() - 0.5).slice(0, Math.min(rareOres.length, numOres)), ...commonOres.sort(() => Math.random() - 0.5).slice(0, Math.max(0, numOres - rareOres.length))];
              }
              for (const ore of selectedOres) {
                const quantity = Math.floor(Math.random() * (maxYield - minYield + 1)) + minYield;
                collectedOres[ore] = (collectedOres[ore] || 0) + quantity;
                totalEarned += quantity * ores[ore].value;
              }
            }
            totalEarned *= earningsMultiplier;
            currentDurability -= durabilityCost * collectionEvents;
            if (userEnchantments.includes("mending")) {
              currentDurability = Math.min(currentDurability + collectionEvents, pickaxes[userPickaxe].actualDurability);
            }
            let breakMessage = "";
            if (currentDurability <= 0) {
              userPickaxe = "wooden";
              currentDurability = pickaxes.wooden.durability;
              userEnchantments = [];
              nextPickaxeCostMultiplier = 1;
              breakMessage = `Your ${pickaxes[userData.mining.pickaxe].name} broke! Reverted to Wooden Pickaxe.\n`;
            }
            if (userEnchantments.includes("haste")) {
              nextPickaxeCostMultiplier *= 2;
            }
            const newBalance = (userData.balance || 0) + totalEarned;
            const newStartTime = Date.now();
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: newBalance,
              mining: {
                active: true,
                startTime: newStartTime,
                earned: 0,
                pickaxe: userPickaxe,
                durability: currentDurability,
                lastCollectionTime: newStartTime,
                collectedOres: {},
                enchantments: userEnchantments,
                nextPickaxeCostMultiplier,
              },
            });
            const timeDisplay = timeElapsed < 1 ? `${Math.floor(timeElapsed * 60)} seconds` : `${Math.floor(timeElapsed)} minutes`;
            const replyMessage = breakMessage +
              `Mined for ${timeDisplay}:\n` +
              Object.entries(collectedOres)
                .map(([ore, quantity]) => `${ores[ore].name} ${ores[ore].emoji}: ${quantity} pieces worth $${(quantity * ores[ore].value).toLocaleString("en-US")}`)
                .join("\n") +
              `\nTotal: $${totalEarned.toLocaleString("en-US")}\nYour new balance is $${newBalance.toLocaleString("en-US")}.`;
            await chat.reply(replyMessage);
          },
        },
        {
          subcommand: "buy",
          aliases: ["purchase", "shop"],
          description: "Buy a better pickaxe to mine higher-value ores.",
          usage: "mines buy <stone | iron | diamond | netherite | golden>",
          async deploy({ chat, args, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            let pickaxeType = args[0]?.toLowerCase().trim() || "";
            if (pickaxeType === "buy" && args.length > 1) {
              pickaxeType = args[1].toLowerCase().trim();
            }
            if (!pickaxeType || pickaxeType === "wooden") {
              const purchasablePickaxes = Object.values(pickaxes).filter(p => p.cost > 0);
              return await chat.reply(
                `No pickaxe specified. Usage: mines buy <stone | iron | diamond | netherite | golden>\n` +
                `The Wooden Pickaxe is provided for free and does not need to be purchased.\n` +
                `Available pickaxes for purchase:\n\n` +
                purchasablePickaxes
                  .map(p => 
                    `${p.name}\n` +
                    `Description: ${p.description}\n` +
                    `Durability: ${p.durability}\n` +
                    `Cost: $${(p.cost * (userData.mining?.nextPickaxeCostMultiplier || 1)).toLocaleString("en-US")}\n` +
                    `Ores: ${p.ores.map(o => `${ores[o].name} ${ores[o].emoji}`).join(", ")}`
                  )
                  .join("\n\n")
              );
            }
            if (!pickaxes[pickaxeType]) {
              return await chat.reply(
                `Invalid pickaxe: ${args[0] || pickaxeType}. Use: mines buy <stone | iron | diamond | netherite | golden>`
              );
            }
            const currentPickaxe = userData.mining?.pickaxe || "wooden";
            const currentDurability = userData.mining?.durability || pickaxes[currentPickaxe].durability;
            if (pickaxes[pickaxeType].actualTier < pickaxes[currentPickaxe].actualTier && currentDurability > 0) {
              return await chat.reply(
                `You cannot buy a lower-quality pickaxe while your ${pickaxes[currentPickaxe].name} has durability remaining (${currentDurability}).`
              );
            }
            if (currentPickaxe === pickaxeType) {
              return await chat.reply(
                `You already own a ${pickaxes[pickaxeType].name}!`
              );
            }
            const cost = pickaxes[pickaxeType].cost * (userData.mining?.nextPickaxeCostMultiplier || 1);
            const currentBalance = userData.balance || 0;
            if (currentBalance < cost) {
              return await chat.reply(
                `You need $${cost.toLocaleString("en-US")} to buy a ${pickaxes[pickaxeType].name}, but you only have $${currentBalance.toLocaleString("en-US")}!`
              );
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: currentBalance - cost,
              mining: {
                active: userData.mining?.active || false,
                startTime: userData.mining?.startTime || 0,
                earned: 0,
                pickaxe: pickaxeType,
                durability: pickaxes[pickaxeType].durability,
                lastCollectionTime: userData.mining?.lastCollectionTime || 0,
                collectedOres: userData.mining?.collectedOres || {},
                enchantments: [],
                nextPickaxeCostMultiplier: userData.mining?.nextPickaxeCostMultiplier || 1,
              },
            });
            await chat.reply(
              `Successfully purchased a ${pickaxes[pickaxeType].name} for $${cost.toLocaleString(
                "en-US"
              )}! You can now mine: ${pickaxes[pickaxeType].ores.map(o => `${ores[o].name} ${ores[o].emoji}`).join(", ")}. Durability: ${pickaxes[pickaxeType].durability}.`
            );
          },
        },
        {
          subcommand: "status",
          aliases: ["info", "progress"],
          description: "Check your mining progress, pickaxe durability, and collected ores.",
          usage: "mines status",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const currentPickaxe = userData.mining?.pickaxe || "wooden";
            const currentDurability = userData.mining?.durability || pickaxes[currentPickaxe].durability;
            const userEnchantments = userData.mining?.enchantments || (userData.mining?.enchantment ? [userData.mining.enchantment] : []);
            let message = `Current Pickaxe: ${pickaxes[currentPickaxe].name} (Durability: ${currentDurability})${userEnchantments.length ? ` [${userEnchantments.map(e => enchantments[e].name).join(", ")}]` : ""}\n`;
            if (!userData.mining || !userData.mining.active || !userData.mining.startTime) {
              message += "Status: Not currently mining. Use 'mines start' to begin.\n";
              return await chat.reply(message);
            }
            const timeElapsed = (Date.now() - userData.mining.startTime) / 1000 / 60;
            if (isNaN(timeElapsed) || timeElapsed < 0) {
              await hoshinoDB.set(event.senderID, {
                ...userData,
                mining: {
                  active: false,
                  startTime: 0,
                  earned: 0,
                  pickaxe: currentPickaxe,
                  durability: pickaxes[currentPickaxe].durability,
                  lastCollectionTime: userData.mining?.lastCollectionTime || 0,
                  collectedOres: {},
                  enchantments: [],
                  nextPickaxeCostMultiplier: userData.mining?.nextPickaxeCostMultiplier || 1,
                },
              });
              return await chat.reply(
                "Mining session is invalid. Please start a new session with 'mines start'."
              );
            }
            const availableOres = pickaxes[currentPickaxe].ores;
            const collectedOres = {};
            let totalEarned = 0;
            let collectionEvents = Math.floor(timeElapsed / (Math.random() * 29 + 1)) || 1;
            let minYield = pickaxes[currentPickaxe].minYield;
            let maxYield = pickaxes[currentPickaxe].maxYield;
            let durabilityCost = 1;
            let earningsMultiplier = 1;
            if (userEnchantments.includes("haste")) {
              collectionEvents = Math.floor(collectionEvents * 1.5);
            }
            if (userEnchantments.includes("unbreaking")) {
              minYield *= 0.8;
              maxYield *= 0.8;
              durabilityCost *= 0.5;
            }
            if (userEnchantments.includes("fortune")) {
              minYield *= 0.5;
              maxYield *= 0.5;
            }
            if (userEnchantments.includes("efficiency")) {
              durabilityCost *= 3;
              earningsMultiplier *= 2;
            }
            if (userEnchantments.includes("mending")) {
              earningsMultiplier *= 0.5;
            }
            for (let i = 0; i < collectionEvents; i++) {
              const numOres = Math.floor(Math.random() * availableOres.length) + 1;
              let selectedOres = availableOres.sort(() => Math.random() - 0.5).slice(0, numOres);
              if (userEnchantments.includes("fortune")) {
                const rareOres = availableOres.filter(o => ["diamond", "emerald", "gold"].includes(o));
                const commonOres = availableOres.filter(o => !["diamond", "emerald", "gold"].includes(o));
                selectedOres = [...rareOres.sort(() => Math.random() - 0.5).slice(0, Math.min(rareOres.length, numOres)), ...commonOres.sort(() => Math.random() - 0.5).slice(0, Math.max(0, numOres - rareOres.length))];
              }
              for (const ore of selectedOres) {
                const quantity = Math.floor(Math.random() * (maxYield - minYield + 1)) + minYield;
                collectedOres[ore] = (collectedOres[ore] || 0) + quantity;
                totalEarned += quantity * ores[ore].value;
              }
            }
            totalEarned *= earningsMultiplier;
            let simulatedDurability = currentDurability - durabilityCost * collectionEvents;
            if (userEnchantments.includes("mending")) {
              simulatedDurability = Math.min(simulatedDurability + collectionEvents, pickaxes[currentPickaxe].actualDurability);
            }
            message += `Status: Mining for ${timeElapsed < 1 ? `${Math.floor(timeElapsed * 60)} seconds` : `${Math.floor(timeElapsed)} minutes`}\n` +
                      `Estimated Durability After Collection: ${simulatedDurability > 0 ? simulatedDurability : 0}\n` +
                      `Collected Ores:\n` +
                      (Object.keys(collectedOres).length > 0
                        ? Object.entries(collectedOres)
                            .map(([ore, quantity]) => `${ores[ore].name} ${ores[ore].emoji}: ${quantity} pieces worth $${(quantity * ores[ore].value).toLocaleString("en-US")}`)
                            .join("\n")
                        : "No ores collected yet.") +
                      `\nTotal Earnings: $${totalEarned.toLocaleString("en-US")}`;
            await chat.reply(message);
          },
        },
        {
          subcommand: "enchant",
          aliases: ["upgrade", "enhance"],
          description: "Enchant your pickaxe to improve its performance.",
          usage: "mines enchant <efficiency | unbreaking | fortune | mending | haste>",
          async deploy({ chat, args, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const currentPickaxe = userData.mining?.pickaxe || "wooden";
            if (currentPickaxe === "wooden") {
              return await chat.reply(
                "You cannot enchant a Wooden Pickaxe! Buy a better pickaxe first."
              );
            }
            let enchantmentType = args[0]?.toLowerCase().trim() || "";
            if (enchantmentType === "enchant" && args.length > 1) {
              enchantmentType = args[1].toLowerCase().trim();
            }
            if (!enchantmentType) {
              return await chat.reply(
                `No enchantment specified. Usage: mines enchant <efficiency | unbreaking | fortune | mending | haste>\n` +
                `Available enchantments for your ${pickaxes[currentPickaxe].name}:\n\n` +
                Object.entries(enchantments)
                  .map(([key, ench]) => 
                    `${ench.name}\n` +
                    `Description: ${ench.description}\n` +
                    `Cost: $${ench.cost(pickaxes[currentPickaxe].tier).toLocaleString("en-US")}`
                  )
                  .join("\n\n")
              );
            }
            if (!enchantments[enchantmentType]) {
              return await chat.reply(
                `Invalid enchantment: ${args[0] || enchantmentType}. Use: mines enchant <efficiency | unbreaking | fortune | mending | haste>`
              );
            }
            const userEnchantments = userData.mining?.enchantments || (userData.mining?.enchantment ? [userData.mining.enchantment] : []);
            if (userEnchantments.length >= 2) {
              return await chat.reply(
                "You've already enchanted your pickaxe twice."
              );
            }
            if (userEnchantments.includes(enchantmentType)) {
              return await chat.reply(
                `Your ${pickaxes[currentPickaxe].name} is already enchanted with ${enchantments[enchantmentType].name}!`
              );
            }
            const cost = enchantments[enchantmentType].cost(pickaxes[currentPickaxe].tier);
            const currentBalance = userData.balance || 0;
            if (currentBalance < cost) {
              return await chat.reply(
                `You need $${cost.toLocaleString("en-US")} to enchant your ${pickaxes[currentPickaxe].name} with ${enchantments[enchantmentType].name}, but you only have $${currentBalance.toLocaleString("en-US")}!`
              );
            }
            const newEnchantments = [...userEnchantments, enchantmentType];
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: currentBalance - cost,
              mining: {
                ...userData.mining,
                enchantments: newEnchantments,
                nextPickaxeCostMultiplier: enchantmentType === "haste" ? (userData.mining?.nextPickaxeCostMultiplier || 1) * 2 : userData.mining?.nextPickaxeCostMultiplier || 1,
              },
            });
            await chat.reply(
              `Successfully enchanted your ${pickaxes[currentPickaxe].name} with ${enchantments[enchantmentType].name} for $${cost.toLocaleString("en-US")}! ${enchantments[enchantmentType].description}`
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
