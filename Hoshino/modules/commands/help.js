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
    usage: "help [command | page number]",
    config: {
      moderator: false,
      admin: false,
      privateOnly: false,
    },
  },
  style: {
    type: "help1",
    title: `📚 **HOSHINO** COMMAND\nPage {pageNum} / {totalPages}`,
    footer: `You may use the command help [command | page number] to view details or a specific page \n\n**Developed by**: Francis Loyd Raval`,
  },
  font: {
    title: "Sans",
    content: "sans",
    footer: "sans",
  },
  async deploy({ chat, args }) {
    const commandsPerPage = 10;
    const uniqueCommands = new Map();
    for (const [_, cmd] of global.Hoshino.commands) {
      if (cmd.manifest && !uniqueCommands.has(cmd.manifest.name)) {
        uniqueCommands.set(cmd.manifest.name, cmd);
      }
    }
    const sortedCommands = Array.from(uniqueCommands.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    const totalCommands = sortedCommands.length;
    const totalPages = Math.ceil(totalCommands / commandsPerPage);

    if (args.length > 0) {
      const input = args[0].toLowerCase();
      const pageNum = parseInt(input);

      if (!isNaN(pageNum)) {
        if (pageNum <= 0 || pageNum > totalPages) {
          return chat.reply(`Page ${pageNum} does not exist. There are only ${totalPages} pages.`);
        }

        const startIndex = (pageNum - 1) * commandsPerPage;
        const endIndex = startIndex + commandsPerPage;
        const pageCommands = sortedCommands.slice(startIndex, endIndex);

        const commandList = pageCommands
          .map(([name], index) => {
            const globalIndex = startIndex + index + 1;
            return `〘  ${globalIndex}  〙 ${name}`;
          })
          .join("\n");

        const helpText = [
          `**Page ${pageNum} of ${totalPages}**`,
          commandList || "No commands available.",
        ].join("\n");

        return chat.reply(helpText);
      }

      let command = global.Hoshino.commands.get(input);
      if (!command) {
        for (const [_, cmd] of global.Hoshino.commands) {
          if (cmd.manifest?.aliases?.includes(input)) {
            command = cmd;
            break;
          }
        }
      }

      if (!command || !command.manifest) {
        return chat.reply(
          `No command found with the name or alias "${input}". Use "help" to see all commands.`
        );
      }

      const { name, description, usage, aliases, version, developer } = command.manifest;
      const helpText = [
        `**Command**: ${name}`,
        `**Version**: ${version}`,
        `**Developer**: ${developer || "Unknown"}`,
        `**Description**: ${description || "No description available"}`,
        `**Usage**: ${usage || name}`,
        aliases && aliases.length > 0 ? `**Aliases**: ${aliases.join(", ")}` : null,
      ]
        .filter(line => line !== null)
        .join("\n");

      return chat.reply(helpText);
    }

    const pageCommands = sortedCommands.slice(0, commandsPerPage);
    const commandList = pageCommands
      .map(([name], index) => `〘  ${index + 1}  〙 ${name}`)
      .join("\n");

    const helpText = [
      `**Page 1 of ${totalPages}**`,
      commandList || "No commands loaded yet.",
    ].join("\n");

    return chat.reply(helpText);
  },
};

module.exports = command;
