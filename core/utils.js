import { readdirSync } from "fs-extra";
import { resolve, join } from "path";

/**
 * @type {HoshinoLia.HoshinoUtils}
 */
const utils = {
  cleanUserID(senderID) {
    return senderID.replace(/^web:/, "");
  },
  async loadCommands() {
    global.Hoshino.isLoading = true;
    try {
      const filePath = resolve(__dirname, "../Hoshino/modules/commands");
      console.log(`[DEBUG] Command file path: ${filePath}`);
      const loadfiles = readdirSync(filePath).filter(
        (file) => file.endsWith(".js") || file.endsWith(".ts")
      );

      if (loadfiles.length === 0) {
        console.log("[ERROR] No commands available to deploy");
        return;
      }

      for (const file of loadfiles) {
        const commandPath = join(filePath, file);
        /**
         * @type {HoshinoLia.Command | { default: HoshinoLia.Command }}
         */
        let command = require(commandPath);
        if ("default" in command) {
          command = command.default;
        }
        const { manifest, deploy } = command ?? {};

        if (!manifest) {
          console.log(`[ERROR] Missing 'manifest' for the command: ${file}`);
          continue;
        }

        if (!manifest.name) {
          console.log(
            `[ERROR] Manifest missing 'name' for the command: ${file}`
          );
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
    } finally {
      global.Hoshino.isLoading = false;
    }
  },

  async loadEvents() {
    global.Hoshino.isLoading = true;
    try {
      const filePath = resolve(__dirname, "../Hoshino/modules/events");
      console.log(`[DEBUG] Event file path: ${filePath}`);
      const loadfiles = readdirSync(filePath).filter(
        (file) => file.endsWith(".js") || file.endsWith(".ts")
      );

      if (loadfiles.length === 0) {
        console.log("[ERROR] No events available to deploy");
        return;
      }

      for (const file of loadfiles) {
        const eventPath = join(filePath, file);
        let event = require(eventPath);
        if (event.default) {
          event = event.default;
        }
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
    } finally {
      global.Hoshino.isLoading = false;
    }
  },
};

export default utils;
