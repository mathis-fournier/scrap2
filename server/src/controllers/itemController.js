const db = require('../db');
const logger = require('../logger');

async function getUserItems(req, res) {
    if (req.user.userId !== req.params.targetUserId) {
        return res.status(403).json({ error: 'Forbidden access.' });
    }

    try {
        const [rows] = await db.execute(
            'SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC LIMIT 60',
            [req.user.userId]
        );
        res.json(rows);
    } catch (err) {
        logger.error(err, 'getUserItems failed');
        res.status(500).json({ error: err.message });
    }
}

module.exports = { getUserItems };
