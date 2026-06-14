const logger = require('../logger');

async function scanVinted(apiUrl, cookie, userAgent, proxyUrl) {
    if (!cookie) {
        return null;
    }

    try {
        // Dynamically import got-scraping (ESM) into your CommonJS environment
        const { gotScraping } = await import('got-scraping');

        const response = await gotScraping({
            url: apiUrl,
            responseType: 'json',
            timeout: { request: 15000 },
            proxyUrl: proxyUrl || undefined,
            headers: {
                'User-Agent': userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
                'Cookie': cookie,
                'Accept': 'application/json, text/plain, */*'
            }
        });

        const body = response.body;

        // 1. Check for the "Soft" Cookie Death
        if (!body || !body.items) {
            const bodyStr = JSON.stringify(body || {}).toLowerCase();

            if (bodyStr.includes('unauthorized') || bodyStr.includes('login') || bodyStr.includes('session') || bodyStr.includes('jeton')) {
                logger.warn(`[VintedService] Soft session expiration detected in JSON body.`);
                return { error: 'SESSION_EXPIRED' };
            }
            if (bodyStr.includes('cloudflare') || bodyStr.includes('datadome') || bodyStr.includes('challenge')) {
                return { error: 'PROXY_BANNED' };
            }

            logger.warn(`[VintedService] Unexpected JSON structure (No items array). Body: ${bodyStr.substring(0, 150)}`);
            return null;
        }

        const items = body.items;

        // 2. Process ALL real items
        if (items.length > 0) {
            const realItems = items.filter(item => !item.is_promoted && !item.promoted);

            if (realItems.length > 0) {
                // Return the full array instead of just realItems[0]
                return realItems.map(item => ({
                    id: item.id.toString(),
                    titre: item.title,
                    prix: item.price?.amount || item.price || 'N/A',
                    lien: item.url,
                    image: item.photo ? item.photo.url : 'https://via.placeholder.com/300?text=No+Image',
                    brand: item.brand_title || 'N/A',
                    size: item.size_title || 'N/A',
                }));
            }
        }

        // 3. If the search was successful but no new items were found
        return { empty: true };

    } catch (error) {
        const status = error.response?.statusCode;
        const rawBody = error.response?.rawBody ? error.response.rawBody.toString().toLowerCase() : '';
        const stringBody = typeof error.response?.body === 'string' ? error.response.body.toLowerCase() : JSON.stringify(error.response?.body || {}).toLowerCase();

        const combinedBody = rawBody || stringBody;

        if (status === 401) {
            return { error: 'SESSION_EXPIRED' };
        }

        if (error.name === 'ParseError' || error.code === 'ERR_BODY_PARSE_FAILURE') {
            if (combinedBody.includes('cloudflare') || combinedBody.includes('datadome') || combinedBody.includes('challenge-platform')) {
                return { error: 'PROXY_BANNED' };
            }
            logger.warn(`[VintedService] JSON Parse failed. Likely redirected to login. Marking cookie dead.`);
            return { error: 'SESSION_EXPIRED' };
        }

        if (status === 403 || status === 429) {
            if (
                combinedBody.includes('cloudflare') ||
                combinedBody.includes('datadome') ||
                combinedBody.includes('security check') ||
                error.response?.headers?.server?.includes('cloudflare')
            ) {
                return { error: 'PROXY_BANNED' };
            }

            if (combinedBody.includes('unauthorized') || combinedBody.includes('login')) {
                return { error: 'SESSION_EXPIRED' };
            }

            return { error: 'PROXY_BANNED' };
        }

        if (['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED', 'ERR_NON_2XX_3XX_RESPONSE', 'EHOSTUNREACH', 'ENOTFOUND'].includes(error.code)) {
            logger.warn(`[VintedService] Network timeout/reset for URL: ${apiUrl} (Code: ${error.code})`);
            return { error: 'PROXY_BANNED' };
        }

        logger.error(error.message || error, `[VintedService] Unhandled scraper crash for URL ${apiUrl}`);
        return null;
    }
}

module.exports = { scanVinted };