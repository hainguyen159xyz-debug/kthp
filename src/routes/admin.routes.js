const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate, requireAdmin } = require('../middlewares/auth.middleware');

router.use(authenticate, requireAdmin);

router.get('/orders', orderController.getAllOrders);
router.get('/orders/:id', orderController.getOrderById);
router.patch('/orders/:id/status', orderController.updateOrderStatus);

module.exports = router;
