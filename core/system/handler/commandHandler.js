const fs = require("fs-extra");
const path = require("path");
const fonts = require("./styler/createFonts");
const route = require("./apisHandler");

const subprefixFile = path.join(__dirname, "./data/subprefixes.json");
const attachmentPath = path.join(__dirname, "./data/attachment/prefix.gif");

function getSubprefix(threadID) {
  try {
    const subprefixes = JSON.parse(fs.readFileSync(subprefixFile, "utf-8"));
    return subprefixes[threadID] || null;
  } catch {
    return null;
  }
}
// WARNING THIS IS UNUSED AND EVERYTHING IS IN LISTENER
// now it is used again - Francis.
module.exports = async function commandHandler({
  api,
  chat,
  event,
  args,
  ...extra
}) {
  if (!event.body) return;

  const isGroup = event.threadID !== event.senderID;
  const threadSubprefix = isGroup ? getSubprefix(event.threadID) : null;
  const mainPrefix = global.Tokito.prefix;
  const usedPrefix = isGroup ? threadSubprefix || mainPrefix : mainPrefix;

  if (!event.body.startsWith(usedPrefix)) {
    const loweredBody = event.body.trim().toLowerCase();

    if (loweredBody === "prefix") {
      let response = fonts.monospace(
        `▀█▀ █▀█ █▄▀ █ ▀█▀ █▀█\n░█░ █▄█ █░█ █ ░█░ █▄█`
      );

      response += `\nSYSTEM PREFIX: ${mainPrefix}`;
      if (threadSubprefix) response += `\nYOUR GC PREFIX: ${threadSubprefix}`;

      return await chat.send({
        body: response,
        attachment: fs.createReadStream(attachmentPath),
      });
    }
    return;
  }

  const [commandNameOrAlias, ...commandArgs] = event.body
    .slice(usedPrefix.length)
    .trim()
    .split(/\s+/);

  const commands = global.Tokito.commands;
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

    return await chat.send(fonts.sans(message));
  }

  const senderID = event.senderID;
  const cooldowns = global.Tokito.cooldowns;
  const userCooldowns = cooldowns.get(senderID) ?? {};

  const lastUsed = userCooldowns[commandNameOrAlias] ?? null;
  if (lastUsed !== null) {
    const elapsed = Date.now() - lastUsed;
    if (elapsed < command.manifest.cooldown * 1000) {
      const remaining = (
        (command.manifest.cooldown * 1000 - elapsed) /
        1000
      ).toFixed(1);
      return await chat.send(
        fonts.sans(
          `Please wait ${remaining} seconds before using "${commandNameOrAlias}" again.`
        )
      );
    }
  }

  if (!global.Tokito.popularCommands) global.Tokito.popularCommands = new Map();
  if (!global.Tokito.recentCommands) global.Tokito.recentCommands = [];

  global.Tokito.recentCommands.unshift(commandNameOrAlias);
  if (global.Tokito.recentCommands.length > 10)
    global.Tokito.recentCommands.pop();

  const count = global.Tokito.popularCommands.get(commandNameOrAlias) || 0;
  global.Tokito.popularCommands.set(commandNameOrAlias, count + 1);

  try {
    await command.deploy({
      api,
      chat,
      event,
      args: commandArgs,
      fonts,
      route,
      ...extra,
    });

    userCooldowns[commandNameOrAlias] = Date.now();
    cooldowns.set(senderID, userCooldowns);
  } catch (error) {
    console.error(`Error executing command "${commandNameOrAlias}":`, error);
    await chat.send(
      `An error occurred while executing the command: ${
        error instanceof Error ? error.message : JSON.stringify(error)
      }`
    );
  }
};