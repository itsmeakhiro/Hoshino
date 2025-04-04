/* 
 * @type {HoshinoLia.Command}
*/
const command = {
  manifest: {
    name: "help",
    aliases: ["h", "?"],
    version: "1.0.0",
    developer: "Francis Loyd Raval",
    description: "Displays a list of available commands",
    category: "utility",
    cooldown: 0,
    usage: "help [command]",
    config: {
      developer: false,
      moderator: false,
      admin: false,
      privateOnly: false,
    }
  },
  async deploy({ chat, args }) {
    if (args.length > 0) {
      const commandName = args[0].toLowerCase();
      const command = global.Hoshino.commands.get(commandName);

      if (!command || !command.manifest) {
        return chat.send(`No command found with the name "${commandName}". Use "help" to see all commands.`);
      }

      const { name, description, usage, aliases } = command.manifest;
      const helpText = [
        `Command: ${name}`,
        `Description: ${description || "No description available"}`,
        `Usage: ${usage || name}`,
        aliases && aliases.length > 0 ? `Aliases: ${aliases.join(", ")}` : "",
      ].filter(Boolean).join("\n");

      return chat.send(helpText);
    }

    const uniqueCommands = new Map();
    for (const [_, cmd] of global.Hoshino.commands) {
      if (cmd.manifest && !uniqueCommands.has(cmd.manifest.name)) {
        uniqueCommands.set(cmd.manifest.name, cmd);
      }
    }

    const commandList = Array.from(uniqueCommands.entries())
      .map(([name, cmd]) => {
        const { description, aliases } = cmd.manifest;
        return `${name}${aliases && aliases.length > 0 ? ` (${aliases.join(", ")})` : ""} - ${description || "No description"}`;
      })
      .sort()
      .join("\n");

    const helpText = [
      "Available Commands:",
      commandList || "No commands loaded yet.",
      "Use `help <command>` for more details on a specific command."
    ].join("\n");

    return chat.send(helpText);
  }
};

module.exports = command;