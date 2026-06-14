const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const logger = require('../logger');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '_refresh';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d'; // 7 days
const INACTIVITY_TIMEOUT = parseInt(process.env.INACTIVITY_TIMEOUT || '1800000'); // 30 minutes in ms

if (!JWT_SECRET) throw new Error("FATAL: JWT_SECRET is not defined");

/**
 * Generate access and refresh tokens
 */
function generateTokens(userId, role) {
    const accessToken = jwt.sign(
        { userId, role, type: 'access' },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
        { userId, role, type: 'refresh' },
        JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    return { accessToken, refreshToken };
}

/**
 * Hash a token for database storage
 */
function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Store refresh token in database
 */
async function storeRefreshToken(userId, refreshToken) {
    try {
        const tokenHash = hashToken(refreshToken);
        const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await db.execute(
            'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
            [userId, tokenHash, expiryDate]
        );

        return true;
    } catch (err) {
        logger.error(err, 'Failed to store refresh token');
        return false;
    }
}

/**
 * Verify refresh token exists in database and is not revoked
 */
async function verifyRefreshTokenInDb(userId, refreshToken) {
    try {
        const tokenHash = hashToken(refreshToken);
        const [rows] = await db.execute(
            'SELECT * FROM refresh_tokens WHERE user_id = ? AND token_hash = ? AND expires_at > NOW() AND revoked = FALSE',
            [userId, tokenHash]
        );

        return rows.length > 0;
    } catch (err) {
        logger.error(err, 'Failed to verify refresh token in db');
        return false;
    }
}

/**
 * Revoke a refresh token
 */
async function revokeRefreshToken(userId, refreshToken) {
    try {
        const tokenHash = hashToken(refreshToken);
        await db.execute(
            'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = ? AND token_hash = ?',
            [userId, tokenHash]
        );
        return true;
    } catch (err) {
        logger.error(err, 'Failed to revoke refresh token');
        return false;
    }
}

/**
 * Revoke all refresh tokens for a user (logout all devices)
 */
async function revokeAllRefreshTokens(userId) {
    try {
        await db.execute(
            'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = ?',
            [userId]
        );
        return true;
    } catch (err) {
        logger.error(err, 'Failed to revoke all refresh tokens');
        return false;
    }
}

async function registerUser(req, res) {
    const { email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = crypto.randomUUID();
        await db.execute('INSERT INTO users (id, email, password, last_login) VALUES (?, ?, ?, NOW())', [id, email, hashedPassword]);

        const { accessToken, refreshToken } = generateTokens(id, 'user');
        await storeRefreshToken(id, refreshToken);

        res.json({
            accessToken,
            refreshToken,
            userId: id,
            role: 'user',
            expiresIn: 900 // 15 minutes in seconds
        });
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

        // Update last login
        await db.execute('UPDATE users SET last_login = NOW(), last_activity = NOW() WHERE id = ?', [user.id]);

        const { accessToken, refreshToken } = generateTokens(user.id, user.role);
        await storeRefreshToken(user.id, refreshToken);

        res.json({
            accessToken,
            refreshToken,
            userId: user.id,
            role: user.role,
            expiresIn: 900 // 15 minutes in seconds
        });
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
            // Update their latest Discord avatar and last_login
            await db.execute(
                'UPDATE users SET discord_id = ?, avatar = ?, last_login = NOW(), last_activity = NOW() WHERE id = ?',
                [discordUser.id, discordUser.avatar, userId]
            );
        } else {
            // Create a new user
            userId = crypto.randomUUID();
            await db.execute(
                'INSERT INTO users (id, email, discord_id, avatar, role, last_login) VALUES (?, ?, ?, ?, ?, NOW())',
                [userId, discordUser.email, discordUser.id, discordUser.avatar, 'user']
            );
        }

        // Generate access and refresh tokens
        const { accessToken, refreshToken } = generateTokens(userId, role);
        await storeRefreshToken(userId, refreshToken);

        // Redirect back to your React app with tokens in the URL
        res.redirect(`${process.env.FRONTEND_URL}/auth-success?accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}&userId=${userId}`);

    } catch (error) {
        logger.error('[OAuth] Discord Login Failed:', error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=OAuthFailed`);
    }
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(req, res) {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required' });
        }

        // Verify the refresh token signature
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        } catch (err) {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        // Verify token exists in database and is not revoked
        const isValid = await verifyRefreshTokenInDb(decoded.userId, refreshToken);
        if (!isValid) {
            return res.status(401).json({ error: 'Refresh token revoked or expired' });
        }

        // Get user info to verify they still exist
        const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [decoded.userId]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        const user = users[0];

        // Check for inactivity
        const lastActivity = new Date(user.last_activity);
        const now = new Date();
        const inactivityDuration = now - lastActivity;

        if (inactivityDuration > INACTIVITY_TIMEOUT) {
            // User has been inactive too long, revoke all tokens and force re-login
            await revokeAllRefreshTokens(decoded.userId);
            return res.status(401).json({
                error: 'Session expired due to inactivity',
                code: 'INACTIVITY_TIMEOUT'
            });
        }

        // Update last_activity
        await db.execute('UPDATE users SET last_activity = NOW() WHERE id = ?', [decoded.userId]);

        // Generate new access token
        const { accessToken: newAccessToken } = generateTokens(decoded.userId, decoded.role);

        res.json({
            accessToken: newAccessToken,
            expiresIn: 900 // 15 minutes in seconds
        });
    } catch (err) {
        logger.error(err, 'refreshAccessToken failed');
        res.status(500).json({ error: err.message });
    }
}

/**
 * Logout user (revoke refresh token)
 */
async function logoutUser(req, res) {
    try {
        const { refreshToken } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        if (refreshToken) {
            // Revoke specific refresh token
            await revokeRefreshToken(userId, refreshToken);
        }

        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        logger.error(err, 'logoutUser failed');
        res.status(500).json({ error: err.message });
    }
}

/**
 * Logout all devices (revoke all refresh tokens)
 */
async function logoutAllDevices(req, res) {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        await revokeAllRefreshTokens(userId);
        res.json({ message: 'Logged out from all devices' });
    } catch (err) {
        logger.error(err, 'logoutAllDevices failed');
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    registerUser,
    loginUser,
    discordLogin,
    discordCallback,
    refreshAccessToken,
    logoutUser,
    logoutAllDevices
};
