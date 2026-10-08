const Order = require('../models/Order');
const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');
const User = require('../models/User');

/**
 * Thống kê Dashboard dành cho Admin: Doanh thu, Chi phí nhập, Khách hàng, Tồn kho cảnh báo, Đơn hàng gần đây
 * GET /api/dashboard/stats
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    // 1. Thống kê doanh thu từ đơn hàng (các đơn khác 'cancelled')
    const revenueAgg = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' }, orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, orderCount: { $sum: 1 } } }
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
    const totalOrders = revenueAgg[0]?.orderCount || 0;

    // 2. Thống kê đơn hàng hôm nay
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: startOfToday }
    });

    // 3. Đơn hàng đang xử lý & chờ nhập hàng
    const [waitingSupplierOrders, processingOrders] = await Promise.all([
      Order.countDocuments({ fulfillmentStatus: 'waiting_supplier' }),
      Order.countDocuments({
        $or: [{ orderStatus: 'pending' }, { orderStatus: 'processing' }, { status: 'pending' }, { status: 'processing' }]
      })
    ]);

    // 4. Thống kê khách hàng
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // 5. Thống kê chi phí nhập hàng từ các phiếu đã nhận (received)
    const costAgg = await PurchaseOrder.aggregate([
      { $match: { status: 'received' } },
      { $group: { _id: null, totalCost: { $sum: '$totalAmount' }, poCount: { $sum: 1 } } }
    ]);
    const totalImportCost = costAgg[0]?.totalCost || 0;

    // 6. Lấy danh sách sản phẩm cảnh báo tồn kho thấp & hết hàng
    const products = await Product.find({ isActive: true })
      .populate('brand', 'name')
      .populate('category', 'name')
      .select('name slug variants isFastMoving stock salePrice totalSold images brand category');

    const lowStockVariants = [];
    let outOfStockCount = 0;

    products.forEach((p) => {
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach((v) => {
          if (v.stockQuantity === 0) outOfStockCount++;
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
      } else {
        if ((p.stock || 0) === 0) outOfStockCount++;
        if ((p.stock || 0) <= 2) {
          lowStockVariants.push({
            productId: p._id,
            productName: p.name,
            sku: 'N/A',
            size: 'All',
            color: 'All',
            stockQuantity: p.stock || 0,
            threshold: 2,
            isFastMoving: p.isFastMoving
          });
        }
      }
    });

    // 7. Top 5 sản phẩm bán chạy nhất
    const topProducts = await Product.find({ isActive: true })
      .select('name slug images salePrice totalSold stock')
      .sort({ totalSold: -1 })
      .limit(5);

    // 8. Đơn hàng gần đây nhất
    const recentOrders = await Order.find()
      .populate('user', 'name fullName email')
      .populate('customer', 'name fullName email')
      .sort({ createdAt: -1 })
      .limit(5);

    // 9. Biểu đồ doanh thu 7 ngày gần nhất
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const trendAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          orderStatus: { $ne: 'cancelled' },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format 7 ngày liên tiếp để không bị rỗng ngày
    const trendMap = {};
    trendAgg.forEach((t) => {
      trendMap[t._id] = t;
    });

    const revenueTrends = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      revenueTrends.push({
        date: dateStr,
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        revenue: trendMap[dateStr]?.revenue || 0,
        orders: trendMap[dateStr]?.orders || 0
      });
    }

    // 10. Phân bổ sản phẩm theo danh mục
    const Category = require('../models/Category');
    const categories = await Category.find().select('name slug').lean();
    const categoryDistribution = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({ category: cat._id });
        return {
          name: cat.name,
          count
        };
      })
    );

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
          todayOrders,
          processingOrders,
          waitingSupplierOrders
        },
        users: {
          totalCustomers
        },
        inventory: {
          totalProducts: products.length,
          lowStockCount: lowStockVariants.length,
          outOfStockCount,
          lowStockAlerts: lowStockVariants.slice(0, 10)
        },
        topProducts,
        recentOrders,
        revenueTrends,
        categoryDistribution
      }
    });
  } catch (error) {
    next(error);
  }
};
