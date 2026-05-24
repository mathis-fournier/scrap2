require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./logger');

const authRoutes = require('./routes/authRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const keywordsRoutes = require('./routes/keywordsRoutes');
const itemsRoutes = require('./routes/itemsRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api', settingsRoutes);
app.use('/api', keywordsRoutes);
app.use('/api', itemsRoutes);
app.use('/api', adminRoutes);

app.use((err, req, res, next) => {
    logger.error(err, 'Unhandled request error');
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
