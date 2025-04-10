const express = require("express");
const character = require("./plugins/characters");
const education = require("./plugins/education");

const app = express();

module.exports = async function routers(){
  app.use("/api", character);
  app.use("/api", education);
}
