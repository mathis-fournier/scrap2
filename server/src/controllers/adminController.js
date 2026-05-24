const db = require('../db');
const logger = require('../logger');

async function getAdminStats(req, res) {
    try {
        const [userCount] = await db.execute('SELECT COUNT(*) as total FROM users');
        const [keywordCount] = await db.execute('SELECT COUNT(*) as total FROM keywords');
        const [itemCount] = await db.execute('SELECT COUNT(*) as total FROM items');

        res.json({
            users: userCount[0].total,
            keywords: keywordCount[0].total,
            items: itemCount[0].total
        });
    } catch (err) {
        logger.error(err, 'getAdminStats failed');
        res.status(500).json({ error: err.message });
    }
}

async function listUsers(req, res) {
    try {
        const [users] = await db.execute(`
            SELECT 
                u.id, u.email, u.role, u.proxy_url, 
                IF(u.vinted_cookie IS NULL, 'Dead/Missing', 'Active') as cookie_status,
                u.created_at,
                COUNT(k.id) as keyword_count
            FROM users u
            LEFT JOIN keywords k ON u.id = k.user_id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `);
        res.json(users);
    } catch (err) {
        logger.error(err, 'listUsers failed');
        res.status(500).json({ error: err.message });
    }
}

async function deleteUser(req, res) {
    try {
        if (req.params.targetId === req.user.userId) {
            return res.status(400).json({ error: 'Cannot delete your own admin account.' });
        }
        await db.execute('DELETE FROM users WHERE id = ?', [req.params.targetId]);
        res.json({ success: true, message: 'User completely removed.' });
    } catch (err) {
        logger.error(err, 'deleteUser failed');
        res.status(500).json({ error: err.message });
    }
}

module.exports = { getAdminStats, listUsers, deleteUser };
