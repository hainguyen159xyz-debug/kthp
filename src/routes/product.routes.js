const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const reviewController = require('../controllers/review.controller');
const { authenticate, requireAdmin } = require('../middlewares/auth.middleware');

// Public endpoints
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// Reviews endpoints
router.get('/:productId/reviews', reviewController.getProductReviews);
router.post('/:productId/reviews', authenticate, reviewController.createProductReview);

// Admin-only endpoints
router.post('/', authenticate, requireAdmin, productController.createProduct);
router.put('/:id', authenticate, requireAdmin, productController.updateProduct);
router.delete('/:id', authenticate, requireAdmin, productController.deleteProduct);

module.exports = router;
