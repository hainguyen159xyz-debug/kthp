const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');

// Routes dành cho khách hàng
router.post('/', verifyToken, orderController.createOrder);
router.get('/my-orders', verifyToken, orderController.getMyOrders);
router.get('/:id', verifyToken, orderController.getOrderById);

// Routes dành cho Admin quản lý đơn hàng
router.get('/', verifyToken, requireAdmin, orderController.getAllOrders);
router.patch('/:id/status', verifyToken, requireAdmin, orderController.updateOrderStatus);

module.exports = router;
