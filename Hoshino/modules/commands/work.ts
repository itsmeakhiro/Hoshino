const command: HoshinoLia.Command = {
  manifest: {
    name: "work",
    aliases: ["workreward"],
    version: "1.0.0",
    developer: "Francis Loyd Raval",
    description: "Work to claim a random coin reward (1-50,000) every 12 hours with a 50% success chance!",
    category: "Economy",
    usage: "work | work check",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "〘 💼 〙 WORK REWARD",
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
      const { workCooldown = 0 } = userData;
      const cooldownTime = 12 * 60 * 60 * 1000;
      const timeNow = Date.now();
      const timeLeft = Math.max(0, Math.ceil((workCooldown - timeNow) / 1000));

      if (timeLeft > 0) {
        const hours = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);
        const seconds = timeLeft % 60;
        return await chat.reply(
          `Please wait ${hours}h ${minutes}m ${seconds}s before working again.`
        );
      }
      return await chat.reply(`You can work now! Use: work`);
    }

    const userData = await hoshinoDB.get(userID);

    if (!userData || !userData.username) {
      return await chat.reply(
        "You need to register first! Use: profile register <username>"
      );
    }

    const { balance = 0, workCooldown = 0, isAdmin = false } = userData;
    const cooldownTime = 12 * 60 * 60 * 1000;
    const timeNow = Date.now();
    const timeLeft = Math.max(0, workCooldown - timeNow);

    if (timeLeft > 0 && !isAdmin) {
      const hours = Math.floor(timeLeft / 1000 / 3600);
      const minutes = Math.floor(((timeLeft / 1000) % 3600) / 60);
      const seconds = Math.floor((timeLeft / 1000) % 60);
      const info = await chat.reply(
        `Please wait ${hours}h ${minutes}m ${seconds}s before working again.`
      );
      info.addReply((ctx) => {
        return ctx.chat.reply(
          "Why are you replying? Just wait for your work reward."
        );
      });
      return;
    }

    const success = Math.random() < 0.5;
    let resultMessage: string[] = [];

    if (!success && !isAdmin) {
      await hoshinoDB.set(userID, {
        ...userData,
        workCooldown: timeNow + cooldownTime,
      });
      resultMessage = [
        `💼 **Work Failed!**`,
        `The company of your job you've working on is on bankruptcy so you have claimed nothing`,
      ];
      const info = await chat.reply(resultMessage.join("\n"));
      info.addReply((ctx) => {
        return ctx.chat.reply("Better luck next time!");
      });
      return;
    }

    const reward = Math.floor(Math.random() * 50000) + 1;
    const finalBalance = balance + reward;

    await hoshinoDB.set(userID, {
      ...userData,
      balance: finalBalance,
      workCooldown: timeNow + cooldownTime,
    });

    resultMessage = [
      `💼 **Work Reward Claimed!**`,
      `You've earned **${reward.toLocaleString(
        "en-US"
      )}** for your work today! Come back in 12 hours!`,
      `💰 **New Balance**: ${finalBalance.toLocaleString("en-US")} coins.`,
    ];

    const info = await chat.reply(resultMessage.join("\n"));
    info.addReply((ctx) => {
      if (ctx.event.body === "thanks") {
        return ctx.chat.reply("Finally, someone said **thanks**!");
      }
    });
  },
};

export default command;
