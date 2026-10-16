const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Sản phẩm là bắt buộc']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người dùng là bắt buộc']
    },
    rating: {
      type: Number,
      required: [true, 'Đánh giá số sao là bắt buộc'],
      min: [1, 'Đánh giá tối thiểu là 1 sao'],
      max: [5, 'Đánh giá tối đa là 5 sao']
    },
    title: {
      type: String,
      trim: true,
      default: ''
    },
    comment: {
      type: String,
      trim: true,
      default: ''
    },
    variant: {
      type: String,
      trim: true,
      default: ''
    },
    shopReply: {
      type: String,
      trim: true,
      default: ''
    },
    helpful: {
      type: Number,
      default: 0
    },
    tags: [{
      type: String,
      trim: true
    }]
  },
  {
    timestamps: true
  }
);

// Mỗi khách hàng chỉ được đánh giá 1 lần cho mỗi sản phẩm (phiên bản 1)
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
