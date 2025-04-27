/**
 * @type {HoshinoLia.Command}
 */
const command = {
  manifest: {
    name: "slot",
    aliases: ["slots", "spin"],
    version: "1.0.0",
    developer: "Francis Loyd Raval",
    description: "Play a slot machine game by betting an amount of currency",
    category: "Game",
    usage: "!slot <bet>",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "🎰 SLOT",
    footer: "**Developed by**: Francis Loyd Raval",
  },
  font: {
    title: "bold",
    content: "sans",
    footer: "sans",
  },
  async deploy(ctx) {
    const { chat, hoshinoDB, event, args } = ctx;
    try {
      const userData = await hoshinoDB.get(event.senderID);
      if (!userData || !userData.username) {
        return await chat.reply(
          "You must register first using profile register [username]"
        );
      }

      const bet = parseInt(args[0]);
      if (!bet || bet <= 0) {
        return await chat.reply(
          "Please specify a valid bet amount (e.g., !slot 100)."
        );
      }

      let { balance = 0 } = userData;
      if (balance < bet) {
        return await chat.reply(
          `You don't have enough balance! Your balance: $${balance}.`
        );
      }

      balance -= bet;
      const symbols = ["🍒", "🍋", "⭐", "💎"];
      const reel1 = symbols[Math.floor(Math.random() * symbols.length)];
      const reel2 = symbols[Math.floor(Math.random() * symbols.length)];
      const reel3 = symbols[Math.floor(Math.random() * symbols.length)];

      const allSame = reel1 === reel2 && reel2 === reel3;
      const twoSame = reel1 === reel2 || reel2 === reel3 || reel1 === reel3;

      let resultMessage = `                    **Result**
           〘 ${reel1} | ${reel2} | ${reel3} 〙\n`;

      if (allSame && reel1 === "⭐") {
        const winnings = bet * 5;
        balance += winnings;
        await hoshinoDB.set(event.senderID, { ...userData, balance });
        resultMessage += `JACKPOT! Three ⭐! You won $${winnings}! Your new balance is $${balance}.`;
      } else if (allSame) {
        const winnings = bet * 3;
        balance += winnings;
        await hoshinoDB.set(event.senderID, { ...userData, balance });
        resultMessage += `Big win! Three matching ${reel1}! You won $${winnings}. Your new balance is $${balance}.`;
      } else if (twoSame) {
        const winnings = bet * 2;
        balance += winnings;
        await hoshinoDB.set(event.senderID, { ...userData, balance });
        resultMessage += `Nice! Two matching symbols! You won $${winnings}. Your new balance is $${balance}.`;
      } else {
        await hoshinoDB.set(event.senderID, { ...userData, balance });
        resultMessage += `No luck this time. You lost $${bet}. Your new balance is $${balance}.`;
      }

      await chat.reply(resultMessage);
    } catch (error) {
      console.error("Error in slot command:", error);
      await chat.reply("An error occurred while playing the slot machine.");
    }
  },
};

export default command;
