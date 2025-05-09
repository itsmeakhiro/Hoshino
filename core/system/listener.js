// @ts-check
let isConnected = false;

/**
 * @type {Map<string, HoshinoLia.RepliesArg>}
 */
const replies = new Map();
import eventHandler from "./handler/eventHandler";
import commandHandler from "./handler/commandHandler";
import route from "./handler/apiHandler";
import HoshinoDB from "../../Hoshino/resources/plugins/database/utils";
const hoshinoDB = new HoshinoDB();
import {
  HoshinoUser,
  HoshinoEXP,
  HoshinoQuest,
} from "../../Hoshino/resources/plugins/level/utils";
import Inventory from "../../Hoshino/resources/plugins/inventory/utils";
import styler from "../../Hoshino/resources/styler/styler";
import fonts from "../../Hoshino/resources/styler/fonts";
import HoshinoHM from "../../Hoshino/resources/styler/hoshinohomemodular";
import { ChatContextor, ChatResult } from "./handler/chat";

/**
 *
 * @param {{ api: any; event: HoshinoLia.Event }} param0
 * @returns
 */
export default async function listener({ api, event }) {
  if (!isConnected) {
    isConnected = true;
    await hoshinoDB.connect();
  }

  const { prefix, developer } = global.Hoshino.config;
  if (!event.body) return;

  let hasPrefix = event.body.startsWith(prefix);
  let [commandName, ...args] = event.body.split(" ");
  commandName = commandName.toLowerCase();

  if (!hasPrefix) return;

  if (hasPrefix) {
    commandName = commandName.slice(prefix.length);
  }

  const command = global.Hoshino.commands.get(commandName);
  const chat = ChatContextor({ api, event, command, replies });

  /**
   * @type {HoshinoLia.CommandContext}
   * DO NOT REMOVE
   */
  const entryObj = {
    api,
    ChatContextor,
    chat,
    event,
    args,
    fonts,
    styler,
    route,
    hoshinoDB,
    HoshinoHM,
    replies,
    HoshinoUser,
    HoshinoEXP,
    HoshinoQuest,
    ChatResult,
    Inventory,
  };

  global.bot.emit("message", entryObj);

  if (
    event.type === "message_reply" &&
    event.messageReply &&
    replies.has(event.messageReply.messageID)
  ) {
    const target = replies.get(event.messageReply.messageID);
    if (target) {
      try {
        await target.callback({ ...entryObj, ReplyData: { ...target } });
      } catch (error) {
        console.log(
          "ERROR",
          error instanceof Error ? error.stack : JSON.stringify(error)
        );
      }
    }
  }

  const senderID = event.senderID;

  const admins = global.Hoshino.config.admin || [];
  const moderators = global.Hoshino.config.moderator || [];

  function hasPermission(type) {
    return (
      developer?.includes(senderID) ||
      (type === "admin"
        ? admins.includes(senderID)
        : moderators.includes(senderID) || admins.includes(senderID))
    );
  }

  const isAdmin = hasPermission("admin");
  const isModerator = hasPermission("moderator");

  function antiNSFW(name) {
    const nsfwKeywords = ["18+", "nsfw", "porn", "hentai", "lewd"];
    return nsfwKeywords.some((word) => name.includes(word));
  }

  if (antiNSFW(commandName)) {
    await chat.reply(
      fonts.sans("Warning: NSFW content is not allowed on Hoshino.")
    );
    return;
  }

  if (command) {
    // Check command permissions before execution
    if (
      command.manifest?.config?.privateOnly &&
      event.threadID !== event.senderID
    ) {
      return await chat.reply(
        fonts.sans("This command can only be used in private chats.")
      );
    }

    if (command.manifest.config?.admin && !isAdmin) {
      return await chat.reply(
        fonts.sans("This command is restricted to administrators.")
      );
    }

    if (command.manifest.config?.moderator && !isModerator) {
      return await chat.reply(
        fonts.sans("This command is restricted to moderators.")
      );
    }

    try {
      await command.deploy(entryObj);
    } catch (err) {
      console.error(`Error executing command "${commandName}":`, err);
      err instanceof Error ? await chat.reply(err?.stack ?? err.message) : null;
    }
    return;
  }

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
}
