const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');

router.get('/', categoryController.getCategories);
router.post('/', verifyToken, requireAdmin, categoryController.createCategory);

module.exports = router;
