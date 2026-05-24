const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { saveUserSettings } = require('../controllers/settingsController');

const router = express.Router();

router.post('/settings', authenticateToken, saveUserSettings);

module.exports = router;
