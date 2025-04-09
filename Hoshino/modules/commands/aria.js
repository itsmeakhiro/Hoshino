/**
 * @type {HoshinoLia.Command}
 */

const axios = require("axios");

const command = {
    manifest: {
     name: "aria",
     aliases: ["aibrowser"],
     version: "1.0.0",
     developer: "Francis Loyd Raval",
     description: "Meet Aria AI from Opera Browser developed by Kenneth Panio.",
     category: "education",
     cooldown: 0,
     config: {
        moderator: false,
        admin: false,
        privateOnly: false,
     }
    },
    async deploy({ chat, args }){
        const q = args.join(" ");
        if (!q){
            return chat.send(fonts.sans("Provide a query."));
        }
        try {
         const aria = await axios.get(`https://haji-mix.up.railway.app/api/aria?ask=${encodeURIComponent(q)}&stream=false`);
         const r = aria.data.answer;
         chat.reply(r)
        } catch (error) {
            chat.reply(error.message)
        }
    }
}

module.exports = command;