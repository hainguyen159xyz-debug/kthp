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
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Số lượng nhập phải lớn hơn 0']
    },
    importPrice: {
      type: Number,
      required: true,
      min: [0, 'Giá nhập không được âm']
    },
    subtotal: {
      type: Number,
      required: true
    }
  },
  { _id: false }
);

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
      default: null,
      comment: 'ID đơn hàng của khách hàng nếu phiếu này tạo do đơn hàng bị thiếu tồn kho'
    },
    items: [purchaseOrderItemSchema],
    totalCost: {
      type: Number,
      required: true,
      default: 0
    },
    status: {
      type: String,
      enum: [
        'pending',             // Mới tạo yêu cầu, chờ gửi NCC
        'sent_to_supplier',    // Đã gửi NCC
        'supplier_confirmed',  // NCC xác nhận còn hàng và đóng gói
        'in_transit',          // Hàng đang trên đường về kho
        'received',            // Đã nhập vào kho (tự động cộng tồn kho)
        'cancelled'            // Đã hủy
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

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
