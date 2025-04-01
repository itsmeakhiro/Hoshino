const { spawn } = require("child_process");
const express = require("express");
const app = express();
const path = require("path");
const net = require("net");
const fs = require("fs");
const cors = require("cors");

const generateRandomPort = () =>
  Math.floor(Math.random() * (65535 - 1024) + 1024);
let activePort = generateRandomPort();

app.use(cors());

app.use(express.static(path.join(__dirname, "views")));

async function isPortInUse(port) {
  return new Promise((resolve) => {
    const tester = net
      .createServer()
      .once("error", () => resolve(false))
      .once("listening", () => {
        tester.once("close", () => resolve(true)).close();
      })
      .listen(port, "127.0.0.1");
  });
}

async function initializeServer(port) {
  try {
    const isAvailable = await isPortInUse(port);
    if (!isAvailable) {
      const newPort = generateRandomPort();
      console.log(`Port ${port} is in use. Switching to port ${newPort}`);
      activePort = newPort;
      return initializeServer(newPort);
    }

    app.listen(port, () => {

    });
  } catch (error) {
    console.error(`Failed to start the server: ${error}`);
  }
}

function launchProcess(instanceIndex) {
  const childProcess = spawn(
    "node",
    ["--trace-warnings", "--async-stack-traces", "./core/main.js"],
    {
      cwd: __dirname,
      stdio: "inherit",
      env: {
        ...process.env,
        INSTANCE_INDEX: instanceIndex,
      },
    }
  );

  childProcess.on("close", (exitCode) => {
    if (exitCode !== 0) {
      console.log(
        `API server process exited with code ${exitCode}. Restarting...`
      );
      launchProcess(instanceIndex);
    }
  });

  childProcess.on("error", (error) => {
    console.error(`Error with child process: ${error}`);
  });
}

async function startApp() {
  await initializeServer(activePort);
  launchProcess(1);
}

startApp();