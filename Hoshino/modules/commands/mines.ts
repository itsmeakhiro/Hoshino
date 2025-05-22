const manifest: HoshinoLia.CommandManifest = {
  name: "mines",
  aliases: ["mine", "mining"],
  version: "1.0.5",
  developer: "Francis And Liane",
  description: "Mine ores like in Minecraft, where each pickaxe can only mine specific ores based on its tier.",
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
    tier: 1,
    mining: 0.5,
    cost: 100,
    icon: "🪓",
    flavorText: "A basic tool for mining coal, stone, and copper.",
    sellPrice: 50,
  },
  {
    name: "Stone Pickaxe",
    key: "stone_pickaxe",
    tier: 2,
    mining: 1,
    cost: 300,
    icon: "⛏️",
    flavorText: "A sturdy tool for mining iron, lapis, and below.",
    sellPrice: 150,
  },
  {
    name: "Iron Pickaxe",
    key: "iron_pickaxe",
    tier: 3,
    mining: 2,
    cost: 800,
    icon: "⛏️",
    flavorText: "A reliable tool for mining gold, redstone, and below.",
    sellPrice: 400,
  },
  {
    name: "Gold Pickaxe",
    key: "gold_pickaxe",
    tier: 4,
    mining: 3,
    cost: 2000,
    icon: "⛏️",
    flavorText: "A shiny tool for mining diamond, emerald, and below.",
    sellPrice: 1000,
  },
  {
    name: "Diamond Pickaxe",
    key: "diamond_pickaxe",
    tier: 5,
    mining: 5,
    cost: 5000,
    icon: "⛏️",
    flavorText: "The ultimate tool for mining all ores efficiently.",
    sellPrice: 2500,
  },
  {
    name: "Netherite Pickaxe",
    key: "netherite_pickaxe",
    tier: 5,
    mining: 7,
    cost: 12000,
    icon: "⛏️",
    flavorText: "An indestructible tool forged from netherite, unmatched in mining speed.",
    sellPrice: 6000,
  },
];

const ORES = [
  { name: "Coal Ore", cost: 1, tier: 1, probability: 0.20 },
  { name: "Stone", cost: 0.5, tier: 1, probability: 0.20 },
  { name: "Copper Ore", cost: 1.5, tier: 1, probability: 0.20 },
  { name: "Iron Ore", cost: 3, tier: 2, probability: 0.15 },
  { name: "Lapis Lazuli Ore", cost: 4, tier: 2, probability: 0.10 },
  { name: "Gold Ore", cost: 6, tier: 3, probability: 0.05 },
  { name: "Redstone Ore", cost: 5, tier: 3, probability: 0.08 },
  { name: "Diamond Ore", cost: 10, tier: 4, probability: 0.02 },
  { name: "Emerald Ore", cost: 12, tier: 4, probability: 0.02 },
];

