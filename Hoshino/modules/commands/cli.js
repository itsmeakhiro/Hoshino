const axios = require("axios").default;
const util = require("util");

/**
 * @type {HoshinoLia.Command}
 */
const command = {
  manifest: {
    name: "cli",
    aliases: ["test"],
    developer: "Francis Loyd Raval",
    description: "Test APIs or execute JavaScript code",
    category: "developer",
    cooldown: 0,
    usage: "cli curl <URL> | cli eval <code>",
    config: {
      botAdmin: true,
      botModerator: false,
    },
  },
  style: {
    type: "design",
    title: "⏤͟͟͞͞   𝗖𝗟𝗜 𝖳𝖾𝗌𝗍𝖾𝗋",
    footer: "Developed By: Francis Loyd Raval",
  },
  font: {
    content: "sans",
    footer: "sans",
  },
  async deploy({ chat, args, fonts, event, api, replies }) {
    if (args.length < 2) {
      return chat.send(`Welcome to ${fonts.bold(
        "CLI"
      )} Tester made by Francis Loyd Raval, Here's some function(s) that may help you
      
 ⦿ ${fonts.bold(
   "curl"
 )} use to test your personalized or someone's ${fonts.bold("API")}.
  ${fonts.bold("USAGE: ")} curl [ API LINK WITH THE ENDPOINT ]
      
 ⦿ ${fonts.bold(
   "eval"
 )} use to evaluate or to test your JavaScript codes using the Tokito Functions.
  ${fonts.bold("USAGE: ")} eval [ JavaScript Code ]
      
ℹ️ This is meant for educational or for API testing only. Use it at your own risk.`);
    }
    const command = args.shift()?.toLowerCase();
    const input = args.join(" ");

    switch (command) {
      case "curl":
        if (!input.startsWith("http")) return chat.send("Invalid URL.");
        try {
          const response = await axios.get(input);
          let data = response.data;

          if (typeof data !== "string") {
            data = JSON.stringify(data, null, 2);
          }

          if (!data) return;

          return chat.send(`Response:\n${data.slice(0, 2000)}`);
        } catch (error) {
          return chat.send(
            `Error fetching API:\n${
              error instanceof Error ? error.message : JSON.stringify(error)
            }`
          );
        }

      case "eval":
        try {
          let result = eval(input);

          if (typeof result !== "string") {
            result = util.inspect(result);
          }

          if (!result || result.trim() === "") return;

          return chat.send(`Output:\n${result.slice(0, 2000)}`);
        } catch (error) {
          return chat.send(
            `Error:\n${
              error instanceof Error ? error.message : JSON.stringify(error)
            }`
          );
        }

      default:
        return chat.send(
          "Unknown command. Use `cli curl <URL>` or `cli eval <code>`."
        );
    }
  },
};

module.exports = command;