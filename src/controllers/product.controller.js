const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const { isValidObjectId } = require('../validators/validate');

/**
 * Lấy danh sách sản phẩm với bộ lọc, tìm kiếm, phân trang và sắp xếp
 * GET /api/products
 */
exports.getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      status,
      featured,
      size,
      color,
      isFastMoving,
      gender,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 12
    } = req.query;

    const filter = {};

    // Chỉ lọc sản phẩm active cho khách, hoặc theo status nếu admin truyền vào
    if (status) {
      if (status !== 'all') {
        filter.status = status;
      }
    } else {
      filter.status = 'active';
    }

    if (search) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    if (category) {
      filter.category = category;
    }

    if (brand) {
      filter.brand = brand;
    }

    if (gender) {
      const g = String(gender).toLowerCase().trim();
      if (g === 'men') {
        filter.gender = { $in: ['men', 'unisex'] };
      } else if (g === 'women') {
        filter.gender = { $in: ['women', 'unisex'] };
      } else if (g === 'unisex') {
        filter.gender = 'unisex';
      }
    }

    if (featured !== undefined) {
      filter.featured = featured === 'true' || featured === true;
    }

    if (isFastMoving !== undefined) {
      filter.isFastMoving = isFastMoving === 'true' || isFastMoving === true;
    }

    // Lọc theo khoảng giá (salePrice hoặc variants.price)
    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (minPrice) priceFilter.$gte = Number(minPrice);
      if (maxPrice) priceFilter.$lte = Number(maxPrice);
      filter.$or = [{ salePrice: priceFilter }, { 'variants.price': priceFilter }];
    }

    // Lọc theo size hoặc color
    if (size) {
      filter.$or = filter.$or || [];
      filter.$or.push({ sizes: Number(size) }, { 'variants.size': Number(size) });
    }
    if (color) {
      filter.$or = filter.$or || [];
      filter.$or.push(
        { colors: { $regex: color.trim(), $options: 'i' } },
        { 'variants.color': { $regex: color.trim(), $options: 'i' } }
      );
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 12);
    const skip = (pageNum - 1) * limitNum;

    // Sắp xếp
    const sortOptions = {};
    const sortField = ['createdAt', 'salePrice', 'name', 'totalSold'].includes(sortBy)
      ? sortBy
      : 'createdAt';
    sortOptions[sortField] = order === 'asc' ? 1 : -1;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('brand', 'name slug logo')
        .populate('category', 'name slug')
        .skip(skip)
        .limit(limitNum)
        .sort(sortOptions),
      Product.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy chi tiết sản phẩm theo ID hoặc Slug
 * GET /api/products/:id
 */
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let product;

    if (isValidObjectId(id)) {
      product = await Product.findById(id)
        .populate('brand', 'name slug logo logoUrl')
        .populate('category', 'name slug')
        .populate('defaultSupplier', 'name phone leadTimeDays');
    } else {
      product = await Product.findOne({ slug: id })
        .populate('brand', 'name slug logo logoUrl')
        .populate('category', 'name slug')
        .populate('defaultSupplier', 'name phone leadTimeDays');
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm.',
        errors: ['Sản phẩm không tồn tại']
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
 * POST /api/products
 */
exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      slug,
      brand,
      category,
      costPrice,
      salePrice,
      description,
      images,
      sizes,
      colors,
      stock,
      status,
      featured,
      variants,
      defaultSupplier,
      isFastMoving
    } = req.body;

    if (!name || !brand || !category) {
      return res.status(400).json({
        success: false,
        message: 'Tên sản phẩm, thương hiệu và danh mục là bắt buộc.',
        errors: ['Thiếu thông tin bắt buộc']
      });
    }

    const autoSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + `-${Date.now().toString().slice(-4)}`;

    const product = await Product.create({
      name,
      slug: autoSlug,
      brand,
      category,
      costPrice: Number(costPrice) || 0,
      salePrice: Number(salePrice) || 0,
      description: description || '',
      images: images || [],
      sizes: sizes || [],
      colors: colors || [],
      stock: Number(stock) || 0,
      status: status || 'active',
      featured: featured || false,
      variants: variants || [],
      gender: req.body.gender || 'men',
      defaultSupplier,
      isFastMoving: isFastMoving || false
    });

    // Tự động khởi tạo tồn kho nếu có variants
    if (variants && variants.length > 0) {
      for (const v of variants) {
        await Inventory.findOneAndUpdate(
          { product: product._id, size: v.size, color: v.color },
          {
            sku: v.sku,
            quantity: v.stockQuantity || 0,
            reservedQuantity: 0,
            availableQuantity: v.stockQuantity || 0
          },
          { upsert: true, new: true }
        );
      }
    }

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
 * PUT /api/products/:id
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
        message: 'Không tìm thấy sản phẩm cần cập nhật.',
        errors: ['Sản phẩm không tồn tại']
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

/**
 * Xóa sản phẩm (Admin)
 * DELETE /api/products/:id
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm để xóa.',
        errors: ['Sản phẩm không tồn tại']
      });
    }

    // Xóa các bản ghi tồn kho liên quan
    await Inventory.deleteMany({ product: product._id });

    res.status(200).json({
      success: true,
      message: 'Xóa sản phẩm thành công.'
    });
  } catch (error) {
    next(error);
  }
};
