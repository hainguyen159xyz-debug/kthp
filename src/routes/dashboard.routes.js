const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');

router.get('/stats', verifyToken, requireAdmin, dashboardController.getDashboardStats);

module.exports = router;
