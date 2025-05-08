// DO NOT REMOVE HoshinoLia.Command, do not add types on async deploy ctx
const command: HoshinoLia.Command = {
  manifest: {
    name: "out",
    aliases: ["leave", "exit"],
    version: "1.0.0",
    developer: "Francis Loyd Raval",
    description: "Makes the bot leave the group",
    category: "admin",
    cooldown: 0,
    usage: "out",
    config: {
      admin: true,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "👋 LEAVING",
    footer: `Developed by: Francis Loyd Raval`,
  },
  font: {
    title: "bold",
    content: "sans",
    footer: "sans",
  },
  async deploy({ chat, api, event, fonts }) {
    await chat.reply(
      fonts.sans(
        "Leaving this group chat. Thank you for your cooperation. Until we meet again."
      )
    );
    setTimeout(() => {
      api.removeUserFromGroup(api.getCurrentUserID(), event.threadID);
    }, 1500);
  },
};

export default command;
