const manifest: HoshinoLia.CommandManifest = {
  name: "leaderboard",
  aliases: ["lb", "top"],
  description: "View the top 10 users with the highest balance and seasonal trophies.",
  version: "1.0.0",
  category: "Economy",
  cooldown: 5,
  developer: "Francis Loyd Raval",
  usage: "leaderboard",
  config: {
    admin: false,
    moderator: false,
  },
};

const style: HoshinoLia.Command["style"] = {
  title: `〘 🏆 〙 LEADERBOARD`,
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
      subcommand: "top",
      description: "Display the top 10 users with the highest balance.",
      usage: "leaderboard",
      icon: "🏆",
      aliases: ["rank", "ranks"],
      async deploy({ chat, event, hoshinoDB, fonts }) {
        const now = new Date();
        const yearMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const isEndOfMonth = now.getDate() === lastDayOfMonth;

        const allUsers = await hoshinoDB.getAll();
        const userArray = Object.entries(allUsers)
          .map(([uid, data]) => ({
            uid,
            username: data.username || "Unknown",
            balance: data.balance || 0,
            trophies: data.trophies || [],
          }))
          .filter(user => user.username !== "Unknown" && user.balance > 0)
          .sort((a, b) => b.balance - a.balance)
          .slice(0, 10);

        if (userArray.length === 0) {
          return chat.reply("📊 | No users with a balance found!");
        }

        if (isEndOfMonth && userArray.length > 0) {
          const topUser = userArray[0];
          const topUserData = await hoshinoDB.get(topUser.uid);
          const updatedTrophies = topUserData.trophies ? [...topUserData.trophies, yearMonth] : [yearMonth];
          await hoshinoDB.set(topUser.uid, { ...topUserData, trophies: updatedTrophies });
        }

        const texts = [
          `🏆 | **Top 10 Richest Users**`,
          ...userArray.map((user, index) => {
            const rankEmoji = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `🔢 #${index + 1}`;
            const username = index === 0 ? fonts.outline(user.username) : user.username;
            const hasTrophy = user.trophies.length > 0;
            return `${rankEmoji} | **${username}${hasTrophy ? " 🏆" : ""}** - ${formatCash(user.balance, true)}`;
          }),
        ];

        return chat.reply(texts.join("\n"));
      },
    },
  ]);

  return home.runInContext(ctx);
}

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

export default {
  manifest,
  style,
  deploy,
  font,
} as HoshinoLia.Command;
