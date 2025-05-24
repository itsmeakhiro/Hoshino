const manifest: HoshinoLia.CommandManifest = {
  name: "fisch",
  aliases: ["fish", "fishing"],
  version: "1.0.0",
  developer: "Francis And Liane",
  description:
    "A fishing adventure: cast your line to catch fish, sell them for C$, buy stronger rods, and check your fishing stats.",
  category: "Simulator",
  usage:
    "fisch cast | fisch sell <fish_key> [amount] | fisch buy <rod_key> | fisch status",
  config: {
    admin: false,
    moderator: false,
  },
};

const style: HoshinoLia.Command["style"] = {
  type: "lines1",
  title: "〘 🎣 〙 FISCH",
  footer: "Made with 🤍 by Francis And Liane",
};

const font: HoshinoLia.Command["font"] = {
  title: "bold",
  content: "sans",
  footer: "sans",
};

const fishTypes = {
  "minnow": {
    key: "minnow",
    name: "Minnow",
    flavorText: "A small, common fish found in shallow waters.",
    icon: "🐟",
    type: "fish",
    cannotToss: false,
    sellPrice: 10,
    rarity: "common",
    weight: 1,
  },
  "trout": {
    key: "trout",
    name: "Trout",
    flavorText: "A tasty fish that thrives in rivers.",
    icon: "🐠",
    type: "fish",
    cannotToss: false,
    sellPrice: 50,
    rarity: "uncommon",
    weight: 3,
  },
  "salmon": {
    key: "salmon",
    name: "Salmon",
    flavorText: "A prized fish known for its strength.",
    icon: "🐡",
    type: "fish",
    cannotToss: false,
    sellPrice: 100,
    rarity: "rare",
    weight: 5,
  },
  "shark": {
    key: "shark",
    name: "Shark",
    flavorText: "A fearsome predator of the deep.",
    icon: "🦈",
    type: "fish",
    cannotToss: false,
    sellPrice: 500,
    rarity: "legendary",
    weight: 20,
  },
};

const rods = {
  "flimsy-rod": {
    key: "flimsy-rod",
    name: "Flimsy Rod",
    flavorText: "A basic rod for beginner anglers.",
    icon: "🎣",
    type: "utility",
    cannotToss: false,
    sellPrice: 0,
    price: 0,
    durability: 50,
    stats: { fishing: 1 },
  },
  "carbon-rod": {
    key: "carbon-rod",
    name: "Carbon Rod",
    flavorText: "A sturdy rod for catching bigger fish.",
    icon: "🎣",
    type: "utility",
    cannotToss: false,
    sellPrice: 500,
    price: 2000,
    durability: 100,
    stats: { fishing: 5 },
  },
  "steady-rod": {
    key: "steady-rod",
    name: "Steady Rod",
    flavorText: "A reliable rod for rare catches.",
    icon: "🎣",
    type: "utility",
    cannotToss: false,
    sellPrice: 1000,
    price: 7000,
    durability: 150,
    stats: { fishing: 10 },
  },
};

