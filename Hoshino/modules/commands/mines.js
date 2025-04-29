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
      wooden: { name: "Wooden Pickaxe", cost: 0, ores: ["stone", "coal", "copper"], durability: 59, minYield: 50, maxYield: 150 },
      stone: { name: "Stone Pickaxe", cost: 1000, ores: ["stone", "coal", "copper", "iron"], durability: 131, minYield: 100, maxYield: 200 },
      iron: { name: "Iron Pickaxe", cost: 5000, ores: ["stone", "coal", "copper", "iron", "gold", "redstone"], durability: 250, minYield: 150, maxYield: 300 },
      diamond: { name: "Diamond Pickaxe", cost: 25000, ores: ["stone", "coal", "copper", "iron", "gold", "redstone", "emerald", "diamond"], durability: 1561, minYield: 200, maxYield: 400 },
      netherite: { name: "Netherite Pickaxe", cost: 100000, ores: ["stone", "coal", "copper", "iron", "gold", "redstone", "emerald", "diamond"], durability: 2031, minYield: 300, maxYield: 600 },
    };
    const ores = {
      stone: { name: "Stone", value: 500 },
      coal: { name: "Coal", value: 1000 },
      copper: { name: "Copper", value: 1500 },
      iron: { name: "Iron", value: 2500 },
      redstone: { name: "Redstone", value: 3000 },
      gold: { name: "Gold", value: 5000 },
      emerald: { name: "Emerald", value: 7500 },
      diamond: { name: "Diamond", value: 10000 },
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
            if (userData.mining && userData.mining.active) {
              const timeElapsed = (Date.now() - userData.mining.startTime) / 1000 / 60;
              if (timeElapsed >= 60) {
                const availableOres = pickaxes[userPickaxe].ores;
                const collectedOres = {};
                let totalEarned = 0;
                for (const ore of availableOres) {
                  if (Math.random() > 0.5) {
                    const quantity = Math.floor(Math.random() * (pickaxes[userPickaxe].maxYield - pickaxes[userPickaxe].minYield + 1)) + pickaxes[userPickaxe].minYield;
                    collectedOres[ore] = quantity;
                    totalEarned += quantity * ores[ore].value;
                  }
                }
                const newBalance = (userData.balance || 0) + totalEarned;
                currentDurability -= 1;
                if (currentDurability <= 0) {
                  userPickaxe = "wooden";
                  currentDurability = pickaxes.wooden.durability;
                  message = `Your ${pickaxes[userData.mining.pickaxe].name} broke! Reverted to Wooden Pickaxe.\n`;
                }
                await hoshinoDB.set(event.senderID, {
                  ...userData,
                  balance: newBalance,
                  mining: {
                    active: false,
                    startTime: 0,
                    earned: 0,
                    pickaxe: userPickaxe,
                    durability: currentDurability,
                  },
                });
                if (Object.keys(collectedOres).length > 0) {
                  message += "Collected from your previous mining session:\n" +
                    Object.entries(collectedOres)
                      .map(([ore, quantity]) => `${ores[ore].name}: ${quantity} pieces worth $${(quantity * ores[ore].value).toLocaleString("en-US")}`)
                      .join("\n") +
                    `\nTotal: $${totalEarned.toLocaleString("en-US")}\n`;
                } else {
                  message += "No ores collected from your previous mining session.\n";
                }
              } else {
                message = "No ore's collected on it. Comeback after an hour for the collection.\n";
              }
            } else {
              message = "No ore's collected on it. Comeback after an hour for the collection.\n";
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
              },
            });
            message += `Mining started with your ${pickaxes[userPickaxe].name} (Durability: ${currentDurability})! Use 'mines collect' to collect your earnings later.`;
            await chat.reply(message);
          },
        },
        {
          subcommand: "collect",
          aliases: ["claim", "gather"],
          description: "Collect money earned from mining and reset the simulator.",
          usage: "mines collect",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.mining || !userData.mining.active) {
              return await chat.reply(
                "You haven't started mining! Use 'mines start' to begin."
              );
            }
            const timeElapsed = (Date.now() - userData.mining.startTime) / 1000 / 60;
            if (timeElapsed < 60) {
              return await chat.reply(
                "No ore's collected on it. Comeback after an hour for the collection."
              );
            }
            let userPickaxe = userData.mining.pickaxe || "wooden";
            let currentDurability = userData.mining.durability || pickaxes[userPickaxe].durability;
            const availableOres = pickaxes[userPickaxe].ores;
            const collectedOres = {};
            let totalEarned = 0;
            for (const ore of availableOres) {
              if (Math.random() > 0.5) {
                const quantity = Math.floor(Math.random() * (pickaxes[userPickaxe].maxYield - pickaxes[userPickaxe].minYield + 1)) + pickaxes[userPickaxe].minYield;
                collectedOres[ore] = quantity;
                totalEarned += quantity * ores[ore].value;
              }
            }
            const newBalance = (userData.balance || 0) + totalEarned;
            currentDurability -= 1;
            let breakMessage = "";
            if (currentDurability <= 0) {
              userPickaxe = "wooden";
              currentDurability = pickaxes.wooden.durability;
              breakMessage = `Your ${pickaxes[userData.mining.pickaxe].name} broke! Reverted to Wooden Pickaxe.\n`;
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: newBalance,
              mining: {
                active: false,
                startTime: 0,
                earned: 0,
                pickaxe: userPickaxe,
                durability: currentDurability,
              },
            });
            const formattedBalance = newBalance.toLocaleString("en-US");
            let replyMessage = breakMessage;
            if (Object.keys(collectedOres).length > 0) {
              replyMessage += "Collected from mining:\n" +
                Object.entries(collectedOres)
                  .map(([ore, quantity]) => `${ores[ore].name}: ${quantity} pieces worth $${(quantity * ores[ore].value).toLocaleString("en-US")}`)
                  .join("\n") +
                `\nTotal: $${totalEarned.toLocaleString("en-US")}\nYour new balance is $${formattedBalance}.`;
            } else {
              replyMessage += "No ores collected from mining.\nYour balance remains $${formattedBalance}.";
            }
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
                "Please specify a pickaxe to buy. Usage: mines buy <wooden | stone | iron | diamond | netherite>\nAvailable pickaxes:\n" +
                Object.values(pickaxes)
                  .map(p => `${p.name}: $${p.cost.toLocaleString("en-US")} (Mines: ${p.ores.map(o => ores[o].name).join(", ")}, Durability: ${p.durability})`)
                  .join("\n")
              );
            }
            const pickaxeType = args[0].toLowerCase();
            if (!pickaxes[pickaxeType]) {
              return await chat.reply(
                "Invalid pickaxe! Use: mines buy <wooden | stone | iron | diamond | netherite>"
              );
            }
            const currentPickaxe = userData.mining?.pickaxe || "wooden";
            if (currentPickaxe === pickaxeType) {
              return await chat.reply(
                `You already own a ${pickaxes[pickaxeType].name}!`
              );
            }
            const cost = pickaxes[pickaxeType].cost;
            if ((userData.balance || 0) < cost) {
              return await chat.reply(
                `You need $${cost.toLocaleString("en-US")} to buy a ${pickaxes[pickaxeType].name}!`
              );
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: (userData.balance || 0) - cost,
              mining: {
                ...userData.mining,
                pickaxe: pickaxeType,
                durability: pickaxes[pickaxeType].durability,
              },
            });
            await chat.reply(
              `Successfully purchased a ${pickaxes[pickaxeType].name} for $${cost.toLocaleString(
                "en-US"
              )}! You can now mine: ${pickaxes[pickaxeType].ores.map(o => ores[o].name).join(", ")}. Durability: ${pickaxes[pickaxeType].durability}.`
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
