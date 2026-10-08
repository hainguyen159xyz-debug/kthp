const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const brandRoutes = require('./brand.routes');
const inventoryRoutes = require('./inventory.routes');
const orderRoutes = require('./order.routes');
const cartRoutes = require('./cart.routes');
const supplierRoutes = require('./supplier.routes');
const purchaseOrderRoutes = require('./purchaseOrder.routes');
const promotionRoutes = require('./promotion.routes');
const adminRoutes = require('./admin.routes');
const dashboardRoutes = require('./dashboard.routes');

// Health check endpoint (Bắt buộc giữ nguyên để tương thích)
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Hệ thống Backend API Giày Thể Thao đang hoạt động tốt!',
    timestamp: new Date().toISOString()
  });
});

// Gắn toàn bộ các module REST API
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/promotions', promotionRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
