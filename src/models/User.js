const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true
    },
    fullName: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Email không hợp lệ']
    },
    password: {
      type: String,
      required: [true, 'Mật khẩu là bắt buộc'],
      minlength: [6, 'Mật khẩu phải từ 6 ký tự trở lên'],
      select: false // Mặc định không trả về password trong query
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      type: mongoose.Schema.Types.Mixed,
      default: ''
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer'
    },
    status: {
      type: String,
      enum: ['active', 'blocked', 'inactive'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

// Đồng bộ name và fullName trước khi validate/save
userSchema.pre('validate', function (next) {
  if (this.name && !this.fullName) {
    this.fullName = this.name;
  } else if (this.fullName && !this.name) {
    this.name = this.fullName;
  }
  next();
});

// Hash password trước khi lưu
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// So sánh password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
