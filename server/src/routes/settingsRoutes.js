const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { saveUserSettings, getUserSettings } = require('../controllers/settingsController');

const router = express.Router();

router.get('/settings', authenticateToken, getUserSettings);
router.post('/settings', authenticateToken, saveUserSettings);

module.exports = router;