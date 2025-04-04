/* 
 * @type {HoshinoLia.Command}
*/

const command = {
   manifest: {
    name: "test",
    aliases: ["t"],
    version: "1.0.0",
    developer: "Francis Loyd Raval",
    description: "A test",
    category: "utility",
    cooldown: 0,
    usage: "test",
    config: {
      moderator: false,
      admin: false,
      privateOnly: false,
    }
   },
   async deploy({ chat }){
     chat.send("hello.");
   }
}

module.exports = command;