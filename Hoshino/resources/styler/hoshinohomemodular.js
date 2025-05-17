import styler from './styler';

/**
 * @typedef {Object} Command
 * @property {string} subcommand - The subcommand name.
 * @property {string[]} [aliases] - Alternate names for the subcommand (optional).
 * @property {string} description - The description of the subcommand.
 * @property {string} [usage] - Usage instructions for the subcommand (optional).
 * @property {(ctx: HoshinoLia.EntryObj) => Promise<any>} deploy - The function to execute the subcommand.
 */
class HoshinoHM {
  /**
   * @param {Command[]} commands - An array of command objects.
   * @param {string} [icon="✦"] - The icon to use for the commands.
   * @param {Object} [style] - Styling options for the command list.
   * @param {Object} [font] - Font styles for title, content, and footer.
   * @param {string} [introMessage] - Optional introductory message for the command list.
   */
  constructor(commands, icon = "✦", style = {}, font = {}, introMessage = "") {
    if (!Array.isArray(commands)) {
      throw new Error("Commands must be an array.");
    }
    this.commands = new Map();
    for (const cmd of commands) {
      if (!cmd.subcommand || !cmd.description || !cmd.deploy) {
        throw new Error(`Invalid command object: ${JSON.stringify(cmd)}`);
      }
      this.commands.set(cmd.subcommand, cmd);
      if (cmd.aliases && Array.isArray(cmd.aliases)) {
        for (const alias of cmd.aliases) {
          if (this.commands.has(alias)) {
            console.warn(`Alias "${alias}" already exists for another command.`);
          } else {
            this.commands.set(alias, cmd);
          }
        }
      }
    }
    this.icon = icon;
    this.style = style;
    this.font = font;
    this.introMessage = introMessage;
    console.log('HoshinoHM initialized with:', { style: this.style, font: this.font, introMessage: this.introMessage });
  }

  /**
   * Formats the command list with an optional introductory message.
   * @private
   * @returns {string} The formatted command list.
   */
  formatCommandList() {
    const commandList = [...new Set(this.commands.values())]
      .map((cmd) => {
        const aliases = cmd.aliases && cmd.aliases.length ? ` (aliases: ${cmd.aliases.join(", ")})` : "";
        const description = `${this.icon} ${cmd.subcommand}${aliases} → ${cmd.description}`;
        return cmd.usage ? `${description}\n   **Usage:** ${cmd.usage}` : description;
      })
      .join("\n\n");
    return this.introMessage ? `${this.introMessage}\n\n${commandList}` : commandList;
  }

  /**
   * @param {HoshinoLia.EntryObj} ctx
   */
  async runInContext(ctx) {
    const { args, chat, hoshinoDB, fonts, event } = ctx;
    const subcommand = args[0];

    if (!subcommand || !this.commands.has(subcommand)) {
      const list = this.formatCommandList();
      const stylerFn = typeof ctx.styler === 'function' ? ctx.styler : styler;
      if (typeof stylerFn !== 'function') {
        console.error('Styler function is not defined.');
        return await chat.reply(`Error: Styler function unavailable.\n${list}`);
      }

      try {
        const fontStyles = {
          title: this.font.title || 'Arial',
          content: this.font.content || 'Arial',
          footer: this.font.footer || 'Arial'
        };
        console.log('Applying styler with:', {
          type: this.style.type || 'default',
          title: this.style.title || '',
          content: list,
          footer: this.style.footer || '',
          fontStyles
        });

        const formattedList = stylerFn(
          this.style.type || 'default',
          this.style.title || '',
          list,
          this.style.footer || '',
          fontStyles
        );
        console.log('Formatted output:', formattedList);
        return await chat.reply(formattedList);
      } catch (error) {
        console.error('Styler error:', error);
        return await chat.reply(`Error formatting command list:\n${list}`);
      }
    }

    try {
      return await this.commands.get(subcommand)?.deploy(ctx);
    } catch (error) {
      console.error(`Error executing command ${subcommand}:`, error);
      return await chat.reply(`Error executing command: ${subcommand}`);
    }
  }
}

export default HoshinoHM;
