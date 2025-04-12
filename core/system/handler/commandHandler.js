const fs = require("fs").promises;
const path = require("path");
const fonts = require("../../../Hoshino/resources/styler/fonts");
const route = require("./apiHandler");

/**
 *
 * @param {HoshinoLia.CommandContext} param0
 * @returns
 */
module.exports = async function commandHandler({
  api,
  chat,
  event,
  args,
  ...extra
}) {
  if (!event.body) return;

  const mainPrefix = global.Hoshino.config.prefix;
  const usedPrefix = mainPrefix;

  const senderID = event.senderID;
  const pluginsDir = path.join(__dirname, "..", "..", "plugins");
  const BAN_FILE = path.join(pluginsDir, "bannedUsers.json");

  // Create plugins directory if it doesn't exist
  try {
    await fs.mkdir(pluginsDir, { recursive: true });
  } catch (error) {
    console.error("Error creating plugins directory:", error);
    throw new Error("Failed to create plugins directory.");
  }

  const loadBannedUsers = async () => {
    try {
      const data = await fs.readFile(BAN_FILE, "utf8");
      return JSON.parse(data);
    } catch {
      await fs.writeFile(BAN_FILE, JSON.stringify([], null, 2));
      return [];
    }
  };

  const bannedUsers = await loadBannedUsers();
  if (bannedUsers.some((ban) => ban.userID === senderID)) {
    return await chat.reply(
      fonts.sans("You are banned from using this system.")
    );
  }

  const [commandNameOrAlias, ...commandArgs] = event.body
    .slice(usedPrefix.length)
    .trim()
    .split(/\s+/);

  const commands = global.Hoshino.commands;
  const command =
    commands.get(commandNameOrAlias) ||
    [...commands.values()].find((cmd) =>
      cmd.manifest.aliases?.includes(commandNameOrAlias)
    );

  if (!command) {
    const helpCommand =
      commands.get("help") ||
      [...commands.values()].find((cmd) =>
        cmd.manifest.aliases?.includes("help")
      );

    const message = helpCommand
      ? `Unknown command: "${commandNameOrAlias}". Use "${usedPrefix}help" to view available commands.`
      : `Unknown command: "${commandNameOrAlias}".`;

    return await chat.reply(fonts.sans(message));
  }

  if (command.manifest.config.privateOnly && event.threadID !== event.senderID) {
    return await chat.reply(
      fonts.sans("This command can only be used in private chats.")
    );
  }

  if (command.manifest.config.admin && !extra.isAdmin) {
    return await chat.reply(
      fonts.sans("This command is restricted to administrators.")
    );
  }
  if (command.manifest.config.moderator && !extra.isModerator) {
    return await chat.reply(
      fonts.sans("This command is restricted to moderators.")
    );
  }

  const cooldowns = global.Hoshino.cooldowns;
  const userCooldowns = cooldowns.get(senderID) ?? {};

  const lastUsed = userCooldowns[commandNameOrAlias] ?? null;
  if (lastUsed !== null && command.manifest.cooldown) {
    const elapsed = Date.now() - lastUsed;
    if (elapsed < command.manifest.cooldown * 1000) {
      const remaining = (
        (command.manifest.cooldown * 1000 - elapsed) /
        1000
      ).toFixed(1);
      return await chat.reply(
        fonts.sans(
          `Please wait ${remaining} seconds before using "${commandNameOrAlias}" again.`
        )
      );
    }
  }

  try {
    await command.deploy({
      ...extra,
      api,
      chat,
      event,
      args: commandArgs,
      fonts,
      route,
    });

    userCooldowns[commandNameOrAlias] = Date.now();
    cooldowns.set(senderID, userCooldowns);
  } catch (error) {
    console.error(`Error executing command "${commandNameOrAlias}":`, error);
    await chat.reply(
      fonts.sans(
        `An error occurred while executing the command: ${
          error instanceof Error ? error.message : JSON.stringify(error)
        }`
      )
    );
  }
};
