/**
 * @type {HoshinoLia.Command}
 */
const command = {
    manifest: {
      name: "inventory",
      aliases: ["inv", "items"],
      version: "1.0.0"
      developer: "Liane Cagara",,
      description: "Manage your inventory",
      category: "simulator",
      cooldown: 3
      usage: "!inventory <subcommand> [args]",
      config: {
        admin: false,
        moderator: false,
        privateOnly: false,
      },
    },
    async deploy(ctx) {
      const { fonts } = ctx;
      const ITEMS_PER_PAGE = 10;
      const INVENTORY_LIMIT = 100;
  
      const subcommands = [
        {
          subcommand: "view",
          description: "View your inventory (e.g., !inventory view [page])",
          deploy: async function (/** @type {TokitoLia.CommandContext} */ ctx) {
            const { chat, event, args, styler, tokitoDB, Inventory } = ctx;
            const userData = await tokitoDB.get(event.senderID);
            const inventory = new Inventory(
              userData.inventory || [],
              INVENTORY_LIMIT
            );
  
            if (!inventory.size()) {
              return chat.send("Your inventory is empty!");
            }
  
            const totalItems = inventory.size();
            const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
            let page = parseInt(args[1], 10) || 1;
            if (isNaN(page) || page < 1) page = 1;
            if (page > totalPages) page = totalPages;
  
            const startIndex = (page - 1) * ITEMS_PER_PAGE;
            const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
            const items = inventory.getAll().slice(startIndex, endIndex);
  
            const itemList = items
              .map(function (item, i) {
                return `${
                  startIndex + i + 1
                }. ${item.icon} ${fonts.bold(item.name)} (${item.key}) - ${item.flavorText}`;
              })
              .join("\n");
  
            const message = styler(
              "Hdesign",
              `Your Inventory (Page ${page}/${totalPages})`,
              itemList,
              `Total items: ${totalItems} / ${inventory.limit} | Use "!inventory view [page]" to navigate`
            );
            return chat.send(message);
          },
        },
        {
          subcommand: "toss",
          description: "Toss an item (e.g., !inventory toss health-potion 1)",
          deploy: async function (/** @type {TokitoLia.CommandContext} */ ctx) {
            const { chat, event, args, tokitoDB, Inventory } = ctx;
            const itemKey = args[1];
            const amount = args[2] === "all" ? "all" : parseInt(args[2], 10) || 1;
            if (!itemKey) {
              return chat.send(
                "Please specify an item key (e.g., health-potion)."
              );
            }
            const userData = await tokitoDB.get(event.senderID);
            const inventory = new Inventory(
              userData.inventory || [],
              INVENTORY_LIMIT
            );
            if (!inventory.has(itemKey)) {
              return chat.send("You don’t have that item!");
            }
            const item = inventory.getOne(itemKey);
            if (item.cannotToss) {
              return chat.send(`${item.name} cannot be tossed!`);
            }
            inventory.toss(itemKey, amount);
            await tokitoDB.set(event.senderID, { inventory: inventory.raw() });
            return chat.send(
              `Tossed ${amount === "all" ? "all" : amount} ${item.name}(s)!`
            );
          },
        },
        {
          subcommand: "sell",
          description: "Sell an item (e.g., !inventory sell iron-sword 1)",
          deploy: async function (/** @type {TokitoLia.CommandContext} */ ctx) {
            const { chat, event, args, tokitoDB, Inventory, BalanceHandler } =
              ctx;
            const itemKey = args[1];
            const amount = parseInt(args[2], 10) || 1;
            if (!itemKey) {
              return chat.send("Please specify an item key (e.g., iron-sword).");
            }
            const userData = await tokitoDB.get(event.senderID);
            const inventory = new Inventory(
              userData.inventory || [],
              INVENTORY_LIMIT
            );
            if (!inventory.hasAmount(itemKey, amount)) {
              return chat.send(`You don’t have enough ${itemKey} to sell!`);
            }
            const item = inventory.getOne(itemKey);
            const sellPrice = Number(item.sellPrice);
            if (isNaN(sellPrice) || sellPrice <= 0) {
              return chat.send(
                `${item.name} cannot be sold (invalid or zero sell price)!`
              );
            }
            const sellValue = sellPrice * amount;
            inventory.toss(itemKey, amount);
            const balanceHandler = new BalanceHandler(userData);
            balanceHandler.addBalance(sellValue);
            await tokitoDB.set(event.senderID, {
              inventory: inventory.raw(),
              balance: balanceHandler.getBalance(),
            });
            return chat.send(
              `Sold ${amount} ${
                item.name
              }(s) for ${sellValue.toLocaleString()} credits!`
            );
          },
        },
      ];
  
      const inventoryHandler = new ctx.TokitoHM(subcommands, "🎒");
  
      return inventoryHandler.runInContext(ctx);
    },
  };
  
  module.exports = command;