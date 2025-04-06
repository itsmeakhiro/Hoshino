/**
 * @type {HoshinoLia.Command}
 */
const vm = require("vm");
const fs = require("fs-extra");
const path = require("path");
const ts = require("typescript");
const util = require("util");
const { exec } = require("child_process");

const command = {
  manifest: {
    name: "eval",
    aliases: ["e", "run", "evaluate", "exec"],
    version: "1.0.0",
    developer: "Francis Loyd Raval",
    description: "Evaluate code in various programming languages",
    category: "developer",
    cooldown: 5,
    usage: "eval <code> or eval <file>",
    config: {
      developer: true,
      moderator: false,
      admin: false,
      privateOnly: false,
    }
  },
  async deploy({ chat, args, attachments, fonts }) {
    if (args.length === 0 && (!attachments || attachments.length === 0)) {
      return chat.send(fonts.sans("Please provide code to evaluate or a file (supports .js, .cjs, .ts, .py, .cpp, .c, .java, .rb, .go)"));
    }

    let code = "";
    let isFile = false;
    let fileExt = "";
    let filePath = "";

    if (attachments && attachments.length > 0) {
      filePath = attachments[0].path || attachments[0];
      fileExt = path.extname(filePath).toLowerCase();
      code = await fs.readFile(filePath, "utf8");
      isFile = true;
    } else {
      code = args.join(" ");
    }

    const installPackage = async (manager, packageName) => {
      return new Promise((resolve, reject) => {
        exec(`${manager} install ${packageName}`, (error, stdout, stderr) => {
          if (error) return reject(stderr || error.message);
          resolve(stdout || stderr);
        });
      });
    };

    const executeCode = async () => {
      if (!isFile || fileExt === ".js" || fileExt === ".cjs") {
        const sandbox = { console, require, process, Buffer, setTimeout, setInterval };
        const context = vm.createContext(sandbox);
        return vm.runInContext(code, context);
      }

      if (fileExt === ".ts") {
        const compiledCode = ts.transpileModule(code, {
          compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ESNext,
          }
        }).outputText;
        const sandbox = { console, require, process, Buffer, setTimeout, setInterval };
        const context = vm.createContext(sandbox);
        return vm.runInContext(compiledCode, context);
      }

      if (fileExt === ".py") {
        const tempFile = path.join(__dirname, "../../temp", `eval-${Date.now()}.py`);
        await fs.ensureDir(path.dirname(tempFile));
        await fs.writeFile(tempFile, code);
        return new Promise((resolve, reject) => {
          exec(`python3 ${tempFile}`, (error, stdout, stderr) => {
            fs.remove(tempFile);
            if (error) return reject(stderr || error.message);
            resolve(stdout || stderr);
          });
        });
      }

      if (fileExt === ".cpp") {
        const tempFile = path.join(__dirname, "../../temp", `eval-${Date.now()}.cpp`);
        const outFile = tempFile.replace(".cpp", "");
        await fs.ensureDir(path.dirname(tempFile));
        await fs.writeFile(tempFile, code);
        return new Promise((resolve, reject) => {
          exec(`g++ ${tempFile} -o ${outFile} && ${outFile}`, (error, stdout, stderr) => {
            fs.remove(tempFile);
            fs.remove(outFile);
            if (error) return reject(stderr || error.message);
            resolve(stdout || stderr);
          });
        });
      }

      if (fileExt === ".c") {
        const tempFile = path.join(__dirname, "../../temp", `eval-${Date.now()}.c`);
        const outFile = tempFile.replace(".c", "");
        await fs.ensureDir(path.dirname(tempFile));
        await fs.writeFile(tempFile, code);
        return new Promise((resolve, reject) => {
          exec(`gcc ${tempFile} -o ${outFile} && ${outFile}`, (error, stdout, stderr) => {
            fs.remove(tempFile);
            fs.remove(outFile);
            if (error) return reject(stderr || error.message);
            resolve(stdout || stderr);
          });
        });
      }

      if (fileExt === ".java") {
        const classNameMatch = code.match(/public\s+class\s+(\w+)/);
        const className = classNameMatch ? classNameMatch[1] : "EvalTemp";
        const tempDir = path.join(__dirname, "../../temp");
        const tempFile = path.join(tempDir, `${className}.java`);
        await fs.ensureDir(tempDir);
        await fs.writeFile(tempFile, code);
        return new Promise((resolve, reject) => {
          exec(`javac ${tempFile} && java -cp ${tempDir} ${className}`, (error, stdout, stderr) => {
            fs.remove(tempFile);
            fs.remove(tempFile.replace(".java", ".class"));
            if (error) return reject(stderr || error.message);
            resolve(stdout || stderr);
          });
        });
      }

      if (fileExt === ".rb") {
        const tempFile = path.join(__dirname, "../../temp", `eval-${Date.now()}.rb`);
        await fs.ensureDir(path.dirname(tempFile));
        await fs.writeFile(tempFile, code);
        return new Promise((resolve, reject) => {
          exec(`ruby ${tempFile}`, (error, stdout, stderr) => {
            fs.remove(tempFile);
            if (error) return reject(stderr || error.message);
            resolve(stdout || stderr);
          });
        });
      }

      if (fileExt === ".go") {
        const tempFile = path.join(__dirname, "../../temp", `eval-${Date.now()}.go`);
        await fs.ensureDir(path.dirname(tempFile));
        await fs.writeFile(tempFile, code);
        return new Promise((resolve, reject) => {
          exec(`go run ${tempFile}`, (error, stdout, stderr) => {
            fs.remove(tempFile);
            if (error) return reject(stderr || error.message);
            resolve(stdout || stderr);
          });
        });
      }

      throw new Error(`Unsupported file type: ${fileExt}`);
    };

    try {
      let result = await executeCode();
      if (typeof result !== "string") {
        result = util.inspect(result);
      }
      return chat.send(fonts.monospace("Output:\n") + fonts.monospace(result.slice(0, 2000)));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      if ((fileExt === ".js" || fileExt === ".cjs" || fileExt === ".ts" || !isFile) && errorMsg.includes("Cannot find module")) {
        const packageName = errorMsg.split("'")[1];
        chat.send(fonts.sans(`Installing missing package: ${packageName}...`));
        try {
          await installPackage("npm", packageName);
          let result = await executeCode();
          if (typeof result !== "string") {
            result = util.inspect(result);
          }
          return chat.send(fonts.monospace("Output:\n") + fonts.monospace(result.slice(0, 2000)));
        } catch (installError) {
          return chat.send(fonts.bold("Install Error:\n") + fonts.bold(installError));
        }
      }

      if (fileExt === ".py" && errorMsg.includes("No module named")) {
        const packageName = errorMsg.split("'")[1];
        chat.send(fonts.sans(`Installing missing package: ${packageName}...`));
        try {
          await installPackage("pip3", packageName);
          let result = await executeCode();
          return chat.send(fonts.monospace("Output:\n") + fonts.monospace(result.slice(0, 2000)));
        } catch (installError) {
          return chat.send(fonts.bold("Install Error:\n") + fonts.bold(installError));
        }
      }

      return chat.send(fonts.bold("Error:\n") + fonts.bold(errorMsg));
    }
  }
};

module.exports = command;
