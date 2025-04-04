const vm = require("vm");
const fs = require("fs-extra");
const path = require("path");
const ts = require("typescript");

const command = {
  manifest: {
    name: "eval",
    aliases: ["e", "run"],
    version: "1.0.0",
    developer: "Francis Loyd Raval",
    description: "Evaluate JavaScript or TypeScript code",
    category: "developer",
    cooldown: 0,
    usage: "eval <code> or eval <file>",
    config: {
      moderator: false,
      admin: false,
      privateOnly: false,
    }
  },
  async deploy({ chat, args, attachments }) {
    if (args.length === 0 && (!attachments || attachments.length === 0)) {
      return chat.send("Usage: eval <code> or eval <file> (supports .js, .cjs, .ts)");
    }

    let code = "";
    let isFile = false;
    let fileExt = "";

    if (attachments && attachments.length > 0) {
      const filePath = attachments[0].path || attachments[0];
      fileExt = path.extname(filePath).toLowerCase();

      if (fileExt === ".py") {
        return chat.send("Python (.py) files are not supported.");
      }

      if (![".js", ".cjs", ".ts"].includes(fileExt)) {
        return chat.send("Only .js, .cjs, and .ts files are supported.");
      }

      code = await fs.readFile(filePath, "utf8");
      isFile = true;
    } else {
      code = args.join(" ");
    }

    try {
      let result;
      const sandbox = { console, require, process, Buffer, setTimeout, setInterval };
      const context = vm.createContext(sandbox);

      if (fileExt === ".ts" || (!isFile && code.includes("let ") || code.includes("const ") || code.includes("type "))) {
        const compiledCode = ts.transpileModule(code, {
          compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ESNext,
          }
        }).outputText;
        result = vm.runInContext(compiledCode, context);
      } else {
        result = vm.runInContext(code, context);
      }

      const output = typeof result === "undefined" ? "No output" : String(result);
      return chat.send(`Result: ${output.slice(0, 1000)}`);
    } catch (error) {
      return chat.send(`Error: ${error.message}`);
    }
  }
};

module.exports = command;