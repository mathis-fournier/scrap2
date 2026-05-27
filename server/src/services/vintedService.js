// server/src/services/vintedService.js
const logger = require('../logger');

async function scanVinted(apiUrl, cookie, userAgent, proxyUrl) {
    if (!cookie) {
        return null;
    }

    try {
        // Dynamically import got-scraping (ESM) into your CommonJS environment
        const { gotScraping } = await import('got-scraping');

        logger.info(`[VintedService] Starting request for: ${apiUrl}`);

        const response = await gotScraping({
            url: apiUrl,
            responseType: 'json',
            timeout: { request: 15000 }, // 🔥 CRITICAL: 15-second timeout
            proxyUrl: proxyUrl || undefined, // Native proxy handling
            headers: {
                'User-Agent': userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
                'Cookie': cookie,
                'Accept': 'application/json, text/plain, */*'
            }
        });

        const items = response.body.items;

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
        // Enhanced Error formatting specifically for got-scraping responses
        if (error.response) {
            const status = error.response.statusCode;
            if (status === 401) return { error: 'SESSION_EXPIRED' };
            if (status === 403 || status === 429) return { error: 'PROXY_BANNED' };
        }

        // got-scraping network error codes
        if (['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED', 'ERR_NON_2XX_3XX_RESPONSE'].includes(error.code)) {
            logger.warn(`[VintedService] Timeout or Connection Reset for URL: ${apiUrl} (Code: ${error.code})`);
            return { error: 'PROXY_BANNED' };
        }

        // Log the full exact message
        logger.error(error.message || error, `[VintedService] got-scraping request completely failed for URL ${apiUrl}`);
        return null;
    }
}

module.exports = { scanVinted };