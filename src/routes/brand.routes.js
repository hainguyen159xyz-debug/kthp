const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brand.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');

router.get('/', brandController.getBrands);
router.post('/', verifyToken, requireAdmin, brandController.createBrand);

module.exports = router;
