const express = require('express');
const { registerUser, loginUser, discordCallback, discordLogin } = require('../controllers/authController');
const { validateAuth, checkValidationErrors } = require('../../middleware/validators');

const router = express.Router();

router.post('/register', validateAuth, checkValidationErrors, registerUser);
router.post('/login', validateAuth, checkValidationErrors, loginUser);

router.get('/auth/discord', discordLogin);
router.get('/auth/discord/callback', discordCallback);

module.exports = router;