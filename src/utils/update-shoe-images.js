require('dotenv').config();
const mongoose = require('mongoose');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Supplier = require('../models/Supplier');

const shoeProductsList = [
  {
    name: 'Nike Air Zoom Pegasus 40',
    slug: 'nike-air-zoom-pegasus-40',
    brandSlug: 'nike',
    catSlug: 'running',
    costPrice: 1800000,
    salePrice: 3290000,
    image: '/images/shoes/1.jpg',
    description: 'Đôi giày chạy bộ quốc dân với công nghệ đệm Zoom Air kép mang lại độ đàn hồi và êm ái vượt trội.',
    sizes: [39, 40, 41, 42, 43],
    colors: ['Đen', 'Trắng'],
    featured: true,
    isFastMoving: true
  },
  {
    name: 'Adidas Ultraboost Light',
    slug: 'adidas-ultraboost-light',
    brandSlug: 'adidas',
    catSlug: 'running',
    costPrice: 2400000,
    salePrice: 4200000,
    image: '/images/shoes/2.jpg',
    description: 'Thế hệ đệm Boost nhẹ nhất của Adidas, hoàn trả năng lượng tối đa trên từng bước chạy.',
    sizes: [40, 41, 42, 43],
    colors: ['Đen', 'Xám'],
    featured: true,
    isFastMoving: true
  },
  {
    name: 'Puma Velocity Nitro 2',
    slug: 'puma-velocity-nitro-2',
    brandSlug: 'puma',
    catSlug: 'running',
    costPrice: 1500000,
    salePrice: 2890000,
    image: '/images/shoes/3.jpg',
    description: 'Giày chạy bộ công nghệ bọt đệm khí Nitro cải tiến, cực kỳ êm ái và siêu bám đường với đế Pumagrip.',
    sizes: [39, 40, 41, 42],
    colors: ['Cam', 'Đen'],
    featured: true,
    isFastMoving: false
  },
  {
    name: 'Nike Air Jordan 1 Low',
    slug: 'nike-air-jordan-1-low',
    brandSlug: 'nike',
    catSlug: 'lifestyle',
    costPrice: 2100000,
    salePrice: 3850000,
    image: '/images/shoes/4.jpg',
    description: 'Huyền thoại bóng rổ đường phố kinh điển của Nike, kiểu dáng low-top năng động và cá tính.',
    sizes: [40, 41, 42, 43],
    colors: ['Đỏ Đen', 'Trắng Xanh'],
    featured: true,
    isFastMoving: true
  },
  {
    name: 'Adidas Stan Smith Primegreen',
    slug: 'adidas-stan-smith-primegreen',
    brandSlug: 'adidas',
    catSlug: 'lifestyle',
    costPrice: 1200000,
    salePrice: 2350000,
    image: '/images/shoes/5.jpg',
    description: 'Mẫu giày tennis cổ điển vượt thời gian, thiết kế tối giản thanh lịch phù hợp mọi trang phục.',
    sizes: [38, 39, 40, 41, 42],
    colors: ['Trắng Xanh', 'Trắng Đen'],
    featured: false,
    isFastMoving: true
  },
  {
    name: 'Nike Dunk Low Retro Panda',
    slug: 'nike-dunk-low-retro-panda',
    brandSlug: 'nike',
    catSlug: 'lifestyle',
    costPrice: 1900000,
    salePrice: 3490000,
    image: '/images/shoes/6.jpg',
    description: 'Phối màu Panda đen trắng huyền thoại được giới trẻ toàn cầu săn đón nhiệt liệt.',
    sizes: [39, 40, 41, 42, 43],
    colors: ['Đen Trắng'],
    featured: true,
    isFastMoving: true
  },
  {
    name: 'Puma Deviate Nitro Elite 2',
    slug: 'puma-deviate-nitro-elite-2',
    brandSlug: 'puma',
    catSlug: 'running',
    costPrice: 2800000,
    salePrice: 4890000,
    image: '/images/shoes/7.jpg',
    description: 'Giày đua marathon đỉnh cao có đĩa carbon INNOPLATE trợ lực tối đa cho vận động viên chuyên nghiệp.',
    sizes: [40, 41, 42],
    colors: ['Xanh Neon', 'Đen'],
    featured: false,
    isFastMoving: false
  },
  {
    name: 'Nike ZoomX Vaporfly 3',
    slug: 'nike-zoomx-vaporfly-3',
    brandSlug: 'nike',
    catSlug: 'running',
    costPrice: 3800000,
    salePrice: 6290000,
    image: '/images/shoes/8.jpg',
    description: 'Đỉnh cao tốc độ đường đua với bọt ZoomX đàn hồi nhất cùng tấm sợi carbon toàn chiều dài.',
    sizes: [40, 41, 42, 43],
    colors: ['Hồng', 'Trắng'],
    featured: true,
    isFastMoving: false
  },
  {
    name: 'Adidas Adizero Adios Pro 3',
    slug: 'adidas-adizero-adios-pro-3',
    brandSlug: 'adidas',
    catSlug: 'running',
    costPrice: 3500000,
    salePrice: 5800000,
    image: '/images/shoes/9.jpg',
    description: 'Vũ khí phá kỷ lục cự ly marathon của Adidas với thanh carbon EnergyRods 2.0 tân tiến.',
    sizes: [40, 41, 42],
    colors: ['Vàng Neon', 'Đen'],
    featured: false,
    isFastMoving: false
  },
  {
    name: 'Nike Air Force 1 07 All White',
    slug: 'nike-air-force-1-07-white',
    brandSlug: 'nike',
    catSlug: 'lifestyle',
    costPrice: 1600000,
    salePrice: 2990000,
    image: '/images/shoes/10.jpg',
    description: 'Mẫu giày thể thao đường phố biểu tượng nhất mọi thời đại với chất liệu da cao cấp toàn bộ màu trắng.',
    sizes: [38, 39, 40, 41, 42, 43],
    colors: ['Trắng'],
    featured: true,
    isFastMoving: true
  },
  {
    name: 'Adidas Samba OG Classic',
    slug: 'adidas-samba-og-classic',
    brandSlug: 'adidas',
    catSlug: 'lifestyle',
    costPrice: 1700000,
    salePrice: 3100000,
    image: '/images/shoes/11.jpg',
    description: 'Đôi giày thời trang hot-trend toàn cầu với mũi giày da lộn chữ T và đế cao su gum cổ điển.',
    sizes: [39, 40, 41, 42],
    colors: ['Trắng Đen', 'Đen Trắng'],
    featured: true,
    isFastMoving: true
  },
  {
    name: 'Puma Future 7 Match FG/AG',
    slug: 'puma-future-7-match-fg-ag',
    brandSlug: 'puma',
    catSlug: 'football',
    costPrice: 1400000,
    salePrice: 2490000,
    image: '/images/shoes/12.jpg',
    description: 'Giày đá bóng cổ cao công nghệ dệt FUZIONFIT360 ôm khít bàn chân, kiểm soát bóng điêu luyện.',
    sizes: [39, 40, 41, 42, 43],
    colors: ['Hồng Neon', 'Trắng'],
    featured: false,
    isFastMoving: false
  },
  {
    name: 'Nike Mercurial Superfly 9 Academy',
    slug: 'nike-mercurial-superfly-9',
    brandSlug: 'nike',
    catSlug: 'football',
    costPrice: 1600000,
    salePrice: 2790000,
    image: '/images/shoes/13.jpg',
    description: 'Giày bóng đá sân cỏ nhân tạo có bộ đệm Zoom Air cho cảm giác bứt tốc bùng nổ trên sân.',
    sizes: [39, 40, 41, 42, 43],
    colors: ['Đồng Đỏ', 'Vàng Chanh'],
    featured: true,
    isFastMoving: true
  },
  {
    name: 'Adidas Predator Elite FT',
    slug: 'adidas-predator-elite-ft',
    brandSlug: 'adidas',
    catSlug: 'football',
    costPrice: 2900000,
    salePrice: 5200000,
    image: '/images/shoes/14.jpg',
    description: 'Vũ khí sút bóng xoáy chết chóc với các vây cao su Strikeskin và lưỡi gà gập cổ điển.',
    sizes: [40, 41, 42, 43],
    colors: ['Đen Đỏ Trắng'],
    featured: false,
    isFastMoving: false
  },
  {
    name: 'Puma King Pro 21 FG/AG',
    slug: 'puma-king-pro-21-fg-ag',
    brandSlug: 'puma',
    catSlug: 'football',
    costPrice: 1500000,
    salePrice: 2690000,
    image: '/images/shoes/15.jpg',
    description: 'Da nhân tạo K-BETTER êm mềm không nguồn gốc động vật, độ bền và cảm giác bóng tinh tế.',
    sizes: [40, 41, 42],
    colors: ['Đen Trắng'],
    featured: false,
    isFastMoving: false
  },
  {
    name: 'Nike Giannis Freak 5',
    slug: 'nike-giannis-freak-5',
    brandSlug: 'nike',
    catSlug: 'basketball',
    costPrice: 1900000,
    salePrice: 3390000,
    image: '/images/shoes/16.jpg',
    description: 'Dòng giày bóng rổ signature của Á thần Giannis Antetokounmpo, hỗ trợ bứt tốc đổi hướng cực nhanh.',
    sizes: [41, 42, 43, 44],
    colors: ['Xanh Đỏ', 'Đen'],
    featured: false,
    isFastMoving: false
  },
  {
    name: 'Adidas Dame 8 EXTPLY',
    slug: 'adidas-dame-8-extply',
    brandSlug: 'adidas',
    catSlug: 'basketball',
    costPrice: 1800000,
    salePrice: 3150000,
    image: '/images/shoes/17.jpg',
    description: 'Đệm Bounce Pro mật độ kép mang lại sự ổn định và bật nhảy êm ái cho các hậu vệ bóng rổ.',
    sizes: [41, 42, 43],
    colors: ['Đen Vàng', 'Trắng'],
    featured: false,
    isFastMoving: false
  },
  {
    name: 'Puma MB.03 LaMelo Ball',
    slug: 'puma-mb-03-lamelo-ball',
    brandSlug: 'puma',
    catSlug: 'basketball',
    costPrice: 2200000,
    salePrice: 3890000,
    image: '/images/shoes/18.jpg',
    description: 'Mẫu giày bóng rổ thiết kế ngoài không gian độc lạ cùng lớp đệm Nitro Foam êm ái.',
    sizes: [41, 42, 43, 44],
    colors: ['Xanh Neon Độc Đáo'],
    featured: true,
    isFastMoving: true
  },
  {
    name: 'Nike Metcon 9 Training',
    slug: 'nike-metcon-9-training',
    brandSlug: 'nike',
    catSlug: 'training',
    costPrice: 2100000,
    salePrice: 3690000,
    image: '/images/shoes/19.jpg',
    description: 'Tiêu chuẩn vàng cho giày tập gym, cross-fit với đế Hyperlift vững chãi khi nâng tạ nặng.',
    sizes: [39, 40, 41, 42, 43],
    colors: ['Xám Đen', 'Trắng'],
    featured: false,
    isFastMoving: true
  },
  {
    name: 'Adidas Dropset 2 Trainer',
    slug: 'adidas-dropset-2-trainer',
    brandSlug: 'adidas',
    catSlug: 'training',
    costPrice: 1800000,
    salePrice: 3200000,
    image: '/images/shoes/20.jpg',
    description: 'Đế đệm EVA kép kết hợp thông gió dưới lòng bàn chân, chuyên dụng cho các bài tập thể lực.',
    sizes: [40, 41, 42],
    colors: ['Đen Trắng'],
    featured: false,
    isFastMoving: false
  },
  {
    name: 'Puma Fuse 2.0 Workout Trainer',
    slug: 'puma-fuse-2-0-workout',
    brandSlug: 'puma',
    catSlug: 'training',
    costPrice: 1400000,
    salePrice: 2490000,
    image: '/images/shoes/21.jpg',
    description: 'Độ dốc gót 4mm cùng khuôn đế rộng tạo nền tảng vững chắc cho các bài tập tạ và cardio.',
    sizes: [39, 40, 41, 42],
    colors: ['Đen', 'Xanh Dương'],
    featured: false,
    isFastMoving: false
  },
  {
    name: 'Nike Invincible 3 Max Cushion',
    slug: 'nike-invincible-3-max-cushion',
    brandSlug: 'nike',
    catSlug: 'running',
    costPrice: 2700000,
    salePrice: 4790000,
    image: '/images/shoes/22.jpg',
    description: 'Độ đệm tối đa bảo vệ khớp gối khi chạy cự ly dài với lớp bọt ZoomX siêu dày.',
    sizes: [40, 41, 42, 43],
    colors: ['Trắng Xanh', 'Đen'],
    featured: true,
    isFastMoving: true
  },
  {
    name: 'Adidas Boston 12 Energy Rods',
    slug: 'adidas-boston-12-energy-rods',
    brandSlug: 'adidas',
    catSlug: 'running',
    costPrice: 2200000,
    salePrice: 3890000,
    image: '/images/shoes/23.jpg',
    description: 'Mẫu giày luyện tập tốc độ hoàn hảo với sự kết hợp Lightstrike Pro và các thanh sợi thủy tinh.',
    sizes: [40, 41, 42, 43],
    colors: ['Trắng Vàng', 'Xanh'],
    featured: false,
    isFastMoving: true
  },
  {
    name: 'Puma Magnify Nitro 2 Comfort',
    slug: 'puma-magnify-nitro-2-comfort',
    brandSlug: 'puma',
    catSlug: 'running',
    costPrice: 1900000,
    salePrice: 3390000,
    image: '/images/shoes/24.jpg',
    description: 'Đôi giày chạy cự ly dài êm nhất của Puma với hàm lượng bọt Nitro dày dặn.',
    sizes: [39, 40, 41, 42],
    colors: ['Đen Bạc'],
    featured: false,
    isFastMoving: false
  },
  {
    name: 'Nike Air Max 270 Lifestyle',
    slug: 'nike-air-max-270-lifestyle',
    brandSlug: 'nike',
    catSlug: 'lifestyle',
    costPrice: 2200000,
    salePrice: 3990000,
    image: '/images/shoes/25.jpg',
    description: 'Cửa sổ đệm khí Air lớn nhất ở gót chân mang lại cảm giác êm ái như đi trên mây suốt cả ngày.',
    sizes: [39, 40, 41, 42, 43],
    colors: ['Đen Trắng', 'Xanh Đen'],
    featured: true,
    isFastMoving: true
  },
  {
    name: 'Adidas NMD_R1 V3 Urban',
    slug: 'adidas-nmd-r1-v3-urban',
    brandSlug: 'adidas',
    catSlug: 'lifestyle',
    costPrice: 2000000,
    salePrice: 3590000,
    image: '/images/shoes/26.jpg',
    description: 'Phong cách khám phá đô thị hiện đại với các miếng chèn TPU đặc trưng và đệm Boost toàn phần.',
    sizes: [40, 41, 42, 43],
    colors: ['Trắng Xám', 'Đen'],
    featured: false,
    isFastMoving: true
  },
  {
    name: 'Puma RS-X Efekt Remastered',
    slug: 'puma-rs-x-efekt-remastered',
    brandSlug: 'puma',
    catSlug: 'lifestyle',
    costPrice: 1700000,
    salePrice: 2990000,
    image: '/images/shoes/27.jpg',
    description: 'Thiết kế chunky sneaker đậm chất retro thập niên 80 với các chi tiết cắt lớp hầm hố ấn tượng.',
    sizes: [39, 40, 41, 42],
    colors: ['Xám Bạc', 'Nhiều Màu'],
    featured: false,
    isFastMoving: false
  },
  {
    name: 'Nike InfinityRN 4 Flyknit',
    slug: 'nike-infinityrn-4-flyknit',
    brandSlug: 'nike',
    catSlug: 'running',
    costPrice: 2400000,
    salePrice: 4190000,
    image: '/images/shoes/28.jpg',
    description: 'Công nghệ bọt ReactX mới giảm 43% lượng khí thải carbon và tăng 13% độ hoàn trả năng lượng.',
    sizes: [40, 41, 42, 43],
    colors: ['Đen Trắng', 'Xanh'],
    featured: true,
    isFastMoving: true
  },
  {
    name: 'Adidas Supernova Rise Dreamstrike',
    slug: 'adidas-supernova-rise-dreamstrike',
    brandSlug: 'adidas',
    catSlug: 'running',
    costPrice: 1900000,
    salePrice: 3300000,
    image: '/images/shoes/29.jpg',
    description: 'Bọt Dreamstrike+ thế hệ mới thiết kế riêng cho việc tập luyện chạy bộ hàng ngày cực kỳ thoải mái.',
    sizes: [39, 40, 41, 42],
    colors: ['Đen Cam', 'Trắng Xanh'],
    featured: false,
    isFastMoving: true
  },
  {
    name: 'Puma Fast-R Nitro Elite Carbon',
    slug: 'puma-fast-r-nitro-elite-carbon',
    brandSlug: 'puma',
    catSlug: 'running',
    costPrice: 3600000,
    salePrice: 5990000,
    image: '/images/shoes/30.jpg',
    description: 'Thiết kế đế tách rời đột phá với tấm đĩa carbon PWRPLATE lộ thiên đem lại tốc độ bùng nổ.',
    sizes: [40, 41, 42],
    colors: ['Cam Neon Đen'],
    featured: true,
    isFastMoving: false
  }
];

