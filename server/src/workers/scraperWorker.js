require('dotenv').config();
const { Worker } = require('bullmq');
const Redis = require('ioredis');
const db = require('../db');
const logger = require('../logger');
const { scanVinted } = require('../services/vintedService');

const redisConnection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
const redisPub = new Redis(process.env.REDIS_URL);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const worker = new Worker('vinted-scan-queue', async job => {
    const { userId, cookie, userAgent, proxyUrl, keywords } = job.data;

    logger.info(`[Worker] Starting batch for User ${userId} (${keywords.length} keywords) - Proxy: ${proxyUrl ? 'Active' : 'None'}`);

    for (const kw of keywords) {
        try {
            const annonce = await scanVinted(kw.apiUrl, cookie, userAgent, proxyUrl);

            if (annonce && annonce.error === 'SESSION_EXPIRED') {
                logger.warn(`[Worker] Cookie died for User ${userId}. Stripping access.`);
                await db.execute('UPDATE users SET vinted_cookie = NULL WHERE id = ?', [userId]);
                redisPub.publish('vinted-system', JSON.stringify({ userId, type: 'COOKIE_DEAD' }));
                break;
            }

            if (!annonce || annonce.error === 'PROXY_BANNED') {
                const reason = !annonce ? 'returned null' : 'returned PROXY_BANNED';
                logger.warn(`[Worker] ⚠️ Proxy failed (${reason}) for User ${userId}. Initiating auto-rotation...`);

                if (process.env.PROXY_POOL) {
                    const pool = process.env.PROXY_POOL.split(',');
                    const [assignedRows] = await db.execute('SELECT proxy_url FROM users WHERE proxy_url IS NOT NULL');
                    const assignedProxies = assignedRows.map(row => row.proxy_url);
                    const availableProxies = pool.filter(proxy => !assignedProxies.includes(proxy));

                    if (availableProxies.length > 0) {
                        const newProxy = availableProxies[Math.floor(Math.random() * availableProxies.length)];
                        await db.execute('UPDATE users SET proxy_url = ? WHERE id = ?', [newProxy, userId]);
                        logger.info(`[Worker] Reassigned User ${userId} to new UNIQUE proxy IP. (${availableProxies.length - 1} proxies remaining)`);
                    } else {
                        logger.error(new Error(`No unassigned proxies left in PROXY_POOL for User ${userId}`), 'Worker proxy rotation failure');
                    }
                } else {
                    logger.error(new Error('No PROXY_POOL found in .env'), 'Worker proxy rotation unavailable');
                }

                break;
            }

            if (annonce && !annonce.error) {
                const [result] = await db.execute(
                    `INSERT IGNORE INTO items 
                    (id, user_id, keyword_id, title, price, url, image_url, brand, size) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [annonce.id, userId, kw.id, annonce.titre, annonce.prix, annonce.lien, annonce.image, annonce.brand, annonce.size]
                );

                if (result.affectedRows > 0) {
                    logger.info(`🎯 HIT! [${kw.name}] : ${annonce.titre}`);
                    redisPub.publish('vinted-drops', JSON.stringify({
                        userId: userId,
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
            }
        } catch (error) {
            logger.error(error, `[Worker] Error on ${kw.name}`);
        }
        await delay(2500);
    }

    logger.info(`✅ [Worker] Finished batch for User ${userId}`);
}, {
    connection: redisConnection,
    concurrency: 5
});

worker.on('failed', (job, err) => {
    logger.error(err, `[Worker] Batch failed for User ${job?.data?.userId}`);
});

logger.info('🚀 Worker listening for user batches...');
