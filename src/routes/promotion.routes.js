const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotion.controller');
const { authenticate, requireAdmin } = require('../middlewares/auth.middleware');

// Public & Customer endpoints
router.get('/', promotionController.getPromotions);
router.get('/:id', promotionController.getPromotionById);
router.post('/apply', promotionController.applyPromotion);

// Admin-only endpoints
router.post('/', authenticate, requireAdmin, promotionController.createPromotion);
router.put('/:id', authenticate, requireAdmin, promotionController.updatePromotion);
router.delete('/:id', authenticate, requireAdmin, promotionController.deletePromotion);

module.exports = router;
