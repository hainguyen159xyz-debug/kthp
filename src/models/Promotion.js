const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Mã khuyến mãi là bắt buộc'],
      unique: true,
      uppercase: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Tên chương trình khuyến mãi là bắt buộc'],
      trim: true
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    discountValue: {
      type: Number,
      required: [true, 'Giá trị giảm giá là bắt buộc'],
      min: [0, 'Giá trị giảm không được âm']
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: [0, 'Giá trị đơn tối thiểu không được âm']
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
      comment: 'Số tiền giảm tối đa (dành cho phần trăm)'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: [true, 'Ngày kết thúc là bắt buộc']
    },
    usageLimit: {
      type: Number,
      default: 100,
      min: [0, 'Giới hạn lượt dùng không được âm']
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

// Tự động kiểm tra hết hạn
promotionSchema.methods.isValid = function (orderAmount = 0) {
  const now = new Date();
  if (this.status !== 'active') return false;
  if (now < this.startDate || now > this.endDate) return false;
  if (this.usageLimit > 0 && this.usedCount >= this.usageLimit) return false;
  if (orderAmount < this.minOrderValue) return false;
  return true;
};

// Hàm tính số tiền giảm
promotionSchema.methods.calculateDiscount = function (orderAmount = 0) {
  if (!this.isValid(orderAmount)) return 0;
  let discount = 0;
  if (this.discountType === 'percentage') {
    discount = (orderAmount * this.discountValue) / 100;
    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount;
    }
  } else {
    discount = this.discountValue;
  }
  return Math.min(discount, orderAmount);
};

module.exports = mongoose.model('Promotion', promotionSchema);
