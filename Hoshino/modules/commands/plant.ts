export function formatCash(
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
  name: "plant",
  aliases: ["garden", "farm"],
  description:
    "Manage your garden: buy land, start planting, check status, collect earnings, upgrade land, or pay property taxes.",
  version: "1.0.0",
  category: "Economy",
  cooldown: 5,
  developer: "Francis Loyd Raval",
  usage: "plant [ buy | start | status | collect | upgrade | paytax ]",
  config: {
    admin: false,
    moderator: false,
  },
};

const style: HoshinoLia.Command["style"] = {
  title: `〘 🌱 〙 Planting Simulation`,
  footer: "Made with 🤍 by **Francis Loyd Raval**",
  type: "lines1",
};

const font: HoshinoLia.Command["font"] = {
  title: "bold",
  content: "sans",
  footer: "sans",
};

const LAND_COST = 10000;
const UPGRADE_COST_BASE = 5000;
const EARNINGS_PER_MINUTE = 10;
const PROPERTY_TAX_PER_DAY = 1000;
const TAX_INTERVAL_MS = 24 * 60 * 60 * 1000;

async function handlePropertyTax(userData, hoshinoDB, event, chat, deduct = false) {
  const { garden } = userData;
  if (!garden) return { taxOverdue: false, taxAmount: 0 };

  const taxPerDay = PROPERTY_TAX_PER_DAY * garden.level;
  const timeSinceLastTax = Date.now() - garden.lastTaxPaid;
  const daysDue = Math.floor(timeSinceLastTax / TAX_INTERVAL_MS);
  let taxAmount = daysDue * taxPerDay;

  if (taxAmount <= 0) return { taxOverdue: garden.taxOverdue, taxAmount: 0 };

  if (deduct && userData.balance >= taxAmount) {
    await hoshinoDB.set(event.senderID, {
      ...userData,
      balance: userData.balance - taxAmount,
      garden: {
        ...garden,
        lastTaxPaid: Date.now(),
        taxOverdue: false,
      },
    });
    return {
      taxOverdue: false,
      taxAmount,
      message: `🧾 | Property tax of ${formatCash(taxAmount, true)} deducted for ${daysDue} day(s).`,
    };
  } else if (userData.balance < taxAmount) {
    if (!garden.taxOverdue) {
      await hoshinoDB.set(event.senderID, {
        ...userData,
        garden: { ...garden, taxOverdue: true },
      });
    }
    return {
      taxOverdue: true,
      taxAmount,
      message: `🧾 | Property tax of ${formatCash(taxAmount, true)} is overdue! Pay with 'plant paytax'.`,
    };
  }
  return { taxOverdue: garden.taxOverdue, taxAmount };
}

