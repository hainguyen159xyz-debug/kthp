require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');

async function cleanTestCategories() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Xác định chính xác các bản ghi test
  const testCats = await Category.find({
    $or: [
      { name: { $regex: /test/i } },
      { slug: { $regex: /test/i } }
    ]
  });

  console.log(`Tìm thấy ${testCats.length} danh mục test.`);
  
  // Kiểm tra từng danh mục xem có dính sản phẩm nào không
  const safeToDeleteIds = [];
  for (const cat of testCats) {
    const count = await Product.countDocuments({ category: cat._id });
    if (count === 0) {
      safeToDeleteIds.push(cat._id);
    } else {
      console.warn(`CẢNH BÁO: Danh mục test ${cat.name} có ${count} sản phẩm, KHÔNG XÓA!`);
    }
  }

  if (safeToDeleteIds.length > 0) {
    const res = await Category.deleteMany({ _id: { $in: safeToDeleteIds } });
    console.log(`Đã xóa an toàn ${res.deletedCount} danh mục test (đảm bảo không ảnh hưởng sản phẩm).`);
  }

  const remaining = await Category.find();
  console.log(`Số danh mục còn lại trong hệ thống: ${remaining.length}`);
  remaining.forEach(r => console.log(`+ ${r.name} (${r.slug})`));

  await mongoose.disconnect();
}

cleanTestCategories();
