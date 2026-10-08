const Order = require('../models/Order');
const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');

/**
 * Thống kê Dashboard dành cho Admin: Doanh thu, Chi phí nhập, Tồn kho cảnh báo
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    // 1. Thống kê doanh thu từ đơn hàng (các đơn khác 'cancelled')
    const revenueAgg = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, orderCount: { $sum: 1 } } }
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
    const totalOrders = revenueAgg[0]?.orderCount || 0;

    // 2. Thống kê chi phí nhập hàng từ các phiếu đã nhận (received)
    const costAgg = await PurchaseOrder.aggregate([
      { $match: { status: 'received' } },
      { $group: { _id: null, totalCost: { $sum: '$totalCost' }, poCount: { $sum: 1 } } }
    ]);
    const totalImportCost = costAgg[0]?.totalCost || 0;

    // 3. Đơn hàng đang chờ nhập hàng từ nhà cung cấp
    const waitingSupplierOrders = await Order.countDocuments({ fulfillmentStatus: 'waiting_supplier' });

    // 4. Lấy danh sách các sản phẩm có biến thể tồn kho thấp hơn ngưỡng cảnh báo
    const products = await Product.find({ isActive: true }).select('name variants isFastMoving');
    const lowStockVariants = [];

    products.forEach((p) => {
      p.variants.forEach((v) => {
        if (v.stockQuantity <= (v.lowStockThreshold || 2)) {
          lowStockVariants.push({
            productId: p._id,
            productName: p.name,
            sku: v.sku,
            size: v.size,
            color: v.color,
            stockQuantity: v.stockQuantity,
            threshold: v.lowStockThreshold || 2,
            isFastMoving: p.isFastMoving
          });
        }
      });
    });

    res.status(200).json({
      success: true,
      data: {
        financials: {
          totalRevenue,
          totalImportCost,
          estimatedGrossProfit: totalRevenue - totalImportCost
        },
        orders: {
          totalOrders,
          waitingSupplierOrders
        },
        inventory: {
          totalProducts: products.length,
          lowStockCount: lowStockVariants.length,
          lowStockAlerts: lowStockVariants.slice(0, 10)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
