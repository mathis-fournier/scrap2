const express = require('express');
const {
    registerUser,
    loginUser,
    discordCallback,
    discordLogin,
    refreshAccessToken,
    logoutUser,
    logoutAllDevices
} = require('../controllers/authController');
const { validateAuth, checkValidationErrors } = require('../../middleware/validators');
const { authenticateToken } = require('../../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', validateAuth, checkValidationErrors, registerUser);
router.post('/login', validateAuth, checkValidationErrors, loginUser);
router.post('/refresh-token', refreshAccessToken);

router.get('/auth/discord', discordLogin);
router.get('/auth/discord/callback', discordCallback);

// Protected routes
router.post('/logout', authenticateToken, logoutUser);
router.post('/logout-all-devices', authenticateToken, logoutAllDevices);

module.exports = router;