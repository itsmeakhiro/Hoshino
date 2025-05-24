const manifest: HoshinoLia.CommandManifest = {
  name: "mines",
  aliases: ["mine", "mining"],
  version: "1.0.5",
  developer: "Francis Loyd Raval",
  description: "Mine ores like in Minecraft, where each pickaxe can only mine specific ores.",
  category: "Simulator",
  usage: "mines buy <pickaxe_type> | mines start | mines status | mines collect",
  config: {
    admin: false,
    moderator: false,
  },
};

const style: HoshinoLia.Command["style"] = {
  type: "lines1",
  title: "〘 ⛏️ 〙 MINES",
  footer: "Made with 🤍 by **Francis Loyd Raval**",
};

const font: HoshinoLia.Command["font"] = {
  title: "bold",
  content: "sans",
  footer: "sans",
};

const PICKAXES = [
  {
    name: "Wooden Pickaxe",
    key: "wooden_pickaxe",
    mining: 0.5,
    price: 100,
    icon: "🪓",
    flavorText: "A basic tool for mining coal, stone, and copper.",
    sellPrice: 50,
    durability: 60,
  },
  {
    name: "Stone Pickaxe",
    key: "stone_pickaxe",
    mining: 1,
    price: 300,
    icon: "⛏️",
    flavorText: "A sturdy tool for mining iron, lapis, and below.",
    sellPrice: 150,
    durability: 130,
  },
  {
    name: "Iron Pickaxe",
    key: "iron_pickaxe",
    mining: 2,
    price: 800,
    icon: "⛏️",
    flavorText: "A reliable tool for mining gold, redstone, and below.",
    sellPrice: 400,
    durability: 250,
  },
  {
    name: "Gold Pickaxe",
    key: "gold_pickaxe",
    mining: 3,
    price: 2000,
    icon: "⛏️",
    flavorText: "A shiny tool for mining diamond, emerald, and below.",
    sellPrice: 1000,
    durability: 30,
  },
  {
    name: "Diamond Pickaxe",
    key: "diamond_pickaxe",
    mining: 5,
    price: 5000,
    icon: "⛏️",
    flavorText: "The ultimate tool for mining all ores efficiently.",
    sellPrice: 2500,
    durability: 1560,
  },
  {
    name: "Netherite Pickaxe",
    key: "netherite_pickaxe",
    mining: 7,
    price: 12000,
    icon: "⛏️",
    flavorText: "An indestructible tool forged from netherite, unmatched in mining speed.",
    sellPrice: 6000,
    durability: 2030,
  },
];

const ORES = [
  { name: "Dirt", cost: 0.3, probability: 0.25, pickaxe: "wooden_pickaxe" },
  { name: "Stone", cost: 0.5, probability: 0.25, pickaxe: "wooden_pickaxe" },
  { name: "Coal Ore", cost: 1, probability: 0.20, pickaxe: "wooden_pickaxe" },
  { name: "Iron Ore", cost: 3, probability: 0.15, pickaxe: "stone_pickaxe" },
  { name: "Lapis Lazuli Ore", cost: 4, probability: 0.10, pickaxe: "stone_pickaxe" },
  { name: "Gold Ore", cost: 6, probability: 0.05, pickaxe: "iron_pickaxe" },
  { name: "Redstone Ore", cost: 5, probability: 0.08, pickaxe: "iron_pickaxe" },
  { name: "Diamond Ore", cost: 10, probability: 0.03, pickaxe: "iron_pickaxe" },
  { name: "Emerald Ore", cost: 12, probability: 0.02, pickaxe: "iron_pickaxe" },
];

function getRandomOre(pickaxeKey: string) {
  const pickaxe = PICKAXES.find(p => p.key === pickaxeKey);
  if (!pickaxe) return null;
  const pickaxeIndex = PICKAXES.findIndex(p => p.key === pickaxeKey);
  const compatiblePickaxeKeys = PICKAXES.slice(0, pickaxeIndex + 1).map(p => p.key);
  const availableOres = ORES.filter(ore => compatiblePickaxeKeys.includes(ore.pickaxe));
  if (availableOres.length === 0) return null;
  const totalProbability = availableOres.reduce((sum, ore) => sum + ore.probability, 0);
  const rand = Math.random() * totalProbability;
  let cumulative = 0;
  for (const ore of availableOres) {
    cumulative += ore.probability;
    if (rand <= cumulative) return ore;
  }
  return availableOres[0];
}

