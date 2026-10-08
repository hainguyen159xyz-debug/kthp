const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên thương hiệu là bắt buộc'],
      unique: true,
      trim: true
    },
    slug: {
      type: String,
      required: [true, 'Slug là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    logo: {
      type: String,
      default: ''
    },
    logoUrl: {
      type: String,
      default: ''
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

// Đồng bộ logo / logoUrl và status / isActive
brandSchema.pre('save', function (next) {
  if (this.logo && !this.logoUrl) this.logoUrl = this.logo;
  if (this.logoUrl && !this.logo) this.logo = this.logoUrl;
  if (this.status) this.isActive = this.status === 'active';
  next();
});

module.exports = mongoose.model('Brand', brandSchema);
