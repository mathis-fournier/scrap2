const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const logger = require('./logger');

const authRoutes = require('./routes/authRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const keywordsRoutes = require('./routes/keywordsRoutes');
const itemsRoutes = require('./routes/itemsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const usersRoutes = require('./routes/usersRoutes');

const app = express();

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

app.use('/api', authRoutes);
app.use('/api', settingsRoutes);
app.use('/api', keywordsRoutes);
app.use('/api', itemsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api', adminRoutes);

app.use((err, req, res, next) => {
    logger.error(err, 'Unhandled request error');
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
