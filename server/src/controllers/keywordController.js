const crypto = require('crypto');
const db = require('../db');
const logger = require('../logger');

async function createKeyword(req, res) {
    const userId = req.user.userId;
    const { trackerName, searchText, minPrice, maxPrice, searchTitle, targetBrand, targetSize } = req.body;

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [users] = await connection.execute('SELECT tier FROM users WHERE id = ? FOR UPDATE', [userId]);
        const tier = users[0]?.tier || 'free';

        const [trackers] = await connection.execute('SELECT COUNT(*) as count FROM keywords WHERE user_id = ?', [userId]);
        const currentCount = trackers[0].count;

        const LIMITS = { free: 3, basic: 10, premium: 50 };
        const maxAllowed = LIMITS[tier] || 3;

        if (currentCount >= maxAllowed) {
            await connection.rollback();
            connection.release();
            return res.status(403).json({
                error: `Limit Reached. The ${tier} tier allows a maximum of ${maxAllowed} trackers.`
            });
        }

        const id = crypto.randomUUID();
        const parsedMin = minPrice !== '' && minPrice !== null ? parseFloat(minPrice) : null;
        const parsedMax = maxPrice !== '' && maxPrice !== null ? parseFloat(maxPrice) : null;

        // Display name defaults to the searchText if not provided
        const generatedName = trackerName || searchText || 'General Tracker';

        // 🔥 FIX: We MUST include search_text so Vinted only returns relevant items in its 20-item page
        let apiUrl = `https://www.vinted.fr/api/v2/catalog/items?search_text=${encodeURIComponent(searchText)}&order=newest_first`;
        if (parsedMin !== null) apiUrl += `&price_from=${parsedMin}`;
        if (parsedMax !== null) apiUrl += `&price_to=${parsedMax}`;

        await connection.execute(
            'INSERT INTO keywords (id, user_id, name, min_price, max_price, api_url, search_title, target_brand, target_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, userId, generatedName, parsedMin, parsedMax, apiUrl, searchTitle || null, targetBrand || null, targetSize || null]
        );

        await connection.commit();
        connection.release();

        res.json({
            success: true,
            id,
            name: generatedName,
            min_price: parsedMin,
            max_price: parsedMax,
            apiUrl,
            search_title: searchTitle || null,
            target_brand: targetBrand || null,
            target_size: targetSize || null
        });

    } catch (err) {
        await connection.rollback();
        connection.release();
        logger.error(err, 'createKeyword failed');
        res.status(500).json({ error: err.message });
    }
}

// ... getKeywords and removeKeyword remain exactly the same as before ...
async function getKeywords(req, res) {
    const { targetUserId } = req.params;
    const requesterId = req.user.userId;

    if (requesterId !== targetUserId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized access to keywords.' });
    }

    try {
        const [rows] = await db.execute(
            'SELECT id, name, min_price, max_price, api_url, search_title, target_brand, target_size FROM keywords WHERE user_id = ?',
            [targetUserId]
        );
        res.json(rows);
    } catch (err) {
        logger.error(err, 'getKeywords failed');
        res.status(500).json({ error: err.message });
    }
}

async function removeKeyword(req, res) {
    const { keywordId } = req.params;
    const requesterId = req.user.userId;

    try {
        const [rows] = await db.execute('SELECT user_id FROM keywords WHERE id = ?', [keywordId]);
        if (rows.length === 0) return res.status(404).json({ error: 'Keyword not found.' });

        if (requesterId !== rows[0].user_id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized.' });
        }

        await db.execute('DELETE FROM keywords WHERE id = ?', [keywordId]);
        res.json({ success: true });
    } catch (err) {
        logger.error(err, 'removeKeyword failed');
        res.status(500).json({ error: err.message });
    }
}

module.exports = { createKeyword, getKeywords, removeKeyword };