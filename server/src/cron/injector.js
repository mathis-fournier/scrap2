const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const { Queue } = require('bullmq');
const Redis = require('ioredis');
const db = require('../db');
const logger = require('../logger');

const redisConnection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
const scanQueue = new Queue('vinted-scan-queue', { connection: redisConnection });

scanQueue.on('error', (err) => {
    logger.error(err, '[Cron] Redis Queue Error encountered in Injector');
});

async function injectJobs() {
    try {
        // Added u.use_proxy to the SELECT statement
        const [rows] = await db.execute(`
            SELECT 
                u.id AS userId, u.vinted_cookie AS cookie, u.user_agent AS userAgent, u.proxy_url AS proxyUrl, u.use_proxy AS useProxy,
                k.id AS keywordId, k.name AS keywordName, k.api_url AS apiUrl
            FROM users u
            JOIN keywords k ON u.id = k.user_id
            WHERE u.vinted_cookie IS NOT NULL AND u.vinted_cookie != ''
        `);

        if (rows.length === 0) return;

        const urlBatches = {};

        for (const row of rows) {
            // Group by unique API URL instead of by User
            if (!urlBatches[row.apiUrl]) {
                urlBatches[row.apiUrl] = {
                    jobId: Buffer.from(row.apiUrl).toString('base64').substring(0, 40),
                    apiUrl: row.apiUrl,
                    delegatedUserId: row.userId,
                    cookie: row.cookie,
                    userAgent: row.userAgent,
                    // If useProxy is false, force proxyUrl to null so local network is used
                    proxyUrl: row.useProxy ? row.proxyUrl : null,
                    subscribers: []
                };
            }

            urlBatches[row.apiUrl].subscribers.push({
                userId: row.userId,
                keywordId: row.keywordId,
                keywordName: row.keywordName
            });
        }

        const uniqueUrls = Object.values(urlBatches);

        for (const urlBatch of uniqueUrls) {
            await scanQueue.add('url-scan-job', urlBatch, {
                jobId: urlBatch.jobId,
                removeOnComplete: true,
                removeOnFail: true
            });
        }

        logger.info(`⏱️ [Cron] Dispatched ${uniqueUrls.length} unique URL searches for ${rows.length} total active trackers.`);
    } catch (error) {
        logger.error(error, 'Cron Error');
    }
}

function runInjectJobs() {
    injectJobs();
    const randomDelay = Math.floor(Math.random() * 10000) + 20000; // 20-30 seconds
    setTimeout(runInjectJobs, randomDelay);
}

runInjectJobs();
logger.info('🚀 Cron Injector started. Adding unique URL batches every 20-30 seconds...');