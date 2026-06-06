const crypto = require('crypto');
const db = require('../db');
const logger = require('../logger');

async function createKeyword(req, res) {
    const userId = req.user.userId;
    const { keyword, minPrice, maxPrice } = req.body;

    // 1. Get a dedicated connection for the transaction
    const connection = await db.getConnection();

    try {
        // 2. Start the transaction
        await connection.beginTransaction();

        // 3. Lock the user row (FOR UPDATE) to prevent concurrent reads
        const [users] = await connection.execute('SELECT tier FROM users WHERE id = ? FOR UPDATE', [userId]);
        const tier = users[0]?.tier || 'free';

        // 4. Count current trackers (this is now safe because concurrent requests are waiting)
        const [trackers] = await connection.execute('SELECT COUNT(*) as count FROM keywords WHERE user_id = ?', [userId]);
        const currentCount = trackers[0].count;

        const LIMITS = { free: 3, basic: 10, premium: 50 };
        const maxAllowed = LIMITS[tier] || 3;

        // 5. Block if over limit
        if (currentCount >= maxAllowed) {
            await connection.rollback(); // Release the lock
            connection.release();
            return res.status(403).json({
                error: `Limit Reached. The ${tier} tier allows a maximum of ${maxAllowed} trackers.`
            });
        }

        // 6. Proceed with insertion
        const id = crypto.randomUUID();
        const parsedMin = minPrice !== '' && minPrice !== null ? parseFloat(minPrice) : null;
        const parsedMax = maxPrice !== '' && maxPrice !== null ? parseFloat(maxPrice) : null;

        let apiUrl = `https://www.vinted.fr/api/v2/catalog/items?search_text=${encodeURIComponent(keyword)}&order=newest_first`;
        if (parsedMin !== null) apiUrl += `&price_from=${parsedMin}`;
        if (parsedMax !== null) apiUrl += `&price_to=${parsedMax}`;

        await connection.execute(
            'INSERT INTO keywords (id, user_id, name, min_price, max_price, api_url) VALUES (?, ?, ?, ?, ?, ?)',
            [id, userId, keyword, parsedMin, parsedMax, apiUrl]
        );

        // 7. Commit the transaction and release the lock
        await connection.commit();
        connection.release();

        res.json({ success: true, id, name: keyword, min_price: parsedMin, max_price: parsedMax, apiUrl });

    } catch (err) {
        // If anything fails, rollback to prevent database corruption
        await connection.rollback();
        connection.release();
        logger.error(err, 'createKeyword failed');
        res.status(500).json({ error: err.message });
    }
}

module.exports = { createKeyword, getKeywords, removeKeyword };
