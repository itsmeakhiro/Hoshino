const utils = require("../utils")

module.exports = async function cUI(){
 console.log("Starting hoshino.");
 console.log("Running at port: 8080");
 console.log("Deploy commands");
 await utils.loadCommands();
 console.log("Deploy events");
 await utils.loadEvents();
}