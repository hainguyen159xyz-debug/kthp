const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const apiRoutes = require('./routes/api');
const { notFoundHandler, globalErrorHandler } = require('./middlewares/error.middleware');

const app = express();

// Middlewares cơ bản
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Phục vụ giao diện tĩnh Frontend (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '../public')));

// Gắn toàn bộ REST API
app.use('/api', apiRoutes);

// Bắt lỗi khi không tìm thấy route API
app.use('/api/*', notFoundHandler);

// Xử lý lỗi toàn cục
app.use(globalErrorHandler);

module.exports = app;
