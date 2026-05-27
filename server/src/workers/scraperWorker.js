const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const { Worker } = require('bullmq');
const Redis = require('ioredis');
const db = require('../db');
const logger = require('../logger');
const { scanVinted } = require('../services/vintedService');

const redisConnection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
const redisPub = new Redis(process.env.REDIS_URL);

const worker = new Worker('vinted-scan-queue', async job => {
    const { apiUrl, delegatedUserId, cookie, userAgent, proxyUrl, subscribers } = job.data;
    const isLocalNetwork = !proxyUrl;

    logger.info(`[Worker] Scanning 1 URL for ${subscribers.length} subscribers - Delegated to User ${delegatedUserId} via ${isLocalNetwork ? 'LOCAL NETWORK' : 'PROXY'}`);

    try {
        const annonce = await scanVinted(apiUrl, cookie, userAgent, proxyUrl);

        if (annonce && annonce.error === 'SESSION_EXPIRED') {
            logger.warn(`[Worker] Cookie died for Delegated User ${delegatedUserId}. Stripping access.`);
            await db.execute('UPDATE users SET vinted_cookie = NULL WHERE id = ?', [delegatedUserId]);
            redisPub.publish('vinted-system', JSON.stringify({ userId: delegatedUserId, type: 'COOKIE_DEAD' }));
            return;
        }

        if (!annonce || annonce.error === 'PROXY_BANNED') {
            const reason = !annonce ? 'returned null' : 'returned PROXY_BANNED';

            // If they are on local network, do not rotate proxies. Just log the failure (IP might be blocked locally)
            if (isLocalNetwork) {
                logger.warn(`[Worker] ⚠️ Request failed (${reason}) for Delegated User ${delegatedUserId} on LOCAL NETWORK. No rotation possible.`);
                return;
            }

            logger.warn(`[Worker] ⚠️ Proxy failed (${reason}) for Delegated User ${delegatedUserId}. Initiating auto-rotation...`);

            if (process.env.PROXY_POOL) {
                const pool = process.env.PROXY_POOL.split(',');
                const [assignedRows] = await db.execute('SELECT proxy_url FROM users WHERE proxy_url IS NOT NULL');
                const assignedProxies = assignedRows.map(row => row.proxy_url);
                const availableProxies = pool.filter(proxy => !assignedProxies.includes(proxy));

                if (availableProxies.length > 0) {
                    const newProxy = availableProxies[Math.floor(Math.random() * availableProxies.length)];
                    await db.execute('UPDATE users SET proxy_url = ? WHERE id = ?', [newProxy, delegatedUserId]);
                    logger.info(`[Worker] Reassigned User ${delegatedUserId} to new UNIQUE proxy IP.`);
                }
            }
            return;
        }

        if (annonce && !annonce.error) {
            // Fan-out: Execute all DB inserts and Redis publishes concurrently
            const notificationPromises = subscribers.map(async (sub) => {
                const [result] = await db.execute(
                    `INSERT IGNORE INTO items 
                    (id, user_id, keyword_id, title, price, url, image_url, brand, size) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [annonce.id, sub.userId, sub.keywordId, annonce.titre, annonce.prix, annonce.lien, annonce.image, annonce.brand, annonce.size]
                );

                // Only publish to the socket if this specific user hasn't seen it yet
                if (result.affectedRows > 0) {
                    logger.info(`🎯 HIT! [${sub.keywordName}] for User ${sub.userId} : ${annonce.titre}`);
                    redisPub.publish('vinted-drops', JSON.stringify({
                        userId: sub.userId,
                        item: {
                            id: annonce.id,
                            title: annonce.titre,
                            price: annonce.prix,
                            url: annonce.lien,
                            imageUrl: annonce.image,
                            brand: annonce.brand,
                            size: annonce.size,
                            platform: 'Vinted'
                        }
                    }));
                }
            });
            await Promise.all(notificationPromises);
        }
    } catch (error) {
        logger.error(error, `[Worker] Error scanning URL`);
    }

}, {
    connection: redisConnection,
    concurrency: 10
});

worker.on('failed', (job, err) => {
    logger.error(err, `[Worker] Job failed for URL batch`);
});

worker.on('failed', (job, err) => {
    logger.error(err, `[Worker] Job completely failed for URL: ${job?.data?.apiUrl || 'Unknown'}`);
});

// 🔥 Add this: Catches worker-level exceptions (e.g., Redis disconnects, OOM errors)
worker.on('error', err => {
    logger.error(err, `[Worker] Critical BullMQ Worker Error!`);
});

// 🔥 Add this: Confirms when the worker ACTUALLY picks up the job
worker.on('active', job => {
    logger.info(`[Worker] Started processing job ${job.id} for URL: ${job.data.apiUrl}`);
});

logger.info('🚀 Worker listening for deduplicated URL batches...');