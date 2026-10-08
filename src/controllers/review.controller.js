const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { isValidObjectId } = require('../validators/validate');

/**
 * Lấy danh sách đánh giá của một sản phẩm (Public)
 * GET /api/products/:productId/reviews
 */
exports.getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ.',
        errors: ['Invalid ObjectId']
      });
    }

    const reviews = await Review.find({ product: productId })
      .populate('user', 'name fullName')
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
        : 0;

    res.status(200).json({
      success: true,
      data: {
        totalReviews,
        averageRating,
        reviews
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tạo đánh giá cho sản phẩm (Customer)
 * Điều kiện: Chỉ khách hàng đã mua sản phẩm này mới được đánh giá, tối đa 1 đánh giá / sản phẩm
 * POST /api/products/:productId/reviews
 */
exports.createProductReview = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ.',
        errors: ['Invalid ObjectId']
      });
    }

    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        success: false,
        message: 'Số sao đánh giá phải từ 1 đến 5.',
        errors: ['Rating phải từ 1 đến 5']
      });
    }

    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm.',
        errors: ['Sản phẩm không tồn tại']
      });
    }

    // Kiểm tra khách hàng đã từng mua sản phẩm này chưa
    const hasPurchased = await Order.findOne({
      $or: [{ user: req.user.id }, { customer: req.user.id }],
      'items.product': productId,
      orderStatus: { $ne: 'cancelled' }
    });

    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua sản phẩm này.',
        errors: ['Chưa mua sản phẩm']
      });
    }

    // Kiểm tra đã đánh giá trước đó chưa (1 review/sản phẩm)
    const existingReview = await Review.findOne({
      product: productId,
      user: req.user.id
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đánh giá sản phẩm này trước đó rồi.',
        errors: ['Đã tồn tại đánh giá cho sản phẩm này']
      });
    }

    const review = await Review.create({
      product: productId,
      user: req.user.id,
      rating: ratingNum,
      comment: comment || ''
    });

    await review.populate('user', 'name fullName');

    res.status(201).json({
      success: true,
      message: 'Gửi đánh giá thành công. Cảm ơn bạn!',
      data: review
    });
  } catch (error) {
    next(error);
  }
};
