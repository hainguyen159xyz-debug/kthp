const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isValidEmail, isValidPassword } = require('../validators/validate');

/**
 * Đăng ký tài khoản khách hàng mới
 */
exports.register = async (req, res, next) => {
  try {
    const { name, fullName, email, password, phone, address } = req.body;
    const userName = name || fullName;

    if (!userName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ tên, email và mật khẩu.',
        errors: ['Tên, email và mật khẩu là bắt buộc']
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng email không hợp lệ.',
        errors: ['Email không đúng định dạng chuẩn']
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải từ 6 ký tự trở lên.',
        errors: ['Mật khẩu tối thiểu 6 ký tự']
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được sử dụng.',
        errors: ['Email đã tồn tại trong hệ thống']
      });
    }

    const user = await User.create({
      name: userName,
      fullName: userName,
      email: email.toLowerCase().trim(),
      password,
      phone: phone || '',
      address: address || '',
      role: 'customer',
      status: 'active'
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          address: user.address,
          role: user.role,
          status: user.status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Đăng nhập (Khách hàng hoặc Admin)
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu.',
        errors: ['Thiếu email hoặc mật khẩu']
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác.',
        errors: ['Thông tin đăng nhập không hợp lệ']
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác.',
        errors: ['Thông tin đăng nhập không hợp lệ']
      });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
        errors: ['Tài khoản đang bị khóa']
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          address: user.address,
          role: user.role,
          status: user.status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy thông tin người dùng hiện tại (GET /api/auth/me & GET /api/auth/profile)
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng.',
        errors: ['Người dùng không tồn tại']
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

exports.getProfile = exports.getMe;

/**
 * Cập nhật thông tin cá nhân (PUT /api/auth/profile)
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, fullName, phone, address } = req.body;
    const updateName = name || fullName;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng.',
        errors: ['Người dùng không tồn tại']
      });
    }

    if (updateName) {
      user.name = updateName;
      user.fullName = updateName;
    }
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công.',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Đổi mật khẩu (PUT /api/auth/change-password)
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.',
        errors: ['Thiếu mật khẩu']
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải từ 6 ký tự trở lên.',
        errors: ['Mật khẩu quá ngắn']
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng.',
        errors: ['Người dùng không tồn tại']
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng.',
        errors: ['Mật khẩu hiện tại sai']
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công.'
    });
  } catch (error) {
    next(error);
  }
};
