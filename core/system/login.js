const fs = require("fs-extra");
const { execSync } = require("child_process");
const path = require("path");

try {
    require.resolve("chatbox-fca-remake");
} catch (e) {
    console.log("chatbox-fca-remake not found, installing...");
    execSync("npm install chatbox-fca-remake", { stdio: "inherit" });
}

const fcaLogin = require("chatbox-fca-remake");

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
