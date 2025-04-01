const fs = require("fs-extra");
const path = require("path");

function log(type, message) {
  const colors = {
    SYSTEM: "\x1b[34m",
    EVENT: "\x1b[33m",
    COMMAND: "\x1b[32m",
    ERROR: "\x1b[31m",
    RESET: "\x1b[0m",
  };
  console.log(
    `${colors[type] || colors.SYSTEM}[ ${type} ]${colors.RESET} ${message}`
  );
}

module.exports = {
  async loadCommands() {
    const filePath = path.resolve(process.cwd(), "./Tokito/modules/commands");
    const loadfiles = fs
      .readdirSync(filePath)
      .filter((file) => file.endsWith(".js"));

    if (loadfiles.length === 0) {
      log("ERROR", "No commands available to deploy");
      return;
    }

    for (const file of loadfiles) {
      const commandPath = path.join(filePath, file);
      /**
       * @type {TokitoLia.Command}
       */
      const command = require(commandPath);
      const { manifest, deploy } = command ?? {};

      if (!manifest) {
        log("ERROR", `Missing 'manifest' for the command: ${file}`);
        continue;
      }

      if (typeof deploy !== "function") {
        log("ERROR", `Invalid 'deploy' function for the command: ${file}`);
        continue;
      }

      if (
        manifest.config?.botAdmin === undefined ||
        manifest.config?.botModerator === undefined
      ) {
        log(
          "ERROR",
          `Missing botAdmin or botModerator config for the command: ${file}`
        );
        continue;
      }

      try {
        if (manifest.name) {
          log("COMMAND", `Deployed ${manifest.name} successfully`);
          global.Tokito.commands.set(manifest.name, command);

          if (Array.isArray(manifest.aliases)) {
            for (const alias of manifest.aliases) {
              global.Tokito.commands.set(alias, command);
              log(
                "COMMAND",
                `Alias "${alias}" registered for command "${manifest.name}"`
              );
            }
          }
        } else {
          log("ERROR", `Manifest missing 'name' for the command: ${file}`);
        }
      } catch (error) {
        log("ERROR", `Failed to deploy ${manifest.name}: ${error.stack}`);
      }
    }
  },

  async loadEvents() {
    const filePath = path.resolve(process.cwd(), "./Tokito/modules/events");
    const loadfiles = fs
      .readdirSync(filePath)
      .filter((file) => file.endsWith(".js"));

    if (loadfiles.length === 0) {
      log("ERROR", "No events available to deploy");
      return;
    }

    for (const file of loadfiles) {
      const eventPath = path.join(filePath, file);
      const event = require(eventPath);
      const { manifest, onEvent } = event ?? {};

      if (!manifest) {
        log("ERROR", `Missing 'manifest' for the event: ${file}`);
        continue;
      }

      if (typeof onEvent !== "function") {
        log("ERROR", `Missing 'onEvent' function for the event: ${file}`);
        continue;
      }

      try {
        if (manifest.name) {
          log("EVENT", `Deployed ${manifest.name} successfully.`);
          global.Tokito.events.set(manifest.name, event);
        } else {
          log("ERROR", `Manifest missing 'name' for the event: ${file}`);
        }
      } catch (error) {
        log("ERROR", `Failed to deploy ${file}: ${error.stack}`);
      }
    }
  },
};