const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { authenticate, requireAdmin } = require('../middlewares/auth.middleware');

router.use(authenticate, requireAdmin);

router.get('/', inventoryController.getAllInventory);
router.get('/:productId', inventoryController.getInventoryByProductId);
router.post('/', inventoryController.createInventory);
router.put('/:id', inventoryController.updateInventory);

module.exports = router;
