const utils = require("../utils");
const login = require("./system/login");

module.exports = async function cUI(){
 console.log("Starting hoshino.");
 console.log("Running at port: 8080");
 console.log("Deploy commands");
 await utils.loadCommands();
 console.log("Deploy events");
 await utils.loadEvents();
 console.log("Logging In");
 await login()
}