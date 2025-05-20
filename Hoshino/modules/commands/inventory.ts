function formatItem(item: any, bold = false): string {
  const prefix = bold ? '**' : '';
  const suffix = bold ? '**' : '';
  let details = `${prefix}${item.name} (${item.key}, ${item.type})${suffix}`;
  if (item.type === 'food' || item.type === 'potion') {
    details += ` [heal: ${item.heal}, mana: ${item.mana}]`;
  } else if (item.type === 'weapon' || item.type === 'armor') {
    details += ` [atk: ${item.atk}, def: ${item.def}]`;
  } else if (item.type === 'utility') {
    details += ` [utility: ${item.utilityEffect}]`;
  } else if (item.type === 'chest') {
    details += ` [contents: ${item.contents.map((c: any) => c.key).join(', ')}]`;
  }
  return details;
}

const INVENTORY_LIMIT = 10;

const manifest: HoshinoLia.CommandManifest = {
  name: 'inventory',
  aliases: ['inv', 'items'],
  description: 'Manage your inventory: use, equip, unequip, toss, or list items.',
  version: '1.0.0',
  category: 'Inventory',
  cooldown: 3,
  developer: 'Francis Loyd Raval',
  usage: 'inventory [ list | use | equip | unequip | toss | status ]',
  config: {
    admin: false,
    moderator: false,
  },
};

const style: HoshinoLia.Command['style'] = {
  title: '〘 🎒 〙 Inventory Management',
  footer: 'Made with 🤍 by **Francis Loyd Raval**',
  type: 'lines1',
};

const font: HoshinoLia.Command['font'] = {
  title: 'bold',
  content: 'sans',
  footer: 'sans',
};

