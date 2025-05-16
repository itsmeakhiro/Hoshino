const { cleanUserID } = global.Hoshino.utils;

const command: HoshinoLia.Command = {
  manifest: {
    name: "bounty",
    aliases: ["bountyhunt"],
    version: "1.0.0",
    developer: "Francis Loyd Raval",
    description:
      "Hunt a fugitive with a random bounty! Capture them to double or triple the bounty, or fail and pay your bet to a random user as a fee!",
    category: "Gambling Games",
    usage: "bounty <bet> | bounty cooldown",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "〘 🕵️‍♂️💰 〙 BOUNTY HUNT",
    footer: "**Developed by**: Francis Loyd Raval & Liane",
  },
  font: {
    title: "bold",
    content: "fancy",
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
      const { bountyWins = 0, bountyCooldown = 0 } = userData;
      const cooldownTime = 10;
      const timeNow = Date.now();
      const timeLeft = Math.max(0, Math.ceil((bountyCooldown - timeNow) / 1000));

      if (timeLeft > 0) {
        return await chat.reply(
          `Please wait for ${timeLeft} seconds before hunting again.\nTotal Wins: ${bountyWins}`
        );
      }
      return await chat.reply(
        `You can hunt now! Use: bounty <bet>\nTotal Wins: ${bountyWins}`
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
      bountyWins = 0,
      bountyCooldown = 0,
      isAdmin = false,
    } = userData;
    const cooldownTime = 10 * 1000;
    const timeNow = Date.now();
    const timeLeft = Math.max(0, bountyCooldown - timeNow);

    if (timeLeft > 0 && !isAdmin) {
      return await chat.reply(
        `Please wait for ${Math.ceil(
          timeLeft / 1000
        )} seconds before hunting again.\nTotal Wins: ${bountyWins}`
      );
    }

    if (isNaN(bet) || bet < 20) {
      return await chat.reply(
        `Minimum bet is 20 coins. Please enter a valid bet.\n\nTotal Wins: ${bountyWins}\n\nExample: bounty 100`
      );
    }

    if (balance < bet) {
      return await chat.reply(
        `You don't have enough coins to bet ${bet} coins. Current balance: $${balance.toLocaleString("en-US")}.`
      );
    }

    const captureChance = 0.5;
    const isCaptured = Math.random() < captureChance;
    let resultMessage: string[] = [];
    let finalBalance = balance;
    let newBountyWins = bountyWins;
    const bountyValue = Math.floor(Math.random() * (500 - 100 + 1)) + 100;

    if (isCaptured) {
      const multiplier = Math.random() < 0.5 ? 2 : 3;
      const winnings = bountyValue * multiplier;
      finalBalance += winnings;
      newBountyWins += 1;
      resultMessage = [
        `🕵️‍♂️ **Captured!** You nabbed the fugitive!`,
        `💰 Bounty worth **${bountyValue.toLocaleString("en-US")}** coins, won **${winnings.toLocaleString("en-US")}** coins (${multiplier}x)!`,
      ];
    } else {
      const allUsers = await hoshinoDB.getAll();
      const userKeys = Object.keys(allUsers).filter((key) => key !== userID && allUsers[key].username);
      if (userKeys.length === 0) {
        resultMessage = [
          `😓 **Slipped Away!** The fugitive escaped, but no one else was around!`,
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
          `😓 **Slipped Away!** The fugitive escaped your grasp!`,
          `🕴️ You paid **${randomUser.username}** a fee for bad intel!`,
          `💸 Lost **${bet.toLocaleString("en-US")}** coins to **${randomUser.username}**.`,
        ];
      }
    }

    await hoshinoDB.set(userID, {
      ...userData,
      balance: finalBalance,
      bountyWins: newBountyWins,
      bountyCooldown: timeNow + cooldownTime,
    });

    resultMessage.push(
      `💰 **New Balance**: ${finalBalance.toLocaleString("en-US")} coins.`,
      `🎯 **Total Wins**: ${newBountyWins}`
    );

    await chat.reply(resultMessage.join("\n"));
  },
};

export default command;
