const mongoose = require('mongoose');
const dns = require('dns');

// Thiết lập DNS dự phòng để đảm bảo phân giải SRV của MongoDB Atlas trên Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Bỏ qua nếu môi trường không cho phép setServers
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[MongoDB] Kết nối thành công: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] Lỗi kết nối CSDL: ${error.message}`);
    console.warn('[MongoDB] Vui lòng kiểm tra lại dịch vụ MongoDB hoặc cập nhật MONGODB_URI trong file .env');
    // Không ép process.exit(1) để server vẫn có thể khởi động và phục vụ thông báo cho nhà phát triển
  }
};

module.exports = connectDB;
