const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const { isValidObjectId } = require('../validators/validate');

/**
 * Lấy toàn bộ danh sách tồn kho theo từng variant (Admin)
 * GET /api/inventory
 */
exports.getAllInventory = async (req, res, next) => {
  try {
    const { productId, lowStock, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (productId && isValidObjectId(productId)) {
      filter.product = productId;
    }

    if (lowStock === 'true') {
      filter.$expr = { $lte: ['$availableQuantity', '$lowStockThreshold'] };
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 20);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Inventory.find(filter)
        .populate('product', 'name slug images brand category salePrice costPrice')
        .skip(skip)
        .limit(limitNum)
        .sort({ updatedAt: -1 }),
      Inventory.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: items,
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
 * Lấy danh sách tồn kho của một sản phẩm cụ thể (Admin)
 * GET /api/inventory/:productId
 */
exports.getInventoryByProductId = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ.',
        errors: ['Invalid ObjectId']
      });
    }

    const items = await Inventory.find({ product: productId }).sort({ size: 1 });

    res.status(200).json({
      success: true,
      data: items
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Khởi tạo hoặc thêm mới bản ghi tồn kho biến thể (Admin)
 * POST /api/inventory
 */
exports.createInventory = async (req, res, next) => {
  try {
    const { productId, size, color, quantity, reservedQuantity, sku, lowStockThreshold } = req.body;

    if (!productId || size === undefined || !color) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp productId, size và color.',
        errors: ['Thiếu thông tin bắt buộc']
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm.',
        errors: ['Sản phẩm không tồn tại']
      });
    }

    const qty = Number(quantity) || 0;
    const reserved = Number(reservedQuantity) || 0;

    let inventory = await Inventory.findOne({
      product: productId,
      size: Number(size),
      color: color.trim()
    });

    if (inventory) {
      inventory.quantity = qty;
      inventory.reservedQuantity = reserved;
      inventory.availableQuantity = Math.max(0, qty - reserved);
      if (sku) inventory.sku = sku;
      if (lowStockThreshold !== undefined) inventory.lowStockThreshold = Number(lowStockThreshold);
      await inventory.save();
    } else {
      inventory = await Inventory.create({
        product: productId,
        size: Number(size),
        color: color.trim(),
        sku: sku || `SKU-${size}-${color.toUpperCase().slice(0, 3)}`,
        quantity: qty,
        reservedQuantity: reserved,
        availableQuantity: Math.max(0, qty - reserved),
        lowStockThreshold: Number(lowStockThreshold) || 2
      });
    }

    // Đồng bộ tồn kho sang Product
    const allInventories = await Inventory.find({ product: productId });
    product.stock = allInventories.reduce((sum, item) => sum + item.quantity, 0);
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Cập nhật bản ghi tồn kho thành công.',
      data: inventory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật số lượng tồn kho theo ID bản ghi inventory (Admin)
 * PUT /api/inventory/:id
 */
exports.updateInventory = async (req, res, next) => {
  try {
    const { quantity, reservedQuantity, lowStockThreshold, sku } = req.body;
    const inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản ghi tồn kho.',
        errors: ['Bản ghi không tồn tại']
      });
    }

    if (quantity !== undefined) inventory.quantity = Math.max(0, Number(quantity));
    if (reservedQuantity !== undefined) inventory.reservedQuantity = Math.max(0, Number(reservedQuantity));
    if (lowStockThreshold !== undefined) inventory.lowStockThreshold = Math.max(0, Number(lowStockThreshold));
    if (sku) inventory.sku = sku;

    inventory.availableQuantity = Math.max(0, inventory.quantity - inventory.reservedQuantity);
    await inventory.save();

    // Đồng bộ sang Product
    const allInventories = await Inventory.find({ product: inventory.product });
    const totalStock = allInventories.reduce((sum, item) => sum + item.quantity, 0);
    await Product.findByIdAndUpdate(inventory.product, { stock: totalStock });

    res.status(200).json({
      success: true,
      message: 'Cập nhật tồn kho thành công.',
      data: inventory
    });
  } catch (error) {
    next(error);
  }
};
