const fs = require("fs-extra");
const path = require("path");

module.exports = {
  async loadCommands() {
    const filePath = path.resolve(process.cwd(), "./Tokito/modules/commands");
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

      if (typeof deploy !== "function") {
        console.log(`[ERROR] Invalid 'deploy' function for the command: ${file}`);
        continue;
      }

      try {
        if (manifest.name) {
          console.log(`[COMMAND] Deployed ${manifest.name} successfully`);
          global.Hoshino.commands.set(manifest.name, command);
        } else {
          console.log(`[ERROR] Manifest missing 'name' for the command: ${file}`);
        }
      } catch (error) {
        console.log(`[ERROR] Failed to deploy ${manifest.name}: ${error.stack}`);
      }
    }
  },

  async loadEvents() {
    const filePath = path.resolve(process.cwd(), "./Tokito/modules/events");
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

      if (typeof onEvent !== "function") {
        console.log(`[ERROR] Missing 'onEvent' function for the event: ${file}`);
        continue;
      }

      try {
        if (manifest.name) {
          console.log(`[EVENT] Deployed ${manifest.name} successfully.`);
          global.Hoshino.events.set(manifest.name, event);
        } else {
          console.log(`[ERROR] Manifest missing 'name' for the event: ${file}`);
        }
      } catch (error) {
        console.log(`[ERROR] Failed to deploy ${file}: ${error.stack}`);
      }
    }
  },
};