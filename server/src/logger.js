const fs = require('fs');
const path = require('path');

const logDir = path.resolve(__dirname, '../logs');
const logFile = process.env.LOG_FILE_PATH || path.join(logDir, 'server.log');
const writeLogsToFile = process.env.LOG_TO_FILE !== 'false';

function ensureLogDir() {
    try {
        fs.mkdirSync(logDir, { recursive: true });
    } catch (err) {
        console.error('[Logger] Failed to ensure log directory:', err);
    }
}

function formatMessage(level, message, error) {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    let text = `[${timestamp}] [${level}] ${message}`;
    if (error) {
        if (error.stack) {
            text += `\n${error.stack}`;
        } else {
            text += `\n${String(error)}`;
        }
    }
    return text;
}

function writeToFile(message) {
    if (!writeLogsToFile) return;
    try {
        ensureLogDir();
        fs.appendFileSync(logFile, `${message}\n`, 'utf8');
    } catch (err) {
        console.error('[Logger] Failed to write log file:', err);
    }
}

function log(level, message, error) {
    const formatted = formatMessage(level, message, error);
    if (level === 'ERROR') {
        console.error(formatted);
    } else if (level === 'WARN') {
        console.warn(formatted);
    } else {
        console.log(formatted);
    }
    writeToFile(formatted);
}

function info(message) {
    log('INFO', typeof message === 'string' ? message : JSON.stringify(message, null, 2));
}

function warn(message) {
    log('WARN', typeof message === 'string' ? message : JSON.stringify(message, null, 2));
}

function error(errorObj, message) {
    if (typeof errorObj === 'string') {
        log('ERROR', errorObj);
    } else {
        const text = message ? `${message}: ${errorObj.message || errorObj}` : errorObj.message || 'Unhandled error';
        log('ERROR', text, errorObj);
    }
}

module.exports = { info, warn, error };
