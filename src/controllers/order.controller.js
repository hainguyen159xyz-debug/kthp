const Order = require('../models/Order');
const orderService = require('../services/order.service');
const inventoryService = require('../services/inventory.service');
const { isValidObjectId } = require('../validators/validate');

/**
 * Đặt hàng mới (Customer)
 * Áp dụng logic 5 bước và mã lỗi OUT_OF_STOCK nếu thiếu tồn kho
 * POST /api/orders
 */
exports.createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, promotionCode, shippingFee } = req.body;

    const result = await orderService.createCustomerOrder({
      userId: req.user.id,
      items,
      shippingAddress,
      paymentMethod,
      promotionCode,
      shippingFee
    });

    return res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy lịch sử đơn hàng của người dùng hiện tại (Customer)
 * GET /api/orders
 */
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      $or: [{ user: req.user.id }, { customer: req.user.id }]
    })
      .populate('items.product', 'name slug images colorVariants')
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
 * Lấy chi tiết đơn hàng theo ID (Customer hoặc Admin)
 * GET /api/orders/:id & GET /api/admin/orders/:id
 */
exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ.',
        errors: ['Invalid ObjectId']
      });
    }

    const order = await Order.findById(id)
      .populate('user', 'name fullName email phone')
      .populate('customer', 'name fullName email phone')
      .populate('items.product', 'name slug images salePrice colorVariants');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng.',
        errors: ['Đơn hàng không tồn tại']
      });
    }

    // Customer chỉ được xem đơn hàng của chính mình
    const orderUserId = (order.user?._id || order.customer?._id || order.user || order.customer).toString();
    if (req.user.role !== 'admin' && orderUserId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem đơn hàng này.',
        errors: ['Truy cập bị từ chối']
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
 * GET /api/admin/orders
 */
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, fulfillmentStatus, paymentStatus, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.$or = [{ status }, { orderStatus: status }];
    if (fulfillmentStatus) filter.fulfillmentStatus = fulfillmentStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 20);
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name fullName email phone')
        .populate('customer', 'name fullName email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: orders,
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
 * Cập nhật trạng thái đơn hàng (Admin)
 * PATCH /api/admin/orders/:id/status
 */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, orderStatus, fulfillmentStatus, paymentStatus } = req.body;
    const targetStatus = status || orderStatus;

    for (const [field, value] of Object.entries({ orderStatus: targetStatus, fulfillmentStatus, paymentStatus })) {
      if (value !== undefined && !Order.schema.path(field).enumValues.includes(value)) {
        return res.status(400).json({ success: false, message: `Trạng thái ${field} không hợp lệ.` });
      }
    }

    const existingOrder = await Order.findById(req.params.id);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng.',
        errors: ['Đơn hàng không tồn tại']
      });
    }

    const prevStatus = existingOrder.orderStatus || existingOrder.status;

    // Nếu đơn hàng chuyển sang 'cancelled' -> Hoàn lại tồn kho
    if (prevStatus !== 'cancelled' && targetStatus === 'cancelled') {
      for (const item of (existingOrder.items || [])) {
        await inventoryService.replenishStock(
          item.product,
          item.size,
          item.color,
          item.quantity,
          item.variantSku
        );
      }
    }

    // Nếu đơn hàng từ 'cancelled' chuyển lại trạng thái hoạt động -> Trừ lại kho
    if (prevStatus === 'cancelled' && targetStatus && targetStatus !== 'cancelled') {
      for (const item of (existingOrder.items || [])) {
        const availability = await inventoryService.checkItemAvailability(item.product, item.size, item.color, item.quantity);
        if (!availability.isSufficient) {
          return res.status(400).json({ success: false, code: 'OUT_OF_STOCK', message: 'Không đủ tồn kho để kích hoạt lại đơn hàng.' });
        }
      }
      for (const item of (existingOrder.items || [])) {
        await inventoryService.deductStock(
          item.product,
          item.size,
          item.color,
          item.quantity
        );
      }
    }

    const updateFields = {};
    if (targetStatus) {
      updateFields.orderStatus = targetStatus;
      updateFields.status = targetStatus;
    }
    if (fulfillmentStatus) updateFields.fulfillmentStatus = fulfillmentStatus;
    if (paymentStatus) updateFields.paymentStatus = paymentStatus;

    if (targetStatus === 'completed') {
      updateFields.fulfillmentStatus = 'delivered';
    } else if (targetStatus === 'cancelled') {
      updateFields.fulfillmentStatus = 'cancelled';
    } else if (targetStatus === 'shipping') {
      updateFields.fulfillmentStatus = 'shipping';
    } else if (prevStatus === 'cancelled' && targetStatus) {
      updateFields.fulfillmentStatus = 'in_stock';
    }

    const order = await Order.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true
    })
      .populate('user', 'name fullName email phone')
      .populate('customer', 'name fullName email phone');

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công.',
      data: order
    });
  } catch (error) {
    next(error);
  }
};
