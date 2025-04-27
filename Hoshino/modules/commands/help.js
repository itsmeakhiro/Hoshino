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
    usage: "help [command | page <number>]",
    config: {
      moderator: false,
      admin: false,
      privateOnly: false,
    },
  },
  style: {
    type: "help1",
    title: "ＨＯＳＨＩＮＯ ＢＯＴ",
    footer: `        〘 𝚅𝙴𝚁𝚂𝙸𝙾𝙽 𝟸.𝟶.𝟶 〙`,
  },
  font: {
    content: "sans",
    footer: "sans",
  },
  async deploy({ chat, args }) {
    if (args.length > 0 && args[0].toLowerCase() !== "page") {
      const commandName = args[0].toLowerCase();
      const command = global.Hoshino.commands.get(commandName);

      if (!command || !command.manifest) {
        return chat.send(
          `No command found with the name "${commandName}". Use "help" to see all commands.`
        );
      }

      const { name, description, usage, aliases, version, developer } =
        command.manifest;
      const helpText = [
        `**Command**: ${name}`,
        `**Version**: ${version}`,
        `**Developer**: ${developer || "Unknown"}`,
        `**Description**: ${description || "No description available"}`,
        `**Usage**: ${usage || name}`,
        aliases && aliases.length > 0
          ? `**Aliases**: ${aliases.join(", ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

      return chat.send(helpText);
    }

    /**
     * @type {Map<string, HoshinoLia.Command>}
     */
    const uniqueCommands = new Map();
    for (const [_, cmd] of global.Hoshino.commands) {
      if (cmd.manifest && !uniqueCommands.has(cmd.manifest.name)) {
        uniqueCommands.set(cmd.manifest.name, cmd);
      }
    }

    const sortedCommands = Array.from(uniqueCommands.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );

    const commandsPerPage = 10;
    const totalCommands = sortedCommands.length;
    const totalPages = Math.ceil(totalCommands / commandsPerPage);

    let page = 1;
    if (args.length > 1 && args[0].toLowerCase() === "page") {
      const requestedPage = parseInt(args[1]);
      if (!isNaN(requestedPage) && requestedPage > 0 && requestedPage <= totalPages) {
        page = requestedPage;
      } else {
        return chat.send(
          `Invalid page number. Please use a number between 1 and ${totalPages}.`
        );
      }
    }

    const startIndex = (page - 1) * commandsPerPage;
    const endIndex = startIndex + commandsPerPage;
    const paginatedCommands = sortedCommands.slice(startIndex, endIndex);

    const commandList = paginatedCommands
      .map(([name, cmd], index) => {
        return `**${startIndex + index + 1}**. ${name}\n  **Description**: ${
          cmd.manifest.description || "No description available"
        }\n  **Usage**: ${cmd.manifest.usage || name}`;
      })
      .join("\n\n");

    const helpText = [
      commandList || "No commands loaded yet.",
      `\n\n             Page **${page} | ${totalPages}**`,
      totalPages > 1 || "";
    ]
      .filter(Boolean)
      .join("\n");

    return chat.reply(helpText);
  },
};

export default command;
