const express = require('express');
const router = express.Router();
const Redis = require('ioredis');

// Connect to Redis
const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

router.post('/track-click', async (req, res) => {
    try {
        const { userId, tier } = req.body;

        // Premium users bypass the limit entirely
        if (tier === 'premium') {
            return res.json({ allowed: true });
        }

        // Create a unique Redis key for this user for today (e.g., clicks:123:2026-05-28)
        const todayStr = new Date().toISOString().split('T')[0];
        const redisKey = `vinted:clicks:${userId}:${todayStr}`;

        // Increment their click count
        const currentClicks = await redis.incr(redisKey);

        // If this is their first click today, set the counter to expire in 24 hours (86400 seconds)
        if (currentClicks === 1) {
            await redis.expire(redisKey, 86400);
        }

        // The Limit: 3 clicks per day
        if (currentClicks > 3) {
            return res.json({ allowed: false, remaining: 0 });
        }

        res.json({ allowed: true, remaining: 3 - currentClicks });
    } catch (error) {
        console.error('[Users Route] Error tracking click:', error);
        // Fail open: If Redis crashes, let them through so the app doesn't break
        res.json({ allowed: true });
    }
});

module.exports = router;