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
  name: "fishing",
  aliases: ["fish", "angle"],
  description: "Manage your fishing: buy a rod, start fishing, check status, or collect earnings.",
  version: "1.0.0",
  category: "Economy",
  cooldown: 5,
  developer: "Francis Loyd Raval",
  usage: "fishing [ buy <basic | advanced | master> | start | status | collect ]",
  config: {
    admin: false,
    moderator: false,
  },
};

const style: HoshinoLia.Command["style"] = {
  title: `〘 🎣 〙 FISHING`,
  footer: "Made with 🤍 by **Francis Loyd Raval**",
  type: "lines1",
};

const font: HoshinoLia.Command["font"] = {
  title: "bold",
  content: "sans",
  footer: "sans",
};

const ROD_TYPES = {
  basic: {
    cost: 10000,
    fishPool: [
      "Sardine",
      "Mackerel",
      "Anchovy",
      "Herring",
      "Sprat",
      "Smelt",
      "Capelin",
      "Shad",
    ],
    quality: "Weak",
  },
  advanced: {
    cost: 25000,
    fishPool: [
      "Cod",
      "Salmon",
      "Snapper",
      "Haddock",
      "Pollock",
      "Whiting",
      "Perch",
      "Bass",
    ],
    quality: "Mid-tier",
  },
  master: {
    cost: 50000,
    fishPool: [
      "Cod",
      "Salmon",
      "Snapper",
      "Haddock",
      "Pollock",
      "Whiting",
      "Perch",
      "Bass",
      "Tuna",
      "Marlin",
      "Swordfish",
      "MahiMahi",
    ],
    quality: "High-quality",
  },
};

const FISH_TYPES = [
  { name: "Sardine", value: 50, quality: "Weak" },
  { name: "Mackerel", value: 60, quality: "Weak" },
  { name: "Anchovy", value: 55, quality: "Weak" },
  { name: "Herring", value: 65, quality: "Weak" },
  { name: "Sprat", value: 70, quality: "Weak" },
  { name: "Smelt", value: 75, quality: "Weak" },
  { name: "Capelin", value: 80, quality: "Weak" },
  { name: "Shad", value: 85, quality: "Weak" },
  { name: "Cod", value: 120, quality: "Mid-tier" },
  { name: "Salmon", value: 130, quality: "Mid-tier" },
  { name: "Snapper", value: 140, quality: "Mid-tier" },
  { name: "Haddock", value: 150, quality: "Mid-tier" },
  { name: "Pollock", value: 160, quality: "Mid-tier" },
  { name: "Whiting", value: 170, quality: "Mid-tier" },
  { name: "Perch", value: 175, quality: "Mid-tier" },
  { name: "Bass", value: 180, quality: "Mid-tier" },
  { name: "Tuna", value: 200, quality: "High-quality" },
  { name: "Marlin", value: 220, quality: "High-quality" },
  { name: "Swordfish", value: 250, quality: "High-quality" },
  { name: "MahiMahi", value: 280, quality: "High-quality" },
];

const FISHING_INTERVAL_MS = 5 * 60 * 1000;

