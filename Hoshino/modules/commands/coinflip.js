/**
 * @type {HoshinoLia.Command}
 */
const command = {
  manifest: {
    name: "coinflip",
    aliases: ["flip", "coin"],
    version: "1.0.0",
    developer: "Francis Loyd Raval",
    description: "Flip a coin and guess the result to win currency",
    category: "Game",
    usage: "!coinflip <heads/tails> <bet>",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "🪙 COIN FLIP",
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
        return await chat.reply("You must register first using profile register [username]");
      }

      const choice = args[0]?.toLowerCase();
      const bet = parseInt(args[1]);

      if (!["heads", "tails"].includes(choice) || !bet || bet <= 0) {
        return await chat.reply("Usage: !coinflip <heads/tails> <bet> (e.g., !coinflip heads 100)");
      }

      let { balance = 0 } = userData;
      if (balance < bet) {
        return await chat.reply(`You don't have enough balance! Your balance: $${balance}.`);
      }

      const flip = Math.random() < 0.5 ? "heads" : "tails";
      let resultMessage = `The coin landed on: **${flip}**\n`;

      if (choice === flip) {
        const winnings = bet * 2;
        balance += winnings;
        resultMessage += `You guessed right! You won $${winnings}.`;
      } else {
        balance -= bet;
        resultMessage += `Wrong guess! You lost $${bet}.`;
      }

      await hoshinoDB.set(event.senderID, { ...userData, balance });
      resultMessage += `\nYour new balance is $${balance}.`;

      await chat.reply(resultMessage);
    } catch (error) {
      console.error("Error in coinflip command:", error);
      await chat.reply("An error occurred while flipping the coin.");
    }
  },
};

module.exports = command;
