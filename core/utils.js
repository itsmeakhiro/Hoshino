import { readdirSync } from "fs-extra";
import { resolve, join } from "path";
import { log } from "./views/custom"

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
      log("DEBUG", `Deploying commands from ${filePath}`);
      const loadfiles = readdirSync(filePath).filter(
        (file) => file.endsWith(".js") || file.endsWith(".ts")
      );

      if (loadfiles.length === 0) {
        log("SYSTEM", "No commands available to deploy, Proceeding to events...");
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
          log("WARNING", `Missing 'manifest' for the command: ${file}`);
          continue;
        }

        if (!manifest.name) {
          console.log(
            "ERROR", `Manifest missing 'name' for the command: ${file}`
          );
          continue;
        }

        if (typeof deploy !== "function") {
          log(
            "WARNING", `Invalid 'deploy' function for the command: ${file}`
          );
          continue;
        }

        try {
          log("COMMAND", `Deployed ${manifest.name} successfully`);
          global.Hoshino.commands.set(manifest.name, command);

          if (Array.isArray(manifest.aliases)) {
            for (const alias of manifest.aliases) {
              global.Hoshino.commands.set(alias, command);
              log(
                "ALIAS", `Alias "${alias}" registered for command "${manifest.name}"`
              );
            }
          }
        } catch (error) {
          if (error instanceof Error)
            log(
              "ERROR", `Failed to deploy ${manifest.name}: ${error.stack}`
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
      log("DEBUG", `Deploying events from ${filePath}`);
      const loadfiles = readdirSync(filePath).filter(
        (file) => file.endsWith(".js") || file.endsWith(".ts")
      );

      if (loadfiles.length === 0) {
        log("EVENT", "No events available to deploy, proceeding to login...");
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
          log("WARNING", `Missing 'manifest' for the event: ${file}`);
          continue;
        }

        if (!manifest.name) {
          log("WARNING", `Manifest missing 'name' for the event: ${file}`);
          continue;
        }

        if (typeof onEvent !== "function") {
          log(
            "WARNING", `Missing 'onEvent' function for the event: ${file}`
          );
          continue;
        }

        try {
          log("EVENT", `Deployed ${manifest.name} successfully`);
          global.Hoshino.events.set(manifest.name, event);
        } catch (error) {
          if (error instanceof Error)
            log("ERROR", `Failed to deploy ${file}: ${error.stack}`);
          else console.log(error);
        }
      }
    } finally {
      global.Hoshino.isLoading = false;
    }
  },
};

export default utils;
