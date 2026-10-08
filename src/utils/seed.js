require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Supplier = require('../models/Supplier');
const Promotion = require('../models/Promotion');
const Order = require('../models/Order');
const PurchaseOrder = require('../models/PurchaseOrder');
const Cart = require('../models/Cart');
const Review = require('../models/Review');
const Payment = require('../models/Payment');
const Shipment = require('../models/Shipment');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('[Seed Error] MONGODB_URI không được tìm thấy trong file .env');
      process.exit(1);
    }

    console.log('[Seed] Đang kết nối tới MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('[Seed] Kết nối MongoDB Atlas thành công!');

    // 1. Dọn dẹp dữ liệu cũ một cách an toàn
    console.log('[Seed] Đang dọn dẹp dữ liệu mẫu cũ...');
    await Promise.all([
      User.deleteMany({ email: { $in: ['admin@sportshoes.com', 'customer@sportshoes.com'] } }),
      Brand.deleteMany({ slug: { $in: ['nike', 'adidas', 'puma'] } }),
      Category.deleteMany({ slug: { $in: ['running', 'football', 'basketball', 'training', 'lifestyle'] } }),
      Supplier.deleteMany({ name: { $in: ['Nike Vietnam Distributor', 'Adidas Global Supply'] } }),
      Product.deleteMany({ slug: { $in: ['nike-air-zoom-pegasus-40', 'adidas-ultraboost-light', 'puma-velocity-nitro-2'] } }),
      Promotion.deleteMany({ code: { $in: ['WELCOME10', 'GIAM50K'] } })
    ]);

    // 2. Tạo Users (Admin & Customer)
    console.log('[Seed] Đang tạo tài khoản Admin và Customer...');
    const adminUser = await User.create({
      name: 'Quản Trị Viên',
      fullName: 'Quản Trị Viên',
      email: 'admin@sportshoes.com',
      password: 'Admin123456',
      phone: '0988888888',
      address: { street: '1 Hoàng Hoa Thám', city: 'Hà Nội' },
      role: 'admin',
      status: 'active'
    });

    const customerUser = await User.create({
      name: 'Nguyễn Văn Khách',
      fullName: 'Nguyễn Văn Khách',
      email: 'customer@sportshoes.com',
      password: 'Customer123456',
      phone: '0977777777',
      address: { street: '123 Nguyễn Trãi', city: 'TP. Hồ Chí Minh' },
      role: 'customer',
      status: 'active'
    });

    // 3. Tạo Brands
    console.log('[Seed] Đang tạo Thương hiệu (Brands)...');
    const [nike, adidas, puma] = await Brand.create([
      {
        name: 'Nike',
        slug: 'nike',
        description: 'Just Do It - Thương hiệu thể thao hàng đầu thế giới.',
        logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200',
        logoUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200',
        status: 'active'
      },
      {
        name: 'Adidas',
        slug: 'adidas',
        description: 'Impossible Is Nothing - Đỉnh cao công nghệ đệm giày.',
        logo: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=200',
        logoUrl: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=200',
        status: 'active'
      },
      {
        name: 'Puma',
        slug: 'puma',
        description: 'Forever Faster - Tốc độ và phong cách thể thao đột phá.',
        logo: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=200',
        logoUrl: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=200',
        status: 'active'
      }
    ]);

    // 4. Tạo Categories
    console.log('[Seed] Đang tạo Danh mục (Categories)...');
    const [running, football, basketball, training, lifestyle] = await Category.create([
      { name: 'Running', slug: 'running', description: 'Giày chạy bộ chuyên dụng êm ái, trợ lực tối đa', status: 'active' },
      { name: 'Football', slug: 'football', description: 'Giày đá bóng sân cỏ tự nhiên và nhân tạo', status: 'active' },
      { name: 'Basketball', slug: 'basketball', description: 'Giày bóng rổ cổ cao bảo vệ cổ chân', status: 'active' },
      { name: 'Training', slug: 'training', description: 'Giày tập gym, cross-fit đế phẳng ổn định', status: 'active' },
      { name: 'Lifestyle', slug: 'lifestyle', description: 'Giày thời trang thể thao thường ngày', status: 'active' }
    ]);

    // 5. Tạo Suppliers
    console.log('[Seed] Đang tạo Nhà cung cấp (Suppliers)...');
    const [supplierNike, supplierAdidas] = await Supplier.create([
      {
        name: 'Nike Vietnam Distributor',
        contactName: 'Nguyễn Văn An',
        contactPerson: 'Nguyễn Văn An',
        phone: '0901234567',
        email: 'supplier.nike@gmail.com',
        address: '123 Lê Duẩn, Quận 1, TP.HCM',
        leadTimeDays: 2,
        status: 'active'
      },
      {
        name: 'Adidas Global Supply',
        contactName: 'Trần Thị Bình',
        contactPerson: 'Trần Thị Bình',
        phone: '0909876543',
        email: 'supplier.adidas@gmail.com',
        address: '456 Nguyễn Huệ, Quận 1, TP.HCM',
        leadTimeDays: 3,
        status: 'active'
      }
    ]);

    // 6. Tạo Products
    console.log('[Seed] Đang tạo Sản phẩm và Tồn kho chi tiết...');
    const product1 = await Product.create({
      name: 'Nike Air Zoom Pegasus 40',
      slug: 'nike-air-zoom-pegasus-40',
      brand: nike._id,
      category: running._id,
      costPrice: 1800000,
      salePrice: 3200000,
      description: 'Đôi giày chạy bộ huyền thoại của Nike với công nghệ đệm khí kép Zoom Air mang lại phản hồi lực tuyệt hảo.',
      images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'],
      sizes: [39, 40, 41, 42],
      colors: ['Black', 'White'],
      stock: 26,
      status: 'active',
      featured: true,
      isFastMoving: true,
      defaultSupplier: supplierNike._id,
      variants: [
        { sku: 'PEG40-39-BLK', color: 'Black', size: 39, stockQuantity: 5, price: 3200000, importPrice: 1800000 },
        { sku: 'PEG40-40-BLK', color: 'Black', size: 40, stockQuantity: 8, price: 3200000, importPrice: 1800000 },
        { sku: 'PEG40-41-WHT', color: 'White', size: 41, stockQuantity: 3, price: 3200000, importPrice: 1800000 },
        { sku: 'PEG40-42-BLK', color: 'Black', size: 42, stockQuantity: 10, price: 3200000, importPrice: 1800000 }
      ]
    });

    const product2 = await Product.create({
      name: 'Adidas Ultraboost Light',
      slug: 'adidas-ultraboost-light',
      brand: adidas._id,
      category: running._id,
      costPrice: 2200000,
      salePrice: 4100000,
      description: 'Thế hệ đệm Boost nhẹ nhất lịch sử Adidas, hoàn trả năng lượng tối đa trên từng sải bước chân.',
      images: ['https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=600'],
      sizes: [40, 41, 42],
      colors: ['Core Black', 'Cloud White'],
      stock: 15,
      status: 'active',
      featured: true,
      isFastMoving: false,
      defaultSupplier: supplierAdidas._id,
      variants: [
        { sku: 'UB-40-BLK', color: 'Core Black', size: 40, stockQuantity: 7, price: 4100000, importPrice: 2200000 },
        { sku: 'UB-41-WHT', color: 'Cloud White', size: 41, stockQuantity: 5, price: 4100000, importPrice: 2200000 },
        { sku: 'UB-42-BLK', color: 'Core Black', size: 42, stockQuantity: 3, price: 4100000, importPrice: 2200000 }
      ]
    });

    // 7. Tạo Inventory chi tiết cho từng biến thể
    console.log('[Seed] Đang đồng bộ bản ghi Inventory Model...');
    for (const v of product1.variants) {
      await Inventory.findOneAndUpdate(
        { product: product1._id, size: v.size, color: v.color },
        {
          sku: v.sku,
          quantity: v.stockQuantity,
          reservedQuantity: 0,
          availableQuantity: v.stockQuantity,
          lowStockThreshold: 3
        },
        { upsert: true, new: true }
      );
    }

    for (const v of product2.variants) {
      await Inventory.findOneAndUpdate(
        { product: product2._id, size: v.size, color: v.color },
        {
          sku: v.sku,
          quantity: v.stockQuantity,
          reservedQuantity: 0,
          availableQuantity: v.stockQuantity,
          lowStockThreshold: 2
        },
        { upsert: true, new: true }
      );
    }

    // 8. Tạo Promotions
    console.log('[Seed] Đang tạo Mã khuyến mãi (Promotions)...');
    await Promotion.create([
      {
        code: 'WELCOME10',
        name: 'Giảm giá 10% chào mừng thành viên mới',
        discountType: 'percentage',
        discountValue: 10,
        minOrderValue: 500000,
        maxDiscountAmount: 300000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        usageLimit: 500,
        status: 'active'
      },
      {
        code: 'GIAM50K',
        name: 'Giảm ngay 50.000 VNĐ cho đơn từ 1 triệu',
        discountType: 'fixed',
        discountValue: 50000,
        minOrderValue: 1000000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        usageLimit: 200,
        status: 'active'
      }
    ]);

    console.log('====================================================');
    console.log('[OK] Khởi tạo dữ liệu mẫu (Seed Data) THÀNH CÔNG!');
    console.log('====================================================');
    console.log('[ADMIN] Admin Account:');
    console.log('   Email:    admin@sportshoes.com');
    console.log('   Password: Admin123456');
    console.log('----------------------------------------------------');
    console.log('[SHOES] Customer Account:');
    console.log('   Email:    customer@sportshoes.com');
    console.log('   Password: Customer123456');
    console.log('----------------------------------------------------');
    console.log('[BRAND]️ Khuyến mãi: WELCOME10, GIAM50K');
    console.log('====================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error.message);
    process.exit(1);
  }
};

seedData();
