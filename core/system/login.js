const login = require("fca-priyansh");
const fs = require("fs-extra");

module.exports = async function login() {
    login({appState: JSON.parse(fs.readFileSync('appstate.json', 'utf-8'))}, (err, api) => {
        if(err) return console.error(err);
    
        api.listen((err, message) => {
            api.sendMessage(message.body, message.threadID);
        });
    });
}
