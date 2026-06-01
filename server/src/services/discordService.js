const logger = require('../logger');

async function sendTeaserWebhook(item) {
    const webhookUrl = process.env.DISCORD_TEASER_WEBHOOK_URL;
    if (!webhookUrl) return;

    // Generate a fake blurred link or just link to your landing page
    const upgradeUrl = 'https://yourwebsite.com/upgrade';

    const payload = {
        username: 'FinderPro Sniper',
        avatar_url: 'https://cdn-icons-png.flaticon.com/512/732/732221.png',
        embeds: [
            {
                title: '🚨 Massive Steal Detected!',
                description: `A **${item.title}** just dropped way below market value.`,
                color: 16711680, // Red color for urgency
                fields: [
                    {
                        name: '💵 Price',
                        value: `**${item.price}€**`,
                        inline: true
                    },
                    {
                        name: '🏷️ Brand',
                        value: item.brand || 'N/A',
                        inline: true
                    },
                    {
                        name: '📏 Size',
                        value: item.size || 'N/A',
                        inline: true
                    }
                ],
                thumbnail: {
                    url: item.imageUrl
                },
                footer: {
                    text: '🔒 Link hidden. Premium members are checking out right now.'
                },
                timestamp: new Date().toISOString()
            }
        ],
        components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 5, // Link button
                        label: 'Upgrade to Unlock Link ⚡',
                        url: upgradeUrl
                    }
                ]
            }
        ]
    };

    try {
        // Fire and forget using native fetch
        fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(err => logger.error('[Discord] Silent fetch error:', err.message));
    } catch (error) {
        logger.error('[Discord] Failed to send webhook teaser');
    }
}

module.exports = { sendTeaserWebhook };