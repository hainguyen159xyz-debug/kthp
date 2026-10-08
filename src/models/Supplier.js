const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên nhà cung cấp là bắt buộc'],
      unique: true,
      trim: true
    },
    contactPerson: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      trim: true,
      default: ''
    },
    phone: {
      type: String,
      trim: true,
      required: [true, 'Số điện thoại nhà cung cấp là bắt buộc']
    },
    address: {
      type: String,
      default: ''
    },
    leadTimeDays: {
      type: Number,
      default: 2,
      min: [1, 'Thời gian cung ứng tối thiểu là 1 ngày'],
      comment: 'Số ngày dự kiến để nhà cung cấp giao hàng tới kho'
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

module.exports = mongoose.model('Supplier', supplierSchema);
