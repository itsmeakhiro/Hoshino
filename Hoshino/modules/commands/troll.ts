const { cleanUserID } = global.Hoshino.utils;

const command: HoshinoLia.Command = {
  manifest: {
    name: "troll",
    aliases: ["t"],
    version: "1.0.0",
    developer: "Francis Loyd Raval",
    description: "Troll a random user to steal 1-5,000 in currency",
    category: "Game",
    usage: "!troll",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "😈 Troll Game",
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
      const user = await hoshinoDB.get(cleanID, { username });
      if (!user) {
        await chat.send("Please register using **profile register [username]** first!");
        return;
      }
      const allUsers = await hoshinoDB.getAll();
      const userIDs = Object.keys(allUsers).filter((id) => id !== cleanID);
      if (userIDs.length === 0) {
        await chat.send("No other users to troll! Try again later.");
        return;
      }
      const randomUserID = userIDs[Math.floor(Math.random() * userIDs.length)];
      const randomUser = allUsers[randomUserID];
      const randomUsername = randomUser.username || "Mystery User";
      const isSuccess = Math.random() < 0.5;
      const amount = Math.floor(Math.random() * (5000 - 1 + 1)) + 1;
      if (isSuccess) {
        let { balance: userBalance = 0 } = await hoshinoDB.get(cleanID);
        let { balance: targetBalance = 0 } = await hoshinoDB.get(randomUserID);
        if (targetBalance < amount) {
          await chat.send(`Lol, ${randomUsername} is too broke to troll! Try someone else.`);
          return;
        }
        userBalance += amount;
        targetBalance -= amount;
        await hoshinoDB.set(cleanID, { balance: userBalance });
        await hoshinoDB.set(randomUserID, { balance: targetBalance });
        await chat.send(
          `Epic troll! You pranked ${randomUsername} and stole $${amount}! Your balance is now $${userBalance}.`
        );
      } else {
        const nothingHappens = Math.random() < 0.5;
        if (nothingHappens) {
          await chat.send(
            `Boo, ${randomUsername} dodged your troll. Nothing happened!`
          );
        } else {
          let { balance: userBalance = 0 } = await hoshinoDB.get(cleanID);
          let { balance: targetBalance = 0 } = await hoshinoDB.get(randomUserID);
          if (userBalance < amount) {
            await chat.send(`You're too broke to lose $${amount}! ${randomUsername} laughs at your weak troll.`);
            return;
          }
          userBalance -= amount;
          targetBalance += amount;
          await hoshinoDB.set(cleanID, { balance: userBalance });
          await hoshinoDB.set(randomUserID, { balance: targetBalance });
          await chat.send(
            `Oof, ${randomUsername} turned the tables and trolled you! You lost $${amount}. Your balance is now $${userBalance}.`
          );
        }
      }
    } catch (error) {
      console.error("Error in troll command:", error);
      await chat.send("An error occurred while playing the troll game.");
    }
  },
};

export default command;
