const fs = require("fs-extra");
const path = require("path");

/**
 * @type {HoshinoLia.HoshinoUtils}
 */
const utils = {
  async loadCommands() {
    const filePath = path.resolve(__dirname, "../Hoshino/modules/commands");
    console.log(`[DEBUG] Command file path: ${filePath}`);
    const loadfiles = fs
      .readdirSync(filePath)
      .filter((file) => file.endsWith(".js"));

    if (loadfiles.length === 0) {
      console.log("[ERROR] No commands available to deploy");
      return;
    }

    for (const file of loadfiles) {
      const commandPath = path.join(filePath, file);
      /**
       * @type {HoshinoLia.Command}
       */
      const command = require(commandPath);
      const { manifest, deploy } = command ?? {};

      if (!manifest) {
        console.log(`[ERROR] Missing 'manifest' for the command: ${file}`);
        continue;
      }

      if (!manifest.name) {
        console.log(`[ERROR] Manifest missing 'name' for the command: ${file}`);
        continue;
      }

      if (typeof deploy !== "function") {
        console.log(
          `[ERROR] Invalid 'deploy' function for the command: ${file}`
        );
        continue;
      }

      try {
        console.log(`[COMMAND] Deployed ${manifest.name} successfully`);
        global.Hoshino.commands.set(manifest.name, command);

        if (Array.isArray(manifest.aliases)) {
          for (const alias of manifest.aliases) {
            global.Hoshino.commands.set(alias, command);
            console.log(
              `[COMMAND] Alias "${alias}" registered for command "${manifest.name}"`
            );
          }
        }
      } catch (error) {
        if (error instanceof Error)
          console.log(
            `[ERROR] Failed to deploy ${manifest.name}: ${error.stack}`
          );
        else console.log(error);
      }
    }
  },

  async loadEvents() {
    const filePath = path.resolve(__dirname, "../Hoshino/modules/events");
    console.log(`[DEBUG] Event file path: ${filePath}`);
    const loadfiles = fs
      .readdirSync(filePath)
      .filter((file) => file.endsWith(".js"));

    if (loadfiles.length === 0) {
      console.log("[ERROR] No events available to deploy");
      return;
    }

    for (const file of loadfiles) {
      const eventPath = path.join(filePath, file);
      const event = require(eventPath);
      const { manifest, onEvent } = event ?? {};

      if (!manifest) {
        console.log(`[ERROR] Missing 'manifest' for the event: ${file}`);
        continue;
      }

      if (!manifest.name) {
        console.log(`[ERROR] Manifest missing 'name' for the event: ${file}`);
        continue;
      }

      if (typeof onEvent !== "function") {
        console.log(
          `[ERROR] Missing 'onEvent' function for the event: ${file}`
        );
        continue;
      }

      try {
        console.log(`[EVENT] Deployed ${manifest.name} successfully`);
        global.Hoshino.events.set(manifest.name, event);
      } catch (error) {
        if (error instanceof Error)
          console.log(`[ERROR] Failed to deploy ${file}: ${error.stack}`);
        else console.log(error);
      }
    }
  },
};

module.exports = utils;
