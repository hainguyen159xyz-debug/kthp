require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Kết nối cơ sở dữ liệu MongoDB
connectDB();

// Khởi chạy server
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`[SERVER] Sport Shoes Inventory System Server dang chay!`);
  console.log(`[STOREFRONT] http://localhost:${PORT}`);
  console.log(`[ADMIN] http://localhost:${PORT}/admin`);
  console.log(`[HEALTH] http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

// Xử lý unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection]: ${err.message}`);
});
