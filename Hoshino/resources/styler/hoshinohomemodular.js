class HoshinoHM {
    /**
     * @typedef {Object} Command
     * @property {string} subcommand - The subcommand name.
     * @property {string} description - The description of the subcommand.
     * @property {(ctx: TokitoLia.EntryObj) => Promise<any>} deploy - The function to execute the subcommand.
     */
  
    /**
     * @param {Command[]} commands - An array of command objects.
     * @param {string} [icon="✦"] - The icon to use for the commands.
     */
    constructor(commands, icon = "✦") {
      if (!Array.isArray(commands)) {
        throw new Error("Commands must be an array.");
      }
      this.commands = new Map(commands.map((cmd) => [cmd.subcommand, cmd]));
      this.icon = icon;
    }
  
    /**
     * @param {TokitoLia.EntryObj} ctx
     */
    async runInContext(ctx) {
      const { args, chat } = ctx;
      const subcommand = args[0];
  
      if (!subcommand || !this.commands.has(subcommand)) {
        const list = [...this.commands.values()]
          .map((cmd) => `${this.icon} ${cmd.subcommand} → ${cmd.description}`)
          .join("\n");
        return chat.send(`Available subcommands:\n\n${list}`);
      }
  
      return this.commands.get(subcommand)?.deploy(ctx);
    }
  }
  
  module.exports = HoshinoHM;