async function updateShoeImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[DB] Kết nối MongoDB thành công');

    // Lấy brands
    const nike = await Brand.findOne({ slug: 'nike' }) || await Brand.create({ name: 'Nike', slug: 'nike', status: 'active' });
    const adidas = await Brand.findOne({ slug: 'adidas' }) || await Brand.create({ name: 'Adidas', slug: 'adidas', status: 'active' });
    const puma = await Brand.findOne({ slug: 'puma' }) || await Brand.create({ name: 'Puma', slug: 'puma', status: 'active' });

    const brandMap = { nike: nike._id, adidas: adidas._id, puma: puma._id };

    // Lấy categories
    const categories = await Category.find();
    const catMap = {};
    for (const c of categories) {
      catMap[c.slug] = c._id;
    }

    // Default supplier
    const supplier = await Supplier.findOne() || await Supplier.create({
      name: 'SportZone Global Supply',
      email: 'supply@sportzone.vn',
      phone: '0901234567',
      address: 'TP.HCM',
      status: 'active'
    });

    console.log('[DB] Đang làm sạch các sản phẩm thử nghiệm cũ...');
    await Product.deleteMany({
      $or: [
        { name: { $regex: /Test|Unpurchased/i } },
        { slug: { $in: shoeProductsList.map((s) => s.slug) } }
      ]
    });

    console.log('[DB] Đang tạo 30 sản phẩm giày thể thao chân thực với 30 ảnh tương ứng...');
    let createdCount = 0;

    for (let i = 0; i < shoeProductsList.length; i++) {
      const sp = shoeProductsList[i];
      const brandId = brandMap[sp.brandSlug] || nike._id;
      const catId = catMap[sp.catSlug] || Object.values(catMap)[0];

      const variants = [];
      let totalStock = 0;
      sp.sizes.forEach((sz) => {
        sp.colors.forEach((col) => {
          const qty = Math.floor(Math.random() * 8) + 4; // 4 to 11 đôi
          totalStock += qty;
          const skuCode = `${sp.slug.slice(0, 6).toUpperCase()}-${sz}-${col.slice(0, 3).toUpperCase()}`;
          variants.push({
            sku: skuCode,
            color: col,
            size: sz,
            stockQuantity: qty,
            price: sp.salePrice,
            importPrice: sp.costPrice
          });
        });
      });

      const newProd = await Product.create({
        name: sp.name,
        slug: sp.slug,
        brand: brandId,
        category: catId,
        costPrice: sp.costPrice,
        salePrice: sp.salePrice,
        description: sp.description,
        images: [sp.image],
        sizes: sp.sizes,
        colors: sp.colors,
        stock: totalStock,
        status: 'active',
        featured: sp.featured,
        isFastMoving: sp.isFastMoving,
        defaultSupplier: supplier._id,
        variants
      });

      // Tạo Inventory
      for (const v of variants) {
        await Inventory.findOneAndUpdate(
          { product: newProd._id, size: v.size, color: v.color },
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

      createdCount++;
    }

    console.log(`[Thành công] Đã đưa thành công ${createdCount}/30 sản phẩm giày chân thực lên hệ thống!`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Lỗi cập nhật ảnh giày:', err);
    process.exit(1);
  }
}

updateShoeImages();
