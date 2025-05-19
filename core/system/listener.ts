let isConnected = false;

const replies: Map<string, HoshinoLia.RepliesArg> = new Map();
import eventHandler from "@sys-handler/eventHandler";
import commandHandler from "@sys-handler/commandHandler";
import route from "@sys-handler/apiHandler";
import HoshinoDB from "@plugins/database/utils";
const hoshinoDB = new HoshinoDB();
import { HoshinoUser, HoshinoEXP, HoshinoQuest } from "@plugins/level/utils";
import Inventory from "@plugins/inventory/utils";
import styler from "@styler/styler";
import fonts from "@styler/fonts";
import HoshinoHM from "@styler/hoshinohomemodular";
import { ChatContextor, ChatResult } from "@sys-handler/chat";

const commandCooldowns = new Map();

/**
 * Restricts command usage based on cooldown per user and command.
 * @param senderID - The ID of the sender.
 * @param commandName - The name of the command.
 * @param cooldownSeconds - Cooldown duration in seconds.
 * @returns {{ allowed: boolean, remaining?: number }} - Whether the command is allowed and remaining cooldown time (if blocked).
 */
export function restrictCooldown(
  senderID: string,
  commandName: string,
  cooldownSeconds: number = 5
): { allowed: boolean; remaining?: number } {
  const key = `${senderID}:${commandName}`;
  const lastUsed = commandCooldowns.get(key);
  const now = Date.now();

  if (lastUsed) {
    const elapsedSeconds = (now - lastUsed) / 1000;
    if (elapsedSeconds < cooldownSeconds) {
      return {
        allowed: false,
        remaining: Math.ceil(cooldownSeconds - elapsedSeconds),
      };
    }
  }

  commandCooldowns.set(key, now);
  return { allowed: true };
}

/**
 * Restricts web users from accessing commands with admin or moderator permissions.
 * @param event - The event object containing isWeb and senderID.
 * @param senderID - The ID of the sender.
 * @param developer - Array of developer IDs from config.
 * @param admins - Array of admin IDs from config.
 * @param moderators - Array of moderator IDs from config.
 * @param command - The command object from global.Hoshino.commands.
 * @returns - Returns true if the user is allowed to proceed, false if blocked.
 */
export function restrictWebPermissions(
  event: HoshinoLia.Event,
  senderID: string,
  developer: string[],
  admins: string[],
  moderators: string[],
  command: any
): boolean {
  if (
    event.isWeb &&
    command?.manifest?.config &&
    (command.manifest.config.admin || command.manifest.config.moderator)
  ) {
    return false;
  }
  return true;
}

/**
 *
 * @param {{ api: any; event: HoshinoLia.Event }} param0
 * @returns
 */
export default async function listener({
  api,
  event,
}: {
  api: any;
  event: HoshinoLia.Event;
}) {
  if (!isConnected) {
    isConnected = true;
    await hoshinoDB.connect();
  }

  const { prefix } = global.Hoshino.config;

  let hasPrefix = "body" in event ? event.body.startsWith(prefix) : false;
  let [commandName, ...args] = "body" in event ? event.body.split(" ") : [""];
  commandName = String(commandName).toLowerCase();

  if (hasPrefix) {
    commandName = commandName.slice(prefix.length);
  }

  const command = global.Hoshino.commands.get(commandName);
  const chat = ChatContextor({ api, event, command, replies });

  /**
   * DO NOT REMOVE
   */
  const entryObj: HoshinoLia.CommandContext = {
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
    restrictWebPermissions,
    restrictCooldown,
    command,
    hasPrefix,
    commandName,
    get entryObj() {
      return entryObj;
    },
  };

  global.bot.emit("message", entryObj);

  if (
    event.type === "message" &&
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
      console.log(`Unhandled event type: ${(event as any).type}`);
  }
}
