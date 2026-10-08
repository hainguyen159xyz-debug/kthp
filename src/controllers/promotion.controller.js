const Promotion = require('../models/Promotion');
const { isValidObjectId } = require('../validators/validate');

/**
 * Lấy danh sách mã khuyến mãi (Admin thấy tất cả, Khách thấy mã active)
 * GET /api/promotions
 */
exports.getPromotions = async (req, res, next) => {
  try {
    const filter = {};
    if (!req.user || req.user.role !== 'admin') {
      filter.status = 'active';
      filter.endDate = { $gte: new Date() };
    }

    const promotions = await Promotion.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: promotions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy chi tiết mã khuyến mãi theo ID hoặc Code
 * GET /api/promotions/:id
 */
exports.getPromotionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let promo;

    if (isValidObjectId(id)) {
      promo = await Promotion.findById(id);
    } else {
      promo = await Promotion.findOne({ code: id.toUpperCase().trim() });
    }

    if (!promo) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã khuyến mãi.',
        errors: ['Mã không tồn tại']
      });
    }

    res.status(200).json({
      success: true,
      data: promo
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tạo mới mã khuyến mãi (Admin)
 * POST /api/promotions
 */
exports.createPromotion = async (req, res, next) => {
  try {
    const {
      code,
      name,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscountAmount,
      startDate,
      endDate,
      usageLimit,
      status
    } = req.body;

    if (!code || !name || discountValue === undefined || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã code, tên chương trình, giá trị giảm và ngày kết thúc.',
        errors: ['Thiếu thông tin bắt buộc']
      });
    }

    const promoCode = code.toUpperCase().trim();
    const existing = await Promotion.findOne({ code: promoCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Mã khuyến mãi này đã tồn tại.',
        errors: ['Mã khuyến mãi trùng lặp']
      });
    }

    const promotion = await Promotion.create({
      code: promoCode,
      name,
      discountType: discountType || 'percentage',
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      startDate: startDate || new Date(),
      endDate: new Date(endDate),
      usageLimit: Number(usageLimit) || 100,
      status: status || 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Tạo mã khuyến mãi thành công.',
      data: promotion
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật mã khuyến mãi (Admin)
 * PUT /api/promotions/:id
 */
exports.updatePromotion = async (req, res, next) => {
  try {
    const promotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã khuyến mãi để cập nhật.',
        errors: ['Mã không tồn tại']
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật mã khuyến mãi thành công.',
      data: promotion
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Xóa mã khuyến mãi (Admin)
 * DELETE /api/promotions/:id
 */
exports.deletePromotion = async (req, res, next) => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã khuyến mãi để xóa.',
        errors: ['Mã không tồn tại']
      });
    }

    res.status(200).json({
      success: true,
      message: 'Xóa mã khuyến mãi thành công.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Áp dụng mã khuyến mãi xem trước số tiền giảm (Customer khi checkout)
 * POST /api/promotions/apply
 */
exports.applyPromotion = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã khuyến mãi.',
        errors: ['Mã code là bắt buộc']
      });
    }

    const promo = await Promotion.findOne({ code: code.toUpperCase().trim() });
    if (!promo) {
      return res.status(404).json({
        success: false,
        message: 'Mã khuyến mãi không tồn tại.',
        errors: ['Mã không hợp lệ']
      });
    }

    const amount = Number(orderAmount) || 0;
    if (!promo.isValid(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Mã khuyến mãi không hợp lệ, đã hết hạn hoặc chưa đạt giá trị đơn tối thiểu.',
        errors: ['Điều kiện khuyến mãi không thỏa mãn']
      });
    }

    const discount = promo.calculateDiscount(amount);

    res.status(200).json({
      success: true,
      message: 'Áp dụng mã khuyến mãi thành công.',
      data: {
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        discountAmount: discount,
        finalAmount: Math.max(0, amount - discount)
      }
    });
  } catch (error) {
    next(error);
  }
};
