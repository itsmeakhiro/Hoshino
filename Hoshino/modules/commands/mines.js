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
      "Start a mining simulator to earn money, collect ores, or buy better pickaxes.",
    category: "Economy",
    usage: "mines start | mines collect | mines buy <pickaxe>",
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
      wooden: { name: "Wooden Pickaxe", cost: 0, ores: ["stone", "coal", "clay"], durability: 59, minYield: 50, maxYield: 150 },
      stone: { name: "Stone Pickaxe", cost: 1000, ores: ["stone", "coal", "clay", "copper"], durability: 131, minYield: 100, maxYield: 200 },
      iron: { name: "Iron Pickaxe", cost: 5000, ores: ["stone", "coal", "clay", "copper", "iron"], durability: 250, minYield: 150, maxYield: 300 },
      diamond: { name: "Diamond Pickaxe", cost: 25000, ores: ["stone", "coal", "clay", "copper", "iron", "gold", "emerald"], durability: 1561, minYield: 200, maxYield: 400 },
      netherite: { name: "Netherite Pickaxe", cost: 100000, ores: ["stone", "coal", "clay", "copper", "iron", "gold", "emerald", "diamond"], durability: 2031, minYield: 300, maxYield: 600 },
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
            if (userData.mining && userData.mining.active && userData.mining.startTime) {
              const timeElapsed = (Date.now() - userData.mining.startTime) / 1000 / 60;
              if (isNaN(timeElapsed) || timeElapsed < 0) {
                message = "Mining session is invalid. Starting a new session.\n";
              } else if (timeElapsed > 0) {
                const availableOres = pickaxes[userPickaxe].ores;
                const collectedOres = {};
                let totalEarned = 0;
                const collectionEvents = Math.floor(timeElapsed / (Math.random() * 29 + 1)) || 1;
                let durabilityCost = 0;
                for (let i = 0; i < collectionEvents; i++) {
                  const numOres = Math.floor(Math.random() * availableOres.length) + 1;
                  const selectedOres = availableOres.sort(() => Math.random() - 0.5).slice(0, numOres);
                  for (const ore of selectedOres) {
                    const quantity = Math.floor(Math.random() * (pickaxes[userPickaxe].maxYield - pickaxes[userPickaxe].minYield + 1)) + pickaxes[userPickaxe].minYield;
                    collectedOres[ore] = (collectedOres[ore] || 0) + quantity;
                    totalEarned += quantity * ores[ore].value;
                  }
                  durabilityCost += 1;
                }
                currentDurability -= durabilityCost;
                if (currentDurability <= 0) {
                  userPickaxe = "wooden";
                  currentDurability = pickaxes.wooden.durability;
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
              },
            });
            message += `Mining started with your ${pickaxes[userPickaxe].name} (Durability: ${currentDurability})! Use 'mines collect' to collect your earnings.`;
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
                  durability: userData.mining?.durability || pickaxes[userData.mining?.pickaxe || "wooden"].durability,
                  lastCollectionTime: userData.mining?.lastCollectionTime || 0,
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
            const availableOres = pickaxes[userPickaxe].ores;
            const collectedOres = {};
            let totalEarned = 0;
            const collectionEvents = Math.floor(timeElapsed / (Math.random() * 29 + 1)) || 1;
            let durabilityCost = 0;
            for (let i = 0; i < collectionEvents; i++) {
              const numOres = Math.floor(Math.random() * availableOres.length) + 1;
              const selectedOres = availableOres.sort(() => Math.random() - 0.5).slice(0, numOres);
              for (const ore of selectedOres) {
                const quantity = Math.floor(Math.random() * (pickaxes[userPickaxe].maxYield - pickaxes[userPickaxe].minYield + 1)) + pickaxes[userPickaxe].minYield;
                collectedOres[ore] = (collectedOres[ore] || 0) + quantity;
                totalEarned += quantity * ores[ore].value;
              }
              durabilityCost += 1;
            }
            currentDurability -= durabilityCost;
            let breakMessage = "";
            if (currentDurability <= 0) {
              userPickaxe = "wooden";
              currentDurability = pickaxes.wooden.durability;
              breakMessage = `Your ${pickaxes[userData.mining.pickaxe].name} broke! Reverted to Wooden Pickaxe.\n`;
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
          usage: "mines buy <wooden | stone | iron | diamond | netherite>",
          async deploy({ chat, args, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (args.length < 1) {
              return await chat.reply(
                `Please specify a pickaxe to buy. Usage: mines buy <wooden | stone | iron | diamond | netherite>\nAvailable pickaxes:\n` +
                Object.values(pickaxes)
                  .map(p => `${p.name}: $${p.cost.toLocaleString("en-US")} (Mines: ${p.ores.map(o => `${ores[o].name} ${ores[o].emoji}`).join(", ")}, Durability: ${p.durability})`)
                  .join("\n")
              );
            }
            const pickaxeType = args[0].toLowerCase().trim();
            if (!pickaxes[pickaxeType]) {
              return await chat.reply(
                `Invalid pickaxe: ${args[0]}. Use: mines buy <wooden | stone | iron | diamond | netherite>`
              );
            }
            const currentPickaxe = userData.mining?.pickaxe || "wooden";
            if (currentPickaxe === pickaxeType) {
              return await chat.reply(
                `You already own a ${pickaxes[pickaxeType].name}!`
              );
            }
            const cost = pickaxes[pickaxeType].cost;
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
                earned: userData.mining?.earned || 0,
                pickaxe: pickaxeType,
                durability: pickaxes[pickaxeType].durability,
                lastCollectionTime: userData.mining?.lastCollectionTime || 0,
              },
            });
            await chat.reply(
              `Successfully purchased a ${pickaxes[pickaxeType].name} for $${cost.toLocaleString(
                "en-US"
              )}! You can now mine: ${pickaxes[pickaxeType].ores.map(o => `${ores[o].name} ${ores[o].emoji}`).join(", ")}. Durability: ${pickaxes[pickaxeType].durability}.`
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
