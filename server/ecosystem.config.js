// ecosystem.config.js
module.exports = {
    apps: [
        {
            name: "finder-api",
            script: "./src/index.js",
            watch: false,
            env: { NODE_ENV: "production" }
        },
        {
            name: "finder-cron",
            script: "./src/cron/injector.js",
            watch: false,
            env: { NODE_ENV: "production" }
        },
        {
            name: "finder-worker",
            script: "./src/workers/scraperWorker.js",
            watch: false,
            env: { NODE_ENV: "production" }
        }
    ]
};