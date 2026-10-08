const User = require('../models/User');
const Review = require('../models/Review');
const Order = require('../models/Order');
const { isValidObjectId } = require('../validators/validate');

/**
 * Lấy danh sách khách hàng (Admin)
 * GET /api/admin/customers
 */
exports.getAllCustomers = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const filter = { role: 'customer' };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { name: regex },
        { fullName: regex },
        { email: regex },
        { phone: regex }
      ];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 20);
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter)
    ]);

    // Lấy số lượng đơn hàng cho mỗi khách hàng
    const userIds = users.map((u) => u._id);
    const orderCounts = await Order.aggregate([
      {
        $match: {
          $or: [
            { user: { $in: userIds } },
            { customer: { $in: userIds } }
          ]
        }
      },
      {
        $group: {
          _id: { $ifNull: ['$user', '$customer'] },
          orderCount: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [{ $ne: ['$orderStatus', 'cancelled'] }, '$totalAmount', 0]
            }
          }
        }
      }
    ]);

    const countMap = {};
    orderCounts.forEach((c) => {
      countMap[c._id.toString()] = {
        orderCount: c.orderCount,
        totalSpent: c.totalSpent
      };
    });

    const customersWithStats = users.map((u) => ({
      ...u,
      orderCount: countMap[u._id.toString()]?.orderCount || 0,
      totalSpent: countMap[u._id.toString()]?.totalSpent || 0
    }));

    res.status(200).json({
      success: true,
      data: customersWithStats,
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
 * Lấy chi tiết một khách hàng và lịch sử đơn hàng (Admin)
 * GET /api/admin/customers/:id
 */
exports.getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID khách hàng không hợp lệ.',
        errors: ['Invalid ObjectId']
      });
    }

    const customer = await User.findById(id).select('-password').lean();
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng.',
        errors: ['Khách hàng không tồn tại']
      });
    }

    const orders = await Order.find({
      $or: [{ user: customer._id }, { customer: customer._id }]
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        customer,
        orders
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật trạng thái khách hàng (Kích hoạt / Khóa tài khoản) (Admin)
 * PATCH /api/admin/customers/:id/status
 */
exports.updateCustomerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID khách hàng không hợp lệ.',
        errors: ['Invalid ObjectId']
      });
    }

    if (!status || !['active', 'blocked', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ. Cho phép: active, blocked, inactive',
        errors: ['Trạng thái không hợp lệ']
      });
    }

    const customer = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select('-password');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng.',
        errors: ['Khách hàng không tồn tại']
      });
    }

    res.status(200).json({
      success: true,
      message: `Đã cập nhật trạng thái khách hàng thành "${status}".`,
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy danh sách đánh giá của hệ thống (Admin)
 * GET /api/admin/reviews
 */
exports.getAllReviews = async (req, res, next) => {
  try {
    const { rating, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (rating && Number(rating) >= 1 && Number(rating) <= 5) {
      filter.rating = Number(rating);
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 20);
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('product', 'name slug images')
        .populate('user', 'name fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: reviews,
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
 * Xóa một đánh giá không phù hợp (Admin)
 * DELETE /api/admin/reviews/:id
 */
exports.deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID đánh giá không hợp lệ.',
        errors: ['Invalid ObjectId']
      });
    }

    const review = await Review.findByIdAndDelete(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá cần xóa.',
        errors: ['Đánh giá không tồn tại']
      });
    }

    res.status(200).json({
      success: true,
      message: 'Đã xóa đánh giá thành công.'
    });
  } catch (error) {
    next(error);
  }
};
