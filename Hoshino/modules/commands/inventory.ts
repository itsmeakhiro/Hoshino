const manifest: HoshinoLia.CommandManifest = {
  name: "inventory",
  aliases: ["inv", "items"],
  version: "1.0.0",
  developer: "Francis And Liane",
  description: "Manage your inventory: check items, use food/potions/chests, equip/unequip items, or toss items.",
  category: "Simulator",
  usage: "inventory list | inventory use <item_key> | inventory equip <item_key> | inventory unequip <type> <stats> [return] [item_data]",
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

export async function deploy(ctx: any) {
  const home = new ctx.HoshinoHM([
    {
      subcommand: "list",
      aliases: ["check", "view"],
      description: "View all items in your inventory.",
      usage: "inventory list",
      async deploy({ chat, event, hoshinoDB, Inventory }: { chat: any; event: any; hoshinoDB: any; Inventory: any }) {
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
          atk?: number;
          def?: number;
          stats?: { [key: string]: number };
        }>).map((item, index) => {
          const effects: string[] = [];
          if (typeof item.heal === 'number' && item.heal > 0) {
            effects.push(`+${item.heal} HP`);
          }
          if (typeof item.mana === 'number' && item.mana > 0) {
            effects.push(`+${item.mana} MP`);
          }
          if (typeof item.atk === 'number' && item.atk > 0) {
            effects.push(`+${item.atk} ATK`);
          }
          if (typeof item.def === 'number' && item.def > 0) {
            effects.push(`+${item.def} DEF`);
          }
          if (item.stats && typeof item.stats === 'object') {
            Object.entries(item.stats).forEach(([stat, value]) => {
              if (value > 0) {
                effects.push(`+${value} ${stat.toUpperCase()}`);
              }
            });
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
      async deploy({ chat, args, event, hoshinoDB, HoshinoEXP, Inventory }: { chat: any; args: string[]; event: any; hoshinoDB: any; HoshinoEXP: any; Inventory: any }) {
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
            const contentNames = result.contents.map((c: any) => c.name).join(", ");
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
      subcommand: "equip",
      aliases: ["wear", "use-equip"],
      description: "Equip a weapon, armor, or utility item.",
      usage: "inventory equip <item_key>",
      async deploy({ chat, args, event, hoshinoDB, HoshinoEXP, Inventory }: { chat: any; args: string[]; event: any; hoshinoDB: any; HoshinoEXP: any; Inventory: any }) {
        if (args.length < 1) {
          return await chat.reply(
            "Please provide an item key. Usage: inventory equip <item_key>"
          );
        }
        const itemKey = args.join(" ").trim().toLowerCase();
        if (!itemKey) {
          return await chat.reply(
            "Invalid item key. Usage: inventory equip <item_key>"
          );
        }
        const cleanID = event.senderID;
        const userData = await hoshinoDB.get(cleanID);
        if (!userData || !userData.username) {
          return await chat.reply(
            "You need to register first! Use: profile register <username>"
          );
        }
        const { expData = { exp: 0, mana: 100, health: 100, atk: 0, def: 0 }, inventoryData = [] } = userData;
        const exp = new HoshinoEXP(expData);
        const inventory = new Inventory(inventoryData);
        if (!inventory.has(itemKey)) {
          return await chat.reply(
            `You don't have an item with key "${itemKey}" in your inventory!`
          );
        }
        try {
          const item = inventory.getOne(itemKey);
          if (!item) {
            return await chat.reply(`Item with key "${itemKey}" not found.`);
          }
          let result;
          let message = "";
          if (item.type === "weapon" || item.type === "armor") {
            result = inventory.equipItem(itemKey, exp);
            const stats = [];
            if (result.atk > 0) stats.push(`+${result.atk} ATK`);
            if (result.def > 0) stats.push(`+${result.def} DEF`);
            message = `Equipped "${result.item}"${stats.length ? ` (${stats.join(", ")})` : ""}!`;
          } else if (item.type === "utility") {
            result = inventory.equipUtility(itemKey, exp);
            const stats = Object.entries(result.stats)
              .map(([stat, value]) => `+${value} ${stat.toUpperCase()}`)
              .join(", ");
            message = `Equipped "${result.item}"${stats ? ` (${stats})` : ""}!`;
          } else {
            return await chat.reply(
              `Item "${item.name}" cannot be equipped. Use "inventory use" for food, potions, or chests.`
            );
          }
          await hoshinoDB.set(cleanID, {
            ...userData,
            expData: exp.raw(),
            inventoryData: inventory.raw(),
          });
          const statDisplay = [
            `ATK: ${exp.getAtk ? exp.getAtk() : 0}`,
            `DEF: ${exp.getDef ? exp.getDef() : 0}`,
            ...Object.entries(exp.raw()).filter(([key]) => key !== "exp" && key !== "mana" && key !== "health" && key !== "atk" && key !== "def")
              .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
          ].join("\n");
          await chat.reply(`${message}\nCurrent Stats:\n${statDisplay}`);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          return await chat.reply(`Failed to equip item: ${errorMessage}`);
        }
      },
    },
    {
      subcommand: "unequip",
      aliases: ["remove-equip", "dequip"],
      description: "Unequip a weapon, armor, or utility item.",
      usage: "inventory unequip <type> <stats> [return] [item_data]",
      async deploy({ chat, args, event, hoshinoDB, HoshinoEXP, Inventory }: { chat: any; args: string[]; event: any; hoshinoDB: any; HoshinoEXP: any; Inventory: any }) {
        if (args.length < 2) {
          return await chat.reply(
            "Please provide item type and stats. Usage: inventory unequip <type> <stats> [return] [item_data]"
          );
        }
        const type = args[0].toLowerCase();
        let statsArg: any;
        const returnToInventory = args[2]?.toLowerCase() === "return";
        try {
          statsArg = JSON.parse(args[1]);
        } catch {
          return await chat.reply(
            "Invalid stats format. Provide stats as JSON, e.g., '{\"atk\": 5}' or '{\"stats\": {\"mining\": 5}}'."
          );
        }
        const cleanID = event.senderID;
        const userData = await hoshinoDB.get(cleanID);
        if (!userData || !userData.username) {
          return await chat.reply(
            "You need to register first! Use: profile register <username>"
          );
        }
        const { expData = { exp: 0, mana: 100, health: 100, atk: 0, def: 0 }, inventoryData = [] } = userData;
        const exp = new HoshinoEXP(expData);
        const inventory = new Inventory(inventoryData);
        let itemData: any = {};
        if (returnToInventory) {
          if (args.length < 4) {
            return await chat.reply(
              "Please provide item data for returning to inventory. Usage: inventory unequip <type> <stats> return <item_data>"
            );
          }
          try {
            itemData = JSON.parse(args[3]);
            if (!itemData.key || !itemData.name) {
              return await chat.reply(
                "Item data must include key and name, e.g., '{\"key\": \"sword\", \"name\": \"Iron Sword\"}'."
              );
            }
          } catch {
            return await chat.reply(
              "Invalid item data format. Provide item data as JSON, e.g., '{\"key\": \"sword\", \"name\": \"Iron Sword\"}'."
            );
          }
        }
        try {
          const result = inventory.unequipItem(type, statsArg, exp, returnToInventory, itemData);
          let message = "";
          if (type === "weapon" || type === "armor") {
            const stats = [];
            if (result.stats.atk > 0) stats.push(`-${result.stats.atk} ATK`);
            if (result.stats.def > 0) stats.push(`-${result.stats.def} DEF`);
            message = `Unequipped ${type}${stats.length ? ` (${stats.join(", ")})` : ""}${returnToInventory ? `, returned "${itemData.name}" to inventory` : ""}!`;
          } else if (type === "utility") {
            const stats = Object.entries(result.stats)
              .map(([stat, value]) => `-${value} ${stat.toUpperCase()}`)
              .join(", ");
            message = `Unequipped utility item${stats ? ` (${stats})` : ""}${returnToInventory ? `, returned "${itemData.name}" to inventory` : ""}!`;
          }
          await hoshinoDB.set(cleanID, {
            ...userData,
            expData: exp.raw(),
            inventoryData: inventory.raw(),
          });
          const statDisplay = [
            `ATK: ${exp.getAtk ? exp.getAtk() : 0}`,
            `DEF: ${exp.getDef ? exp.getDef() : 0}`,
            ...Object.entries(exp.raw()).filter(([key]) => key !== "exp" && key !== "mana" && key !== "health" && key !== "atk" && key !== "def")
              .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
          ].join("\n");
          await chat.reply(`${message}\nCurrent Stats:\n${statDisplay}`);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          return await chat.reply(`Failed to unequip item: ${errorMessage}`);
        }
      },
    },
    {
      subcommand: "toss",
      aliases: ["discard", "remove"],
      description: "Remove items from your inventory.",
      usage: "inventory toss <item_key> [amount]",
      async deploy({ chat, args, event, hoshinoDB, Inventory }: { chat: any; args: string[]; event: any; hoshinoDB: any; Inventory: any }) {
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
