require('dotenv').config();
const mongoose = require('mongoose');
const Brand = require('../models/Brand');
const Product = require('../models/Product');

async function cleanTestBrands() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('Không tìm thấy MONGODB_URI');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('MongoDB connected.');

    // Tìm tất cả các brand có chứa chữ "test" trong tên hoặc slug
    const testBrands = await Brand.find({
      $or: [
        { name: { $regex: /test/i } },
        { slug: { $regex: /test/i } }
      ]
    });

    console.log(`Tìm thấy ${testBrands.length} thương hiệu test:`);
    testBrands.forEach(b => console.log(`- ${b.name} (${b.slug})`));

    // Kiểm tra xem có sản phẩm nào thuộc các brand test này không
    const testBrandIds = testBrands.map(b => b._id);
    const linkedProducts = await Product.find({ brand: { $in: testBrandIds } });
    if (linkedProducts.length > 0) {
      console.log(`Cảnh báo: Có ${linkedProducts.length} sản phẩm liên kết với brand test!`);
    } else {
      console.log('Không có sản phẩm nào liên kết với các brand test này. An toàn để xóa.');
    }

    // Xóa các brand test
    const deleteRes = await Brand.deleteMany({ _id: { $in: testBrandIds } });
    console.log(`Đã xóa thành công ${deleteRes.deletedCount} brand test.`);

    // Hiển thị các brand thật còn lại
    const remainingBrands = await Brand.find().sort({ name: 1 });
    console.log(`Các thương hiệu thật còn lại (${remainingBrands.length}):`);
    remainingBrands.forEach(b => console.log(`+ ${b.name} (${b.slug})`));

    await mongoose.disconnect();
    console.log('Xong!');
  } catch (err) {
    console.error('Lỗi khi dọn dẹp test brands:', err);
    process.exit(1);
  }
}

cleanTestBrands();
