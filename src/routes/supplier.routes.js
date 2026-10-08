const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');

router.get('/', verifyToken, requireAdmin, supplierController.getAllSuppliers);
router.post('/', verifyToken, requireAdmin, supplierController.createSupplier);
router.put('/:id', verifyToken, requireAdmin, supplierController.updateSupplier);

module.exports = router;
