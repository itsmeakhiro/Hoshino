type UseItemResult = true | { opened: boolean; contents: Array<{ name: string; [key: string]: any }> };

const command: HoshinoLia.Command = {
  manifest: {
    name: 'inventory',
    aliases: ['inv', 'items'],
    version: '1.0.0',
    developer: 'Francis Loyd Raval',
    description: 'Manage your inventory: check items, use items, equip/unequip gear, or toss items.',
    category: 'Inventory',
    usage: 'inventory list | inventory use <item_key> | inventory equip <item_key> | inventory unequip <item_key> <type> <value1> <value2> <name> | inventory toss <item_key> [amount] | inventory status',
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: 'lines1',
    title: '〘 🎒 〙 INVENTORY',
    footer: 'Made with 🤍 by **Francis Loyd Raval**',
  },
  font: {
    title: 'bold',
    content: 'sans',
    footer: 'sans',
  },
  async deploy(ctx) {
    const home = new ctx.HoshinoHM(
      [
        {
          subcommand: 'list',
          aliases: ['view', 'check'],
          description: 'View all items in your inventory.',
          usage: 'inventory list',
          async deploy({ chat, args, event, hoshinoDB, Inventory }) {
            const cleanID = ctx.utils.cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(cleanID);
            if (!userData || !userData.username) {
              return await chat.reply('You need to register first! Use: profile register <username>');
            }
            const { inventoryData = [] } = userData;
            const inventory = new Inventory(inventoryData, 10);
            if (inventory.size() === 0) {
              return await chat.reply('Your inventory is empty!');
            }
            const items = inventory.getAll().map((item: any, index: number) => {
              const effects: string[] = [];
              if (item.heal > 0) effects.push(`+${item.heal} HP`);
              if (item.mana > 0) effects.push(`+${item.mana} MP`);
              if (item.atk > 0) effects.push(`+${item.atk} ATK`);
              if (item.def > 0) effects.push(`+${item.def} DEF`);
              if (item.utilityEffect > 0) effects.push(`+${item.utilityEffect} UTIL`);
              const effectText = effects.length ? ` (${effects.join(', ')})` : '';
              const flavorText = item.flavorText ? `\n   ${item.flavorText}` : '';
              return `${index + 1}. ${item.icon || '📦'} ${item.name} [${item.key}]${effectText}${flavorText}`;
            });
            return await chat.reply(`**Your Inventory (${inventory.size()}/10)**\n${items.join('\n')}`);
          },
        },
        {
          subcommand: 'use',
          aliases: ['consume', 'activate'],
          description: 'Use a food, potion, or chest item.',
          usage: 'inventory use <item_key>',
          async deploy({ chat, args, event, hoshinoDB, Inventory }) {
            const cleanID = ctx.utils.cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(cleanID);
            if (!userData || !userData.username) {
              return await chat.reply('You need to register first! Use: profile register <username>');
            }
            if (!args[1]) {
              return await chat.reply('Please provide an item key. Usage: inventory use <item_key>');
            }
            const itemKey = args[1].toLowerCase();
            const { statsData = { health: 100, mana: 50, atk: 10, def: 5, utility: 0 }, inventoryData = [] } = userData;
            const inventory = new Inventory(inventoryData, 10);
            if (!inventory.has(itemKey)) {
              return await chat.reply(`You don't have an item with key "${itemKey}" in your inventory!`);
            }
            const item = inventory.getOne(itemKey) || { name: 'Unknown Item', type: 'generic', heal: 0, mana: 0 };
            const result = inventory.useItem(itemKey, statsData);
            let message = '';
            if (item.type === 'chest' && result !== true) {
              message = `You opened "${item.name}" and found: ${result.contents.map((c: any) => c.name).join(', ')}!`;
            } else {
              const restored = [item.heal > 0 ? `${item.heal} health` : '', item.mana > 0 ? `${item.mana} mana` : ''].filter(Boolean).join(' and ');
              message = restored ? `You used "${item.name}" and restored ${restored}!` : `You used "${item.name}", but it had no effect.`;
            }
            await hoshinoDB.set(cleanID, {
              ...userData,
              statsData,
              inventoryData: inventory.getAll(),
            });
            return await chat.reply(`${message}\nHealth: ${statsData.health}/100\nMana: ${statsData.mana}/50`);
          },
        },
        {
          subcommand: 'equip',
          aliases: ['wear', 'arm'],
          description: 'Equip a weapon, armor, or utility item.',
          usage: 'inventory equip <item_key>',
          async deploy({ chat, args, event, hoshinoDB, Inventory }) {
            const cleanID = ctx.utils.cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(cleanID);
            if (!userData || !userData.username) {
              return await chat.reply('You need to register first! Use: profile register <username>');
            }
            if (!args[1]) {
              return await chat.reply('Please provide an item key. Usage: inventory equip <item_key>');
            }
            const itemKey = args[1].toLowerCase();
            const { statsData = { health: 100, mana: 50, atk: 10, def: 5, utility: 0 }, inventoryData = [] } = userData;
            const inventory = new Inventory(inventoryData, 10);
            if (!inventory.has(itemKey)) {
              return await chat.reply(`You don't have an item with key "${itemKey}" in your inventory!`);
            }
            inventory.equipItem(itemKey, statsData);
            await hoshinoDB.set(cleanID, {
              ...userData,
              statsData,
              inventoryData: inventory.getAll(),
            });
            return await chat.reply(`Equipped "${itemKey}". ATK: ${statsData.atk}, DEF: ${statsData.def}, UTIL: ${statsData.utility}`);
          },
        },
        {
          subcommand: 'unequip',
          aliases: ['remove', 'disarm'],
          description: 'Unequip a weapon, armor, or utility item.',
          usage: 'inventory unequip <item_key> <type> <value1> <value2> <name>',
          async deploy({ chat, args, event, hoshinoDB, Inventory }) {
            const cleanID = ctx.utils.cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(cleanID);
            if (!userData || !userData.username) {
              return await chat.reply('You need to register first! Use: profile register <username>');
            }
            if (args.length < 6) {
              return await chat.reply('Please provide all required arguments. Usage: inventory unequip <item_key> <type> <value1> <value2> <name>');
            }
            const key = args[1].toLowerCase();
            const type = args[2].toLowerCase();
            const value1 = args[3];
            const value2 = args[4];
            const name = args.slice(5).join(' ');
            const item = { key, type, name };
            if (type === 'weapon' || type === 'armor') {
              item.atk = parseFloat(value1) || 0;
              item.def = parseFloat(value2) || 0;
            } else if (type === 'utility') {
              item.utilityEffect = parseFloat(value1) || 0;
            } else {
              return await chat.reply('Can only unequip weapon, armor, or utility items.');
            }
            const { statsData = { health: 100, mana: 50, atk: 10, def: 5, utility: 0 }, inventoryData = [] } = userData;
            const inventory = new Inventory(inventoryData, 10);
            inventory.unequipItem(item, statsData);
            await hoshinoDB.set(cleanID, {
              ...userData,
              statsData,
              inventoryData: inventory.getAll(),
            });
            return await chat.reply(`Unequipped "${key}". ATK: ${statsData.atk}, DEF: ${statsData.def}, UTIL: ${statsData.utility}`);
          },
        },
        {
          subcommand: 'toss',
          aliases: ['discard', 'drop'],
          description: 'Remove items from your inventory.',
          usage: 'inventory toss <item_key> [amount]',
          async deploy({ chat, args, event, hoshinoDB, Inventory }) {
            const cleanID = ctx.utils.cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(cleanID);
            if (!userData || !userData.username) {
              return await chat.reply('You need to register first! Use: profile register <username>');
            }
            if (!args[1]) {
              return await chat.reply('Please provide an item key. Usage: inventory toss <item_key> [amount]');
            }
            const itemKey = args[1].toLowerCase();
            const amount = args[2] ? parseInt(args[2]) : 1;
            if (isNaN(amount) || amount < 1) {
              return await chat.reply('Amount must be a positive number.');
            }
            const { inventoryData = [] } = userData;
            const inventory = new Inventory(inventoryData, 10);
            if (!inventory.has(itemKey)) {
              return await chat.reply(`You don't have an item with key "${itemKey}" in your inventory!`);
            }
            const item = inventory.getOne(itemKey);
            if (item.cannotToss) {
              return await chat.reply(`You cannot toss "${item.name}"!`);
            }
            if (amount > inventory.getAmount(itemKey)) {
              return await chat.reply(`You only have ${inventory.getAmount(itemKey)} "${item.name}"(s) to toss!`);
            }
            inventory.toss(itemKey, amount);
            await hoshinoDB.set(cleanID, {
              ...userData,
              inventoryData: inventory.getAll(),
            });
            return await chat.reply(`Tossed ${amount} "${item.name}"(s) from your inventory.`);
          },
        },
        {
          subcommand: 'status',
          aliases: ['stats', 'info'],
          description: 'Check your character stats.',
          usage: 'inventory status',
          async deploy({ chat, args, event, hoshinoDB, Inventory }) {
            const cleanID = ctx.utils.cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(cleanID);
            if (!userData || !userData.username) {
              return await chat.reply('You need to register first! Use: profile register <username>');
            }
            const { statsData = { health: 100, mana: 50, atk: 10, def: 5, utility: 0 }, inventoryData = [] } = userData;
            const inventory = new Inventory(inventoryData, 10);
            const texts = [
              '**Character Stats**',
              `Health: ${statsData.health}/100`,
              `Mana: ${statsData.mana}/50`,
              `Attack: ${statsData.atk}`,
              `Defense: ${statsData.def}`,
              `Utility: ${statsData.utility}`,
              `Inventory: ${inventory.size()}/10`,
            ];
            return await chat.reply(texts.join('\n'));
          },
        },
      ],
      '◆'
    );
    await home.runInContext(ctx);
  },
};

export default command;
