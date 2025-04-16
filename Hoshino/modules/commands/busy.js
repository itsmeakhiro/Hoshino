// DO NOT MODIFY, THIS SERVES AS A NEW COMMAND
const fs = require("fs");
const path = require("path");

/**
 * @type {HoshinoLia.Command}
 */

const command = {
  manifest: {
    name: "busy",
    aliases: ["b"],
    version: "1.0.0",
    developer: "Francis Loyd Raval",
    description: "Manages user busy status with a reason, saved to JSON, with group chat mention notifications",
    category: "utility",
    cooldown: 5000,
    usage: ["busy set <true|false> [reason]", "busy check"],
    config: {
      admin: false,
      moderator: false,
      privateOnly: false,
    },
  },
  async deploy(ctx) {
    const pluginsDir = path.join(__dirname, "plugins");
    const busyFile = path.join(pluginsDir, "busyUsers.json");

    if (!fs.existsSync(pluginsDir)) {
      fs.mkdirSync(pluginsDir, { recursive: true });
    }
    if (!fs.existsSync(busyFile)) {
      fs.writeFileSync(busyFile, JSON.stringify({}));
    }

    let busyUsers = {};
    try {
      busyUsers = JSON.parse(fs.readFileSync(busyFile));
    } catch (error) {
      await ctx.chat.send("Error reading busy users data. Please try again.");
      return;
    }

    const home = new ctx.HoshinoHM(
      [
        {
          subcommand: "set",
          description: "Sets your busy status (true or false) with an optional reason.",
          async deploy({ chat, args, event }) {
            const senderID = event.senderID;
            if (!args[0] || !["true", "false"].includes(args[0].toLowerCase())) {
              await chat.send("Please specify 'true' or 'false'. Usage: busy set <true|false> [reason]");
              return;
            }
            const isBusy = args[0].toLowerCase() === "true";
            const reason = args.length > 1 ? args.slice(1).join(" ").slice(0, 100) : null;
            if (isBusy) {
              busyUsers[senderID] = { busy: true, reason };
            } else {
              delete busyUsers[senderID];
            }
            try {
              fs.writeFileSync(busyFile, JSON.stringify(busyUsers, null, 2));
            } catch (error) {
              await chat.send("Error saving busy status. Please try again.");
              return;
            }
            let response = `Your busy status is now set to: ${isBusy ? "Busy" : "Not Busy"}`;
            if (isBusy && reason) {
              response += `\nReason: ${reason}`;
            }
            await chat.send(response);
          },
        },
        {
          subcommand: "check",
          description: "Checks your current busy status and reason (if any).",
          async deploy({ chat, event }) {
            const senderID = event.senderID;
            const userData = busyUsers[senderID] || { busy: false, reason: null };
            const status = userData.busy ? "Busy" : "Not Busy";
            let response = `Your current status: ${status}`;
            if (userData.busy && userData.reason) {
              response += `\nReason: ${userData.reason}`;
            }
            await chat.send(response);
          },
        },
      ],
      "◆"
    );

    if (ctx.event && ctx.event.mentions && ctx.event.isGroup) {
      const mentions = ctx.event.mentions;
      for (const mentionedID in mentions) {
        if (mentionedID === ctx.event.senderID) continue;
        const userData = busyUsers[mentionedID];
        if (userData && userData.busy) {
          let response = `<User ${mentionedID}> is currently busy.`;
          if (userData.reason) {
            response += `\nReason: ${userData.reason}`;
          }
          await ctx.chat.send(response);
        }
      }
    }

    await home.runInContext(ctx);
  },
};
module.exports = command;
