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
      required: true
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
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Số lượng tối thiểu là 1']
    },
    subtotal: {
      type: Number,
      required: true
    },
    isBackorder: {
      type: Boolean,
      default: false,
      comment: 'true nếu sản phẩm này tại thời điểm đặt kho không đủ, cần chờ nhập từ NCC'
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
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      district: { type: String, default: '' },
      note: { type: String, default: '' }
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'bank_transfer'],
      default: 'COD'
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid'
    },
    fulfillmentStatus: {
      type: String,
      enum: [
        'in_stock',         // Toàn bộ các món đều có sẵn trong kho
        'waiting_supplier', // Đang chờ nhập hàng từ nhà cung cấp
        'imported',         // Đã nhập đủ hàng về kho
        'packing',          // Đang đóng gói
        'shipping',         // Đang giao hàng
        'delivered',        // Giao hàng thành công
        'cancelled'         // Đã hủy
      ],
      default: 'in_stock'
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipping', 'completed', 'cancelled'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Order', orderSchema);
