const Brand = require('../models/Brand');
const { isValidObjectId } = require('../validators/validate');

/**
 * Lấy danh sách thương hiệu (Public)
 * GET /api/brands
 */
exports.getBrands = async (req, res, next) => {
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

    const brands = await Brand.find(filter).sort({ name: 1 });
    res.status(200).json({ success: true, data: brands });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy chi tiết thương hiệu theo ID hoặc Slug (Public)
 * GET /api/brands/:id
 */
exports.getBrandById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let brand;

    if (isValidObjectId(id)) {
      brand = await Brand.findById(id);
    } else {
      brand = await Brand.findOne({ slug: id });
    }

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thương hiệu.',
        errors: ['Thương hiệu không tồn tại']
      });
    }

    res.status(200).json({ success: true, data: brand });
  } catch (error) {
    next(error);
  }
};

/**
 * Tạo mới thương hiệu (Admin)
 * POST /api/brands
 */
exports.createBrand = async (req, res, next) => {
  try {
    const { name, slug, description, logo, logoUrl, status } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Tên thương hiệu là bắt buộc.',
        errors: ['Tên thương hiệu không được để trống']
      });
    }

    const brandSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const existingSlug = await Brand.findOne({ slug: brandSlug });
    if (existingSlug) {
      return res.status(400).json({
        success: false,
        message: 'Slug thương hiệu đã tồn tại, vui lòng chọn tên khác.',
        errors: ['Slug trùng lặp']
      });
    }

    const brand = await Brand.create({
      name,
      slug: brandSlug,
      description: description || '',
      logo: logo || logoUrl || '',
      logoUrl: logoUrl || logo || '',
      status: status || 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Tạo thương hiệu thành công.',
      data: brand
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật thương hiệu (Admin)
 * PUT /api/brands/:id
 */
exports.updateBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thương hiệu cần cập nhật.',
        errors: ['Thương hiệu không tồn tại']
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật thương hiệu thành công.',
      data: brand
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Xóa thương hiệu (Admin)
 * DELETE /api/brands/:id
 */
exports.deleteBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thương hiệu để xóa.',
        errors: ['Thương hiệu không tồn tại']
      });
    }

    res.status(200).json({
      success: true,
      message: 'Xóa thương hiệu thành công.'
    });
  } catch (error) {
    next(error);
  }
};
