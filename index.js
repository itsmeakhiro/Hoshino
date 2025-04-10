const { spawn } = require("child_process");

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
  launchProcess(1);
}

startApp();
