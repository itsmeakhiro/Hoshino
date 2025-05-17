const { cleanUserID } = global.Hoshino.utils;

const command: HoshinoLia.Command = {
  manifest: {
    name: "shoti",
    aliases: ["s"],
    version: "1.0.0",
    developer: "Francis Loyd Raval",
    description: "Impress a random user for a chance to win 0-5,000 in currency",
    category: "Game",
    usage: "!shoti",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "🔥 Shoti Game",
    footer:
      "Developed by: Francis Loyd Raval",
  },
  font: {
    title: "bold",
    content: "sans",
    footer: "sans",
  },
  async deploy(ctx) {
    const { chat, hoshinoDB, event } = ctx;
    try {
      const cleanID = cleanUserID(event.senderID);
      const user = await hoshinoDB.get(cleanID);
      if (!user || !user.username) {
        await chat.send("Please register with a username using **profile register [username]** first!");
        return;
      }
      const allUsers = await hoshinoDB.getAll();
      const userIDs = Object.keys(allUsers).filter((id) => id !== cleanID);
      if (userIDs.length === 0) {
        await chat.send("No other users to impress! Try again later.");
        return;
      }
      const randomUserID = userIDs[Math.floor(Math.random() * userIDs.length)];
      const randomUser = allUsers[randomUserID];
      const randomUsername = randomUser.username || "Mystery User";
      const isSuccess = Math.random() < 0.5;
      const winnings = Math.floor(Math.random() * (5000 + 1));
      if (isSuccess) {
        let { balance = 0 } = await hoshinoDB.get(cleanID);
        balance += winnings;
        await hoshinoDB.set(cleanID, { balance });
        await chat.send(
          `Aughh.... Napasarap ka nung tinikman mo sya. Nice one Fam. Here's your $${winnings} grand.`
        );
      } else {
        await chat.send(
          `Oof, ${randomUsername} wasn't impressed with your vibe. You got nothing!`
        );
      }
    } catch (error) {
      console.error("Error in shoti command:", error);
      await chat.send("An error occurred while playing the shoti game.");
    }
  },
};

export default command;
