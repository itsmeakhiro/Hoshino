const fs = require("fs-extra");
const { execSync } = require("child_process");
const path = require("path");
const util = require("util");
const listener = require("./listener");

try {
  require.resolve("chatbox-fca-remake");
} catch (e) {
  console.log("chatbox-fca-remake not found, installing...");
  execSync("npm install chatbox-fca-remake", { stdio: "inherit" });
}

const login = util.promisify(require("chatbox-fca-remake"));

module.exports = async function initializeBot() {
  const appStatePath = path.join(__dirname, "..", "..", "appstate.json");
  let api;
  try {
    api = await login({
      appState: JSON.parse(fs.readFileSync(appStatePath, "utf8")),
    });
    const conf = global.Hoshino.config["api-options"];
    if (conf) {
      api.setOptions(conf);
    }
    // let botId = api.getCurrentUserID();
    api.listenMqtt((err, event) => {
      if (err) {
        return console.error("Listener error:", err);
      }
      listener({ api, event });
    });
  } catch (error) {
    return console.error("Login error:", error);
  }
};
