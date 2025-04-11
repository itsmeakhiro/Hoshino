const hoshino = require("./hoshino");
const EventEmitter = require("events");
const utils = require("./utils");
const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

const bot = new EventEmitter();

process.on("unhandledRejection", (error) => console.log("ERROR", error));
process.on("uncaughtException", (error) => console.log("ERROR", error.stack));

global.bot = bot;

app.use("", hoshino);

global.Hoshino = {
  utils,
  get config() {
    try {
      return JSON.parse(
        fs.readFileSync(path.join(__dirname, "..", "settings.json"), "utf-8")
      );
    } catch (err) {
      console.log(
        "Unexpected error: Cannot read file 'settings.json', ensure that this file exists and is valid JSON."
      );
      return {};
    }
  },
  set config(config) {
    const data = global.Hoshino.config;
    const finalData = { ...data, ...config };
    const str = JSON.stringify(finalData, null, 2);
    fs.writeFileSync(path.join(__dirname, "..", "settings.json"), str);
  },
  commands: new Map(),
  events: new Map(),
  reacts: new Map(),
  cooldowns: new Map(),
};

Object.assign(global.Hoshino, {
  get prefix() {
    return global.Hoshino.config.prefix;
  },
  get maintenance() {
    return global.Hoshino.config.maintenance;
  },
  get developer() {
    return global.Hoshino.config.developer;
  },
  get moderator() {
    return global.Hoshino.config.moderator;
  },
  get admin() {
    return global.Hoshino.config.admin;
  },
});

const cUI = require("./views/console");

async function start() {
  app.use(express.static(path.join(__dirname, "views", "web")));

  const server = app.listen(8080, () => {
    console.log("Server running on port 8080");
    cUI();
  });

  setInterval(() => {
    server.close(() => {
      console.log("Server restarting...");
      start();
    });
  }, 30 * 60 * 1000);
}

start();