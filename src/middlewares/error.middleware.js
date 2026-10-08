/**
 * Middleware bắt lỗi 404 khi route không tồn tại
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy tài nguyên: ${req.method} ${req.originalUrl}`,
    errors: [`Route ${req.originalUrl} không tồn tại`]
  });
};

/**
 * Middleware xử lý lỗi tập trung (Global Error Handler)
 */
const globalErrorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('[Error Details]:', err.name || '', err.message || err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Lỗi máy chủ nội bộ (Internal Server Error)';
  let errors = err.errors || [];

  // Mongoose CastError (ObjectId không hợp lệ)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Định dạng ID không hợp lệ cho trường: ${err.path}`;
    errors = [`Giá trị '${err.value}' không phải là ObjectId hợp lệ`];
  }

  // Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'dữ liệu';
    message = `Giá trị của ${field} đã tồn tại trong hệ thống.`;
    errors = [`${field}: ${err.keyValue ? err.keyValue[field] : ''} đã được sử dụng`];
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Dữ liệu đầu vào không hợp lệ.';
    errors = Object.values(err.errors).map((val) => val.message);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token không hợp lệ.';
    errors = ['Token không đúng định dạng'];
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token đã hết hạn.';
    errors = ['Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'];
  }

  const response = {
    success: false,
    message,
    errors: errors.length > 0 ? errors : [message]
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = {
  notFoundHandler,
  globalErrorHandler
};
