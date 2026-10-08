const Cart = require('../models/Cart');
const Product = require('../models/Product');
const inventoryService = require('../services/inventory.service');
const { isValidObjectId } = require('../validators/validate');

/**
 * Lấy giỏ hàng của người dùng hiện tại (Customer)
 * GET /api/cart
 */
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate(
      'items.product',
      'name slug images salePrice'
    );

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Thêm sản phẩm vào giỏ hàng (Customer)
 * POST /api/cart/items
 * Kiểm tra: Không cho phép thêm số lượng vượt quá availableQuantity
 */
exports.addItemToCart = async (req, res, next) => {
  try {
    const { productId, size, color, quantity } = req.body;

    if (!productId || size === undefined || !color) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp productId, size và color.',
        errors: ['Thiếu thông tin bắt buộc']
      });
    }

    if (!isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ.',
        errors: ['Invalid ObjectId']
      });
    }

    const product = await Product.findById(productId);
    if (!product || product.status === 'inactive' || product.isActive === false) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại hoặc đã ngừng kinh doanh.',
        errors: ['Sản phẩm không khả dụng']
      });
    }

    const addQty = Math.max(1, Number(quantity) || 1);
    const requestedSize = Number(size);
    const requestedColor = color.trim();

    // Tìm giỏ hàng hiện tại
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    // Kiểm tra xem mặt hàng đã có trong giỏ chưa
    const existingIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.size === requestedSize &&
        item.color.toLowerCase() === requestedColor.toLowerCase()
    );

    const currentQtyInCart = existingIndex > -1 ? cart.items[existingIndex].quantity : 0;
    const targetQty = currentQtyInCart + addQty;

    // Kiểm tra tồn kho khả dụng
    const availability = await inventoryService.checkItemAvailability(
      productId,
      requestedSize,
      requestedColor,
      targetQty
    );

    if (!availability.isSufficient) {
      return res.status(400).json({
        success: false,
        message: `Không đủ tồn kho khả dụng. Hiện chỉ còn ${availability.available} đôi trong kho.`,
        errors: [
          `Tồn kho khả dụng: ${availability.available}, bạn đang yêu cầu tổng cộng: ${targetQty}`
        ]
      });
    }

    // Xác định giá bán
    let price = product.salePrice;
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find(
        (v) => Number(v.size) === requestedSize && v.color.toLowerCase() === requestedColor.toLowerCase()
      );
      if (variant && variant.price) price = variant.price;
    }

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity = targetQty;
      cart.items[existingIndex].price = price;
    } else {
      cart.items.push({
        product: product._id,
        size: requestedSize,
        color: requestedColor,
        quantity: addQty,
        price
      });
    }

    await cart.save();
    await cart.populate('items.product', 'name slug images salePrice');

    res.status(200).json({
      success: true,
      message: 'Đã thêm sản phẩm vào giỏ hàng.',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật số lượng của một mặt hàng trong giỏ (Customer)
 * PUT /api/cart/items/:itemId
 */
exports.updateCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const newQty = Number(quantity);
    if (!newQty || newQty < 1) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng phải lớn hơn hoặc bằng 1.',
        errors: ['Số lượng không hợp lệ']
      });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giỏ hàng.',
        errors: ['Giỏ hàng không tồn tại']
      });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mặt hàng trong giỏ.',
        errors: ['Mặt hàng không tồn tại']
      });
    }

    // Kiểm tra tồn kho khả dụng
    const availability = await inventoryService.checkItemAvailability(
      item.product,
      item.size,
      item.color,
      newQty
    );

    if (!availability.isSufficient) {
      return res.status(400).json({
        success: false,
        message: `Số lượng yêu cầu vượt quá tồn kho khả dụng (còn ${availability.available} đôi).`,
        errors: [`Tồn kho khả dụng: ${availability.available}`]
      });
    }

    item.quantity = newQty;
    await cart.save();
    await cart.populate('items.product', 'name slug images salePrice');

    res.status(200).json({
      success: true,
      message: 'Cập nhật số lượng thành công.',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Xóa một mặt hàng khỏi giỏ (Customer)
 * DELETE /api/cart/items/:itemId
 */
exports.removeCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giỏ hàng.',
        errors: ['Giỏ hàng không tồn tại']
      });
    }

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
    await cart.save();
    await cart.populate('items.product', 'name slug images salePrice');

    res.status(200).json({
      success: true,
      message: 'Đã xóa mặt hàng khỏi giỏ.',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Xóa toàn bộ giỏ hàng (Customer)
 * DELETE /api/cart
 */
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Giỏ hàng đã được làm trống.',
      data: { user: req.user.id, items: [] }
    });
  } catch (error) {
    next(error);
  }
};
