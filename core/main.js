require("dotenv").config();

const path = require("path");
const fs = require("fs-extra");

(global.Hoshino = {
    get config(){
        try{
            JSON.parse(
                fs.readFileSync(path.join(__dirname, "..", "settings.json"), "utf-8")
            )
        } catch (err) {
            // @ts-ignore
            
        }
    }
    set config(){

    }
})