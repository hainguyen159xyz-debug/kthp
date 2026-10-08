const Product = require('../models/Product');

/**
 * Lấy danh sách sản phẩm (có lọc theo danh mục, thương hiệu, giá, size, màu sắc)
 */
exports.getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      size,
      color,
      isFastMoving,
      page = 1,
      limit = 12
    } = req.query;

    const filter = { isActive: true };

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      filter.category = category;
    }
    if (brand) {
      filter.brand = brand;
    }
    if (isFastMoving !== undefined) {
      filter.isFastMoving = isFastMoving === 'true';
    }

    // Lọc theo biến thể (Size, Màu, Giá)
    const variantFilters = {};
    if (size) variantFilters['variants.size'] = Number(size);
    if (color) variantFilters['variants.color'] = { $regex: color, $options: 'i' };
    if (minPrice || maxPrice) {
      variantFilters['variants.price'] = {};
      if (minPrice) variantFilters['variants.price'].$gte = Number(minPrice);
      if (maxPrice) variantFilters['variants.price'].$lte = Number(maxPrice);
    }

    Object.assign(filter, variantFilters);

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('brand', 'name slug')
        .populate('category', 'name slug')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Product.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy chi tiết sản phẩm theo ID hoặc Slug
 */
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('brand', 'name slug logoUrl')
      .populate('category', 'name slug')
      .populate('defaultSupplier', 'name phone leadTimeDays');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm.'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Thêm sản phẩm mới (Admin)
 */
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Tạo sản phẩm thành công.',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật sản phẩm (Admin)
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm cần cập nhật.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật sản phẩm thành công.',
      data: product
    });
  } catch (error) {
    next(error);
  }
};
