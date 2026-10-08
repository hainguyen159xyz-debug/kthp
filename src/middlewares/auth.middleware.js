const jwt = require('jsonwebtoken');

/**
 * Middleware xác thực JWT Token từ Header Authorization
 * Export cả 2 tên `authenticate` và `verifyToken` để tương thích toàn diện
 */
const authenticate = (req, res, next) => {
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
      errors: [error.message]
    });
  }
};

const verifyToken = authenticate;

/**
 * Middleware phân quyền dựa trên danh sách roles được phép
 * Ví dụ: authorize('admin'), authorize('admin', 'customer')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Bạn chưa đăng nhập.'
      });
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Truy cập bị từ chối. Bạn không có quyền thực hiện thao tác này.'
      });
    }

    next();
  };
};

/**
 * Middleware chỉ cho phép Admin truy cập
 */
const requireAdmin = authorize('admin');

module.exports = {
  authenticate,
  verifyToken,
  authorize,
  requireAdmin
};
