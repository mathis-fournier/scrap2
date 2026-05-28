const db = require('../db');
const logger = require('../logger');

async function getUserSettings(req, res) {
    const userId = req.user.userId;
    try {
        // Fetch vinted_cookie, use_proxy, and tier
        const [users] = await db.execute('SELECT use_proxy, vinted_cookie, tier FROM users WHERE id = ?', [userId]);

        if (users.length > 0) {
            res.json({
                useProxy: Boolean(users[0].use_proxy),
                hasCookie: !!users[0].vinted_cookie, // Returns true if it exists, false if it is NULL or empty
                tier: users[0].tier || 'free' // <-- Added tier to the frontend response
            });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        logger.error(err, 'getUserSettings failed');
        res.status(500).json({ error: err.message });
    }
}

async function saveUserSettings(req, res) {
    const userId = req.user.userId;
    const { cookie, useProxy } = req.body;

    try {
        const [users] = await db.execute('SELECT proxy_url FROM users WHERE id = ?', [userId]);
        let proxyToSave = users[0]?.proxy_url;

        if (!proxyToSave && process.env.PROXY_POOL) {
            const pool = process.env.PROXY_POOL.split(',');
            const [usedProxiesRows] = await db.execute('SELECT proxy_url FROM users WHERE proxy_url IS NOT NULL');
            const usedProxies = usedProxiesRows.map(row => row.proxy_url);
            const availableProxies = pool.filter(proxy => !usedProxies.includes(proxy));

            if (availableProxies.length > 0) {
                proxyToSave = availableProxies[Math.floor(Math.random() * availableProxies.length)];
            } else {
                return res.status(400).json({ error: 'System at capacity! No dedicated proxies available right now.' });
            }
        }

        // Force convert the boolean from frontend to 1 or 0 for MySQL
        const useProxyValue = useProxy ? 1 : 0;

        await db.execute(
            'UPDATE users SET vinted_cookie = ?, proxy_url = ?, use_proxy = ? WHERE id = ?',
            [cookie, proxyToSave, useProxyValue, userId]
        );

        res.json({ success: true, message: 'Settings saved successfully!' });
    } catch (err) {
        logger.error(err, 'saveUserSettings failed');
        res.status(500).json({ error: err.message });
    }
}

module.exports = { saveUserSettings, getUserSettings };