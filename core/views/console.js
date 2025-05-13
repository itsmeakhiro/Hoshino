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
  log("SYSTEM", "Hello Developer, Welcome to Hoshino!");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  log("SYSTEM", "Hoshino is now running...");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await util.loadCommands();
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await util.loadEvents();
  log("LOGIN", "Accessing Appstate...");
  await login();
  log("NOTE", "This is a beta version, please report any bugs to the developer.");
  await new Promise((resolve) => setTimeout(resolve, 2000));
  log("SYSTEM", "Hoshino is now online and ready to use!")
}