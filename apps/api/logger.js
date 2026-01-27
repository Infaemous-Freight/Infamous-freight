// api/logger.js - Structured Logging Module
const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

function formatLog(level, message, data = {}) {
    return JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        ...data
    });
}

function writeLog(filename, entry) {
    const filepath = path.join(logsDir, filename);
    fs.appendFileSync(filepath, entry + '\n');
}

const logger = {
    info: (message, data = {}) => {
        const entry = formatLog('INFO', message, data);
        console.log(entry);
        writeLog('combined.log', entry);
    },

    error: (message, data = {}) => {
        const entry = formatLog('ERROR', message, data);
        console.error(entry);
        writeLog('error.log', entry);
        writeLog('combined.log', entry);
    },

    warn: (message, data = {}) => {
        const entry = formatLog('WARN', message, data);
        console.warn(entry);
        writeLog('combined.log', entry);
    },

    debug: (message, data = {}) => {
        if (process.env.LOG_LEVEL === 'debug') {
            const entry = formatLog('DEBUG', message, data);
            console.log(entry);
            writeLog('combined.log', entry);
        }
    }
};

module.exports = logger;
