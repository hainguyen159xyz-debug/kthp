require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Kết nối cơ sở dữ liệu MongoDB
connectDB();

// Khởi chạy server
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`👟 Sport Shoes Inventory System Server đang chạy!`);
  console.log(`🌐 Storefront: http://localhost:${PORT}`);
  console.log(`⚙️  Admin Portal: http://localhost:${PORT}/admin`);
  console.log(`🚀 REST API Health: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

// Xử lý unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection]: ${err.message}`);
});
