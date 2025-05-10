// DO NOT REMOVE HoshinoLia.Command
const command: HoshinoLia.Command = {
  manifest: {
    name: "pair",
    aliases: ["match", "couple"],
    version: "1.0.0",
    developer: "Francis Loyd Raval",
    description: "Pairs the user with a random user in the group and shows their profile pictures",
    category: "fun",
    cooldown: 0,
    usage: "pair",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "💞 PAIRING",
    footer: `Developed by: Francis Loyd Raval`,
  },
  font: {
    title: "bold",
    content: "sans",
    footer: "sans",
  },
  async deploy({ chat, api, event, fonts }) {
    if (!event.isGroup) {
      await chat.reply(
        fonts.sans("This command can only be used in group chats.")
      );
      return;
    }

    try {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const participants = threadInfo.participantIDs.filter(
        (id) => id !== api.getCurrentUserID() && id !== event.senderID // Exclude bot and sender
      );

      if (participants.length < 1) {
        await chat.reply(
          fonts.sans("Not enough users in the group to pair!")
        );
        return;
      }

      const randomIndex = Math.floor(Math.random() * participants.length);
      const pairedUserID = participants[randomIndex];

      const userInfo = await api.getUserInfo([event.senderID, pairedUserID]);
      const senderName = userInfo[event.senderID]?.name || "Unknown User";
      const pairedUserName = userInfo[pairedUserID]?.name || "Unknown User";
      const senderProfilePic = userInfo[event.senderID]?.thumbSrc || null;
      const pairedProfilePic = userInfo[pairedUserID]?.thumbSrc || null;

      const pairingMessage = fonts.sans(
        `${senderName} has been paired with ${pairedUserName}! 💕\nEnjoy your new connection!`
      );

      const attachments = [];
      if (senderProfilePic) {
        attachments.push({
          type: "photo",
          url: senderProfilePic,
          description: `${senderName}'s profile picture`,
        });
      }
      if (pairedProfilePic) {
        attachments.push({
          type: "photo",
          url: pairedProfilePic,
          description: `${pairedUserName}'s profile picture`,
        });
      }

      if (attachments.length > 0) {
        await chat.reply({
          body: pairingMessage,
          attachment: attachments,
        });
      } else {
        await chat.reply(
          fonts.sans(
            `${pairingMessage}\n(Note: Profile pictures could not be fetched.)`
          )
        );
      }
    } catch (error) {
      console.error("Pair command error:", error);
      await chat.reply(
        fonts.sans("An error occurred while pairing users or fetching profile pictures. Please try again.")
      );
    }
  },
};

export default command;