export async function deploy(ctx) {
  const home = new ctx.HoshinoHM(
    [
      {
        subcommand: "buy",
        aliases: ["purchase", "shop"],
        description: "Buy a pickaxe to mine specific ores (wooden, stone, iron, gold, diamond, netherite).",
        usage: "mines buy <pickaxe_type>",
        icon: "🛒",
        async deploy({ chat, args, event, hoshinoDB, Inventory }) {
          const cleanID = event.senderID;
          const userData = await hoshinoDB.get(cleanID);
          if (!userData || !userData.username) {
            return await chat.reply(
              "You need to register first! Use: profile register <username>"
            );
          }
          if (args.length < 1) {
            const pickaxeIndex = PICKAXES.findIndex(pick => pick.key === p.key);
            const compatibleKeys = PICKAXES.slice(0, pickaxeIndex + 1).map(pick => pick.key);
            const pickaxeList = PICKAXES.map(p => `${p.name} [${p.key}] (${p.price} coins, can mine: ${ORES.filter(o => compatibleKeys.includes(o.pickaxe)).map(o => o.name).join(", ")})`).join("\n");
            return await chat.reply(
              `Please specify a pickaxe type. Available pickaxes:\n${pickaxeList}\nUsage: mines buy <pickaxe_type>`
            );
          }
          const pickaxeType = args[1]?.toLowerCase();
          const pickaxe = PICKAXES.find(p => p.key === pickaxeType);
          if (!pickaxe) {
            const pickaxeList = PICKAXES.map(p => {
              const pickaxeIndex = PICKAXES.findIndex(pick => pick.key === p.key);
              const compatibleKeys = PICKAXES.slice(0, pickaxeIndex + 1).map(pick => pick.key);
              return `${p.name} [${p.key}] (${p.price} coins, can mine: ${ORES.filter(o => compatibleKeys.includes(o.pickaxe)).map(o => o.name).join(", ")})`
            }).join("\n");
            return await chat.reply(
              `Invalid pickaxe type. Available pickaxes:\n${pickaxeList}`
            );
          }
          const { inventoryData = [], balance = 0 } = userData;
          const inventory = new Inventory(inventoryData);
          if (inventory.size() >= inventory.limit) {
            return await chat.reply("Your inventory is full! Cannot buy a new pickaxe.");
          }
          if (inventory.getAll().some((item: any) => item.key === pickaxe.key)) {
            return await chat.reply(`You already own a "${pickaxe.name}"!`);
          }
          if (balance < pickaxe.price) {
            return await chat.reply(
              `You need ${pickaxe.price} coins to buy a ${pickaxe.name}, but you only have ${balance}!`
            );
          }
          const pickaxeItem = {
            name: pickaxe.name,
            key: pickaxe.key,
            type: "utility",
            icon: pickaxe.icon,
            flavorText: pickaxe.flavorText,
            sellPrice: pickaxe.sellPrice,
            cannotToss: false,
            stats: { mining: pickaxe.mining },
            durability: pickaxe.durability,
          };
          inventory.addOne(pickaxeItem);
          await hoshinoDB.set(cleanID, {
            ...userData,
            balance: balance - pickaxe.price,
            inventoryData: inventory.raw(),
          });
          const pickaxeIndex = PICKAXES.findIndex(pick => pick.key === pickaxe.key);
          const compatibleKeys = PICKAXES.slice(0, pickaxeIndex + 1).map(pick => pick.key);
          await chat.reply(
            `You purchased a "${pickaxe.name}" for ${pickaxe.price} coins! Equip it with: inventory equip ${pickaxe.key}\nCan mine: ${ORES.filter(o => compatibleKeys.includes(o.pickaxe)).map(o => o.name).join(", ")}`
          );
        },
      },
      {
        subcommand: "start",
        aliases: ["begin", "mine"],
        description: "Start mining a random ore compatible with your equipped pickaxe.",
        usage: "mines start",
        icon: "⛏️",
        async deploy({ chat, event, hoshinoDB, HoshinoEXP, Inventory }) {
          const cleanID = event.senderID;
          const userData = await hoshinoDB.get(cleanID);
          if (!userData || !userData.username) {
            return await chat.reply(
              "You need to register first! Use: profile register <username>"
            );
          }
          const { expData = { mining: 0 }, inventoryData = [], miningData = {} } = userData;
          const exp = new HoshinoEXP(expData);
          const inventory = new Inventory(inventoryData);
          if (!exp.getMining || exp.getMining() <= 0) {
            return await chat.reply(
              "You need to equip a pickaxe first! Use: inventory equip <pickaxe_key>. If you don't have one, buy it with: mines buy <pickaxe_type>"
            );
          }
          const equippedPickaxe = inventory.getAll().find(
            (item: any) => item.type === "utility" && item.stats?.mining === exp.getMining()
          );
          if (!equippedPickaxe) {
            return await chat.reply("Your equipped pickaxe is invalid.");
          }
          if (equippedPickaxe.durability <= 0) {
            return await chat.reply(
              `Your ${equippedPickaxe.name} is broken! Buy a new one with: mines buy <pickaxe_type>`
            );
          }
          if (miningData.active) {
            return await chat.reply("You are already mining! Check progress with: mines status");
          }
          const ore = getRandomOre(equippedPickaxe.key);
          if (!ore) {
            return await chat.reply(
              `No ores are available for your ${equippedPickaxe.name}! Upgrade your pickaxe with: mines buy <pickaxe_type>`
            );
          }
          const miningRate = exp.getMining();
          await hoshinoDB.set(cleanID, {
            ...userData,
            miningData: {
              active: true,
              startTime: Date.now(),
              miningRate,
              oreName: ore.name,
              oreCost: ore.cost,
              pickaxeKey: equippedPickaxe.key,
            },
          });
          await chat.reply(
            `You started mining ${ore.name} (rate: ${(miningRate * ore.cost).toFixed(1)} coins/min) with your ${equippedPickaxe.name}! Check progress with: mines status`
          );
        },
      },
      {
        subcommand: "status",
        aliases: ["check", "progress"],
        description: "Check your mining progress, ore type, and estimated earnings.",
        usage: "mines status",
        icon: "📊",
        async deploy({ chat, event, hoshinoDB, HoshinoEXP, Inventory }) {
          const cleanID = event.senderID;
          const userData = await hoshinoDB.get(cleanID);
          if (!userData || !userData.username) {
            return await chat.reply(
              "You need to register first! Use: profile register <username>"
            );
          }
          const { expData = { mining: 0 }, miningData = {}, inventoryData = [] } = userData;
          const exp = new HoshinoEXP(expData);
          const inventory = new Inventory(inventoryData);
          if (!miningData.active) {
            return await chat.reply(
              "You are not currently mining! Start with: mines start"
            );
          }
          const { startTime, miningRate, oreName, oreCost, pickaxeKey } = miningData;
          const equippedPickaxe = inventory.getAll().find(
            (item: any) => item.type === "utility" && item.stats?.mining === exp.getMining()
          );
          const pickaxeName = equippedPickaxe ? equippedPickaxe.name : "Unknown Pickaxe";
          const pickaxeDurability = equippedPickaxe ? equippedPickaxe.durability : 0;
          const elapsedMinutes = (Date.now() - startTime) / (1000 * 60);
          const earned = Math.floor(elapsedMinutes * miningRate * oreCost);
          const pickaxeIndex = PICKAXES.findIndex(p => p.key === pickaxeKey);
          const compatiblePickaxeKeys = PICKAXES.slice(0, pickaxeIndex + 1).map(p => p.key);
          const availableOres = ORES.filter(ore => compatiblePickaxeKeys.includes(ore.pickaxe))
            .map(ore => `${ore.name} (${ore.cost} coins/unit)`)
            .join(", ");
          const statusMessage = [
            `**Mining Status**`,
            `Pickaxe: ${pickaxeName} (Durability: ${pickaxeDurability})`,
            `Ore: ${oreName} (${oreCost} coins/unit)`,
            `Mining Rate: ${(miningRate * oreCost).toFixed(1)} coins/min`,
            `Time Elapsed: ${elapsedMinutes.toFixed(1)} minutes`,
            `Estimated Earnings: ${earned} coins`,
            `Available Ores: ${availableOres}`,
            `Collect your earnings with: mines collect`,
          ].join("\n");
          await chat.reply(statusMessage);
        },
      },
      {
        subcommand: "collect",
        aliases: ["claim", "end"],
        description: "Collect your mining earnings and reset the cycle.",
        usage: "mines collect",
        icon: "💰",
        async deploy({ chat, event, hoshinoDB, HoshinoEXP, Inventory }) {
          const cleanID = event.senderID;
          const userData = await hoshinoDB.get(cleanID);
          if (!userData || !userData.username) {
            return await chat.reply(
              "You need to register first! Use: profile register <username>"
            );
          }
          const { expData = { mining: 0 }, miningData = {}, balance = 0, inventoryData = [] } = userData;
          const exp = new HoshinoEXP(expData);
          const inventory = new Inventory(inventoryData);
          if (!miningData.active) {
            return await chat.reply(
              "You are not currently mining! Start with: mines start"
            );
          }
          const { startTime, miningRate, oreName, oreCost, pickaxeKey } = miningData;
          const equippedPickaxe = inventory.getAll().find(
            (item: any) => item.type === "utility" && item.stats?.mining === exp.getMining()
          );
          const pickaxeName = equippedPickaxe ? equippedPickaxe.name : "Unknown Pickaxe";
          const elapsedMinutes = (Date.now() - startTime) / (1000 * 60);
          const earned = Math.floor(elapsedMinutes * miningRate * oreCost);
          equippedPickaxe.durability -= 1;
          let breakMessage = "";
          if (equippedPickaxe.durability <= 0) {
            inventory.removeOne(equippedPickaxe.key);
            exp.setMining(0);
            breakMessage = `Your ${pickaxeName} broke! Buy a new one with: mines buy <pickaxe_type>`;
          }
          await hoshinoDB.set(cleanID, {
            ...userData,
            balance: balance + earned,
            expData: exp.raw(),
            inventoryData: inventory.raw(),
            miningData: equippedPickaxe.durability <= 0 ? { active: false, startTime: 0, miningRate: 0, oreName: "", oreCost: 0, pickaxeKey: "" } : { active: false, startTime: 0, miningRate: 0, oreName: "", oreCost: 0, pickaxeKey: pickaxeKey },
          });
          await chat.reply(
            `You collected ${earned} coins from mining ${oreName} with your ${pickaxeName}! Start a new cycle with: mines start${breakMessage ? "\n" + breakMessage : ""}`
          );
        },
      },
    ],
    "◆"
  );
  return home.runInContext(ctx);
}

export default {
  manifest,
  style,
  deploy,
  font,
} as HoshinoLia.Command;
