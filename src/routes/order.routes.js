const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate, requireAdmin } = require('../middlewares/auth.middleware');

// Customer routes
router.post('/', authenticate, orderController.createOrder);
router.get('/', authenticate, orderController.getMyOrders);
router.get('/admin', authenticate, requireAdmin, orderController.getAllOrders);
router.get('/:id', authenticate, orderController.getOrderById);

module.exports = router;
