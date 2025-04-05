const fs = require("fs-extra");
const { execSync } = require("child_process");
const path = require("path");

try {
    require.resolve("fca-priyansh");
} catch (e) {
    console.log("fca-priyansh not found, installing...");
    execSync("npm install fca-priyansh", { stdio: "inherit" });
}

const fcaLogin = require("fca-priyansh");

module.exports = async function initializeBot() {
    const appStatePath = path.join(__dirname, "..", "..", "appstate.json");
    fcaLogin({ appState: JSON.parse(fs.readFileSync(appStatePath, 'utf8')) }, (err, api) => {
        if (err) {
            return console.error('Login error:', err);
        }
        let botId;
        api.getCurrentUserID((err, id) => {
            if (err) {
                return console.error('Failed to get bot ID:', err);
            }
            botId = id;
            api.listen((err, message) => {
                if (err) {
                    return console.error('Listener error:', err);
                }
                if (message.senderID !== botId) {
                    api.sendMessage(message.body, message.threadID);
                }
            });
        });
    });
}
