const fs = require("fs-extra");
const { execSync } = require("child_process");

try {
    require.resolve("fca-priyansh");
} catch (e) {
    console.log("fca-priyansh not found, installing...");
    execSync("npm install fca-priyansh", { stdio: "inherit" });
}

const login = require("fca-priyansh");

module.exports = async function login() {
    login({ appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8')) }, (err, api) => {
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