export async function deploy(ctx: any) {
  const home = new ctx.HoshinoHM([
    {
      subcommand: 'list',
      description: 'List all items in your inventory.',
      usage: 'inventory list',
      icon: '📜',
      aliases: ['show', 'items'],
      async deploy({ chat, args, event, hoshinoDB, Inventory }: { chat: any; args: string[]; event: any; hoshinoDB: any; Inventory: any }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply('📋 | You need to register first! Use: profile register <username>');
        }
        const inventory = new Inventory(userData.inventory || [], INVENTORY_LIMIT);
        const items = inventory.getAll();
        if (items.length === 0) {
          return chat.reply('📜 | Your inventory is empty.');
        }
        const texts = ['📜 | **Your Inventory**'];
        items.forEach((item: any, i: number) => {
          texts.push(`${i + 1}. ${formatItem(item)}`);
        });
        texts.push(`🎒 | Total Items: ${items.length}/${INVENTORY_LIMIT}`);
        return chat.reply(texts.join('\n'));
      },
    },
    {
      subcommand: 'use',
      description: 'Use an item (e.g., "inventory use health_potion").',
      usage: 'inventory use <key>',
      icon: '🧪',
      aliases: ['consume'],
      async deploy({ chat, args, event, hoshinoDB, Inventory }: { chat: any; args: string[]; event: any; hoshinoDB: any; Inventory: any }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply('📋 | You need to register first! Use: profile register <username>');
        }
        if (!args[1]) {
          return chat.reply('📋 | Usage: inventory use <key>');
        }
        const inventory = new Inventory(userData.inventory || [], INVENTORY_LIMIT);
        const result = inventory.useItem(args[1], userData);
        await hoshinoDB.set(event.senderID, {
          ...userData,
          inventory: inventory.getAll(),
          health: userData.health || 100,
          mana: userData.mana || 50,
        });
        return chat.reply(
          result.opened
            ? `🧪 | Opened chest ${args[1]}, added: ${result.contents.map((c: any) => c.name).join(', ')}`
            : `🧪 | Used ${args[1]}. Health: ${userData.health}, Mana: ${userData.mana}`
        );
      },
    },
    {
      subcommand: 'equip',
      description: 'Equip an item (e.g., "inventory equip sword").',
      usage: 'inventory equip <key>',
      icon: '⚔️',
      aliases: ['wear'],
      async deploy({ chat, args, event, hoshinoDB, Inventory }: { chat: any; args: string[]; event: any; hoshinoDB: any; Inventory: any }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply('📋 | You need to register first! Use: profile register <username>');
        }
        if (!args[1]) {
          return chat.reply('📋 | Usage: inventory equip <key>');
        }
        const inventory = new Inventory(userData.inventory || [], INVENTORY_LIMIT);
        inventory.equipItem(args[1], userData);
        await hoshinoDB.set(event.senderID, {
          ...userData,
          inventory: inventory.getAll(),
          atk: userData.atk || 10,
          def: userData.def || 5,
          utility: userData.utility || 0,
        });
        return chat.reply(
          `⚔️ | Equipped ${args[1]}. Atk: ${userData.atk}, Def: ${userData.def}, Utility: ${userData.utility}`
        );
      },
    },
    {
      subcommand: 'unequip',
      description: 'Unequip an item (e.g., "inventory unequip sword weapon 10 0 Iron Sword").',
      usage: 'inventory unequip <key> <type> <value1> <value2> <name>',
      icon: '🛠️',
      aliases: ['remove'],
      async deploy({ chat, args, event, hoshinoDB, Inventory }: { chat: any; args: string[]; event: any; hoshinoDB: any; Inventory: any }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply('📋 | You need to register first! Use: profile register <username>');
        }
        if (args.length < 6) {
          return chat.reply('📋 | Usage: inventory unequip <key> <type> <value1> <value2> <name>');
        }
        const key = args[1];
        const type = args[2];
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
          return chat.reply('📋 | Can only unequip weapon, armor, or utility items.');
        }
        const inventory = new Inventory(userData.inventory || [], INVENTORY_LIMIT);
        inventory.unequipItem(item, userData);
        await hoshinoDB.set(event.senderID, {
          ...userData,
          inventory: inventory.getAll(),
          atk: userData.atk || 10,
          def: userData.def || 5,
          utility: userData.utility || 0,
        });
        return chat.reply(
          `🛠️ | Unequipped ${key}. Atk: ${userData.atk}, Def: ${userData.def}, Utility: ${userData.utility}`
        );
      },
    },
    {
      subcommand: 'toss',
      description: 'Toss items from your inventory (e.g., "inventory toss health_potion 2").',
      usage: 'inventory toss <key> [amount]',
      icon: '🗑️',
      aliases: ['discard', 'drop'],
      async deploy({ chat, args, event, hoshinoDB, Inventory }: { chat: any; args: string[]; event: any; hoshinoDB: any; Inventory: any }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply('📋 | You need to register first! Use: profile register <username>');
        }
        if (!args[1]) {
          return chat.reply('📋 | Usage: inventory toss <key> [amount]');
        }
        const inventory = new Inventory(userData.inventory || [], INVENTORY_LIMIT);
        inventory.toss(args[1], args[2] || '1');
        await hoshinoDB.set(event.senderID, {
          ...userData,
          inventory: inventory.getAll(),
        });
        return chat.reply(`🗑️ | Tossed ${args[2] || '1'} of ${args[1]}.`);
      },
    },
    {
      subcommand: 'status',
      description: 'Check your character stats.',
      usage: 'inventory status',
      icon: '📊',
      aliases: ['stats', 'info'],
      async deploy({ chat, args, event, hoshinoDB, Inventory }: { chat: any; args: string[]; event: any; hoshinoDB: any; Inventory: any }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply('📋 | You need to register first! Use: profile register <username>');
        }
        const inventory = new Inventory(userData.inventory || [], INVENTORY_LIMIT);
        const texts = [
          '📊 | **Character Stats**',
          `💖 | **Health**: ${userData.health || 100}`,
          `🪄 | **Mana**: ${userData.mana || 50}`,
          `⚔️ | **Attack**: ${userData.atk || 10}`,
          `🛡️ | **Defense**: ${userData.def || 5}`,
          `🔧 | **Utility**: ${userData.utility || 0}`,
          `🎒 | **Inventory Size**: ${inventory.size()}/${INVENTORY_LIMIT}`,
        ];
        return chat.reply(texts.join('\n'));
      },
    },
  ]);
  return home.runInContext(ctx);
}

export default {
  manifest,
  style,
  deploy,
  font,
} as HoshinoLia.Command;
