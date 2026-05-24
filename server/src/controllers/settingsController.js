const db = require('../db');
const logger = require('../logger');

async function saveUserSettings(req, res) {
    const userId = req.user.userId;
    const { cookie } = req.body;

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

        await db.execute('UPDATE users SET vinted_cookie = ?, proxy_url = ? WHERE id = ?', [cookie, proxyToSave, userId]);
        res.json({ success: true, message: 'Cookie saved and dedicated proxy secured!' });
    } catch (err) {
        logger.error(err, 'saveUserSettings failed');
        res.status(500).json({ error: err.message });
    }
}

module.exports = { saveUserSettings };
