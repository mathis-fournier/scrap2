const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');
const { validateAuth, checkValidationErrors } = require('../../middleware/validators');

const router = express.Router();

router.post('/register', validateAuth, checkValidationErrors, registerUser);
router.post('/login', validateAuth, checkValidationErrors, loginUser);

module.exports = router;