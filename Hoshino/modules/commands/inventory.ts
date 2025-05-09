const { cleanUserID } = global.Hoshino.utils;

// DO NOT REMOVE HoshinoLia.Command
const command: HoshinoLia.Command = {
  manifest: {
    name: "inventory",
    aliases: ["inv", "items"],
    version: "1.0",
    developer: "Francis And Liane",
    description: "Manage your inventory: check items, use food/potions, or toss items.",
    category: "RPG",
    usage: "inventory list | inventory use <item_key> | inventory toss <item_key> [amount]",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "〘 🎒 〙 INVENTORY",
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
          subcommand: "list",
          aliases: ["check", "view"],
          description: "View all items in your inventory.",
          usage: "inventory list",
          async deploy({ chat, event, hoshinoDB, Inventory }) {
            const cleanID = cleanUserID(event.senderID);
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

            // Type assertion to specify the shape of items
            const items = (inventory.getAll() as Array<{
              key: string;
              name: string;
              icon: string;
              heal?: number;
              mana?: number;
            }>).map((item, index) => {
              const effects: string[] = [];
              if (typeof item.heal === 'number' && item.heal > 0) {
                effects.push(`+${item.heal} HP`);
              }
              if (typeof item.mana === 'number' && item.mana > 0) {
                effects.push(`+${item.mana} MP`);
              }
              const effectText = effects.length ? ` (${effects.join(", ")})` : "";
              return `${index + 1}. ${item.icon} ${item.name} [${item.key}]${effectText}`;
            });
            const inventoryList = `**Your Inventory (${inventory.size()}/${inventory.limit})**\n${items.join("\n")}`;
            await chat.reply(inventoryList);
          },
        },
        {
          subcommand: "use",
          aliases: ["heal", "consume"],
          description: "Use a food or potion item to restore health or mana.",
          usage: "inventory use <item_key>",
          async deploy({ chat, args, event, hoshinoDB, HoshinoEXP, Inventory }) {
            if (args.length < 1) {
              return await chat.reply(
                "Please provide an item key. Usage: inventory use <item_key>"
              );
            }
            const itemKey = args.join(" ").trim();
            if (!itemKey) {
              return await chat.reply(
                "Invalid item key. Usage: inventory use <item_key>"
              );
            }

            const cleanID = cleanUserID(event.senderID);
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
              inventory.useHealingItem(itemKey, exp);
              const item = inventory.getOne(itemKey) || {
                name: "Unknown Item",
                heal: 0,
                mana: 0,
              };
              const healthRestored = item.heal > 0 ? `${item.heal} health` : "";
              const manaRestored = item.mana > 0 ? `${item.mana} mana` : "";
              const restored = [healthRestored, manaRestored].filter(Boolean).join(" and ");
              const message = restored
                ? `You used "${item.name}" and restored ${restored}!`
                : `You used "${item.name}", but it had no effect.`;

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

            const cleanID = cleanUserID(event.senderID);
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
      ],
      "◆"
    );
    await home.runInContext(ctx);
  },
};

export default command;
