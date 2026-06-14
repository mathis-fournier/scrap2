const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit'); // <-- Added rate limiter
const logger = require('./logger');

const authRoutes = require('./routes/authRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const keywordsRoutes = require('./routes/keywordsRoutes');
const itemsRoutes = require('./routes/itemsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const usersRoutes = require('./routes/usersRoutes');

const app = express();

// ==========================================
// CORS CONFIGURATION
// ==========================================
const FRONTEND_URL = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : null;
const allowedOrigins = [
    FRONTEND_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173'
].filter(Boolean);

function isPrivateLanOrigin(origin) {
    try {
        const url = new URL(origin);
        return url.port === '5173' && ['http:', 'https:'].includes(url.protocol) &&
            (/^10\./.test(url.hostname) ||
                /^127\./.test(url.hostname) ||
                /^192\.168\./.test(url.hostname) ||
                /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(url.hostname));
    } catch (err) {
        return false;
    }
}

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || isPrivateLanOrigin(origin)) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

app.use(express.json());

// ==========================================
// RATE LIMITING CONFIGURATION
// ==========================================

// General API Rate Limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // Limit each IP to 150 requests per window
    message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict Auth Rate Limiter (Brute-force protection)
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 15, // Limit each IP to 15 auth attempts per hour
    message: { error: 'Too many authentication attempts. Please try again in an hour.' }
});

// Apply general limiter to all /api routes
app.use('/api', apiLimiter);

// ==========================================
// MOUNTING ROUTES
// ==========================================

// Apply the strict auth limiter specifically to the auth routes
app.use('/api', authRoutes);

// Standard routes (only subjected to the general apiLimiter)
app.use('/api', settingsRoutes);
app.use('/api', keywordsRoutes);
app.use('/api', itemsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api', adminRoutes);

// ==========================================
// ERROR HANDLING
// ==========================================
app.use((err, req, res, next) => {
    logger.error(err, 'Unhandled request error');
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;