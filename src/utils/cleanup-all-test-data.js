require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const User = require('../models/User');
const Inventory = require('../models/Inventory');
const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');
const Order = require('../models/Order');

async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[DB] Đã kết nối MongoDB Atlas để dọn dẹp dữ liệu test');

  // 1. Xóa các sản phẩm test hoặc unpurchased
  const deletedProducts = await Product.deleteMany({
    $or: [
      { name: { $regex: /test|unpurchased/i } },
      { slug: { $regex: /test|unpurchased/i } }
    ]
  });
  console.log(`[CLEANUP] Đã xóa ${deletedProducts.deletedCount} sản phẩm test.`);

  // 2. Xóa các danh mục test
  const deletedCategories = await Category.deleteMany({
    $or: [
      { name: { $regex: /test/i } },
      { slug: { $regex: /test/i } }
    ]
  });
  console.log(`[CLEANUP] Đã xóa ${deletedCategories.deletedCount} danh mục test.`);

  // 3. Xóa các thương hiệu test
  const deletedBrands = await Brand.deleteMany({
    $or: [
      { name: { $regex: /test/i } },
      { slug: { $regex: /test/i } }
    ]
  });
  console.log(`[CLEANUP] Đã xóa ${deletedBrands.deletedCount} thương hiệu test.`);

  // 4. Xóa các user test
  const deletedUsers = await User.deleteMany({
    $or: [
      { email: { $regex: /testuser_|@example\.com/i } },
      { name: { $regex: /Test Khách Hàng/i } }
    ]
  });
  console.log(`[CLEANUP] Đã xóa ${deletedUsers.deletedCount} tài khoản test.`);

  // 5. Xóa đơn nhập hàng test & supplier test
  const deletedSuppliers = await Supplier.deleteMany({
    name: { $regex: /Test Nhà Cung Cấp/i }
  });
  console.log(`[CLEANUP] Đã xóa ${deletedSuppliers.deletedCount} nhà cung cấp test.`);

  // 6. Dọn dẹp tồn kho mồ côi (không còn product)
  const validProducts = await Product.find({}, '_id');
  const validProductIds = validProducts.map(p => p._id);
  const deletedInventories = await Inventory.deleteMany({
    product: { $nin: validProductIds }
  });
  console.log(`[CLEANUP] Đã xóa ${deletedInventories.deletedCount} bản ghi tồn kho rác.`);

  console.log('[SUCCESS] Đã dọn dẹp sạch sẽ toàn bộ dữ liệu test!');
  process.exit(0);
}

cleanup().catch(err => {
  console.error('[ERROR] Lỗi khi dọn dẹp:', err);
  process.exit(1);
});
