/**
 * @type {HoshinoLia.Command}
 */
const command = {
  manifest: {
    name: "help",
    aliases: ["h", "?", "menu"],
    version: "1.0.0",
    developer: "Francis Loyd Raval",
    description: "Displays a list of available commands",
    category: "utility",
    cooldown: 0,
    usage: "help [command]",
    config: {
      moderator: false,
      admin: false,
      privateOnly: false,
    },
  },
  style: {
    type: "help1",
    title: "ＨＯＳＨＩＮＯ ＢＯＴ",
    footer: `You may use the command help [ command name ] to view the details \n\n**Developed by**: Francis Loyd Raval`,
  },
  font: {
    content: "sans",
    footer: "sans",
  },
  async deploy({ chat, args }) {
    if (args.length > 0) {
      const commandName = args[0].toLowerCase();
      const command = global.Hoshino.commands.get(commandName);

      if (!command || !command.manifest) {
        return chat.send(
          `No command found with the name "${commandName}". Use "help" to see all commands.`
        );
      }

      const { name, description, usage, aliases, version, developer } = command.manifest;
      const helpText = [
        `**Command**: ${name}`,
        `**Version**: ${version}`,
        `**Developer**: ${developer || "Unknown"}`,
        `**Description**: ${description || "No description available"}`,
        `**Usage**: ${usage || name}`,
        aliases && aliases.length > 0 ? `**Aliases**: ${aliases.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      return chat.send(helpText);
    }

    const uniqueCommands = new Map();
    for (const [_, cmd] of global.Hoshino.commands) {
      if (cmd.manifest && !uniqueCommands.has(cmd.manifest.name)) {
        uniqueCommands.set(cmd.manifest.name, cmd);
      }
    }

    const sortedCommands = Array.from(uniqueCommands.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );

    const commandList = sortedCommands
      .map(([name], index) => {
        return `〘  ${index + 1}  〙 ${name}`;
      })
      .join("\n");

    const helpText = [commandList || "No commands loaded yet."].join("\n");

    return chat.reply(helpText);
  },
};

module.exports = command;
