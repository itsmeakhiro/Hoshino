const fs = require("fs-extra");
const { execSync } = require("child_process");
const path = require("path");

try {
    require.resolve("fca-priyansh");
} catch (e) {
    console.log("fca-priyansh not found, installing...");
    execSync("npm install fca-priyansh", { stdio: "inherit" });
}

const login = require("fca-priyansh");

module.exports = async function login() {
    const appStatePath = path.join(__dirname, "..", "..", "appstate.json");
    login({ appState: JSON.parse(fs.readFileSync(appStatePath, 'utf8')) }, (err, api) => {
        if (err) {
            return console.error('Login error:', err);
        }
        
        api.listen((err, message) => {
            if (err) {
                return console.error('Listener error:', err);
            }
            api.sendMessage(message.body, message.threadID);
        });
    });
}
