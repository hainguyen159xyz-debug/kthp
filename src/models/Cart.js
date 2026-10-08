const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Sản phẩm là bắt buộc']
    },
    size: {
      type: Number,
      required: [true, 'Size giày là bắt buộc']
    },
    color: {
      type: String,
      required: [true, 'Màu sắc là bắt buộc'],
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Số lượng tối thiểu là 1'],
      default: 1
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Giá không được âm']
    }
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    items: [cartItemSchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Cart', cartSchema);
