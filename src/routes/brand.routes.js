const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brand.controller');
const { authenticate, requireAdmin } = require('../middlewares/auth.middleware');

router.get('/', brandController.getBrands);
router.get('/:id', brandController.getBrandById);
router.post('/', authenticate, requireAdmin, brandController.createBrand);
router.put('/:id', authenticate, requireAdmin, brandController.updateBrand);
router.delete('/:id', authenticate, requireAdmin, brandController.deleteBrand);

module.exports = router;