function getRandomOre(pickaxeTier: number) {
  const availableOres = ORES.filter(ore => ore.tier <= pickaxeTier);
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
        async deploy({
          chat,
          args,
          event,
          hoshinoDB,
          Inventory,
        }: {
          chat: any;
          args: string[];
          event: any;
          hoshinoDB: any;
          Inventory: any;
        }) {
          const cleanID = event.senderID;
          const userData = await hoshinoDB.get(cleanID);
          if (!userData || !userData.username) {
            return await chat.reply(
              "You need to register first! Use: profile register <username>"
            );
          }
          if (args.length < 1) {
            const pickaxeList = PICKAXES.map(p => `${p.name} [${p.key}] (${p.cost} coins, can mine: ${ORES.filter(o => o.tier <= p.tier).map(o => o.name).join(", ")})`).join("\n");
            return await chat.reply(
              `Please specify a pickaxe type. Available pickaxes:\n${pickaxeList}\nUsage: mines buy <pickaxe_type>`
            );
          }
          const pickaxeType = args.join("_").toLowerCase();
          const pickaxe = PICKAXES.find(p => p.key === pickaxeType);
          if (!pickaxe) {
            const pickaxeList = PICKAXES.map(p => `${p.name} [${p.key}] (${p.cost} coins, can mine: ${ORES.filter(o => o.tier <= p.tier).map(o => o.name).join(", ")})`).join("\n");
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
          if (balance < pickaxe.cost) {
            return await chat.reply(
              `You need ${pickaxe.cost} coins to buy a ${pickaxe.name}, but you only have ${balance}!`
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
            tier: pickaxe.tier,
          };
          inventory.addOne(pickaxeItem);
          await hoshinoDB.set(cleanID, {
            ...userData,
            balance: balance - pickaxe.cost,
            inventoryData: inventory.raw(),
          });
          await chat.reply(
            `You purchased a "${pickaxe.name}" for ${pickaxe.cost} coins! Equip it with: inventory equip ${pickaxe.key}\nCan mine: ${ORES.filter(o => o.tier <= pickaxe.tier).map(o => o.name).join(", ")}`
          );
        },
      },
      {
        subcommand: "start",
        aliases: ["begin", "mine"],
        description: "Start mining a random ore compatible with your equipped pickaxe's tier.",
        usage: "mines start",
        icon: "⛏️",
        async deploy({
          chat,
          event,
          hoshinoDB,
          HoshinoEXP,
          Inventory,
        }: {
          chat: any;
          event: any;
          hoshinoDB: any;
          HoshinoEXP: any;
          Inventory: any;
        }) {
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
          if (!equippedPickaxe || !equippedPickaxe.tier) {
            return await chat.reply("Your equipped pickaxe is invalid or missing tier information.");
          }
          if (miningData.active) {
            return await chat.reply("You are already mining! Check progress with: mines status");
          }
          const ore = getRandomOre(equippedPickaxe.tier);
          if (!ore) {
            return await chat.reply(
              `No ores are available for your ${equippedPickaxe.name} (Tier ${equippedPickaxe.tier})! Upgrade your pickaxe with: mines buy <pickaxe_type>`
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
              pickaxeTier: equippedPickaxe.tier,
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
        async deploy({
          chat,
          event,
          hoshinoDB,
          HoshinoEXP,
          Inventory,
        }: {
          chat: any;
          event: any;
          hoshinoDB: any;
          HoshinoEXP: any;
          Inventory: any;
        }) {
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
          const { startTime, miningRate, oreName, oreCost, pickaxeTier } = miningData;
          const equippedPickaxe = inventory.getAll().find(
            (item: any) => item.type === "utility" && item.stats?.mining === exp.getMining()
          );
          const pickaxeName = equippedPickaxe ? equippedPickaxe.name : "Unknown Pickaxe";
          const elapsedMinutes = (Date.now() - startTime) / (1000 * 60);
          const earned = Math.floor(elapsedMinutes * miningRate * oreCost);
          const availableOres = ORES.filter(ore => ore.tier <= pickaxeTier)
            .map(ore => `${ore.name} (${ore.cost} coins/unit)`)
            .join(", ");
          const statusMessage = [
            `**Mining Status**`,
            `Pickaxe: ${pickaxeName} (Tier ${pickaxeTier})`,
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
        async deploy({
          chat,
          event,
          hoshinoDB,
          HoshinoEXP,
          Inventory,
        }: {
          chat: any;
          event: any;
          hoshinoDB: any;
          HoshinoEXP: any;
          Inventory: any;
        }) {
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
          const { startTime, miningRate, oreName, oreCost, pickaxeTier } = miningData;
          const equippedPickaxe = inventory.getAll().find(
            (item: any) => item.type === "utility" && item.stats?.mining === exp.getMining()
          );
          const pickaxeName = equippedPickaxe ? equippedPickaxe.name : "Unknown Pickaxe";
          const elapsedMinutes = (Date.now() - startTime) / (1000 * 60);
          const earned = Math.floor(elapsedMinutes * miningRate * oreCost);
          await hoshinoDB.set(cleanID, {
            ...userData,
            balance: balance + earned,
            miningData: { active: false, startTime: 0, miningRate: 0, oreName: "", oreCost: 0, pickaxeTier: 0 },
          });
          await chat.reply(
            `You collected ${earned} coins from mining ${oreName} with your ${pickaxeName}! Start a new cycle with: mines start`
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
