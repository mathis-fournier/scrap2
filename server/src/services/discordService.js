const logger = require('../logger');

async function sendTeaserWebhook(item) {
    const webhookUrl = process.env.DISCORD_TEASER_WEBHOOK_URL;
    if (!webhookUrl) return;

    // Direct link to your high-converting waitlist/landing page
    const upgradeUrl = process.env.WAITLIST_URL || 'https://gratte.sh';

    // Parse platform or fallback
    const platformName = item.platform ? item.platform.toUpperCase() : 'MARKETPLACE';
    
    // FOMO Tactic: Obfuscate the exact item details slightly so they have to unlock it
    const cleanTitle = item.title || 'Item';
    const teasedTitle = cleanTitle.length > 20 
        ? `${cleanTitle.substring(0, 18)}... [🔒 LOCKED]` 
        : `${cleanTitle} [🔒 LOCKED]`;

    const payload = {
        username: 'gratte.sh | Omni-Scanner',
        avatar_url: 'https://i.imgur.com/your-logo.png', // Replace with your actual asset later
        embeds: [
            {
                title: `⚡ Steal Found on ${platformName}`,
                description: `A highly underpriced **${teasedTitle}** was just extracted. Premium members were alerted instantly.`,
                // Emerald Green accent color (Decimal for #10B981) to match your landing page
                color: 1096065, 
                fields: [
                    {
                        name: '💰 Price',
                        value: `**${item.price} €**`,
                        inline: true
                    },
                    {
                        name: '📈 Profit Est.',
                        value: '` High Margin `',
                        inline: true
                    },
                    {
                        name: '\u200B',
                        value: '\u200B',
                        inline: false
                    },
                    {
                        name: '🏷️ Brand',
                        value: `\`${item.brand || 'Hidden'}\``,
                        inline: true
                    },
                    {
                        name: '📏 Size',
                        value: `\`${item.size || 'Hidden'}\``,
                        inline: true
                    },
                    {
                        name: '🌐 Source',
                        value: `\`${platformName}\``,
                        inline: true
                    }
                ],
                thumbnail: {
                    // Keeps the blurred/unblurred product thumbnail clean on the right side
                    url: item.imageUrl 
                },
                footer: {
                    text: `🔒 Direct buying link & auto-checkout hidden • Latency: ${item.latency || '142'}ms`
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
                        style: 5, // Link Button
                        label: 'Gain Instant Access ⚡',
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
        }).catch(err => logger.error('[Discord Teaser] Silent fetch error:', err.message));
    } catch (error) {
        logger.error('[Discord Teaser] Failed to send webhook teaser');
    }
}

module.exports = { sendTeaserWebhook };