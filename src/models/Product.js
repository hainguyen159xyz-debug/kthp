const mongoose = require('mongoose');

// Biến thể chi tiết cho từng sản phẩm giày (Size + Màu + Tồn kho + Giá)
const productVariantSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    color: {
      type: String,
      required: true,
      trim: true
    },
    size: {
      type: Number,
      required: true
    },
    stockQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Số lượng tồn kho không được âm']
    },
    lowStockThreshold: {
      type: Number,
      default: 2,
      min: 0,
      comment: 'Ngưỡng cảnh báo tồn kho thấp cần lập phiếu nhập'
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    importPrice: {
      type: Number,
      default: 0,
      min: 0,
      comment: 'Giá vốn ước tính để tính toán chi phí và lợi nhuận'
    }
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên giày là bắt buộc'],
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Thương hiệu là bắt buộc']
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Danh mục là bắt buộc']
    },
    images: {
      type: [String],
      default: []
    },
    defaultSupplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      comment: 'Nhà cung cấp chính cho sản phẩm này khi cần đặt hàng JIT'
    },
    variants: [productVariantSchema],
    isFastMoving: {
      type: Boolean,
      default: false,
      comment: 'true = Hàng bán chạy (ưu tiên có tồn an toàn), false = Hàng bán chậm (đặt JIT)'
    },
    totalSold: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Virtual: Tính tổng tồn kho của tất cả biến thể
productSchema.virtual('totalStock').get(function () {
  if (!this.variants || this.variants.length === 0) return 0;
  return this.variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
