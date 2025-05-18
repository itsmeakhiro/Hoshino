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

const commandCooldowns = new Map();

/**
 * Restricts command usage based on cooldown per user and command.
 * @param {string} senderID - The ID of the sender.
 * @param {string} commandName - The name of the command.
 * @param {number} cooldownSeconds - Cooldown duration in seconds.
 * @returns {{ allowed: boolean, remaining?: number }} - Whether the command is allowed and remaining cooldown time (if blocked).
 */
function restrictCooldown(senderID, commandName, cooldownSeconds = 5) {
  const key = `${senderID}:${commandName}`;
  const lastUsed = commandCooldowns.get(key);
  const now = Date.now();

  if (lastUsed) {
    const elapsedSeconds = (now - lastUsed) / 1000;
    if (elapsedSeconds < cooldownSeconds) {
      return { allowed: false, remaining: Math.ceil(cooldownSeconds - elapsedSeconds) };
    }
  }

  commandCooldowns.set(key, now);
  return { allowed: true };
}

/**
 * Restricts web users from accessing developer, admin, or moderator functions if the command requires them.
 * @param {HoshinoLia.Event} event - The event object containing isWeb and senderID.
 * @param {string} senderID - The ID of the sender.
 * @param {string[]} developer - Array of developer IDs from config.
 * @param {string[]} admins - Array of admin IDs from config.
 * @param {string[]} moderators - Array of moderator IDs from config.
 * @param {any} command - The command object from global.Hoshino.commands.
 * @returns {boolean} - Returns true if the user is allowed to proceed, false if blocked.
 */
function restrictWebPermissions(event, senderID, developer, admins, moderators, command) {
  if (event.isWeb && command?.manifest?.config && (command.manifest.config.admin || command.manifest.config.moderator)) {
    return developer?.includes(senderID) || admins.includes(senderID) || moderators.includes(senderID);
  }
  return true;
}

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
          "Reply callback error:",
          error instanceof Error ? error.stack : JSON.stringify(error)
        );
      }
    }
    return;
  }

  const senderID = event.senderID;
  const admins = global.Hoshino.config.admin || [];
  const moderators = global.Hoshino.config.moderator || [];

  if (!restrictWebPermissions(event, senderID, developer, admins, moderators, command)) {
    await chat.reply(
      fonts.sans("Web users cannot access developer, admin, or moderator functions.")
    );
    return;
  }

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
    const cooldownCheck = restrictCooldown(senderID, commandName, command.manifest?.cooldown ?? 5);
    if (!cooldownCheck.allowed) {
      await chat.reply(
        fonts.sans(
          `Please wait ${cooldownCheck.remaining} seconds before using "${commandName}" again.`
        )
      );
      return;
    }

    if (
      command.manifest?.config?.privateOnly &&
      event.threadID !== event.senderID
    ) {
      await chat.reply(
        fonts.sans("This command can only be used in private chats.")
      );
      return;
    }

    if (command.manifest.config?.admin && !isAdmin) {
      await chat.reply(
        fonts.sans("This command is restricted to administrators.")
      );
      return;
    }

    if (command.manifest.config?.moderator && !isModerator) {
      await chat.reply(
        fonts.sans("This command is restricted to moderators.")
      );
      return;
    }

    try {
      const result = await command.deploy(entryObj);
      if (result && typeof result === "object" && result.status === "success") {
        return;
      }
    } catch (err) {
      if (err instanceof Error) {
        console.error(`Error executing command "${commandName}":`, err);
        await chat.reply(
          fonts.sans("Sorry, an error occurred. Please try again.")
        );
      }
    }
    return;
  }

  if (hasPrefix && !command) {
    await chat.reply(
      fonts.sans(
        `Unknown command: "${commandName}". Use "${prefix}help" to view available commands.`
      )
    );
    return;
  }

  if (!hasPrefix) {
    if (event.isWeb && event.body.trim() && event.type !== "message_reply") {
      await chat.reply(
        fonts.sans(
          `Please use the prefix "${prefix}" to invoke a command (e.g., ${prefix}help).`
        )
      );
      return;
    }
  }

  switch (event.type) {
    case "message":
      // commandHandler({ ...entryObj });
      break;
    case "event":
      eventHandler({ ...entryObj });
      break;
    case "message_reply":
      // commandHandler({ ...entryObj });
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}