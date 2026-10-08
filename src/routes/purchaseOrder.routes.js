const express = require('express');
const router = express.Router();
const poController = require('../controllers/purchaseOrder.controller');
const { authenticate, requireAdmin } = require('../middlewares/auth.middleware');

router.use(authenticate, requireAdmin);

router.get('/', poController.getPurchaseOrders);
router.get('/:id', poController.getPurchaseOrderById);
router.post('/', poController.createPurchaseOrder);
router.put('/:id', poController.updatePurchaseOrder);
router.patch('/:id/status', poController.updatePurchaseOrderStatus);

module.exports = router;
