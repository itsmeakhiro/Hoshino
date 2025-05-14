const { cleanUserID } = global.Hoshino.utils;

// DO NOT REMOVE HoshinoLia.Command, do not add types on async deploy ctx
const command: HoshinoLia.Command = {
  manifest: {
    name: "uwu",
    aliases: ["u"],
    version: "1.0.0",
    developer: "Liane Cagara",
    description: "Play a game with a 50% chance to win 500-1000 in currency",
    category: "Game",
    usage: "!uwu",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "🥴 UWU",
    footer:
      "Make sure you're registered on profile, if not use **profile register [ username ]** to register.\n\nDeveloped by: Francis Loyd Raval",
  },
  font: {
    title: "bold",
    content: "sans",
    footer: "sans",
  },
  async deploy(ctx) {
    const { chat, hoshinoDB, event } = ctx;
    try {
      const isWin = Math.random() < 0.5;
      if (isWin) {
        const winnings = Math.floor(Math.random() * (1000 - 500 + 1)) + 500;
        let { balance = 0 } = await hoshinoDB.get(event.senderID);
        balance += winnings;
        const cleanID = cleanUserID(event.senderID);
        await hoshinoDB.set(cleanID, { balance });
        await chat.send(
          `Enebe... nacutetan ako sa UwU mo, eto $${winnings} para sayo, mwaps. So pera mo ngayon is nasa $${balance}.`
        );
      } else {
        const info = await chat.send(`Yock pangit naman ng uwu mo layas.`);
        info.addReply(async ({ chat }) => {
          await chat.reply("Oh bat ka nagrereply?");
          info.edit("Wala na nag reply amputa");
        });
      }
    } catch (error) {
      console.error("Error in uwu command:", error);
      await chat.send("An error occurred while playing the game.");
    }
  },
};

export default command;
