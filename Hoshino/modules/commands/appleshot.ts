const { cleanUserID } = global.Hoshino.utils;

const command: HoshinoLia.Command = {
  manifest: {
    name: "appleshot",
    aliases: ["shootapple"],
    version: "1.0.0",
    developer: "Francis Loyd Raval",
    description:
      "Take aim and shoot an arrow at an apple! Hit it to double or triple your bet, or miss and pay a random user your bet as compensation!",
    category: "Gambling Games",
    usage: "appleshot <bet> | appleshot cooldown",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "〘 🍎🏹 〙 APPLE SHOT",
    footer: "**Developed by**: Francis Loyd Raval",
  },
  font: {
    title: "bold",
    content: "sans",
    footer: "sans",
  },
  async deploy(ctx) {
    const { chat, event, hoshinoDB, args } = ctx;
    const userID = cleanUserID(event.senderID);
    const subcommand = (args[0] || "").toLowerCase();

    if (subcommand === "cooldown") {
      const userData = await hoshinoDB.get(userID);
      if (!userData || !userData.username) {
        return await chat.reply(
          "You need to register first! Use: profile register <username>"
        );
      }
      const { appleWins = 0, appleCooldown = 0 } = userData;
      const cooldownTime = 10;
      const timeNow = Date.now();
      const timeLeft = Math.max(0, Math.ceil((appleCooldown - timeNow) / 1000));

      if (timeLeft > 0) {
        return await chat.reply(
          `Please wait for ${timeLeft} seconds before shooting again.\nTotal Wins: ${appleWins}`
        );
      }
      return await chat.reply(
        `You can shoot now! Use: appleshot <bet>\nTotal Wins: ${appleWins}`
      );
    }

    const bet = parseInt(args[0]);
    const userData = await hoshinoDB.get(userID);

    if (!userData || !userData.username) {
      return await chat.reply(
        "You need to register first! Use: profile register <username>"
      );
    }

    const {
      balance = 0,
      appleWins = 0,
      appleCooldown = 0,
      isAdmin = false,
    } = userData;
    const cooldownTime = 10 * 1000;
    const timeNow = Date.now();
    const timeLeft = Math.max(0, appleCooldown - timeNow);

    if (timeLeft > 0 && !isAdmin) {
      return await chat.reply(
        `Please wait for ${Math.ceil(
          timeLeft / 1000
        )} seconds before shooting again.\nTotal Wins: ${appleWins}`
      );
    }

    if (isNaN(bet) || bet < 20) {
      return await chat.reply(
        `Minimum bet is 20 coins. Please enter a valid bet.\n\nTotal Wins: ${appleWins}\n\nExample: appleshot 100`
      );
    }

    if (balance < bet) {
      return await chat.reply(
        `You don't have enough coins to bet ${bet} coins. Current balance: $${balance.toLocaleString("en-US")}.`
      );
    }

    const hitChance = 0.5;
    const isHit = Math.random() < hitChance;
    let resultMessage: string[] = [];
    let finalBalance = balance;
    let newAppleWins = appleWins;

    if (isHit) {
      const multiplier = Math.random() < 0.5 ? 2 : 3;
      const winnings = bet * multiplier;
      finalBalance += winnings;
      newAppleWins += 1;
      resultMessage = [
        `🎯 **Bullseye!** You hit the apple!`,
        `🍎 You won **${winnings.toLocaleString("en-US")}** coins (${multiplier}x your bet)!`,
      ];
    } else {
      const allUsers = await hoshinoDB.getAll();
      const userKeys = Object.keys(allUsers).filter((key) => key !== userID && allUsers[key].username);
      if (userKeys.length === 0) {
        resultMessage = [
          `🏹 **Ouchh...** You missed the apple, but there’s no one else to hit!`,
          `💸 Your bet of **${bet.toLocaleString("en-US")}** coins is safe.`,
        ];
      } else {
        const randomUserID = userKeys[Math.floor(Math.random() * userKeys.length)];
        const randomUser = allUsers[randomUserID];
        finalBalance -= bet;

        await hoshinoDB.set(randomUserID, {
          ...randomUser,
          balance: (randomUser.balance || 0) + bet,
        });

        resultMessage = [
          `🏹 **Ouchh...** You've made a wrong target fam!!!`,
          `🍑 The arrow hit **${randomUser.username}**'s ass!`,
          `💸 You paid **${bet.toLocaleString("en-US")}** coins to **${randomUser.username}** as compensation.`,
        ];
      }
    }

    await hoshinoDB.set(userID, {
      ...userData,
      balance: finalBalance,
      appleWins: newAppleWins,
      appleCooldown: timeNow + cooldownTime,
    });

    resultMessage.push(
      `💰 **New Balance**: ${finalBalance.toLocaleString("en-US")} coins.`,
      `🎯 **Total Wins**: ${newAppleWins}`
    );

    await chat.reply(resultMessage.join("\n"));
  },
};

export default command;
