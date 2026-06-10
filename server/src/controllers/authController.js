const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const logger = require('../logger');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("FATAL: JWT_SECRET is not defined");

async function registerUser(req, res) {
    const { email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = crypto.randomUUID();
        await db.execute('INSERT INTO users (id, email, password) VALUES (?, ?, ?)', [id, email, hashedPassword]);

        const token = jwt.sign({ userId: id, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, userId: id, role: 'user' });
    } catch (err) {
        logger.error(err, 'registerUser failed');
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email already exists' });
        res.status(500).json({ error: err.message });
    }
}

async function loginUser(req, res) {
    const { email, password } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, userId: user.id, role: user.role });
    } catch (err) {
        logger.error(err, 'loginUser failed');
        res.status(500).json({ error: err.message });
    }
}

// 1. Send the user to Discord's login page
function discordLogin(req, res) {
    const url = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20email`;
    res.redirect(url);
}

// 2. Discord sends them back here with a secret code
async function discordCallback(req, res) {
    const { code } = req.query;
    if (!code) return res.redirect(`${process.env.FRONTEND_URL}/login?error=NoCode`);

    try {
        // Exchange the code for an Access Token
        const tokenParams = new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env.DISCORD_REDIRECT_URI
        });

        const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: tokenParams
        });
        const tokenData = await tokenRes.json();

        if (tokenData.error) throw new Error(tokenData.error_description);

        // Fetch the user's Discord profile
        const userRes = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        const discordUser = await userRes.json();

        // Check if user exists in DB by discord_id or email
        const [existingUsers] = await db.execute(
            'SELECT * FROM users WHERE discord_id = ? OR email = ?',
            [discordUser.id, discordUser.email]
        );

        let userId;
        let role = 'user';

        if (existingUsers.length > 0) {
            userId = existingUsers[0].id;
            role = existingUsers[0].role || 'user';
            // Update their latest Discord avatar
            await db.execute(
                'UPDATE users SET discord_id = ?, avatar = ? WHERE id = ?',
                [discordUser.id, discordUser.avatar, userId]
            );
        } else {
            // Create a new user
            userId = crypto.randomUUID();
            await db.execute(
                'INSERT INTO users (id, email, discord_id, avatar, role) VALUES (?, ?, ?, ?, ?)',
                [userId, discordUser.email, discordUser.id, discordUser.avatar, 'user']
            );
        }

        // Generate your existing JWT token
        const token = jwt.sign({ userId: userId, role }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Redirect back to your React app with the token and userId in the URL
        res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${encodeURIComponent(token)}&userId=${userId}`);

    } catch (error) {
        logger.error('[OAuth] Discord Login Failed:', error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=OAuthFailed`);
    }
}

module.exports = { registerUser, loginUser, discordLogin, discordCallback };
