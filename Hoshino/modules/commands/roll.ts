const command: HoshinoLia.Command = {
  manifest: {
    name: "roll",
    aliases: ["dice"],
    version: "2.0.4",
    developer: "Jenica Ferrer",
    description:
      "Roll dice against AI and test your luck! Bet coins and roll up to 10 dice per game.",
    category: "Gambling Games",
    usage: "roll <bet> <times> | roll cooldown",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "〘 🎲 〙 DICE ROLL",
    footer: "**Developed by**: Jenica & Liane",
  },
  font: {
    title: "bold",
    content: "fancy",
    footer: "sans",
  },
  async deploy(ctx) {
    const { chat, event, hoshinoDB, args } = ctx;
    const userID = String(event.senderID);
    const subcommand = (args[0] || "").toLowerCase();

    if (subcommand === "cooldown") {
      const userData = await hoshinoDB.get(userID);
      if (!userData || !userData.username) {
        return await chat.reply(
          "You need to register first! Use: profile register <username>"
        );
      }
      const { diceWins = 0, diceCooldown = 0 } = userData;
      const cooldownTime = 10;
      const timeNow = Date.now();
      const timeLeft = Math.max(0, Math.ceil((diceCooldown - timeNow) / 1000));

      if (timeLeft > 0) {
        return await chat.reply(
          `Please wait for ${timeLeft} seconds before rolling again.\nTotal Wins: ${diceWins}`
        );
      }
      return await chat.reply(
        `You can roll now! Use: roll <bet> <times>\nTotal Wins: ${diceWins}`
      );
    }

    const bet = parseFloat(args[0]);
    const times = parseInt(args[1]);
    const userData = await hoshinoDB.get(userID);

    if (!userData || !userData.username) {
      return await chat.reply(
        "You need to register first! Use: profile register <username>"
      );
    }

    const {
      balance = 0,
      diceWins = 0,
      diceCooldown = 0,
      isAdmin = false,
    } = userData;
    const cooldownTime = 10 * 1000;
    const timeNow = Date.now();
    const timeLeft = Math.max(0, diceCooldown - timeNow);

    if (timeLeft > 0 && !isAdmin) {
      return await chat.reply(
        `Please wait for ${Math.ceil(
          timeLeft / 1000
        )} seconds before rolling again.\nTotal Wins: ${diceWins}`
      );
    }

    if (isNaN(bet) || isNaN(times)) {
      return await chat.reply(
        `Minimum bet per die is 20 coins. Please enter a valid bet as first argument.\nPlease enter a valid number of dice as second argument (1-10).\n\nTotal Wins: ${diceWins}\n\nExample: roll 10000 5`
      );
    }

    if (times < 1 || times > 10) {
      return await chat.reply(
        "Please enter a valid number of dice (1-10). The more dice, the more risk!"
      );
    }

    if (bet < 20) {
      return await chat.reply(
        "Minimum bet per die is 20 coins. Please enter a valid bet."
      );
    }

    if (balance < bet * times) {
      return await chat.reply(
        `You don't have enough coins to bet ${
          bet * times
        } coins. Current balance: $${balance.toLocaleString("en-US")}.`
      );
    }

    let winTexts: string[] = [];
    let totalWin = 0;
    let totalLoss = 0;

    const getDieNum = () => Math.floor(Math.random() * 6) + 1;

    const devRoll = (aiRoll: number) => {
      if (Math.random() < 0.3) {
        return getDieNum();
      }
      return Math.floor(Math.random() * aiRoll) + 1;
    };

    for (let i = 0; i < times; i++) {
      const aiRoll = getDieNum();
      const playerRoll = devRoll(aiRoll);
      let isWin = playerRoll > aiRoll;
      let isLoss = playerRoll < aiRoll;

      winTexts.push(
        `${getDiceSymbol(playerRoll)} ${
          isWin ? "✅" : isLoss ? "❌" : "🟰"
        } ${getDiceSymbol(aiRoll)} | ${
          isWin ? `+${bet}$` : isLoss ? `-${bet}$` : "-0"
        }`
      );

      if (isWin) {
        totalWin += bet;
      } else if (isLoss) {
        totalLoss += bet;
      }
    }

    const finalBalance = balance + totalWin - totalLoss;
    await hoshinoDB.set(userID, {
      ...userData,
      balance: finalBalance,
      diceWins: diceWins + (totalWin > 0 ? 1 : 0),
      diceCooldown: timeNow + cooldownTime,
    });

    let resultMessage = [
      `🎲 **Your Rolls** (left)`,
      `🤖 **AI Rolls** (right)`,
      ``,
      winTexts.join("\n"),
      ``,
    ];

    if (totalWin > totalLoss) {
      resultMessage.push(
        `🎉 You won **${(totalWin - totalLoss).toLocaleString(
          "en-US"
        )}** coins!`
      );
    } else if (totalLoss > totalWin) {
      resultMessage.push(
        `💸 You lost **${(totalLoss - totalWin).toLocaleString(
          "en-US"
        )}** coins.`
      );
    } else {
      resultMessage.push(`😶 It's a draw! No net win/loss.`);
    }

    resultMessage.push(
      `💰 **New Balance**: ${finalBalance.toLocaleString("en-US")} coins.`,
      `🎯 **Total Wins**: ${diceWins + (totalWin > 0 ? 1 : 0)}`
    );

    await chat.reply(resultMessage.join("\n"));
  },
};

function getDiceSymbol(number: number) {
  const diceSymbols = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  return diceSymbols[number - 1];
}

export default command;