export async function deploy(ctx) {
  const home = new ctx.HoshinoHM(
    [
      {
        subcommand: "cast",
        aliases: ["fish", "catch"],
        description: "Cast your line to catch a fish.",
        usage: "fisch cast",
        async deploy({ chat, event, hoshinoDB, HoshinoEXP, Inventory }) {
          const cleanID = event.senderID;
          const userData = await hoshinoDB.get(cleanID);
          if (!userData || !userData.username) {
            return await chat.reply(
              "You need to register first! Use: profile register <username>"
            );
          }
          const {
            expData = { exp: 0, mana: 100, health: 100, fishing: 0, currency: 0 },
            inventoryData = [],
            equippedRod = null,
          } = userData;
          const exp = new HoshinoEXP(expData);
          const inventory = new Inventory(inventoryData);
          const rod = equippedRod ? inventory.getOne(equippedRod) : inventory.getOne("flimsy-rod");
          if (!rod || rod.type !== "utility" || !rod.stats?.fishing) {
            return await chat.reply(
              "You need an equipped fishing rod! Use 'fisch buy flimsy-rod' to get started."
            );
          }
          const fishingStat = rod.stats.fishing;
          const totalInverseWeight = Object.values(fishTypes).reduce(
            (sum, fish) => sum + (1 / fish.weight),
            0
          );
          let randomWeight = Math.random() * totalInverseWeight;
          let fishCaught = null;
          for (const fish of Object.values(fishTypes)) {
            randomWeight -= 1 / fish.weight;
            if (randomWeight <= 0) {
              fishCaught = fish;
              break;
            }
          }
          if (fishCaught) {
            const catchChance = Math.max(
              10,
              Math.min(90, 50 + fishingStat * 5 - fishCaught.weight * 2)
            ); 
            const roll = Math.random() * 100;
            if (roll < catchChance) {
              inventory.addOne({ ...fishCaught, durability: undefined });
              exp.exp += 10;
            } else {
              fishCaught = null;
            }
          }
          await hoshinoDB.set(cleanID, {
            ...userData,
            expData: exp.raw(),
            inventoryData: inventory.raw(),
          });
          await chat.reply(
            fishCaught
              ? `You cast your line with ${rod.name} and caught a ${fishCaught.name || 'unknown fish'}! 🎣`
              : `You cast your line with ${rod.name}, but the fish was too heavy to reel in...`
          );
        },
      },
      {
        subcommand: "sell",
        aliases: ["trade", "merchant"],
        description: "Sell fish from your inventory for C$.",
        usage: "fisch sell <fish_key> [amount]",
        async deploy({ chat, args, event, hoshinoDB, HoshinoEXP, Inventory }) {
          if (args.length < 1) {
            return await chat.reply(
              "Please provide a fish key. Usage: fisch sell <fish_key> [amount]"
            );
          }
          const fishKey = args[0].trim().toLowerCase();
          const amount = args[1] === "all" ? "all" : parseInt(args[1]) || 1;
          if (!fishKey) {
            return await chat.reply(
              "Invalid fish key. Usage: fisch sell <fish_key> [amount]"
            );
          }
          if (amount !== "all" && (isNaN(amount) || amount < 1)) {
            return await chat.reply(
              "Amount must be a positive number or 'all'."
            );
          }
          const cleanID = event.senderID;
          const userData = await hoshinoDB.get(cleanID);
          if (!userData || !userData.username) {
            return await chat.reply(
              "You need to register first! Use: profile register <username>"
            );
          }
          const {
            expData = { exp: 0, mana: 100, health: 100, fishing: 0, currency: 0 },
            inventoryData = [],
          } = userData;
          const exp = new HoshinoEXP(expData);
          const inventory = new Inventory(inventoryData);
          if (!inventory.has(fishKey)) {
            return await chat.reply(
              `You don't have a fish with key "${fishKey}" in your inventory!`
            );
          }
          const fish = inventory.getOne(fishKey);
          if (fish.type !== "fish") {
            return await chat.reply(
              `Item "${fish.name}" is not a fish! Use 'fisch sell' for fish only.`
            );
          }
          const availableAmount = inventory.getAmount(fishKey);
          if (amount !== "all" && amount > availableAmount) {
            return await chat.reply(
              `You only have ${availableAmount} "${fish.name}"(s) to sell!`
            );
          }
          const sellAmount = amount === "all" ? availableAmount : amount;
          const earnings = sellAmount * fish.sellPrice;
          exp.setStat("currency", (exp.getStat("currency") || 0) + earnings);
          inventory.toss(fishKey, amount);
          await hoshinoDB.set(cleanID, {
            ...userData,
            expData: exp.raw(),
            inventoryData: inventory.raw(),
          });
          await chat.reply(
            `Sold ${sellAmount} "${fish.name}" for ${earnings} C$! Current balance: ${exp.getStat("currency")} C$.`
          );
        },
      },
      {
        subcommand: "buy",
        aliases: ["purchase", "shop"],
        description: "Buy a fishing rod from the merchant.",
        usage: "fisch buy <rod_key>",
        async deploy({ chat, args, event, hoshinoDB, HoshinoEXP, Inventory }) {
          if (args.length < 1) {
            return await chat.reply(
              "Please provide a rod key. Usage: fisch buy <rod_key>"
            );
          }
          const rodKey = args.join(" ").trim().toLowerCase();
          if (!rodKey) {
            return await chat.reply(
              "Invalid rod key. Usage: fisch buy <rod_key>"
            );
          }
          const cleanID = event.senderID;
          const userData = await hoshinoDB.get(cleanID);
          if (!userData || !userData.username) {
            return await chat.reply(
              "You need to register first! Use: profile register <username>"
            );
          }
          const {
            expData = { exp: 0, mana: 100, health: 100, fishing: 0, currency: 0 },
            inventoryData = [],
          } = userData;
          const exp = new HoshinoEXP(expData);
          const inventory = new Inventory(inventoryData);
          const rod = rods[rodKey];
          if (!rod) {
            return await chat.reply(
              `No rod found with key "${rodKey}". Available rods: ${Object.keys(rods).join(", ")}`
            );
          }
          const currency = exp.getStat("currency") || 0;
          if (currency < rod.price) {
            return await chat.reply(
              `You need ${rod.price} C$ to buy "${rod.name}", but you only have ${currency} C$.`
            );
          }
          if (inventory.size() >= inventory.limit) {
            return await chat.reply(
              "Your inventory is full! Toss or sell items to make space."
            );
          }
          exp.setStat("currency", currency - rod.price);
          inventory.addOne(rod);
          inventory.equipUtility(rodKey, exp);
          await hoshinoDB.set(cleanID, {
            ...userData,
            expData: exp.raw(),
            inventoryData: inventory.raw(),
            equippedRod: rodKey,
          });
          await chat.reply(
            `Purchased and equipped "${rod.name}" for ${rod.price} C$! Fishing stat: +${rod.stats.fishing}.`
          );
        },
      },
      {
        subcommand: "status",
        aliases: ["stats", "info"],
        description: "Check your fishing stats and equipped rod.",
        usage: "fisch status",
        async deploy({ chat, event, hoshinoDB, HoshinoEXP, Inventory }) {
          const cleanID = event.senderID;
          const userData = await hoshinoDB.get(cleanID);
          if (!userData || !userData.username) {
            return await chat.reply(
              "You need to register first! Use: profile register <username>"
            );
          }
          const {
            expData = { exp: 0, mana: 100, health: 100, fishing: 0, currency: 0 },
            inventoryData = [],
            equippedRod = null,
          } = userData;
          const exp = new HoshinoEXP(expData);
          const inventory = new Inventory(inventoryData);
          const rod = equippedRod ? inventory.getOne(equippedRod) : inventory.getOne("flimsy-rod");
          const rodText = rod
            ? `${rod.name} (${rod.stats?.fishing || 0} Fishing, ${rod.durability}/100 Durability)`
            : "No rod equipped";
          const fishCount = inventory
            .getAll()
            .filter(item => item.type === "fish")
            .reduce((sum, item) => sum + (item.quantity || 1), 0);
          const status = [
            `**${userData.username}'s Fishing Stats**`,
            `Rod: ${rodText}`,
            `Fish Caught: ${fishCount}`,
            `Currency: ${exp.getStat("currency") || 0} C$`,
            `Fishing Stat: ${exp.getStat("fishing") || 0}`,
            `Level: ${exp.getLevel()}`,
            `EXP: ${exp.getExp()}/${exp.getNextLevelExp()}`,
          ].join("\n");
          await chat.reply(status);
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
