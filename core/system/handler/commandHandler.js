import fonts from "../../../Hoshino/resources/styler/fonts";
import route from "./apiHandler";

/**
 *
 * @param {HoshinoLia.CommandContext} param0
 * @returns
 */
export default async function commandHandler({
  api,
  chat,
  event,
  args,
  ...extra
}) {
  if (!event.body) return;
  const { senderID } = event;

  const mainPrefix = global.Hoshino.config.prefix;
  const usedPrefix = mainPrefix;

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
}
