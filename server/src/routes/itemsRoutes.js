const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getUserItems } = require('../controllers/itemController');

const router = express.Router();

router.get('/items/:targetUserId', authenticateToken, getUserItems);

module.exports = router;
