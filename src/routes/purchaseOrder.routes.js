const express = require('express');
const router = express.Router();
const poController = require('../controllers/purchaseOrder.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');

router.get('/', verifyToken, requireAdmin, poController.getPurchaseOrders);
router.post('/', verifyToken, requireAdmin, poController.createPurchaseOrder);
router.patch('/:id/status', verifyToken, requireAdmin, poController.updatePurchaseOrderStatus);

module.exports = router;
