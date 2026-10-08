const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Sản phẩm là bắt buộc']
    },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      default: ''
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
      default: 0,
      min: [0, 'Số lượng tồn không được âm']
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Số lượng đang giữ không được âm']
    },
    availableQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Số lượng khả dụng không được âm']
    },
    lowStockThreshold: {
      type: Number,
      default: 2,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Ràng buộc duy nhất: Một sản phẩm chỉ có 1 bản ghi tồn kho cho mỗi cặp (size, color)
inventorySchema.index({ product: 1, size: 1, color: 1 }, { unique: true });

// Luôn tính availableQuantity = Math.max(0, quantity - reservedQuantity)
inventorySchema.pre('validate', function (next) {
  if (this.quantity !== undefined && this.reservedQuantity !== undefined) {
    this.availableQuantity = Math.max(0, (this.quantity || 0) - (this.reservedQuantity || 0));
  }
  next();
});

inventorySchema.pre('save', function (next) {
  this.availableQuantity = Math.max(0, (this.quantity || 0) - (this.reservedQuantity || 0));
  next();
});

module.exports = mongoose.model('Inventory', inventorySchema);
