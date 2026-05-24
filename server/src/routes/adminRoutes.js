const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getAdminStats, listUsers, deleteUser } = require('../controllers/adminController');

const router = express.Router();

router.get('/admin/stats', authenticateToken, requireAdmin, getAdminStats);
router.get('/admin/users', authenticateToken, requireAdmin, listUsers);
router.delete('/admin/users/:targetId', authenticateToken, requireAdmin, deleteUser);

module.exports = router;
