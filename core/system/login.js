const fs = require("fs-extra");
const { execSync } = require("child_process");
const path = require("path");
const util = require("util");
const listener = require("./listener");

try {
  require.resolve("ws3-fca");
} catch (e) {
  console.log("ws3-fca not found, installing...");
  execSync("npm install ws3-fca", { stdio: "inherit" });
}

const login = util.promisify(require("ws3-fca"));

module.exports = async function initializeBot() {
  const appStatePath = path.join(__dirname, "..", "..", "appstate.json");
  let api;
  try {
    api = await login({
      appState: JSON.parse(fs.readFileSync(appStatePath, "utf8")),
    });
    // let botId = api.getCurrentUserID();
    api.listenMqtt((err, event) => {
      if (err) {
        return console.error("Listener error:", err);
      }
      listener({ api, event });
    });
  } catch (error) {
    return console.error("Login error:", error.stack);
  }
};
