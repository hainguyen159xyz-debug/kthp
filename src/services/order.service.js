const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Promotion = require('../models/Promotion');
const Payment = require('../models/Payment');
const Shipment = require('../models/Shipment');
const inventoryService = require('./inventory.service');

/**
 * Xử lý đặt hàng theo đúng quy trình 5 bước và nghiệp vụ JIT / Out of stock
 */
const createCustomerOrder = async ({
  userId,
  items,
  shippingAddress,
  paymentMethod = 'COD',
  promotionCode = '',
  shippingFee = 0
}) => {
  // Bước 1: Kiểm tra User
  const user = await User.findById(userId);
  if (!user || user.status === 'blocked') {
    return {
      status: 403,
      data: {
        success: false,
        message: 'Tài khoản người dùng không tồn tại hoặc đã bị khóa.'
      }
    };
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return {
      status: 400,
      data: {
        success: false,
        message: 'Danh sách sản phẩm đặt hàng không được trống.'
      }
    };
  }

  if (
    !shippingAddress ||
    !shippingAddress.fullName ||
    !shippingAddress.phone ||
    !shippingAddress.street ||
    !shippingAddress.city
  ) {
    return {
      status: 400,
      data: {
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin giao hàng (Họ tên, SĐT, Địa chỉ, Tỉnh/TP).'
      }
    };
  }

  const outOfStockItems = [];
  const validatedItems = [];
  let subtotal = 0;

  // Lặp qua từng item để kiểm tra từng bước
  for (const item of items) {
    const productId = item.productId || item.product;
    const requestedQty = Number(item.quantity) || 1;
    const requestedSize = Number(item.size);
    const requestedColor = (item.color || '').trim();

    // Bước 2: Kiểm tra từng Product
    const product = await Product.findById(productId);
    if (!product || product.status === 'inactive' || product.isActive === false) {
      return {
        status: 400,
        data: {
          success: false,
          message: `Sản phẩm với ID ${productId} không tồn tại hoặc đã ngừng kinh doanh.`
        }
      };
    }

    // Bước 3: Kiểm tra Size
    let matchedVariant = null;
    if (product.variants && product.variants.length > 0) {
      matchedVariant = product.variants.find(
        (v) => Number(v.size) === requestedSize && v.color.toLowerCase() === requestedColor.toLowerCase()
      );
    }

    const availableSizes = product.sizes && product.sizes.length > 0
      ? product.sizes
      : (product.variants ? product.variants.map((v) => Number(v.size)) : []);

    if (availableSizes.length > 0 && !availableSizes.includes(requestedSize)) {
      return {
        status: 400,
        data: {
          success: false,
          message: `Sản phẩm ${product.name} không hỗ trợ size ${requestedSize}.`
        }
      };
    }

    // Bước 4: Kiểm tra Color
    const availableColors = product.colors && product.colors.length > 0
      ? product.colors.map((c) => c.toLowerCase())
      : (product.variants ? product.variants.map((v) => v.color.toLowerCase()) : []);

    if (availableColors.length > 0 && !availableColors.includes(requestedColor.toLowerCase())) {
      return {
        status: 400,
        data: {
          success: false,
          message: `Sản phẩm ${product.name} không có tùy chọn màu ${requestedColor}.`
        }
      };
    }

    // Bước 5: Kiểm tra Inventory (tồn kho)
    const availability = await inventoryService.checkItemAvailability(
      product._id,
      requestedSize,
      requestedColor,
      requestedQty
    );

    if (!availability.isSufficient) {
      outOfStockItems.push({
        productId: product._id,
        productName: product.name,
        size: requestedSize,
        color: requestedColor,
        requested: requestedQty,
        available: availability.available
      });
    }

    // Giá sản phẩm tại thời điểm đặt (snapshot)
    const itemPrice = (matchedVariant && matchedVariant.price) || product.salePrice || 0;
    const itemSubtotal = itemPrice * requestedQty;
    subtotal += itemSubtotal;

    validatedItems.push({
      product: product._id,
      productName: product.name,
      variantSku: (matchedVariant && matchedVariant.sku) || '',
      size: requestedSize,
      color: requestedColor,
      price: itemPrice,
      quantity: requestedQty,
      subtotal: itemSubtotal
    });
  }

  // Nếu có bất kỳ mặt hàng nào thiếu tồn kho:
  // KHÔNG được tự động trừ kho, trả về thông tin thiếu hàng
  if (outOfStockItems.length > 0) {
    return {
      status: 400,
      data: {
        success: false,
        code: 'OUT_OF_STOCK',
        message: 'Một hoặc nhiều sản phẩm không đủ tồn kho',
        items: outOfStockItems
      }
    };
  }

  // Nếu đủ hàng: Tính toán khuyến mãi (nếu có)
  let discountAmount = 0;
  let appliedPromo = null;
  if (promotionCode) {
    const promo = await Promotion.findOne({ code: promotionCode.trim().toUpperCase() });
    if (promo && promo.isValid(subtotal)) {
      discountAmount = promo.calculateDiscount(subtotal);
      appliedPromo = promo;
    }
  }

  const finalTotal = Math.max(0, subtotal - discountAmount + Number(shippingFee || 0));

  // Trừ kho cho từng sản phẩm
  for (const item of validatedItems) {
    await inventoryService.deductStock(item.product, item.size, item.color, item.quantity);
  }

  // Cập nhật lượt sử dụng mã khuyến mãi nếu có
  if (appliedPromo) {
    appliedPromo.usedCount = (appliedPromo.usedCount || 0) + 1;
    await appliedPromo.save();
  }

  // Sinh mã đơn hàng
  const orderCode = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  // Tạo Order
  const order = await Order.create({
    orderCode,
    user: user._id,
    customer: user._id,
    items: validatedItems,
    subtotal,
    discount: discountAmount,
    shippingFee: Number(shippingFee || 0),
    totalAmount: finalTotal,
    shippingAddress,
    paymentMethod,
    paymentStatus: 'unpaid',
    orderStatus: 'pending',
    status: 'pending',
    fulfillmentStatus: 'in_stock',
    promotionCode: appliedPromo ? appliedPromo.code : ''
  });

  // Tạo bản ghi Payment nền tảng
  await Payment.create({
    order: order._id,
    user: user._id,
    paymentMethod,
    paymentStatus: 'pending',
    amount: finalTotal
  });

  // Tạo bản ghi Shipment nền tảng
  await Shipment.create({
    order: order._id,
    shippingAddress,
    status: 'pending'
  });

  // Dọn dẹp các mặt hàng đã mua trong Cart của User
  const cart = await Cart.findOne({ user: user._id });
  if (cart && cart.items.length > 0) {
    cart.items = cart.items.filter((cItem) => {
      return !validatedItems.some(
        (vItem) =>
          vItem.product.toString() === cItem.product.toString() &&
          vItem.size === cItem.size &&
          vItem.color.toLowerCase() === cItem.color.toLowerCase()
      );
    });
    await cart.save();
  }

  return {
    status: 201,
    data: {
      success: true,
      message: 'Đặt hàng thành công!',
      data: order
    }
  };
};

module.exports = {
  createCustomerOrder
};
