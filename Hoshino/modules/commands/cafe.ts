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
  name: "cafe",
  aliases: ["cf", "coffee"],
  description: "Manage your café shop, buy a shop, start operations, check status, and collect earnings.",
  version: "1.0.0",
  category: "Simulator",
  cooldown: 5,
  developer: "Francis Loyd Raval",
  usage: "cafe [ buy | start | status | collect | upgrade ]",
  config: {
    admin: false,
    moderator: false,
  },
};

const style: HoshinoLia.Command["style"] = {
  title: `〘 ☕ 〙 CAFÉ`,
  footer: "Made with 🤍 by **Francis Loyd Raval**",
  type: "lines1",
};

const font: HoshinoLia.Command["font"] = {
  title: "bold",
  content: "sans",
  footer: "sans",
};

export async function deploy(ctx) {
  const home = new ctx.HoshinoHM([
    {
      subcommand: "buy",
      description: "Buy a café shop to start earning money.",
      usage: "cafe buy",
      icon: "🏬",
      aliases: ["purchase", "open"],
      async deploy({ chat, event, hoshinoDB }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply("📋 | You need to register first! Use: profile register <username>");
        }
        if (userData.cafe) {
          return chat.reply("📋 | You already own a café shop!");
        }
        const shopCost = 10000;
        if (userData.balance < shopCost) {
          return chat.reply(`📋 | You need ${formatCash(shopCost, true)} to buy a café shop!`);
        }
        await hoshinoDB.set(event.senderID, {
          ...userData,
          balance: userData.balance - shopCost,
          cafe: {
            level: 1,
            isOperating: false,
            startTime: 0,
            earnings: 0,
            upgradeCost: 10000,
          },
        });
        return chat.reply(`☕ | Successfully bought a café shop for ${formatCash(shopCost, true)}! Use 'cafe start' to begin earning.`);
      },
    },
    {
      subcommand: "start",
      description: "Start café operations to earn money over time.",
      usage: "cafe start",
      icon: "▶️",
      aliases: ["run", "open"],
      async deploy({ chat, event, hoshinoDB }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply("📋 | You need to register first! Use: profile register <username>");
        }
        if (!userData.cafe) {
          return chat.reply("📋 | You need to buy a café shop first! Use: cafe buy");
        }
        if (userData.cafe.isOperating) {
          return chat.reply("📋 | Your café is already operating! Check progress with 'cafe status'.");
        }
        await hoshinoDB.set(event.senderID, {
          ...userData,
          cafe: {
            ...userData.cafe,
            isOperating: true,
            startTime: Date.now(),
            earnings: 0,
          },
        });
        return chat.reply("☕ | Café operations started! Check progress with 'cafe status' and collect earnings with 'cafe collect'.");
      },
    },
    {
      subcommand: "status",
      description: "Check your café's level, operation status, and current earnings.",
      usage: "cafe status",
      icon: "ℹ️",
      aliases: ["check", "progress"],
      async deploy({ chat, event, hoshinoDB }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply("📋 | You need to register first! Use: profile register <username>");
        }
        if (!userData.cafe) {
          return chat.reply("📋 | You need to buy a café shop first! Use: cafe buy");
        }
        const { level = 1, isOperating = false, startTime = 0, earnings = 0, upgradeCost = 10000 } = userData.cafe;
        const baseEarningsPerMinute = 100;
        const earningsMultiplier = level;
        let currentEarnings = earnings;
        const coffeeTypes = [
          { name: "Matcha", price: 50, emoji: "🍵" },
          { name: "Latte", price: 60, emoji: "☕" },
          { name: "Espresso", price: 70, emoji: "⚡️" },
        ];
        let coffeeSalesLines: string[] = [];
        if (isOperating) {
          const minutesElapsed = (Date.now() - startTime) / 1000 / 60;
          currentEarnings = Math.floor(minutesElapsed * baseEarningsPerMinute * earningsMultiplier);
          coffeeSalesLines = coffeeTypes.map(coffee => {
            const customersServed = Math.floor(minutesElapsed * (Math.random() * 4 + 1) * level);
            const revenue = customersServed * coffee.price;
            return `- ${coffee.emoji} Served ${coffee.name}: ${customersServed} customers (${formatCash(revenue, true)})`;
          });
        } else {
          coffeeSalesLines = coffeeTypes.map(coffee => {
            return `- ${coffee.emoji} Served ${coffee.name}: 0 customers (${formatCash(0, true)})`;
          });
        }
        const texts = [
          `☕ | **Café Shop Status**`,
          `📊 | **Level**: ${level}`,
          `🏬 | **Operating**: ${isOperating ? "Yes" : "No"}`,
          `Served Customers:`,
          ...coffeeSalesLines,
          `🪙 | **Current Earnings**: ${formatCash(currentEarnings, true)}`,
          `💸 | **Next Upgrade Cost**: ${formatCash(upgradeCost, true)}`,
        ];
        return chat.reply(texts.join("\n"));
      },
    },
    {
      subcommand: "collect",
      description: "Collect earnings from your café shop.",
      usage: "cafe collect",
      icon: "💰",
      aliases: ["claim", "cashout"],
      async deploy({ chat, event, hoshinoDB }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply("📋 | You need to register first! Use: profile register <username>");
        }
        if (!userData.cafe) {
          return chat.reply("📋 | You need to buy a café shop first! Use: cafe buy");
        }
        if (!userData.cafe.isOperating) {
          return chat.reply("📋 | Your café is not operating! Start it with 'cafe start'.");
        }
        const { level = 1, startTime = 0, earnings = 0 } = userData.cafe;
        const baseEarningsPerMinute = 100;
        const earningsMultiplier = level;
        const minutesElapsed = (Date.now() - startTime) / 1000 / 60;
        const currentEarnings = Math.floor(minutesElapsed * baseEarningsPerMinute * earningsMultiplier);
        if (currentEarnings <= 0) {
          return chat.reply("📋 | No earnings to collect yet! Keep your café operating to earn more.");
        }
        await hoshinoDB.set(event.senderID, {
          ...userData,
          balance: (userData.balance || 0) + currentEarnings,
          cafe: {
            ...userData.cafe,
            isOperating: false,
            startTime: 0,
            earnings: 0,
          },
        });
        return chat.reply(`💰 | Collected ${formatCash(currentEarnings, true)} from your café shop! Operations have stopped. Use 'cafe start' to resume.`);
      },
    },
    {
      subcommand: "upgrade",
      description: "Upgrade your café shop to increase earnings.",
      usage: "cafe upgrade",
      icon: "⬆️",
      aliases: ["up", "improve"],
      async deploy({ chat, event, hoshinoDB }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply("📋 | You need to register first! Use: profile register <username>");
        }
        if (!userData.cafe) {
          return chat.reply("📋 | You need to buy a café shop first! Use: cafe buy");
        }
        const { level = 1, upgradeCost = 10000 } = userData.cafe;
        if (userData.balance < upgradeCost) {
          return chat.reply(`📋 | You need ${formatCash(upgradeCost, true)} to upgrade your café shop!`);
        }
        await hoshinoDB.set(event.senderID, {
          ...userData,
          balance: userData.balance - upgradeCost,
          cafe: {
            ...userData.cafe,
            level: level + 1,
            upgradeCost: upgradeCost * 2,
            earnings: userData.cafe.earnings || 0,
            isOperating: userData.cafe.isOperating || false,
            startTime: userData.cafe.startTime || 0,
          },
        });
        return chat.reply(`⬆️ | Café shop upgraded to level ${level + 1}! Earnings multiplier increased. Next upgrade cost: ${formatCash(upgradeCost * 2, true)}.`);
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
