import { readFileSync } from "fs-extra";
import { execSync } from "child_process";
import { join } from "path";
import { promisify } from "util";
import listener from "./listener";

try {
  require.resolve("facebook-chat-api");
} catch (e) {
  console.log("facebook-chat-api not found, installing...");
  execSync("npm install ruingl/facebook-chat-api", { stdio: "inherit" });
}

const fca = require("facebook-chat-api");
fca.logging(false);
const login = promisify(fca.login);

export default async function initializeBot() {
  const appStatePath = join(__dirname, "..", "..", "appstate.json");
  let api;
  try {
    api = await login({
      appState: JSON.parse(readFileSync(appStatePath, "utf8")),
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
