const jwt = require('jsonwebtoken');
const db = require('../db');
const logger = require('../logger');

const JWT_SECRET = process.env.JWT_SECRET;
const INACTIVITY_TIMEOUT = parseInt(process.env.INACTIVITY_TIMEOUT || '1800000'); // 30 minutes in ms

if (!JWT_SECRET) throw new Error("FATAL: JWT_SECRET is not defined");

/**
 * Authenticate access token and track activity
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, JWT_SECRET, async (err, decodedUser) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: 'Token expired',
                    code: 'TOKEN_EXPIRED'
                });
            }
            return res.status(403).json({ error: 'Invalid or expired token.' });
        }

        // Reject if this is a refresh token, not an access token
        if (decodedUser.type === 'refresh') {
            return res.status(403).json({ error: 'Invalid token type. Use access token.' });
        }

        req.user = decodedUser;

        // Update last_activity in database (asynchronously, don't wait for it)
        db.execute('UPDATE users SET last_activity = NOW() WHERE id = ?', [decodedUser.userId])
            .catch(err => logger.error(err, 'Failed to update last_activity'));

        next();
    });
};

/**
 * Check for inactivity timeout
 */
const checkInactivity = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    // This would typically be called after authenticateToken
    // The activity check should happen in the refresh-token endpoint
    next();
};

const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized. Admins only.' });
    }
    next();
};

module.exports = { authenticateToken, requireAdmin, checkInactivity };
