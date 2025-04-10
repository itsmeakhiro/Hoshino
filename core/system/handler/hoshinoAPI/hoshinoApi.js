const express = require("express");
const character = require("./plugins/characters");

const app = express();

module.exports = async function routers(){
  app.use("/api", character);
}
