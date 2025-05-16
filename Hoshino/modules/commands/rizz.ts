const { cleanUserID } = global.Hoshino.utils;

const command: HoshinoLia.Command = {
  manifest: {
    name: "rizz",
    aliases: ["r"],
    version: "1.0.0",
    developer: "Francis Loyd Raval",
    description: "Rizz up a random user for a chance to win 1-10,000 in currency",
    category: "Game",
    usage: "!rizz",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "😎 Rizz Game",
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
      const cleanID = cleanUserID(event.senderID);
      const user = await hoshinoDB.get(cleanID);
      if (!user) {
        await chat.send("Please register using **profile register [username]** first!");
        return;
      }
      const allUsers = await hoshinoDB.getAll();
      const userIDs = Object.keys(allUsers).filter((id) => id !== cleanID);
      if (userIDs.length === 0) {
        await chat.send("No other users to rizz up! Try again later.");
        return;
      }
      const randomUserID = userIDs[Math.floor(Math.random() * userIDs.length)];
      const randomUser = allUsers[randomUserID];
      const randomUsername = randomUser.username || "Mystery User";
      const isSuccess = Math.random() < 0.5;
      const winnings = Math.floor(Math.random() * (10000 - 1 + 1)) + 1;
      if (isSuccess) {
        let { balance = 0 } = await hoshinoDB.get(cleanID);
        balance += winnings;
        await hoshinoDB.set(cleanID, { balance });
        await chat.send(
          `Smooth moves! Your rizz with ${randomUsername} was Ohio-level! You won $${winnings}! Your balance is now $${balance}.`
        );
      } else {
        const noOneWins = Math.random() < 0.5;
        if (noOneWins) {
          await chat.send(
            `Oof, ${randomUsername} wasn't feeling your rizz. No one gets anything!`
          );
        } else {
          let { balance = 0 } = await hoshinoDB.get(randomUserID);
          balance += winnings;
          await hoshinoDB.set(randomUserID, { balance });
          await chat.send(
            `Ohio vibes only! ${randomUsername} out-rizzed you and got $${winnings}! Try harder next time.`
          );
        }
      }
    } catch (error) {
      console.error("Error in rizz command:", error);
      await chat.send("An error occurred while playing the rizz game.");
    }
  },
};

export default command;
