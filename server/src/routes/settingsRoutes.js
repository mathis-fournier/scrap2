const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { saveUserSettings, getUserSettings, generateCookie } = require('../controllers/settingsController');

const router = express.Router();

router.get('/settings', authenticateToken, getUserSettings);
router.post('/settings', authenticateToken, saveUserSettings);
router.post('/settings/generate-cookie', authenticateToken, generateCookie);

module.exports = router;