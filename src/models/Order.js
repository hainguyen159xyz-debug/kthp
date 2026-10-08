const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: {
      type: String,
      required: true
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
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Số lượng tối thiểu là 1']
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    isBackorder: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      default: 0,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      district: { type: String, default: '' },
      note: { type: String, default: '' }
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'bank_transfer'],
      default: 'COD'
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid'
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'processing', 'shipping', 'completed', 'cancelled'],
      default: 'pending'
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipping', 'completed', 'cancelled'],
      default: 'pending'
    },
    fulfillmentStatus: {
      type: String,
      enum: [
        'in_stock',
        'waiting_supplier',
        'imported',
        'packing',
        'shipping',
        'delivered',
        'cancelled'
      ],
      default: 'in_stock'
    },
    promotionCode: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Đồng bộ user và customer, orderStatus và status
orderSchema.pre('validate', function (next) {
  if (this.user && !this.customer) this.customer = this.user;
  if (this.customer && !this.user) this.user = this.customer;
  if (this.orderStatus && !this.status) this.status = this.orderStatus;
  if (this.status && !this.orderStatus) this.orderStatus = this.status;
  next();
});

module.exports = mongoose.model('Order', orderSchema);
