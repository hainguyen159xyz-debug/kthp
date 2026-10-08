const mongoose = require('mongoose');

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
