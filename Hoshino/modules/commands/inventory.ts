function formatCash(
  number: number = 0,
  emoji: string | boolean = "💵",
  bold = false
) {
  if (typeof emoji === "boolean") {
    bold = emoji;
    emoji = "💵";
  }
  return `${bold ? "**" : ""}$${Number(number).toLocaleString()}${
    emoji || "💵"
  }${bold ? "**" : ""}`;
}

const manifest: HoshinoLia.CommandManifest = {
  name: "inventory",
  aliases: ["inv", "items"],
  version: "1.0.0",
  developer: "Francis And Liane",
  description: "Manage your inventory: check items, use food/potions/chests, or toss items.",
  category: "Simulator",
  usage: "inventory list | inventory use <item_key> | inventory toss <item_key> [amount]",
  config: {
    admin: false,
    moderator: false,
  },
};

const style: HoshinoLia.Command["style"] = {
  type: "lines1",
  title: "〘 🎒 〙 INVENTORY",
  footer: "Made with 🤍 by **Francis Loyd Raval**",
};

const font: HoshinoLia.Command["font"] = {
  title: "bold",
  content: "sans",
  footer: "sans",
};

export async function deploy(ctx) {
  const home = new ctx.HoshinoHM([
    {
      subcommand: "list",
      aliases: ["check", "view"],
      description: "View all items in your inventory.",
      usage: "inventory list",
      async deploy({ chat, event, hoshinoDB, Inventory }) {
        const cleanID = event.senderID;
        const userData = await hoshinoDB.get(cleanID);
        if (!userData || !userData.username) {
          return await chat.reply(
            "You need to register first! Use: profile register <username>"
          );
        }
        const { inventoryData = [] } = userData;
        const inventory = new Inventory(inventoryData);
        if (inventory.size() === 0) {
          return await chat.reply("Your inventory is empty!");
        }
        const items = (inventory.getAll() as Array<{
          key: string;
          name: string;
          icon: string;
          heal?: number;
          mana?: number;
          flavorText?: string;
        }>).map((item, index) => {
          const effects: string[] = [];
          if (typeof item.heal === 'number' && item.heal > 0) {
            effects.push(`+${item.heal} HP`);
          }
          if (typeof item.mana === 'number' && item.mana > 0) {
            effects.push(`+${item.mana} MP`);
          }
          const effectText = effects.length ? ` (${effects.join(", ")})` : "";
          const flavorText = item.flavorText ? `\n   ${item.flavorText}` : "";
          return `${index + 1}. ${item.icon} ${item.name} [${item.key}]${effectText}${flavorText}`;
        });
        const inventoryList = `**Your Inventory (${inventory.size()}/${inventory.limit})**\n${items.join("\n")}`;
        await chat.reply(inventoryList);
      },
    },
    {
      subcommand: "use",
      aliases: ["heal", "consume"],
      description: "Use a food, potion, or chest item.",
      usage: "inventory use <item_key>",
      async deploy({ chat, args, event, hoshinoDB, HoshinoEXP, Inventory }) {
        const itemKeyArgs = args[0]?.toLowerCase() === "use" ? args.slice(1) : args;
        if (itemKeyArgs.length < 1) {
          return await chat.reply(
            "Please provide an item key. Usage: inventory use <item_key>"
          );
        }
        const itemKey = itemKeyArgs.join(" ").trim().toLowerCase();
        if (!itemKey) {
          return await chat.reply(
            "Invalid item key. Usage: inventory use <item_key>"
          );
        }
        const cleanID = event.senderID;
        const userData = await hoshinoDB.get(cleanID);
        if (!userData || !userData.username) {
          return await chat.reply(
            "You need to register first! Use: profile register <username>"
          );
        }
        const { expData = { exp: 0, mana: 100, health: 100 }, inventoryData = [] } = userData;
        const exp = new HoshinoEXP(expData);
        const inventory = new Inventory(inventoryData);
        if (!inventory.has(itemKey)) {
          return await chat.reply(
            `You don't have an item with key "${itemKey}" in your inventory!`
          );
        }
        try {
          const item = inventory.getOne(itemKey) || {
            name: "Unknown Item",
            type: "generic",
            heal: 0,
            mana: 0,
          };
          const result = inventory.useItem(itemKey, exp);
          let message = "";
          if (item.type === "chest" && result !== true) {
            const contentNames = result.contents.map((c) => c.name).join(", ");
            message = `You opened "${item.name}" and found: ${contentNames}!`;
          } else {
            const healthRestored = item.heal > 0 ? `${item.heal} health` : "";
            const manaRestored = item.mana > 0 ? `${item.mana} mana` : "";
            const restored = [healthRestored, manaRestored].filter(Boolean).join(" and ");
            message = restored
              ? `You used "${item.name}" and restored ${restored}!`
              : `You used "${item.name}", but it had no effect.`;
          }
          await hoshinoDB.set(cleanID, {
            ...userData,
            expData: exp.raw(),
            inventoryData: inventory.raw(),
          });
          await chat.reply(
            `${message}\nCurrent Health: ${exp.getHealth()}/${exp.getMaxHealth()}\nCurrent Mana: ${exp.getMana()}/${exp.getMaxMana()}`
          );
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          return await chat.reply(`Failed to use item: ${errorMessage}`);
        }
      },
    },
    {
      subcommand: "toss",
      aliases: ["discard", "remove"],
      description: "Remove items from your inventory.",
      usage: "inventory toss <item_key> [amount]",
      async deploy({ chat, args, event, hoshinoDB, Inventory }) {
        if (args.length < 1) {
          return await chat.reply(
            "Please provide an item key. Usage: inventory toss <item_key> [amount]"
          );
        }
        const itemKey = args[0].trim();
        const amount = args[1] ? parseInt(args[1]) : 1;
        if (!itemKey) {
          return await chat.reply(
            "Invalid item key. Usage: inventory toss <item_key> [amount]"
          );
        }
        if (isNaN(amount) || amount < 1) {
          return await chat.reply("Amount must be a positive number.");
        }
        const cleanID = event.senderID;
        const userData = await hoshinoDB.get(cleanID);
        if (!userData || !userData.username) {
          return await chat.reply(
            "You need to register first! Use: profile register <username>"
          );
        }
        const { inventoryData = [] } = userData;
        const inventory = new Inventory(inventoryData);
        if (!inventory.has(itemKey)) {
          return await chat.reply(
            `You don't have an item with key "${itemKey}" in your inventory!`
          );
        }
        const item = inventory.getOne(itemKey);
        if (!item) {
          return await chat.reply(`Item with key "${itemKey}" not found.`);
        }
        if (item.cannotToss) {
          return await chat.reply(`You cannot toss "${item.name}"!`);
        }
        const availableAmount = inventory.getAmount(itemKey);
        if (amount > availableAmount) {
          return await chat.reply(
            `You only have ${availableAmount} "${item.name}"(s) to toss!`
          );
        }
        inventory.toss(itemKey, amount);
        await hoshinoDB.set(cleanID, {
          ...userData,
          inventoryData: inventory.raw(),
        });
        await chat.reply(
          `Successfully tossed ${amount} "${item.name}"(s) from your inventory.`
        );
      },
    },
  ], "◆");
  return home.runInContext(ctx);
}

export default {
  manifest,
  style,
  deploy,
  font,
} as HoshinoLia.Command;
