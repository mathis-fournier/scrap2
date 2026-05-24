const crypto = require('crypto');
const db = require('../db');
const logger = require('../logger');

async function createKeyword(req, res) {
    const userId = req.user.userId;
    const { keyword, minPrice, maxPrice } = req.body;
    const id = crypto.randomUUID();

    const parsedMin = minPrice !== '' && minPrice !== null ? parseFloat(minPrice) : null;
    const parsedMax = maxPrice !== '' && maxPrice !== null ? parseFloat(maxPrice) : null;

    let apiUrl = `https://www.vinted.fr/api/v2/catalog/items?search_text=${encodeURIComponent(keyword)}&order=newest_first`;
    if (parsedMin !== null) apiUrl += `&price_from=${parsedMin}`;
    if (parsedMax !== null) apiUrl += `&price_to=${parsedMax}`;

    try {
        await db.execute(
            'INSERT INTO keywords (id, user_id, name, min_price, max_price, api_url) VALUES (?, ?, ?, ?, ?, ?)',
            [id, userId, keyword, parsedMin, parsedMax, apiUrl]
        );
        res.json({ success: true, id, name: keyword, min_price: parsedMin, max_price: parsedMax, apiUrl });
    } catch (err) {
        logger.error(err, 'createKeyword failed');
        res.status(500).json({ error: err.message });
    }
}

async function getKeywords(req, res) {
    if (req.user.userId !== req.params.targetUserId) {
        return res.status(403).json({ error: 'Forbidden access.' });
    }

    try {
        const [rows] = await db.execute('SELECT * FROM keywords WHERE user_id = ?', [req.user.userId]);
        res.json(rows);
    } catch (err) {
        logger.error(err, 'getKeywords failed');
        res.status(500).json({ error: err.message });
    }
}

async function removeKeyword(req, res) {
    const { keywordId } = req.params;
    const userId = req.user.userId;

    try {
        await db.execute('DELETE FROM keywords WHERE id = ? AND user_id = ?', [keywordId, userId]);
        res.json({ success: true });
    } catch (err) {
        logger.error(err, 'removeKeyword failed');
        res.status(500).json({ error: err.message });
    }
}

module.exports = { createKeyword, getKeywords, removeKeyword };