export async function deploy(ctx) {
  const home = new ctx.HoshinoHM([
    {
      subcommand: "buy",
      description: "Buy a fishing rod (basic, advanced, or master) to start fishing.",
      usage: "fishing buy <basic | advanced | master>",
      icon: "🛒",
      aliases: ["purchase"],
      async deploy({ chat, event, hoshinoDB, args }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply(
            "📋 | You need to register first! Use: profile register <username>"
          );
        }
        if (userData.fishing) {
          return chat.reply("🎣 | You already own fishing equipment!");
        }
        if (args.length < 2 || !args[1]) {
          return chat.reply(
            "📋 | Please specify a rod type. Usage: fishing buy <basic | advanced | master>\n" +
            `- Basic ($10,000): Catches weak fish (Sardine, Mackerel, Anchovy, Herring, Sprat, Smelt, Capelin, Shad)\n` +
            `- Advanced ($25,000): Catches mid-tier fish (Cod, Salmon, Snapper, Haddock, Pollock, Whiting, Perch, Bass)\n` +
            `- Master ($50,000): Catches mid-tier and high-quality fish (Cod, Salmon, Snapper, Haddock, Pollock, Whiting, Perch, Bass, Tuna, Marlin, Swordfish, MahiMahi)`
          );
        }
        const rodType = args[1].toLowerCase();
        if (!ROD_TYPES[rodType]) {
          return chat.reply(
            "📋 | Invalid rod type! Choose: basic, advanced, or master"
          );
        }
        const { cost, quality } = ROD_TYPES[rodType];
        if (userData.balance < cost) {
          return chat.reply(
            `📋 | You need ${formatCash(cost, true)} to buy a ${rodType} rod!`
          );
        }
        await hoshinoDB.set(event.senderID, {
          ...userData,
          balance: userData.balance - cost,
          fishing: {
            rodType,
            level: 1,
            isFishing: false,
            lastFished: 0,
            catches: [],
          },
        });
        return chat.reply(
          `🎣 | You bought a ${rodType} rod (${quality}) for ${formatCash(cost, true)}! ` +
          `Use 'fishing start' to begin fishing. Catches: ${ROD_TYPES[rodType].fishPool.join(", ")}.`
        );
      },
    },
    {
      subcommand: "start",
      description: "Start fishing to collect various fish.",
      usage: "fishing start",
      icon: "🐟",
      aliases: ["begin"],
      async deploy({ chat, event, hoshinoDB }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply(
            "📋 | You need to register first! Use: profile register <username>"
          );
        }
        if (!userData.fishing) {
          return chat.reply(
            "📋 | You need to buy fishing equipment first! Use: fishing buy <basic | advanced | master>"
          );
        }
        if (userData.fishing.isFishing) {
          return chat.reply("🎣 | You are already fishing!");
        }
        const fishPool = ROD_TYPES[userData.fishing.rodType].fishPool;
        const fishName = fishPool[Math.floor(Math.random() * fishPool.length)];
        const fish = FISH_TYPES.find(f => f.name === fishName);
        const catches = fish ? [{ name: fish.name, value: fish.value }] : [];
        await hoshinoDB.set(event.senderID, {
          ...userData,
          fishing: {
            ...userData.fishing,
            isFishing: true,
            lastFished: Date.now(),
            catches,
          },
        });
        return chat.reply(
          `🐟 | You started fishing and caught a ${fish ? fish.name : "fish"}! Check with 'fishing status'.`
        );
      },
    },
    {
      subcommand: "status",
      description: "Check your fishing progress and earnings.",
      usage: "fishing status",
      icon: "📊",
      aliases: ["check", "info"],
      async deploy({ chat, event, hoshinoDB }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply(
            "📋 | You need to register first! Use: profile register <username>"
          );
        }
        if (!userData.fishing) {
          return chat.reply(
            "📋 | You need to buy fishing equipment first! Use: fishing buy <basic | advanced | master>"
          );
        }
        const { fishing } = userData;
        let catches = fishing.catches || [];
        let totalValue = catches.reduce((sum, fish) => sum + (fish ? fish.value : 0), 0);
        if (fishing.isFishing) {
          const timePassed = (Date.now() - fishing.lastFished) / FISHING_INTERVAL_MS;
          const fishCaught = Math.floor(timePassed * fishing.level);
          const fishPool = ROD_TYPES[fishing.rodType].fishPool;
          for (let i = 0; i < fishCaught; i++) {
            const fishName = fishPool[Math.floor(Math.random() * fishPool.length)];
            const fish = FISH_TYPES.find(f => f.name === fishName);
            if (fish) {
              catches.push({ name: fish.name, value: fish.value });
              totalValue += fish.value;
            }
          }
        }
        const fishCount = catches.reduce((acc, fish) => {
          if (fish) {
            acc[fish.name] = (acc[fish.name] || 0) + 1;
          }
          return acc;
        }, {});
        const texts = [
          `🎣 | **Rod Type**: ${fishing.rodType.charAt(0).toUpperCase() + fishing.rodType.slice(1)} (${ROD_TYPES[fishing.rodType].quality})`,
          `🔧 | **Equipment Level**: ${fishing.level}`,
          `🐟 | **Fishing Status**: ${fishing.isFishing ? "Active" : "Idle"}`,
          `💰 | **Total Earnings**: ${formatCash(totalValue, true)}`,
          `📦 | **Caught Fish**:`,
          ...Object.entries(fishCount).map(
            ([name, count]) => {
              const fish = FISH_TYPES.find(f => f.name === name);
              return `  - ${name}: ${count} ($${fish ? fish.value : 0} each, ${fish ? fish.quality : "Unknown"})`;
            }
          ),
          `🎣 | **Available Fish**: ${ROD_TYPES[fishing.rodType].fishPool.join(", ")}`,
        ];
        if (fishing.isFishing) {
          texts.push(`⏰ | **Fishing Since**: ${new Date(fishing.lastFished).toLocaleString()}`);
        }
        return chat.reply(texts.join("\n"));
      },
    },
    {
      subcommand: "collect",
      description: "Collect earnings from your caught fish.",
      usage: "fishing collect",
      icon: "💸",
      aliases: ["harvest"],
      async deploy({ chat, event, hoshinoDB }) {
        const userData = await hoshinoDB.get(event.senderID);
        if (!userData || !userData.username) {
          return chat.reply(
            "📋 | You need to register first! Use: profile register <username>"
          );
        }
        if (!userData.fishing) {
          return chat.reply(
            "📋 | You need to buy fishing equipment first! Use: fishing buy <basic | advanced | master>"
          );
        }
        let { fishing } = userData;
        let catches = fishing.catches || [];
        if (fishing.isFishing) {
          const timePassed = (Date.now() - fishing.lastFished) / FISHING_INTERVAL_MS;
          const fishCaught = Math.floor(timePassed * fishing.level);
          const fishPool = ROD_TYPES[fishing.rodType].fishPool;
          for (let i = 0; i < fishCaught; i++) {
            const fishName = fishPool[Math.floor(Math.random() * fishPool.length)];
            const fish = FISH_TYPES.find(f => f.name === fishName);
            if (fish) {
              catches.push({ name: fish.name, value: fish.value });
            }
          }
        }
        const totalValue = catches.reduce((sum, fish) => sum + (fish ? fish.value : 0), 0);
        if (totalValue <= 0) {
          return chat.reply("📋 | No fish to sell yet!");
        }
        await hoshinoDB.set(event.senderID, {
          ...userData,
          balance: userData.balance + totalValue,
          fishing: {
            ...fishing,
            catches: [],
            lastFished: fishing.isFishing ? Date.now() : fishing.lastFished,
          },
        });
        return chat.reply(
          `💸 | You sold your fish for ${formatCash(totalValue, true)}!`
        );
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
