const styler = require("../../../Hoshino/resources/styler/styler");
const { MethodContextor } = require("./callable-obj-dist");

const ChatContextor = MethodContextor(
  {
    /**
     * @type {Record<string, any> | null}
     */
    event: null,
    /**
     * @type {HoshinoLia.Command | null}
     */
    command: null,

    styler,
    /**
     * @type {any}
     */
    api: null,
    /**
     * Sends a styled or plain message to the thread.
     * @param {HoshinoLia.MessageForm} message - Message to send
     * @param {string} [goal] - Thread ID (defaults to current thread)
     * @param {boolean} [noStyle=false] - If true, skip styling
     * @returns {Promise<any>} - Message send info or error
     */
    async send(message, goal, noStyle = false) {
      try {
        return await new Promise((res, rej) => {
          this.api.sendMessage(
            noStyle ? message : this.processStyle(message),
            goal || this.event?.threadID,
            (err, info) => {
              if (err) rej(err);
              else res(info);
            }
          );
        });
      } catch (err) {
        throw err;
      }
    },

    /**
     * Replies to a specific message in the thread.
     * @param {HoshinoLia.MessageForm} message - Reply content
     * @param {string} [goal] - Thread ID (defaults to current thread)
     * @param {boolean} [noStyle=false] - If true, skip styling

     * @returns {Promise<any>} - Message reply info or error
     */
    async reply(message, goal, noStyle = false) {
      return new Promise((res, rej) => {
        this.api.sendMessage(
          noStyle ? message : this.processStyle(message),
          goal || this.event?.threadID,
          (err, info) => {
            if (err) rej(err);
            else res(info);
          },
          this.event?.messageID
        );
      });
    },
    /**
     * @param {Object} config
     * @param {any} config.api - The API object for sending messages
     * @param {Record<string, any>} config.event - Contains event details like threadID and messageID
     * @param {HoshinoLia.Command?} [config.command] - Optional command object containing style/font info
     */
    create({ api, event, command }) {
      return ChatContextor({ api, event, command });
    },

    /**
     * Adds style, lmao.
     * @param {HoshinoLia.MessageForm} message - Reply content
     * */
    processStyle(message) {
      if (
        this.command &&
        this.command.style &&
        this.command.font &&
        this.styler
      ) {
        const { type, title, footer } = this.command.style;
        return this.styler(
          type,
          title,
          typeof message === "string" ? message : message.body ?? "",
          footer,
          this.command.font
        );
      }
      return message;
    },
  },
  function ({ api, event, command = null }) {
    this.api = api;
    this.event = event;
    this.command = command;
    this.styler = styler;
  }
);

module.exports = {
  ChatContextor,
};
