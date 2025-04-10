const express = require("express");
const hoshino = require("../../../hoshino")
const character = require("./plugins/characters");

const app = express();

module.exports = async function routers(){
  app.use("/", hoshino);
  app.use("/api", character);
}
