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
      min: 0
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    importPrice: {
      type: Number,
      default: 0,
      min: 0
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
      required: [true, 'Slug là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true
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
    costPrice: {
      type: Number,
      default: 0,
      min: [0, 'Giá vốn không được âm']
    },
    salePrice: {
      type: Number,
      required: [true, 'Giá bán là bắt buộc'],
      min: [0, 'Giá bán không được âm'],
      default: 0
    },
    description: {
      type: String,
      default: ''
    },
    images: {
      type: [String],
      default: []
    },
    sizes: {
      type: [Number],
      default: []
    },
    colors: {
      type: [String],
      default: []
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Số lượng tồn kho không được âm']
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft'],
      default: 'active'
    },
    featured: {
      type: Boolean,
      default: false
    },
    variants: [productVariantSchema],
    defaultSupplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
    },
    isFastMoving: {
      type: Boolean,
      default: false
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

// Tự động đồng bộ sizes, colors, stock từ variants nếu có
productSchema.pre('save', function (next) {
  if (this.status) {
    this.isActive = this.status === 'active';
  }

  if (this.variants && this.variants.length > 0) {
    const sizeSet = new Set(this.sizes || []);
    const colorSet = new Set(this.colors || []);
    let calculatedStock = 0;

    this.variants.forEach((v) => {
      if (v.size) sizeSet.add(v.size);
      if (v.color) colorSet.add(v.color);
      calculatedStock += v.stockQuantity || 0;
    });

    this.sizes = Array.from(sizeSet).sort((a, b) => a - b);
    this.colors = Array.from(colorSet);
    this.stock = calculatedStock;

    if (!this.salePrice && this.variants[0].price) {
      this.salePrice = this.variants[0].price;
    }
    if (!this.costPrice && this.variants[0].importPrice) {
      this.costPrice = this.variants[0].importPrice;
    }
  }

  next();
});

// Virtual: Tính tổng tồn kho của tất cả biến thể
productSchema.virtual('totalStock').get(function () {
  if (this.variants && this.variants.length > 0) {
    return this.variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
  }
  return this.stock || 0;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
