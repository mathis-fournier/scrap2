const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const { Queue } = require('bullmq');
const Redis = require('ioredis');
const crypto = require('crypto');
const db = require('../db');
const logger = require('../logger');
const cron = require('node-cron');
const redisConnection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
const scanQueue = new Queue('vinted-scan-queue', { connection: redisConnection });

scanQueue.on('error', (err) => {
    logger.error(err, '[Cron] Redis Queue Error encountered in Injector');
});

async function injectJobs() {
    try {
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
            if (!urlBatches[row.apiUrl]) {
                urlBatches[row.apiUrl] = {
                    // Swap the base64 logic for an MD5 hash
                    jobId: crypto.createHash('md5').update(row.apiUrl).digest('hex'),
                    apiUrl: row.apiUrl,
                    delegatedUserId: row.userId,
                    cookie: row.cookie,
                    userAgent: row.userAgent,
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

        // Bulk add to BullMQ for better Redis performance
        const jobsToAdd = uniqueUrls.map(urlBatch => ({
            name: 'url-scan-job',
            data: urlBatch,
            opts: {
                jobId: urlBatch.jobId,
                removeOnComplete: true,
                removeOnFail: true
            }
        }));

        await scanQueue.addBulk(jobsToAdd);

        logger.info(`⏱️ [Cron] Dispatched ${uniqueUrls.length} unique URL searches for ${rows.length} total active trackers.`);
    } catch (error) {
        logger.error(error, 'Cron Error');
    }
}

// 🔥 CRITICAL FIX: State lock to prevent memory leaks if the DB hangs
let isInjecting = false;

// Runs every 20 seconds predictably 
cron.schedule('*/20 * * * * *', async () => {
    if (isInjecting) {
        logger.warn('⚠️ [Cron] Skipping cycle: Previous injection is still running.');
        return;
    }

    isInjecting = true;
    await injectJobs();
    isInjecting = false;
});
logger.info('🚀 Cron Injector started. Adding unique URL batches every 20-30 seconds...');