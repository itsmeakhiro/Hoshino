const themes = {
    hacker: {
        primary: '\x1b[32m',
        secondary: '\x1b[90m',
        accent: '\x1b[33m',
        success: '\x1b[92m',
        dim: '\x1b[2m',
        gradient: ['\x1b[38;2;0;255;0m', '\x1b[38;2;0;170;0m']
    },
    fire: {
        primary: '\x1b[31m',
        secondary: '\x1b[33m',
        accent: '\x1b[91m',
        success: '\x1b[93m',
        dim: '\x1b[2m\x1b[33m',
        gradient: ['\x1b[38;2;255;0;0m', '\x1b[38;2;255;85;0m', '\x1b[38;2;255;170;0m']
    },
    aqua: {
        primary: '\x1b[36m',
        secondary: '\x1b[34m',
        accent: '\x1b[97m',
        success: '\x1b[96m',
        dim: '\x1b[2m\x1b[34m',
        gradient: ['\x1b[38;2;0;255;255m', '\x1b[38;2;0;170;170m']
    },
    galaxy: {
        primary: '\x1b[35m',
        secondary: '\x1b[34m',
        accent: '\x1b[36m',
        success: '\x1b[95m',
        dim: '\x1b[2m\x1b[34m',
        gradient: ['\x1b[38;2;255;0;255m', '\x1b[38;2;170;0;170m', '\x1b[38;2;85;0;255m']
    }
};

function styleText(text, theme) {
    return text.replace(/\[([^\]]+)\]/g, (match, content) => {
        const reset = '\x1b[0m';
        let result = '';
        const colors = theme.gradient;
        const step = colors.length / content.length;
        
        for (let i = 0; i < content.length; i++) {
            const colorIndex = Math.min(Math.floor(i * step), colors.length - 1);
            result += colors[colorIndex] + content[i];
        }
        
        return `[${result}${reset}]`;
    });
}

module.exports = {
    themes,
    getTheme: (themeName) => themes[themeName] || themes.hacker,
    styleText
};