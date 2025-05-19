const command: HoshinoLia.Command = {
  manifest: {
    name: "daily",
    aliases: ["dailyreward"],
    version: "1.0.0",
    developer: "Francis Loyd Raval",
    description: "Claim a random coin reward (1-10,000) once every 24 hours!",
    category: "Economy",
    usage: "daily | daily check",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "〘 💸 〙 DAILY REWARD",
    footer: "**Developed by**: Francis Loyd Raval & Liane",
  },
  font: {
    title: "bold",
    content: "sans",
    footer: "sans",
  },
  async deploy(ctx) {
    const { chat, event, hoshinoDB } = ctx;
    const userID = event.senderID;
    const subcommand = (ctx.args[0] || "").toLowerCase();

    if (subcommand === "check") {
      const userData = await hoshinoDB.get(userID);
      if (!userData || !userData.username) {
        return await chat.reply(
          "You need to register first! Use: profile register <username>"
        );
      }
      const { dailyCooldown = 0 } = userData;
      const cooldownTime = 24 * 60 * 60;
      const timeNow = Date.now();
      const timeLeft = Math.max(0, Math.ceil((dailyCooldown - timeNow) / 1000));

      if (timeLeft > 0) {
        const hours = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);
        const seconds = timeLeft % 60;
        return await chat.reply(
          `Please wait ${hours}h ${minutes}m ${seconds}s before claiming again.`
        );
      }
      return await chat.reply(`You can claim now! Use: daily`);
    }

    const userData = await hoshinoDB.get(userID);

    if (!userData || !userData.username) {
      return await chat.reply(
        "You need to register first! Use: profile register <username>"
      );
    }

    const { balance = 0, dailyCooldown = 0, isAdmin = false } = userData;
    const cooldownTime = 24 * 60 * 60 * 1000;
    const timeNow = Date.now();
    const timeLeft = Math.max(0, dailyCooldown - timeNow);

    if (timeLeft > 0 && !isAdmin) {
      const hours = Math.floor(timeLeft / 1000 / 3600);
      const minutes = Math.floor(((timeLeft / 1000) % 3600) / 60);
      const seconds = Math.floor((timeLeft / 1000) % 60);
      const info = await chat.reply(
        `Please wait ${hours}h ${minutes}m ${seconds}s before claiming again.`
      );
      info.addReply((ctx) => {
        return ctx.chat.reply(
          "Why are you replying? Just wait for your dam reward."
        );
      });
    }

    const reward = Math.floor(Math.random() * (10000 - 1 + 1)) + 1;
    const finalBalance = balance + reward;

    await hoshinoDB.set(userID, {
      ...userData,
      balance: finalBalance,
      dailyCooldown: timeNow + cooldownTime,
    });

    let resultMessage: string[] = [
      `💸 **Daily Reward Claimed!**`,
      `You've claimed **${reward.toLocaleString(
        "en-US"
      )}** for today, comeback tomorrow for your free earnings!`,
      `💰 **New Balance**: ${finalBalance.toLocaleString("en-US")} coins.`,
    ];

    const info = await chat.reply(resultMessage.join("\n"));
    info.addReply((ctx) => {
      if (ctx.event.body === "thanks") {
        return ctx.chat.reply("Finally, someone finally said **thanks**!");
      }
    });
  },
};

export default command;
