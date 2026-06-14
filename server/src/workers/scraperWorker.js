const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const { Worker } = require('bullmq');
const Redis = require('ioredis');
const db = require('../db');
const logger = require('../logger');
const { scanVinted } = require('../services/vintedService');

// If you haven't created the Discord service yet, you can comment this out
const { sendTeaserWebhook } = require('../services/discordService');

const redisConnection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
const redisPub = new Redis(process.env.REDIS_URL);

const worker = new Worker('vinted-scan-queue', async job => {
    const { apiUrl, delegatedUserId, cookie, userAgent, proxyUrl, subscribers } = job.data;
    const isLocalNetwork = !proxyUrl;

    try {
        const annonces = await scanVinted(apiUrl, cookie, userAgent, proxyUrl);

        // Check if the response is an error object rather than an array of items
        if (annonces && !Array.isArray(annonces)) {
            if (annonces.empty) return;

            if (annonces.error === 'SESSION_EXPIRED') {
                logger.warn(`[Worker] Cookie died for Delegated User ${delegatedUserId}. Stripping access.`);
                await db.execute('UPDATE users SET vinted_cookie = NULL WHERE id = ?', [delegatedUserId]);
                redisPub.publish('vinted-system', JSON.stringify({ userId: delegatedUserId, type: 'COOKIE_DEAD' }));
                return;
            }

            if (annonces.error === 'PROXY_BANNED') {
                if (isLocalNetwork) {
                    logger.warn(`[Worker] ⚠️ Request failed (PROXY_BANNED) for Delegated User ${delegatedUserId} on LOCAL NETWORK. No rotation possible.`);
                    return;
                }

                logger.warn(`[Worker] ⚠️ Proxy failed for Delegated User ${delegatedUserId}. Initiating auto-rotation...`);

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
        }

        // If it's a valid array of items
        if (Array.isArray(annonces) && annonces.length > 0) {
            const insertValues = [];
            const matchedHits = [];

            // Loop through EVERY item Vinted returned
            for (const annonce of annonces) {
                // Evaluate the specific item against each subscriber's strict filters
                for (const sub of subscribers) {
                    let isMatch = true;

                    // 1. Strict Title Check
                    if (sub.searchTitle && !annonce.titre.toLowerCase().includes(sub.searchTitle.toLowerCase())) {
                        isMatch = false;
                    }

                    // 2. Strict Brand Check
                    if (isMatch && sub.targetBrand && annonce.brand.toLowerCase() !== sub.targetBrand.toLowerCase()) {
                        isMatch = false;
                    }

                    // 3. Flexible Size Check
                    if (isMatch && sub.targetSize) {
                        const itemSizeStr = annonce.size.toLowerCase();
                        const targetSizeStr = sub.targetSize.toLowerCase();

                        try {
                            const sizeRegex = new RegExp(`\\b${targetSizeStr}\\b`, 'i');
                            if (!sizeRegex.test(itemSizeStr)) {
                                isMatch = false;
                            }
                        } catch (e) {
                            if (!itemSizeStr.includes(targetSizeStr)) {
                                isMatch = false;
                            }
                        }
                    }

                    // If the item passes all filters for this user, queue it up
                    if (isMatch) {
                        insertValues.push([
                            annonce.id, sub.userId, sub.keywordId, annonce.titre,
                            annonce.prix, annonce.lien, annonce.image, annonce.brand, annonce.size
                        ]);
                        // Store both the user who needs the alert and the specific item that triggered it
                        matchedHits.push({ sub, annonce });
                    }
                }
            }

            // Execute database query and publish events
            if (insertValues.length > 0) {
                const [result] = await db.query(
                    `INSERT IGNORE INTO items 
                    (id, user_id, keyword_id, title, price, url, image_url, brand, size) 
                    VALUES ?`,
                    [insertValues]
                );

                // Only blast notifications if new rows were actually added (prevents duplicate alerts on consecutive scans)
                if (result.affectedRows > 0) {
                    for (const hit of matchedHits) {
                        const { sub, annonce } = hit;

                        // Blast to Discord marketing channel
                        if (sendTeaserWebhook) {
                            sendTeaserWebhook({
                                title: annonce.titre, price: annonce.prix,
                                brand: annonce.brand, size: annonce.size, imageUrl: annonce.image
                            });
                        }

                        // Send to the React Dashboard
                        logger.info(`🎯 STRICT HIT! [${sub.keywordName}] for User ${sub.userId} : ${annonce.titre}`);
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
                }
            }
        }
    } catch (error) {
        logger.error(error, `[Worker] Error scanning URL`);
    }

}, {
    connection: redisConnection,
    concurrency: 10
});

worker.on('failed', (job, err) => {
    logger.error(err, `[Worker] Job completely failed for URL: ${job?.data?.apiUrl || 'Unknown'}`);
});

worker.on('error', err => {
    logger.error(err, `[Worker] Critical BullMQ Worker Error!`);
});

worker.on('active', job => {
    logger.info(`[Worker] Started processing job ${job.id} for URL: ${job.data.apiUrl}`);
});

logger.info('🚀 Worker listening for deduplicated URL batches...');