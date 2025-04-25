const styler = require('./styler'); 

/**
 * @typedef {Object} Command
 * @property {string} subcommand - The subcommand name.
 * @property {string} description - The description of the subcommand.
 * @property {(ctx: HoshinoLia.EntryObj) => Promise<any>} deploy - The function to execute the subcommand.
 */
class HoshinoHM {
  /**
   * @param {Command[]} commands - An array of command objects.
   * @param {string} [icon="✦"] - The icon to use for the commands.
   * @param {Object} [style] - Styling options for the command list (e.g., type, title, footer).
   * @param {Object} [font] - Font styles for title, content, and footer.
   */
  constructor(commands, icon = "✦", style = {}, font = {}) {
    if (!Array.isArray(commands)) {
      throw new Error("Commands must be an array.");
    }
    this.commands = new Map(commands.map((cmd) => [cmd.subcommand, cmd]));
    this.icon = icon;
    this.style = style; 
    this.font = font;
  }

  /**
   * @param {HoshinoLia.EntryObj} ctx
   */
  async runInContext(ctx) {
    const { args, chat, hoshinoDB, fonts, event } = ctx;
    const subcommand = args[0];

    if (!subcommand || !this.commands.has(subcommand)) {
      const list = [...this.commands.values()]
        .map((cmd) => `${this.icon} ${cmd.subcommand} → ${cmd.description}`)
        .join("\n");

      const stylerFn = ctx.styler || styler;

      try {
        const formattedList = stylerFn(
          this.style.type || 'default', 
          this.style.title || '**Available Commands**', 
          list, 
          this.style.footer || 'Use a subcommand to proceed.', 
            {
            title: this.font.title || 'bold', 
            content: this.font.content || 'italic', 
            footer: this.font.footer || ['bold', 'italic'] 
            }
        );
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
