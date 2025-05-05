/**
 * @type {HoshinoLia.Command}
 */
const command = {
  manifest: {
    name: "rizz",
    aliases: ["charm", "flirt"],
    version: "1.0.0",
    developer: "Francis Loyd Raval",
    description: "Try your luck at rizzing someone to earn money!",
    category: "Game",
    usage: "!rizz <bet>",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "😎 RIZZ GAME",
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
      if (args.length === 0 || isNaN(bet) || bet <= 0) {
        return await chat.reply(
          "Please specify a valid bet amount (e.g., !rizz 100)."
        );
      }
      let { balance = 0 } = userData;
      if (balance < bet) {
        return await chat.reply(
          `You don't have enough balance! Your balance: $${balance}.`
        );
      }
      balance -= bet;
      const success = Math.random() < 0.5;
      const outcomes = [
        "You charmed them with your smooth talk! 😎",
        "They blushed and gave you a tip! 😊",
        "Your rizz was unbeatable! 🔥",
        "They fell for your charisma! 💖",
        "Your sigma energy won them over! 🐺",
        "That sigma charm was pure dominance! 🐺",
        "You flexed your sigma aura and they loved it! 🐺",
      ];
      const failures = [
        "Ouch, they ignored your pickup line... 😅",
        "Your rizz needs some work! 😬",
        "They walked away unimpressed... 😞",
        "Epic fail! Better luck next time! 😣",
        "Your sigma vibe didn’t land... 🐺",
        "That sigma move was too bold for them... 🐺",
        "Your sigma swagger got no response... 🐺",
      ];
      let resultMessage = `                    **Result**\n`;
      if (success) {
        const multiplier = (Math.random() * 1.5) + 1.5;
        const winnings = Math.floor(bet * multiplier);
        balance += winnings;
        await hoshinoDB.set(event.senderID, { ...userData, balance });
        const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
        resultMessage += `${outcome} You earned $${winnings}! Your new balance is $${balance}.`;
      } else {
        await hoshinoDB.set(event.senderID, { ...userData, balance });
        const failure = failures[Math.floor(Math.random() * failures.length)];
        resultMessage += `${failure} You lost $${bet}. Your new balance is $${balance}.`;
      }
      await chat.reply(resultMessage);
    } catch (error) {
      console.error("Error in rizz command:", error);
      await chat.reply("An error occurred while playing the rizz game.");
    }
  },
};

export default command;
