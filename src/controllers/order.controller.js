const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * Đặt hàng (Khách hàng)
 * Áp dụng bài toán kiểm tra tồn kho & phân loại:
 * - Nếu còn tồn kho: trừ kho trực tiếp, fulfillmentStatus = 'in_stock'
 * - Nếu thiếu tồn kho: đánh dấu isBackorder = true, fulfillmentStatus = 'waiting_supplier'
 */
exports.createOrder = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { shippingAddress, items, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Giỏ hàng của bạn đang trống.'
      });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.street || !shippingAddress.city) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin giao hàng.'
      });
    }

    let totalAmount = 0;
    const processedItems = [];
    let hasBackorderItem = false;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm ${item.productName || item.productId} không tồn tại hoặc đã ngừng kinh doanh.`
        });
      }

      const variant = product.variants.find((v) => v.sku === item.variantSku);
      if (!variant) {
        return res.status(400).json({
          success: false,
          message: `Không tìm thấy biến thể size ${item.size} của sản phẩm ${product.name}.`
        });
      }

      const requestedQty = Number(item.quantity) || 1;
      const unitPrice = variant.price;
      const itemSubtotal = unitPrice * requestedQty;
      totalAmount += itemSubtotal;

      // KIỂM TRA TỒN KHO THỰC TẾ
      let isBackorder = false;
      if (variant.stockQuantity >= requestedQty) {
        // Kho còn đủ hàng: Trừ tồn kho và giữ hàng
        variant.stockQuantity -= requestedQty;
        product.totalSold = (product.totalSold || 0) + requestedQty;
        await product.save();
      } else {
        // Kho thiếu hàng: Đánh dấu cần đặt nhà cung cấp
        isBackorder = true;
        hasBackorderItem = true;
      }

      processedItems.push({
        product: product._id,
        productName: product.name,
        variantSku: variant.sku,
        color: variant.color,
        size: variant.size,
        price: unitPrice,
        quantity: requestedQty,
        subtotal: itemSubtotal,
        isBackorder
      });
    }

    // Sinh mã đơn hàng
    const orderCode = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const order = await Order.create({
      orderCode,
      customer: customerId,
      shippingAddress,
      items: processedItems,
      totalAmount,
      paymentMethod: paymentMethod || 'COD',
      fulfillmentStatus: hasBackorderItem ? 'waiting_supplier' : 'in_stock',
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: hasBackorderItem
        ? 'Đặt hàng thành công! Một số sản phẩm đang được liên hệ nhập từ nhà cung cấp, chúng tôi sẽ xử lý sớm nhất.'
        : 'Đặt hàng thành công! Đơn hàng sẵn sàng để đóng gói và giao.',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy lịch sử đơn hàng của khách hàng hiện tại
 */
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy chi tiết đơn hàng
 */
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'fullName email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng.'
      });
    }

    // Khách hàng chỉ xem được đơn của mình, Admin xem được tất cả
    if (req.user.role !== 'admin' && order.customer._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem đơn hàng này.'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy toàn bộ đơn hàng (Admin)
 */
exports.getAllOrders = async (req, res, next) => {
  try {
    const { fulfillmentStatus, status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (fulfillmentStatus) filter.fulfillmentStatus = fulfillmentStatus;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('customer', 'fullName email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: orders,
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
 * Cập nhật trạng thái đơn hàng (Admin)
 */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, fulfillmentStatus, paymentStatus } = req.body;
    const updateFields = {};

    if (status) updateFields.status = status;
    if (fulfillmentStatus) updateFields.fulfillmentStatus = fulfillmentStatus;
    if (paymentStatus) updateFields.paymentStatus = paymentStatus;

    const order = await Order.findByIdAndUpdate(req.params.id, updateFields, {
      new: true
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công.',
      data: order
    });
  } catch (error) {
    next(error);
  }
};
