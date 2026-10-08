const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');

/**
 * Lấy danh sách phiếu nhập hàng (Admin)
 */
exports.getPurchaseOrders = async (req, res, next) => {
  try {
    const { status, supplier } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (supplier) filter.supplier = supplier;

    const purchaseOrders = await PurchaseOrder.find(filter)
      .populate('supplier', 'name phone leadTimeDays')
      .populate('createdBy', 'fullName email')
      .populate('relatedOrder', 'orderCode fulfillmentStatus')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: purchaseOrders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tạo phiếu yêu cầu nhập hàng mới từ nhà cung cấp (Admin)
 */
exports.createPurchaseOrder = async (req, res, next) => {
  try {
    const { supplierId, relatedOrderId, items, note } = req.body;

    if (!supplierId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn nhà cung cấp và ít nhất một mặt hàng cần nhập.'
      });
    }

    let totalCost = 0;
    const poItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Không tìm thấy sản phẩm ${item.productId}.`
        });
      }

      const variant = product.variants.find((v) => v.sku === item.variantSku);
      if (!variant) {
        return res.status(400).json({
          success: false,
          message: `Không tìm thấy biến thể ${item.variantSku} của sản phẩm ${product.name}.`
        });
      }

      const qty = Number(item.quantity);
      const price = Number(item.importPrice) || variant.importPrice || 0;
      const subtotal = qty * price;
      totalCost += subtotal;

      poItems.push({
        product: product._id,
        productName: product.name,
        variantSku: variant.sku,
        color: variant.color,
        size: variant.size,
        quantity: qty,
        importPrice: price,
        subtotal
      });
    }

    const poCode = `PO-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const purchaseOrder = await PurchaseOrder.create({
      poCode,
      supplier: supplierId,
      relatedOrder: relatedOrderId || null,
      items: poItems,
      totalCost,
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
 * Cập nhật trạng thái phiếu nhập hàng (Admin)
 * Khi chuyển trạng thái sang 'received':
 * -> Tự động cộng tồn kho vào variant trong CSDL
 */
exports.updatePurchaseOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const po = await PurchaseOrder.findById(req.params.id);

    if (!po) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu nhập hàng.'
      });
    }

    // Nếu phiếu đã nhập kho rồi thì không cho nhập lại để tránh cộng trùng tồn kho
    if (po.status === 'received' && status === 'received') {
      return res.status(400).json({
        success: false,
        message: 'Phiếu này đã được ghi nhận nhập kho trước đó.'
      });
    }

    // Nếu trạng thái mới là 'received' -> Tự động cập nhật tăng tồn kho cho các sản phẩm
    if (status === 'received' && po.status !== 'received') {
      for (const item of po.items) {
        const product = await Product.findById(item.product);
        if (product) {
          const variant = product.variants.find((v) => v.sku === item.variantSku);
          if (variant) {
            variant.stockQuantity += item.quantity;
            await product.save();
          }
        }
      }
      po.receivedAt = new Date();
    }

    po.status = status;
    await po.save();

    res.status(200).json({
      success: true,
      message: status === 'received'
        ? 'Đã xác nhận nhập hàng vào kho và cập nhật số lượng tồn kho thành công!'
        : 'Cập nhật trạng thái phiếu nhập hàng thành công.',
      data: po
    });
  } catch (error) {
    next(error);
  }
};
