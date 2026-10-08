const Category = require('../models/Category');
const { isValidObjectId } = require('../validators/validate');

/**
 * Lấy danh sách danh mục (Public)
 * GET /api/categories
 */
exports.getCategories = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    } else {
      filter.status = 'active';
    }

    if (search) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    const categories = await Category.find(filter).sort({ name: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy chi tiết danh mục theo ID hoặc Slug (Public)
 * GET /api/categories/:id
 */
exports.getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let category;

    if (isValidObjectId(id)) {
      category = await Category.findById(id);
    } else {
      category = await Category.findOne({ slug: id });
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục.',
        errors: ['Danh mục không tồn tại']
      });
    }

    res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

/**
 * Tạo mới danh mục (Admin)
 * POST /api/categories
 */
exports.createCategory = async (req, res, next) => {
  try {
    const { name, slug, description, image, imageUrl, status } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Tên danh mục là bắt buộc.',
        errors: ['Tên danh mục không được để trống']
      });
    }

    const categorySlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const existingSlug = await Category.findOne({ slug: categorySlug });
    if (existingSlug) {
      return res.status(400).json({
        success: false,
        message: 'Slug danh mục đã tồn tại, vui lòng chọn tên khác.',
        errors: ['Slug trùng lặp']
      });
    }

    const category = await Category.create({
      name,
      slug: categorySlug,
      description: description || '',
      image: image || imageUrl || '',
      status: status || 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Tạo danh mục thành công.',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật danh mục (Admin)
 * PUT /api/categories/:id
 */
exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục cần cập nhật.',
        errors: ['Danh mục không tồn tại']
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật danh mục thành công.',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Xóa danh mục (Admin)
 * DELETE /api/categories/:id
 */
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục để xóa.',
        errors: ['Danh mục không tồn tại']
      });
    }

    res.status(200).json({
      success: true,
      message: 'Xóa danh mục thành công.'
    });
  } catch (error) {
    next(error);
  }
};
