import hoshino from "./hoshino";
import api from "./system/handler/hoshinoAPI/plugins/characters";
import EventEmitter from "events";
import utils from "./utils";
import express from "express";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
const app = express();
try {
  require("./global");
} catch (error) {}

const bot = new EventEmitter();

process.on("unhandledRejection", (error) => console.log("ERROR", error));
process.on("uncaughtException", (error) => console.log("ERROR", error.stack));

global.bot = bot;
global.utils = utils;

app.use("", hoshino);
app.use("", api);

global.Hoshino = {
  isLoading: false,
  utils,
  get config() {
    try {
      return JSON.parse(
        readFileSync(join(__dirname, "..", "settings.json"), "utf-8")
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
    writeFileSync(join(__dirname, "..", "settings.json"), str);
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

import cUI from "./views/console";

async function start() {
  app.use(express.static(join(__dirname, "views", "web")));

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
