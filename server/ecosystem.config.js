// ecosystem.config.js
const path = require('path');

module.exports = {
    apps: [
        {
            name: "finder-api",
            script: "./src/index.js",
            cwd: path.resolve(__dirname),
            watch: false,
            env: { NODE_ENV: "production" }
        },
        {
            name: "finder-cron",
            script: "./src/cron/injector.js",
            cwd: path.resolve(__dirname),
            watch: false,
            env: { NODE_ENV: "production" }
        },
        {
            name: "finder-worker",
            script: "./src/workers/scraperWorker.js",
            cwd: path.resolve(__dirname),
            watch: false,
            env: { NODE_ENV: "production" }
        }
    ]
};