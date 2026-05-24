require('dotenv').config();
const { Queue } = require('bullmq');
const Redis = require('ioredis');
const db = require('../db');
const logger = require('../logger');

const redisConnection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
const scanQueue = new Queue('vinted-scan-queue', { connection: redisConnection });

async function injectJobs() {
    try {
        const [rows] = await db.execute(`
            SELECT 
                u.id AS userId, u.vinted_cookie AS cookie, u.user_agent AS userAgent, u.proxy_url AS proxyUrl,
                k.id AS keywordId, k.name AS keywordName, k.api_url AS apiUrl
            FROM users u
            JOIN keywords k ON u.id = k.user_id
            WHERE u.vinted_cookie IS NOT NULL AND u.vinted_cookie != ''
        `);

        if (rows.length === 0) {
            return;
        }

        const userBatches = {};
        for (const row of rows) {
            if (!userBatches[row.userId]) {
                userBatches[row.userId] = {
                    userId: row.userId,
                    cookie: row.cookie,
                    userAgent: row.userAgent,
                    proxyUrl: row.proxyUrl,
                    keywords: []
                };
            }
            userBatches[row.userId].keywords.push({
                id: row.keywordId,
                name: row.keywordName,
                apiUrl: row.apiUrl
            });
        }

        const users = Object.values(userBatches);
        for (const userBatch of users) {
            await scanQueue.add('user-scan-batch', userBatch, {
                jobId: userBatch.userId,
                removeOnComplete: true,
                removeOnFail: true
            });
        }

        logger.info(`⏱️ [Cron] Dispatched batches for ${users.length} unique users.`);
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
logger.info('🚀 Cron Injector started. Adding user batches every 30 seconds...');
