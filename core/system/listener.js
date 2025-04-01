// @ts-check
let isConnected = false;

/**
 * @type {Map<string, HoshinoLia.RepliesArg>}
 */
const replies = new Map();;
const log = require("./logger"); 
const eventHandler = require("./handler/eventHandler");
const commandHandler = require("./handler/commandHandler");
const route = require("./handler/apisHandler");
const HoshinoDB = require("../Hoshino/resources/database/utils");
const hoshinoDB = new HoshinoDB();
const subprefixes = require("./handler/data/subprefixes.json");
const LevelSystem = require("../Hoshino/resources/plugins/level/utils");
const BalanceHandler = require("../Hoshino/resources/plugins/balance/utils");
const Inventory = require("../Hoshino/resources/plugins/inventory/utils");
const BankHandler = require("../Hoshino/resources/plugins/bank/utils");
const styler = require("../Hoshino/resources/styler/styler");
const fonts = require("../Hoshino/resources/styler/fonts");
const HoshinoHM = require("../Hoshino/resources/styler/hoshinohomemodular")

module.exports = async function listener({ api, event }) {
  if (!isConnected) {
    isConnected = true;
    await hoshinoDB.connect();
  }

  const { prefix, developers } = global.Hoshino.config;
  if (!event.body) return;

  const isGroup = event.threadID !== event.senderID;
  const groupSubprefix = isGroup ? subprefixes[event.threadID] : null;
  const usedPrefix = groupSubprefix || prefix;
  let hasPrefix = event.body.startsWith(usedPrefix);
  let [commandName, ...args] = event.body.split(" ");
  commandName = commandName.toLowerCase();

  if (hasPrefix) {
    commandName = commandName.slice(usedPrefix.length);
  }

  const command = global.Hoshino.commands.get(commandName);
  const chat = {
    send: (message, goal, noStyle = false) => {
      return new Promise(async (res, rej) => {
        if (!noStyle && command && command.style && command.font) {
          const { type, title, footer } = command.style;
          message = await styler(type, title, message, footer, command.font);
        }
        api.sendMessage(message, goal || event.threadID, (err, info) => {
          if (err) {
            rej(err);
          } else {
            res(info);
          }
        });
      });
    },
    reply: async (message, goal) => {
      return new Promise((res, rej) => {
        api.sendMessage(message, goal || event.threadID, (err, info) => {
          if (err) {
            rej(err);
          } else {
            res(info);
          }
        }, event.messageID);
      });
    },
  };

  /**
   * @type {HoshinoLia.CommandContext}
   */
  const entryObj = {
    api,
    chat,
    event,
    args,
    fonts,
    styler,
    route,
    hoshinoDB,
    HoshinoHM,
    replies,
    LevelSystem,
    BalanceHandler,
    Inventory,
  };

  global.bot.emit("message", entryObj);

  if (event.type === "message_reply" && event.messageReply && replies.has(event.messageReply.messageID)) {
    const target = replies.get(event.messageReply.messageID);
    if (target) {
      try {
        await target.callback({ ...entryObj, ReplyData: { ...target } });
      } catch (error) {
        log("ERROR", error instanceof Error ? error.stack : JSON.stringify(error));
      }
    }
  }

  const senderID = event.senderID;

  function antiNSFW(name) {
    const nsfwKeywords = ["18+", "nsfw", "porn", "hentai", "lewd"];
    return nsfwKeywords.some((word) => name.includes(word));
  }

  if (antiNSFW(commandName)) {
    await chat.reply(fonts.sans("Warning: NSFW content is not allowed on Hoshino."));
    return;
  }

  if (command) {
    const { config } = command.manifest;

    const admins = global.Hoshino.config.admins  || [];
    const moderators = global.Hoshino.config.moderators || [];

    function hasPermission(type) {
      return (
        developers?.includes(senderID) ||
        (type === "admin"
          ? admins.includes(senderID)
          : moderators.includes(senderID) || admins.includes(senderID))
      );
    }

    const isAdmin = hasPermission("admin");
    const isModerator = hasPermission("moderator");

    if (config?.admin && !isAdmin) {
      await chat.reply(fonts.sans("Access denied, you don't have rights to use this admin-only command."));
      return;
    }

    if (config?.moderator && !isModerator && !isAdmin) {
      await chat.reply(fonts.sans("Access denied, you don't have rights to use this moderator-only command."));
      return;
    }

    try {
      await command.deploy(entryObj);
    } catch (err) {
      console.error(`Error executing command "${commandName}":`, err);
      err instanceof Error ? await chat.reply(err?.stack) : null;
    }
    return;
  }

  if (!hasPrefix) return;

  await chat.reply(
    fonts.sans(
      global.Hoshino.commands.has("help")
        ? `"${commandName}" is not a valid command.\nUse "${usedPrefix}help" to see available commands.`
        : "Oh, you're doomed fam! I don't have a help command yet."
    )
  );

  switch (event.type) {
    case "message":
      commandHandler({ ...entryObj });
      break;
    case "event":
      eventHandler({ ...entryObj });
      break;
    case "message_reply":
      commandHandler({ ...entryObj });
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
};