const utils = require("../utils");
const login = require("../system/login");
const routers = require("../system/handler/hoshinoAPI/hoshinoApi");
const { getTheme, styleText } = require("./custom");

const currentTheme = 'hacker';
const colors = getTheme(currentTheme);
const reset = '\x1b[0m';

const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

async function animateTaskWithProgress(message, task) {
    let i = 0;
    let progress = 0;
    let totalSteps = 0;
    let currentStep = 0;

    const originalConsoleLog = console.log;
    console.log = (...args) => {
        const msg = args.join('\n');
        if (msg.includes('[COMMAND] Deployed') || msg.includes('[EVENT] Deployed')) {
            currentStep++;
            progress = Math.min((currentStep / totalSteps) * 100, 100);
        }
        originalConsoleLog(...args.map(arg => typeof arg === 'string' ? styleText(arg, colors) : arg));
    };

    const filePath = message.includes('commands') ? '../../Hoshino/modules/commands' : '../../Hoshino/modules/events';
    totalSteps = require('fs-extra').readdirSync(require('path').resolve(__dirname, filePath))
        .filter(file => file.endsWith('.js')).length || 1;

    const animation = setInterval(() => {
        process.stdout.write(
            `\r${colors.primary}${spinner[i++ % spinner.length]}${reset} ${styleText(message, colors)} ${colors.secondary}${Math.round(progress)}%${reset}`
        );
    }, 100);

    await task();
    clearInterval(animation);
    console.log = originalConsoleLog; 
    process.stdout.write(`\r${colors.success}✓${reset} ${styleText(message, colors)} ${colors.secondary}100%${reset}\n`);
}

async function animateTask(message, task) {
    let i = 0;
    const animation = setInterval(() => {
        process.stdout.write(
            `\r${colors.primary}${spinner[i++ % spinner.length]}${reset} ${styleText(message, colors)}`
        );
    }, 100);

    await task();
    clearInterval(animation);
    process.stdout.write(`\r${colors.success}✓${reset} ${styleText(message, colors)}\n`);
}

module.exports = async function cUI() {
    console.log(styleText('\n[SYSTEM] Hoshino Bot Initialization\n', colors));

    console.log(`${colors.primary}${styleText('[SYSTEM] Initializing Hoshino System...', colors)}${reset}`);
    console.log(`${colors.dim}Port: 8080${reset}`);

    await animateTaskWithProgress('[COMMANDS] Deploying commands...', async () => {
        await utils.loadCommands();
        await new Promise(resolve => setTimeout(resolve, 500));
    });

    await animateTaskWithProgress('[EVENTS] Deploying events...', async () => {
        await utils.loadEvents();
        await new Promise(resolve => setTimeout(resolve, 500));
    });

    await animateTaskWithProgress('[API] Uploading Hoshino API...', async () => {
        await routers();
        await new Promise(resolve => setTimeout(resolve, 500));
    });

    await animateTask('[LOGIN] Logging in...', async () => {
        await login();
        await new Promise(resolve => setTimeout(resolve, 500));
    });

    console.log(styleText('\n[SYSTEM] Hoshino Bot Successfully Started!', colors));
    console.log(`${colors.dim}Ready to receive commands...\n${reset}`);
}