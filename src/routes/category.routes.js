const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { authenticate, requireAdmin } = require('../middlewares/auth.middleware');

router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);
router.post('/', authenticate, requireAdmin, categoryController.createCategory);
router.put('/:id', authenticate, requireAdmin, categoryController.updateCategory);
router.delete('/:id', authenticate, requireAdmin, categoryController.deleteCategory);

module.exports = router;
