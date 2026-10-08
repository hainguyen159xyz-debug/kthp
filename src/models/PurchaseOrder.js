const mongoose = require('mongoose');

const purchaseOrderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: {
      type: String,
      default: ''
    },
    variantSku: {
      type: String,
      default: ''
    },
    color: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Số lượng nhập phải lớn hơn 0']
    },
    costPrice: {
      type: Number,
      required: true,
      min: [0, 'Giá nhập không được âm']
    },
    importPrice: {
      type: Number,
      default: 0
    },
    subtotal: {
      type: Number,
      required: true
    }
  },
  { _id: false }
);

purchaseOrderItemSchema.pre('validate', function (next) {
  if (this.costPrice !== undefined && this.importPrice === undefined) {
    this.importPrice = this.costPrice;
  } else if (this.importPrice !== undefined && this.costPrice === undefined) {
    this.costPrice = this.importPrice;
  }
  if (!this.subtotal && this.quantity && (this.costPrice !== undefined || this.importPrice !== undefined)) {
    this.subtotal = this.quantity * (this.costPrice || this.importPrice || 0);
  }
  next();
});

const purchaseOrderSchema = new mongoose.Schema(
  {
    poCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true
    },
    relatedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null
    },
    items: [purchaseOrderItemSchema],
    totalAmount: {
      type: Number,
      default: 0
    },
    totalCost: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: [
        'pending',
        'sent',
        'confirmed',
        'receiving',
        'received',
        'cancelled',
        // Các giá trị legacy để không lỗi code cũ
        'sent_to_supplier',
        'supplier_confirmed',
        'in_transit'
      ],
      default: 'pending'
    },
    note: {
      type: String,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receivedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Đồng bộ totalAmount và totalCost
purchaseOrderSchema.pre('validate', function (next) {
  if (this.totalAmount !== undefined && !this.totalCost) {
    this.totalCost = this.totalAmount;
  } else if (this.totalCost !== undefined && !this.totalAmount) {
    this.totalAmount = this.totalCost;
  }
  next();
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
