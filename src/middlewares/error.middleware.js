/**
 * Middleware bắt lỗi 404 khi route không tồn tại
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy tài nguyên: ${req.method} ${req.originalUrl}`
  });
};

/**
 * Middleware xử lý lỗi tập trung (Global Error Handler)
 */
const globalErrorHandler = (err, req, res, next) => {
  console.error('[Error Details]:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Lỗi máy chủ nội bộ (Internal Server Error)';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  notFoundHandler,
  globalErrorHandler
};
