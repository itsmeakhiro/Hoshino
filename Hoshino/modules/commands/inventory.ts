const manifest: HoshinoLia.CommandManifest = {
  name: "inventory",
  aliases: ["inv", "items"],
  version: "1.0.2",
  developer: "Francis And Liane",
  description:
    "Manage your inventory: check items, use food/potions/chests, equip/unequip items, toss items, or repair durable items.",
  category: "Simulator",
  usage:
    "inventory list | inventory use <item_key> | inventory equip <item_key> | inventory unequip <item_key> | inventory toss <item_key> [amount] | inventory repair <item_key> [amount]",
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
  const home = new ctx.HoshinoHM(
    [
      {
        subcommand: "craft",
        aliases: ["make", "forge"],
        description: "Craft a weapon, armor, or utility item using ingredients.",
        usage: "inventory craft <item_key>",
        async deploy({ chat, args, event, hoshinoDB, Inventory }) {
          if (args.length < 1) {
            return await chat.reply(
              "Please provide an item key. Usage: inventory craft <item_key>"
            );
          }
          const itemKey = args.join(" ").trim().toLowerCase();
          if (!itemKey) {
            return await chat.reply(
              "Invalid item key. Usage: inventory craft <item_key>"
            );
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
          const item = itemKey;
          if (!item) {
            return await chat.reply(
              `No recipe found for item with key "${itemKey}". Available recipes: ${Object.keys(recipes).join(", ")}`
            );
          }
          try {
            const result = inventory.craft(item);
            await hoshinoDB.set(cleanID, {
              ...userData,
              inventoryData: inventory.raw(),
            });
            await chat.reply(
              `Successfully crafted "${result.item}" using ${item.ingredients
                .map(ing => `${ing.quantity} ${inventory.getOne(ing.key)?.name || ing.key}`)
                .join(", ")}!`
            );
          } catch (error: unknown) {
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            return await chat.reply(`Failed to craft item: ${errorMessage}`);
          }
        },
      },
      {
        subcommand: "list",
        aliases: ["check", "view"],
        description: "View all items in your inventory.",
        usage: "inventory list",
        async deploy({
          chat,
          event,
          hoshinoDB,
          Inventory,
        }: {
          chat: any;
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
          const { inventoryData = [] } = userData;
          const inventory = new Inventory(inventoryData);
          if (inventory.size() === 0) {
            return await chat.reply("Your inventory is empty!");
          }
          const items = (
            inventory.getAll() as Array<{
              key: string;
              name: string;
              icon: string;
              heal?: number;
              mana?: number;
              flavorText?: string;
              atk?: number;
              def?: number;
              stats?: { [key: string]: number };
              durability?: number;
              [key: string]: any;
            }>
          ).map((item, index) => {
            const effects: string[] = [];
            if (typeof item.heal === "number" && item.heal > 0) {
              effects.push(`+${item.heal} HP`);
            }
            if (typeof item.mana === "number" && item.mana > 0) {
              effects.push(`+${item.mana} MP`);
            }
            if (typeof item.atk === "number" && item.atk > 0) {
              effects.push(`+${item.atk} ATK`);
            }
            if (typeof item.def === "number" && item.def > 0) {
              effects.push(`+${item.def} DEF`);
            }
            if (item.stats && typeof item.stats === "object") {
              Object.entries(item.stats).forEach(([stat, value]) => {
                if (value > 0) {
                  effects.push(`+${value} ${stat.toUpperCase()}`);
                }
              });
            }
            const effectText = effects.length ? ` (${effects.join(", ")})` : "";
            const flavorText = item.flavorText ? `\n   ${item.flavorText}` : "";
            const durabilityText =
              ["weapon", "armor", "utility"].includes(item.type) &&
              item.durability !== undefined
                ? ` [Durability: ${item.durability}/100]`
                : "";
            return `${index + 1}. ${item.icon} ${item.name} [${
              item.key
            }]${effectText}${durabilityText}${flavorText}`;
          });
          const inventoryList = `**Your Inventory (${inventory.size()}/${
            inventory.limit
          })**\n${items.join("\n")}`;
          await chat.reply(inventoryList);
        },
      },
      {
        subcommand: "use",
        aliases: ["heal", "consume"],
        description: "Use a food, potion, or chest item.",
        usage: "inventory use <item_key>",
        async deploy({
          chat,
          args,
          event,
          hoshinoDB,
          HoshinoEXP,
          Inventory,
        }: {
          chat: any;
          args: string[];
          event: any;
          hoshinoDB: any;
          HoshinoEXP: any;
          Inventory: any;
        }) {
          const itemKeyArgs =
            args[0]?.toLowerCase() === "use" ? args.slice(1) : args;
          const itemKey = itemKeyArgs.join(" ").trim().toLowerCase();
          if (!itemKey) {
            return await chat.reply(
              "Please provide an item key. Usage: inventory use <item_key>"
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
            expData = { exp: 0, mana: 100, health: 100 },
            inventoryData = [],
          } = userData;
          const exp = new HoshinoEXP(expData);
          const inventory = new Inventory(inventoryData);
          if (!inventory.has(itemKey)) {
            return await chat.reply(
              `You don't have an item with key "${itemKey}" in your inventory!`
            );
          }
          try {
            const item = inventory.getOne(itemKey);
            const result = inventory.useItem(itemKey, exp);
            let message = "";
            if (item.type === "chest" && result !== true) {
              const contentNames = result.contents
                .map((c: any) => c.name)
                .join(", ");
              message = `You opened "${item.name}" and found: ${contentNames}!`;
            } else {
              const healthRestored = item.heal > 0 ? `${item.heal} health` : "";
              const manaRestored = item.mana > 0 ? `${item.mana} mana` : "";
              const restored = [healthRestored, manaRestored]
                .filter(Boolean)
                .join(" and ");
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
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            return await chat.reply(`Failed to use item: ${errorMessage}`);
          }
        },
      },
      {
        subcommand: "equip",
        aliases: ["wear", "use-equip"],
        description: "Equip a weapon, armor, or utility item.",
        usage: "inventory equip <item_key>",
        async deploy({
          chat,
          args,
          event,
          hoshinoDB,
          HoshinoEXP,
          Inventory,
        }: {
          chat: any;
          args: string[];
          event: any;
          hoshinoDB: any;
          HoshinoEXP: any;
          Inventory: any;
        }) {
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
          const {
            expData = { exp: 0, mana: 100, health: 100, atk: 0, def: 0 },
            inventoryData = [],
          } = userData;
          const exp = new HoshinoEXP(expData);
          const inventory = new Inventory(inventoryData);
          if (!inventory.has(itemKey)) {
            return await chat.reply(
              `You don't have an item with key "${itemKey}" in your inventory!`
            );
          }
          try {
            const item = inventory.getOne(itemKey);
            let result;
            let message = "";
            if (item.type === "weapon" || item.type === "armor") {
              result = inventory.equipItem(itemKey, exp);
              const stats: string[] = [];
              if (result.atk > 0) stats.push(`+${result.atk} ATK`);
              if (result.def > 0) stats.push(`+${result.def} DEF`);
              message = `Equipped "${result.item}"${
                stats.length ? ` (${stats.join(", ")})` : ""
              }! Remaining durability: ${result.durability}/100`;
            } else if (item.type === "utility") {
              result = inventory.equipUtility(itemKey, exp);
              const stats = Object.entries(result.stats)
                .map(([stat, value]) => `+${value} ${stat.toUpperCase()}`)
                .join(", ");
              message = `Equipped "${result.item}"${
                stats ? ` (${stats})` : ""
              }! Remaining durability: ${result.durability}/100`;
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
              ...Object.entries(exp.raw())
                .filter(
                  ([key]) =>
                    key !== "exp" &&
                    key !== "mana" &&
                    key !== "health" &&
                    key !== "atk" &&
                    key !== "def"
                )
                .map(([key, value]) => `${key.toUpperCase()}: ${value}`),
            ].join("\n");
            await chat.reply(`${message}\nCurrent Stats:\n${statDisplay}`);
          } catch (error: unknown) {
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            return await chat.reply(`Failed to equip item: ${errorMessage}`);
          }
        },
      },
      {
        subcommand: "unequip",
        aliases: ["remove-equip", "dequip"],
        description: "Unequip an item and return it to your inventory.",
        usage: "inventory unequip <item_key>",
        async deploy({
          chat,
          args,
          event,
          hoshinoDB,
          HoshinoEXP,
          Inventory,
        }: {
          chat: any;
          args: string[];
          event: any;
          hoshinoDB: any;
          HoshinoEXP: any;
          Inventory: any;
        }) {
          if (args.length < 1) {
            return await chat.reply(
              "Please provide an item key. Usage: inventory unequip <item_key>"
            );
          }
          const itemKey = args.join(" ").trim().toLowerCase();
          if (!itemKey) {
            return await chat.reply(
              "Invalid item key. Usage: inventory unequip <item_key>"
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
            expData = { exp: 0, mana: 100, health: 100, atk: 0, def: 0 },
            inventoryData = [],
          } = userData;
          const exp = new HoshinoEXP(expData);
          const inventory = new Inventory(inventoryData);
          if (!inventory.has(itemKey)) {
            return await chat.reply(
              `You don't have an item with key "${itemKey}" in your inventory!`
            );
          }
          try {
            const item = inventory.getOne(itemKey);
            if (!["weapon", "armor", "utility"].includes(item.type)) {
              return await chat.reply(
                `Item "${item.name}" cannot be unequipped. Only weapons, armor, or utility items can be unequipped.`
              );
            }
            const stats =
              item.type === "utility"
                ? { stats: item.stats || {} }
                : { atk: item.atk || 0, def: item.def || 0 };
            const itemData = {
              key: item.key,
              name: item.name,
              type: item.type,
              icon: item.icon,
              flavorText: item.flavorText,
              sellPrice: item.sellPrice,
              cannotToss: item.cannotToss,
              durability: item.durability,
              ...(item.type === "utility"
                ? { stats: item.distats }
                : { atk: item.atk, def: item.def }),
            };
            const result = inventory.unequipItem(
              item.type,
              stats,
              exp,
              true,
              itemData
            );
            let message = "";
            if (item.type === "weapon" || item.type === "armor") {
              const statsDisplay: string[] = [];
              if (result.stats.atk > 0)
                statsDisplay.push(`-${result.stats.atk} ATK`);
              if (result.stats.def > 0)
                statsDisplay.push(`-${result.stats.def} DEF`);
              message = `Unequipped "${item.name}"${
                statsDisplay.length ? ` (${statsDisplay.join(", ")})` : ""
              }, returned to inventory with ${
                itemData.durability
              }/100 durability!`;
            } else if (item.type === "utility") {
              const statsDisplay = Object.entries(result.stats)
                .map(([stat, value]) => `-${value} ${stat.toUpperCase()}`)
                .join(", ");
              message = `Unequipped "${item.name}"${
                statsDisplay ? ` (${statsDisplay})` : ""
              }, returned to inventory with ${
                itemData.durability
              }/100 durability!`;
            }
            await hoshinoDB.set(cleanID, {
              ...userData,
              expData: exp.raw(),
              inventoryData: inventory.raw(),
            });
            const statDisplay = [
              `ATK: ${exp.getAtk ? exp.getAtk() : 0}`,
              `DEF: ${exp.getDef ? exp.getDef() : 0}`,
              ...Object.entries(exp.raw())
                .filter(
                  ([key]) =>
                    key !== "exp" &&
                    key !== "mana" &&
                    key !== "health" &&
                    key !== "atk" &&
                    key !== "def"
                )
                .map(([key, value]) => `${key.toUpperCase()}: ${value}`),
            ].join("\n");
            await chat.reply(`${message}\nCurrent Stats:\n${statDisplay}`);
          } catch (error: unknown) {
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            return await chat.reply(`Failed to unequip item: ${errorMessage}`);
          }
        },
      },
      {
        subcommand: "toss",
        aliases: ["discard", "remove"],
        description: "Remove items from your inventory.",
        usage: "inventory toss <item_key> [amount]",
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
          if (args.length < 1) {
            return await chat.reply(
              "Please provide an item key. Usage: inventory toss <item_key> [amount]"
            );
          }
          const itemKey = args[0].trim();
          const amount = args[1] === "all" ? "all" : parseInt(args[1]) || 1;
          if (!itemKey) {
            return await chat.reply(
              "Invalid item key. Usage: inventory toss <item_key> [amount]"
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
          const { inventoryData = [] } = userData;
          const inventory = new Inventory(inventoryData);
          if (!inventory.has(itemKey)) {
            return await chat.reply(
              `You don't have an item with key "${itemKey}" in your inventory!`
            );
          }
          const item = inventory.getOne(itemKey);
          if (item.cannotToss && item.durability > 0) {
            return await chat.reply(
              `You cannot toss "${item.name}" unless it is broken!`
            );
          }
          const availableAmount = inventory.getAmount(itemKey);
          if (amount !== "all" && amount > availableAmount) {
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
            `Successfully tossed ${
              amount === "all" ? availableAmount : amount
            } "${item.name}"(s) from your inventory.`
          );
        },
      },
      {
        subcommand: "repair",
        aliases: ["fix", "restore"],
        description: "Repair a weapon, armor, or utility item’s durability.",
        usage: "inventory repair <item_key> [amount]",
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
          if (args.length < 1) {
            return await chat.reply(
              "Please provide an item key. Usage: inventory repair <item_key> [amount]"
            );
          }
          const itemKey = args[0].trim();
          const amount = parseInt(args[1]) || 100;
          if (!itemKey) {
            return await chat.reply(
              "Invalid item key. Usage: inventory repair <item_key> [amount]"
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
          try {
            const result = inventory.repairItem(itemKey, amount);
            await hoshinoDB.set(cleanID, {
              ...userData,
              inventoryData: inventory.raw(),
            });
            await chat.reply(
              `Successfully repaired "${result.item}" to ${result.durability}/100 durability!`
            );
          } catch (error: unknown) {
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            return await chat.reply(`Failed to repair item: ${errorMessage}`);
          }
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
