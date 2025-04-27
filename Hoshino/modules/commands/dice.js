/**
 * @type {HoshinoLia.Command}
 */
const command = {
  manifest: {
    name: "dice",
    aliases: ["roll", "duel"],
    version: "1.0.0",
    developer: "Francis Loyd Raval",
    description:
      "Roll a dice against the bot and try your luck to win currency",
    category: "Game",
    usage: "!dice <bet>",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "🎲 DICE DUEL",
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
          "Please specify a valid bet amount (e.g., !dice 100)."
        );
      }

      let { balance = 0 } = userData;
      if (balance < bet) {
        return await chat.reply(
          `You don't have enough balance! Your balance: $${balance}.`
        );
      }

      const playerRoll = Math.floor(Math.random() * 6) + 1;
      const botRoll = Math.floor(Math.random() * 6) + 1;

      let resultMessage = `You rolled: **${playerRoll}**\nBot rolled: **${botRoll}**\n`;

      if (playerRoll > botRoll) {
        const winnings = bet * 2;
        balance += winnings;
        resultMessage += `You win! You gained $${winnings}.`;
      } else if (playerRoll < botRoll) {
        balance -= bet;
        resultMessage += `You lost! $${bet} has been deducted.`;
      } else {
        resultMessage += `It's a tie! No balance change.`;
      }

      await hoshinoDB.set(event.senderID, { ...userData, balance });
      resultMessage += `\nYour new balance is $${balance}.`;

      await chat.reply(resultMessage);
    } catch (error) {
      console.error("Error in dice command:", error);
      await chat.reply("An error occurred while rolling the dice.");
    }
  },
};

export default command;
