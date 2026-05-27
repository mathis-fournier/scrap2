const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const logger = require('../logger');

async function scanVinted(apiUrl, cookie, userAgent, proxyUrl) {
    if (!cookie) {
        return null;
    }

    let httpsAgent = null;
    if (proxyUrl) {
        httpsAgent = new HttpsProxyAgent(proxyUrl);
    }

    try {
        // Add a debug log to know exactly when Axios starts the request
        logger.info(`[VintedService] Starting request for: ${apiUrl}`);

        const response = await axios.get(apiUrl, {
            httpsAgent: httpsAgent,
            proxy: false,
            timeout: 15000, // 🔥 CRITICAL: 15-second timeout to prevent infinite hangs
            headers: {
                'User-Agent': userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
                'Cookie': cookie,
                'Accept': 'application/json, text/plain, */*'
            }
        });

        const items = response.data.items;

        if (items && items.length > 0) {
            const realItems = items.filter(item => !item.is_promoted && !item.promoted);

            if (realItems.length > 0) {
                const firstItem = realItems[0];
                return {
                    id: firstItem.id.toString(),
                    titre: firstItem.title,
                    prix: firstItem.price?.amount || firstItem.price || 'N/A',
                    lien: firstItem.url,
                    image: firstItem.photo ? firstItem.photo.url : 'https://via.placeholder.com/300?text=No+Image',
                    brand: firstItem.brand_title || 'N/A',
                    size: firstItem.size_title || 'N/A'
                };
            }
        }
        return null;

    } catch (error) {
        // Enhanced Error formatting
        if (error.response) {
            if (error.response.status === 401) return { error: 'SESSION_EXPIRED' };
            if (error.response.status === 403 || error.response.status === 429) return { error: 'PROXY_BANNED' };
        }

        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
            logger.warn(`[VintedService] Timeout or Connection Reset for URL: ${apiUrl} (Code: ${error.code})`);
            return { error: 'PROXY_BANNED' };
        }

        // Log the full exact message so you know WHY it failed
        logger.error(error.message || error, `[VintedService] Axios request completely failed for URL ${apiUrl}`);
        return null;
    }
}

module.exports = { scanVinted };