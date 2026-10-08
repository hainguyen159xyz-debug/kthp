const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');
const inventoryService = require('../services/inventory.service');
const { isValidObjectId } = require('../validators/validate');

/**
 * Lấy danh sách phiếu nhập hàng (Admin)
 * GET /api/purchase-orders
 */
exports.getPurchaseOrders = async (req, res, next) => {
  try {
    const { status, supplier, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (supplier && isValidObjectId(supplier)) filter.supplier = supplier;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 20);
    const skip = (pageNum - 1) * limitNum;

    const [purchaseOrders, total] = await Promise.all([
      PurchaseOrder.find(filter)
        .populate('supplier', 'name phone email contactName leadTimeDays')
        .populate('createdBy', 'name fullName email')
        .populate('relatedOrder', 'orderCode fulfillmentStatus')
        .populate('items.product', 'name slug images')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      PurchaseOrder.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: purchaseOrders,
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
 * Lấy chi tiết phiếu nhập hàng theo ID (Admin)
 * GET /api/purchase-orders/:id
 */
exports.getPurchaseOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID phiếu nhập không hợp lệ.',
        errors: ['Invalid ObjectId']
      });
    }

    const po = await PurchaseOrder.findById(id)
      .populate('supplier', 'name phone email contactName leadTimeDays address')
      .populate('createdBy', 'name fullName email')
      .populate('relatedOrder', 'orderCode fulfillmentStatus')
      .populate('items.product', 'name slug images');

    if (!po) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu nhập hàng.',
        errors: ['Phiếu nhập không tồn tại']
      });
    }

    res.status(200).json({
      success: true,
      data: po
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tạo phiếu yêu cầu nhập hàng mới từ nhà cung cấp (Admin)
 * POST /api/purchase-orders
 */
exports.createPurchaseOrder = async (req, res, next) => {
  try {
    const { supplierId, supplier, relatedOrderId, items, note } = req.body;
    const targetSupplier = supplierId || supplier;

    if (!targetSupplier || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn nhà cung cấp và ít nhất một mặt hàng cần nhập.',
        errors: ['Thiếu nhà cung cấp hoặc danh sách mặt hàng']
      });
    }

    let totalAmount = 0;
    const poItems = [];

    for (const item of items) {
      const productId = item.productId || item.product;
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Không tìm thấy sản phẩm ${productId}.`,
          errors: ['Sản phẩm không tồn tại']
        });
      }

      const requestedSize = Number(item.size);
      const requestedColor = (item.color || '').trim();
      const variant = product.variants
        ? product.variants.find(
            (v) =>
              (item.variantSku && v.sku === item.variantSku) ||
              (Number(v.size) === requestedSize && v.color.toLowerCase() === requestedColor.toLowerCase())
          )
        : null;

      const qty = Number(item.quantity) || 1;
      const costPrice =
        Number(item.costPrice || item.importPrice) || (variant && variant.importPrice) || product.costPrice || 0;
      const subtotal = qty * costPrice;
      totalAmount += subtotal;

      poItems.push({
        product: product._id,
        productName: product.name,
        variantSku: (variant && variant.sku) || item.variantSku || `SKU-${requestedSize}-${requestedColor.toUpperCase()}`,
        color: requestedColor || (variant && variant.color) || 'Default',
        size: requestedSize || (variant && variant.size) || 0,
        quantity: qty,
        costPrice,
        importPrice: costPrice,
        subtotal
      });
    }

    const poCode = `PO-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const purchaseOrder = await PurchaseOrder.create({
      poCode,
      supplier: targetSupplier,
      relatedOrder: relatedOrderId || null,
      items: poItems,
      totalAmount,
      totalCost: totalAmount,
      status: 'pending',
      note: note || '',
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Tạo phiếu yêu cầu nhập hàng thành công.',
      data: purchaseOrder
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật thông tin phiếu nhập (Admin)
 * PUT /api/purchase-orders/:id
 */
exports.updatePurchaseOrder = async (req, res, next) => {
  try {
    const { note, supplier } = req.body;
    const po = await PurchaseOrder.findById(req.params.id);

    if (!po) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu nhập hàng.',
        errors: ['Phiếu nhập không tồn tại']
      });
    }

    if (po.status === 'received') {
      return res.status(400).json({
        success: false,
        message: 'Không thể chỉnh sửa phiếu đã hoàn tất nhập kho.',
        errors: ['Phiếu đã received không thể sửa']
      });
    }

    if (note !== undefined) po.note = note;
    if (supplier) po.supplier = supplier;

    await po.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật phiếu nhập hàng thành công.',
      data: po
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật trạng thái phiếu nhập hàng (Admin)
 * PATCH /api/purchase-orders/:id/status
 * Khi chuyển trạng thái sang 'received':
 * -> Tự động cộng tồn kho vào Inventory & Product
 * -> Tránh cộng 2 lần nếu status đã là received
 */
exports.updatePurchaseOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      'pending',
      'sent',
      'confirmed',
      'receiving',
      'received',
      'cancelled',
      // Legacy status values
      'sent_to_supplier',
      'supplier_confirmed',
      'in_transit'
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Trạng thái không hợp lệ. Cho phép: ${validStatuses.join(', ')}`,
        errors: ['Trạng thái không hợp lệ']
      });
    }

    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu nhập hàng.',
        errors: ['Phiếu nhập không tồn tại']
      });
    }

    // Nếu phiếu đã nhập kho rồi thì không cho nhập lại để tránh cộng trùng tồn kho
    if (po.status === 'received' && status === 'received') {
      return res.status(400).json({
        success: false,
        message: 'Phiếu này đã được ghi nhận nhập kho trước đó.',
        errors: ['Phiếu đã có trạng thái received']
      });
    }

    // Nếu chuyển sang received -> Cập nhật tồn kho vào Inventory & Product
    if (status === 'received' && po.status !== 'received') {
      for (const item of po.items) {
        await inventoryService.replenishStock(
          item.product,
          item.size,
          item.color,
          item.quantity,
          item.variantSku
        );
      }
      po.receivedAt = new Date();
    }

    po.status = status;
    await po.save();

    res.status(200).json({
      success: true,
      message:
        status === 'received'
          ? 'Đã xác nhận nhập hàng vào kho và cập nhật số lượng tồn kho thành công!'
          : 'Cập nhật trạng thái phiếu nhập hàng thành công.',
      data: po
    });
  } catch (error) {
    next(error);
  }
};
