const jwt = require('jsonwebtoken');

/**
 * Middleware xác thực JWT Token từ Header Authorization
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Bạn chưa đăng nhập hoặc không có quyền truy cập (Thiếu token).'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn.',
      error: error.message
    });
  }
};

/**
 * Middleware phân quyền chỉ cho phép Admin truy cập
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Truy cập bị từ chối. Chỉ quản trị viên (Admin) mới có quyền thực hiện thao tác này.'
    });
  }
  next();
};

module.exports = {
  verifyToken,
  requireAdmin
};
