const db = require('../db');
const logger = require('../logger');

async function getUserSettings(req, res) {
    const userId = req.user.userId;
    try {
        // Fetch vinted_cookie, use_proxy, and tier
        const [users] = await db.execute('SELECT use_proxy, vinted_cookie, tier FROM users WHERE id = ?', [userId]);

        if (users.length > 0) {
            const cookiePreview = users[0].vinted_cookie
                ? users[0].vinted_cookie.slice(0, 30)
                : null;

            res.json({
                useProxy: Boolean(users[0].use_proxy),
                hasCookie: !!users[0].vinted_cookie,
                cookiePreview,
                tier: users[0].tier || 'free'
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
        const [users] = await db.execute('SELECT proxy_url, vinted_cookie FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const currentCookie = users[0]?.vinted_cookie ?? null;
        let proxyToSave = users[0]?.proxy_url;
        const cookieToSave = cookie !== undefined ? cookie : currentCookie;

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
            [cookieToSave, proxyToSave, useProxyValue, userId]
        );

        res.json({ success: true, message: 'Settings saved successfully!' });
    } catch (err) {
        logger.error(err, 'saveUserSettings failed');
        res.status(500).json({ error: err.message });
    }
}

async function generateCookie(req, res) {
    const userId = req.user.userId;

    try {
        const { gotScraping } = await import('got-scraping');

        const requestOptions = {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            retry: { limit: 0 },
            throwHttpErrors: false
        };

        if (process.env.PROXY_URL || process.env.PROXY_HOST) {
            const proxyUrl = process.env.PROXY_URL || `http://${process.env.PROXY_USER}:${process.env.PROXY_PASS}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`;
            requestOptions.proxyUrl = proxyUrl;
        }

        const response = await gotScraping.get('https://www.vinted.fr', requestOptions);

        const setCookieHeaders = response.headers['set-cookie'];

        if (!setCookieHeaders || setCookieHeaders.length === 0) {
            return res.status(400).json({
                error: 'No cookies returned by Vinted.',
                statusCode: response.statusCode
            });
        }

        // Extract the "key=value" part of EVERY cookie Vinted sent us
        const cookieFragments = setCookieHeaders.map(headerStr => headerStr.split(';')[0]);

        // Filter out empty ones (like when they send "datadome=")
        const validCookies = cookieFragments.filter(c => c.includes('=') && !c.endsWith('='));

        if (validCookies.length === 0) {
            return res.status(400).json({ error: 'Failed to extract valid cookies.' });
        }

        // Combine them all into one massive valid Cookie string
        const newCookie = validCookies.join('; ');

        // Update the database
        await db.execute('UPDATE users SET vinted_cookie = ? WHERE id = ?', [newCookie, userId]);

        res.json({
            success: true,
            message: 'Cookie generated and saved successfully.',
            cookie: newCookie
        });

    } catch (error) {
        logger.error(error, 'Error generating Vinted cookie');
        res.status(500).json({ error: 'Internal server error while generating cookie.' });
    }
}

module.exports = { saveUserSettings, getUserSettings, generateCookie };