export async function deploy(ctx) {
  const home = new ctx.HoshinoHM([
    {
      subcommand: "buy",
      description: "Buy a garden plot to start planting.",
      usage: "plant buy",
      icon: "🛒",
      aliases: ["purchase"],
      async deploy({ chat, event, hoshinoDB }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply(
            "📋 | You need to register first! Use: profile register <username>"
          );
        }
        if (userData.garden) {
          return chat.reply("🌱 | You already own a garden!");
        }
        if (userData.balance < LAND_COST) {
          return chat.reply(
            `📋 | You need ${formatCash(LAND_COST, true)} to buy a garden!`
          );
        }
        await hoshinoDB.set(event.senderID, {
          ...userData,
          balance: userData.balance - LAND_COST,
          garden: {
            level: 1,
            isPlanting: false,
            lastPlanted: 0,
            accumulatedEarnings: 0,
            lastTaxPaid: Date.now(),
            taxOverdue: false,
          },
        });
        return chat.reply(
          `🌱 | You bought a garden plot for ${formatCash(LAND_COST, true)}! Use 'plant start' to begin planting. Property tax: ${formatCash(PROPERTY_TAX_PER_DAY, true)}/day.`
        );
      },
    },
    {
      subcommand: "start",
      description: "Start planting crops to generate earnings.",
      usage: "plant start",
      icon: "🌿",
      aliases: ["begin"],
      async deploy({ chat, event, hoshinoDB }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply(
            "📋 | You need to register first! Use: profile register <username>"
          );
        }
        if (!userData.garden) {
          return chat.reply(
            "📋 | You need to buy a garden first! Use: plant buy"
          );
        }
        if (userData.garden.taxOverdue) {
          const { taxAmount } = await handlePropertyTax(userData, hoshinoDB, event, chat);
          return chat.reply(
            `🧾 | Cannot start planting: Property tax of ${formatCash(taxAmount, true)} is overdue! Pay with 'plant paytax'.`
          );
        }
        if (userData.garden.isPlanting) {
          return chat.reply("🌱 | You are already planting crops!");
        }
        await hoshinoDB.set(event.senderID, {
          ...userData,
          garden: {
            ...userData.garden,
            isPlanting: true,
            lastPlanted: Date.now(),
          },
        });
        return chat.reply(
          "🌿 | You started planting crops! Earnings will accumulate over time. Check with 'plant status'."
        );
      },
    },
    {
      subcommand: "status",
      description: "Check your garden's status, earnings, and tax status.",
      usage: "plant status",
      icon: "📊",
      aliases: ["check", "info"],
      async deploy({ chat, event, hoshinoDB }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply(
            "📋 | You need to register first! Use: profile register <username>"
          );
        }
        if (!userData.garden) {
          return chat.reply(
            "📋 | You need to buy a garden first! Use: plant buy"
          );
        }
        const { garden } = userData;
        const earningsRate = EARNINGS_PER_MINUTE * garden.level;
        let accumulatedEarnings = garden.accumulatedEarnings || 0;
        if (garden.isPlanting && !garden.taxOverdue) {
          const minutesPassed = (Date.now() - garden.lastPlanted) / 1000 / 60;
          accumulatedEarnings += Math.floor(minutesPassed * earningsRate);
        }
        const { taxOverdue, taxAmount, message } = await handlePropertyTax(userData, hoshinoDB, event, chat, true);
        const texts = [
          `🌱 | **Garden Level**: ${garden.level}`,
          `🪙 | **Earnings Rate**: ${formatCash(earningsRate, true)} per minute`,
          `💰 | **Accumulated Earnings**: ${formatCash(accumulatedEarnings, true)}`,
          `🌿 | **Planting Status**: ${garden.isPlanting ? "Active" : "Idle"}`,
          `🧾 | **Tax Status**: ${taxOverdue ? `Overdue (${formatCash(taxAmount, true)})` : "Paid"}`,
        ];
        if (garden.isPlanting) {
          texts.push(`⏰ | **Planting Since**: ${new Date(garden.lastPlanted).toLocaleString()}`);
        }
        texts.push(`🧾 | **Property Tax**: ${formatCash(PROPERTY_TAX_PER_DAY * garden.level, true)} per day`);
        if (message) texts.push(message);
        return chat.reply(texts.join("\n"));
      },
    },
    {
      subcommand: "collect",
      description: "Collect your garden's accumulated earnings.",
      usage: "plant collect",
      icon: "💸",
      aliases: ["harvest"],
      async deploy({ chat, event, hoshinoDB }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply(
            "📋 | You need to register first! Use: profile register <username>"
          );
        }
        if (!userData.garden) {
          return chat.reply(
            "📋 | You need to buy a garden first! Use: plant buy"
          );
        }
        if (userData.garden.taxOverdue) {
          const { taxAmount } = await handlePropertyTax(userData, hoshinoDB, event, chat);
          return chat.reply(
            `🧾 | Cannot collect earnings: Property tax of ${formatCash(taxAmount, true)} is overdue! Pay with 'plant paytax'.`
          );
        }
        let { garden } = userData;
        let accumulatedEarnings = garden.accumulatedEarnings || 0;
        if (garden.isPlanting) {
          const minutesPassed = (Date.now() - garden.lastPlanted) / 1000 / 60;
          accumulatedEarnings += Math.floor(minutesPassed * EARNINGS_PER_MINUTE * garden.level);
        }
        if (accumulatedEarnings <= 0) {
          return chat.reply("📋 | No earnings to collect yet!");
        }
        await hoshinoDB.set(event.senderID, {
          ...userData,
          balance: userData.balance + accumulatedEarnings,
          garden: {
            ...garden,
            accumulatedEarnings: 0,
            lastPlanted: garden.isPlanting ? Date.now() : garden.lastPlanted,
          },
        });
        return chat.reply(
          `💸 | You collected ${formatCash(accumulatedEarnings, true)} from your garden!`
        );
      },
    },
    {
      subcommand: "upgrade",
      description: "Upgrade your garden to double your earnings.",
      usage: "plant upgrade",
      icon: "⬆️",
      aliases: ["levelup"],
      async deploy({ chat, event, hoshinoDB }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply(
            "📋 | You need to register first! Use: profile register <username>"
          );
        }
        if (!userData.garden) {
          return chat.reply(
            "📋 | You need to buy a garden first! Use: plant buy"
          );
        }
        if (userData.garden.taxOverdue) {
          const { taxAmount } = await handlePropertyTax(userData, hoshinoDB, event, chat);
          return chat.reply(
            `🧾 | Cannot upgrade: Property tax of ${formatCash(taxAmount, true)} is overdue! Pay with 'plant paytax'.`
          );
        }
        const { garden } = userData;
        const upgradeCost = UPGRADE_COST_BASE * garden.level;
        if (userData.balance < upgradeCost) {
          return chat.reply(
            `📋 | You need ${formatCash(upgradeCost, true)} to upgrade your garden!`
          );
        }
        await hoshinoDB.set(event.senderID, {
          ...userData,
          balance: userData.balance - upgradeCost,
          garden: {
            ...garden,
            level: garden.level + 1,
          },
        });
        return chat.reply(
          `⬆️ | Your garden is now Level ${garden.level + 1}! Earnings doubled to ${formatCash(
            EARNINGS_PER_MINUTE * (garden.level + 1),
            true
          )} per minute. Property tax increased to ${formatCash(PROPERTY_TAX_PER_DAY * (garden.level + 1), true)}/day.`
        );
      },
    },
    {
      subcommand: "paytax",
      description: "Pay overdue property taxes to resume gardening.",
      usage: "plant paytax",
      icon: "🧾",
      aliases: ["tax"],
      async deploy({ chat, event, hoshinoDB }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply(
            "📋 | You need to register first! Use: profile register <username>"
          );
        }
        if (!userData.garden) {
          return chat.reply(
            "📋 | You need to buy a garden first! Use: plant buy"
          );
        }
        const { taxOverdue, taxAmount, message } = await handlePropertyTax(userData, hoshinoDB, event, chat, true);
        if (!taxOverdue) {
          return chat.reply("🧾 | No property taxes are currently overdue.");
        }
        if (userData.balance < taxAmount) {
          return chat.reply(
            `📋 | You need ${formatCash(taxAmount, true)} to pay your overdue taxes!`
          );
        }
        return chat.reply(message);
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
