const express = require("express");
const characters = require("./plugins/character");
const education = require("./plugins/education");

const app = express();

module.exports = async function routers(){
  app.use("/api", characters);
  app.use("/api", education);
}
