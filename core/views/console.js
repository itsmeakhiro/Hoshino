const util = require("../utils").default;
const login = require("../system/login").default;
const { log } = require("./custom");

module.exports = async function cUI() {
  console.clear();
  const top = ` 
         █░█ █▀█ █▀ █░█ █ █▄░█ █▀█
         █▀█ █▄█ ▄█ █▀█ █ █░▀█ █▄█
     DEVELOPED BY: FRANCIS LOYD RAVAL`;
  log(top, "");
  console.log();
  log("SYSTEM", "Loading Commands...");
  await util.loadCommands();
  log("SYSTEM", "Loading Events...");
  await util.loadEvents();
  log("LOGIN", "Accessing Appstate...");
  await login();
  log("NOTE:", "This is a beta version of TokitoBot, please report any bugs to the developer.");
}