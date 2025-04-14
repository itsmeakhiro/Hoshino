/**
 * @type {HoshinoLia.Command}
 */
const command = {
  manifest: {
    name: "ban",
    aliases: ["unban"],
    version: "1.0.0",
    developer: "Francis Loyd Raval",
    description: "Ban or unban users from using the system",
    category: "admin",
    cooldown: 5,
    usage: "ban <userID> [reason] | unban <userID>",
    config: {
      moderator: false,
      admin: true,
      privateOnly: false,
    },
  },

  async deploy({ chat, fonts, event, args }) {
    const commandName = event.body.split(/\s+/)[0].toLowerCase();
    const isUnban = commandName.includes("unban");

    if (args.length < 1) {
      return await chat.reply(
        fonts.sans(`Please provide a user ID. Usage: ${this.manifest.usage}`)
      );
    }

    const targetID = args[0];
    const senderID = event.senderID;

    if (!isUnban && targetID === senderID) {
      return await chat.reply(fonts.sans("You cannot ban yourself."));
    }

    if (isUnban) {
      await chat.userUnban(targetID);
    } else {
      const reason = args.slice(1).join(" ") || "";
      await chat.userBan(targetID, reason);
    }
  },
};

module.exports = command;
