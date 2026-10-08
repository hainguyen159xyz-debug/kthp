const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const adminController = require('../controllers/admin.controller');
const { authenticate, requireAdmin } = require('../middlewares/auth.middleware');

// Toàn bộ route admin đều yêu cầu đăng nhập và có role admin
router.use(authenticate, requireAdmin);

// Quản lý Đơn hàng (Orders)
router.get('/orders', orderController.getAllOrders);
router.get('/orders/:id', orderController.getOrderById);
router.patch('/orders/:id/status', orderController.updateOrderStatus);

// Quản lý Khách hàng (Customers)
router.get('/customers', adminController.getAllCustomers);
router.get('/customers/:id', adminController.getCustomerById);
router.patch('/customers/:id/status', adminController.updateCustomerStatus);

// Quản lý Đánh giá (Reviews)
router.get('/reviews', adminController.getAllReviews);
router.delete('/reviews/:id', adminController.deleteReview);

module.exports = router;
