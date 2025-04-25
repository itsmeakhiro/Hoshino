const styler = require('./styler');

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
   */
  constructor(commands, icon = "✦", style = {}, font = {}) {
    if (!Array.isArray(commands)) {
      throw new Error("Commands must be an array.");
    }
    this.commands = new Map();
    for (const cmd of commands) {
      this.commands.set(cmd.subcommand, cmd);
      if (cmd.aliases && Array.isArray(cmd.aliases)) {
        for (const alias of cmd.aliases) {
          this.commands.set(alias, cmd);
        }
      }
    }
    this.icon = icon;
    this.style = style;
    this.font = font;
    console.log('HoshinoHM initialized with:', { style: this.style, font: this.font });
  }

  /**
   * @param {HoshinoLia.EntryObj} ctx
   */
  async runInContext(ctx) {
    const { args, chat, hoshinoDB, fonts, event } = ctx;
    const subcommand = args[0];

    if (!subcommand || !this.commands.has(subcommand)) {
      const list = [...new Set(this.commands.values())]
        .map((cmd) => {
          const aliases = cmd.aliases && cmd.aliases.length ? ` (aliases: ${cmd.aliases.join(", ")})` : "";
          const description = `${this.icon} ${cmd.subcommand}${aliases} → ${cmd.description}`;
          return cmd.usage ? `${description}\n   Usage: ${cmd.usage}` : description;
        })
        .join("\n");

      const stylerFn = ctx.styler || styler;

      try {
        const fontStyles = {
          title: this.font.title || undefined,
          content: this.font.content || undefined,
          footer: this.font.footer || undefined
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

    return this.commands.get(subcommand)?.deploy(ctx);
  }
}

module.exports = HoshinoHM;
