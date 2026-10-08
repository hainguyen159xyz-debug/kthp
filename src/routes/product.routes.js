const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');

router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.post('/', verifyToken, requireAdmin, productController.createProduct);
router.put('/:id', verifyToken, requireAdmin, productController.updateProduct);

module.exports = router;
