const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { createKeyword, getKeywords, removeKeyword } = require('../controllers/keywordController');

const router = express.Router();

router.post('/keywords', authenticateToken, createKeyword);
router.get('/keywords/:targetUserId', authenticateToken, getKeywords);
router.delete('/keywords/:keywordId', authenticateToken, removeKeyword);

module.exports = router;
