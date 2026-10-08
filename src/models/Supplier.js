const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên nhà cung cấp là bắt buộc'],
      unique: true,
      trim: true
    },
    contactName: {
      type: String,
      trim: true,
      default: ''
    },
    contactPerson: {
      type: String,
      trim: true,
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
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }
    ],
    leadTimeDays: {
      type: Number,
      default: 2,
      min: [1, 'Thời gian cung ứng tối thiểu là 1 ngày']
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
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

supplierSchema.pre('validate', function (next) {
  if (this.contactName && !this.contactPerson) this.contactPerson = this.contactName;
  if (this.contactPerson && !this.contactName) this.contactName = this.contactPerson;
  if (this.status) this.isActive = this.status === 'active';
  next();
});

module.exports = mongoose.model('Supplier', supplierSchema);
