const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./src/models/Product');

async function syncAllDatabase() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  const products = await Product.find({}).sort({ createdAt: 1 });
  console.log('Total products in DB:', products.length);

  // Configuration for each product 1 to 30
  const productConfigs = {
    1: {
      thumbnail: '/images/shoes/1.jpg',
      images: ['/images/shoes/1.jpg', '/images/shoes/1-white.jpg'],
      colorVariants: [
        { color: 'Đen Core Black', image: '/images/shoes/1.jpg' },
        { color: 'Trắng Summit White', image: '/images/shoes/1-white.jpg' }
      ]
    },
    2: {
      thumbnail: '/images/shoes/2.jpg',
      images: ['/images/shoes/2.jpg', '/images/shoes/2-white.jpg', '/images/shoes/2-mint.jpg'],
      colorVariants: [
        { color: 'Đen Core Black', image: '/images/shoes/2.jpg' },
        { color: 'Trắng Cloud White', image: '/images/shoes/2-white.jpg' },
        { color: 'Xanh Mint Bạc Hà', image: '/images/shoes/2-mint.jpg' }
      ]
    },
    3: {
      thumbnail: '/images/shoes/3.jpg',
      images: ['/images/shoes/3.jpg', '/images/shoes/3-blue.jpg', '/images/shoes/3-red.jpg'],
      colorVariants: [
        { color: 'Trắng Cổ Điển', image: '/images/shoes/3.jpg' },
        { color: 'Xanh Royal Blue', image: '/images/shoes/3-blue.jpg' },
        { color: 'Đỏ Crimson Red', image: '/images/shoes/3-red.jpg' }
      ]
    },
    4: {
      thumbnail: '/images/shoes/4.jpg',
      images: ['/images/shoes/4.jpg', '/images/shoes/4-blue.jpg'],
      colorVariants: [
        { color: 'Đỏ Đen Chicago', image: '/images/shoes/4.jpg' },
        { color: 'Trắng Xanh UNC', image: '/images/shoes/4-blue.jpg' }
      ]
    },
    5: {
      thumbnail: '/images/shoes/5.jpg',
      images: ['/images/shoes/5.jpg', '/images/shoes/5-black.jpg'],
      colorVariants: [
        { color: 'Trắng Xanh OG', image: '/images/shoes/5.jpg' },
        { color: 'Trắng Đen Core', image: '/images/shoes/5-black.jpg' }
      ]
    },
    6: {
      thumbnail: '/images/shoes/6.jpg',
      images: ['/images/shoes/6.jpg', '/images/shoes/6-mint.jpg', '/images/shoes/6-lavender.jpg'],
      colorVariants: [
        { color: 'Đen Trắng Panda', image: '/images/shoes/6.jpg' },
        { color: 'Xanh Mint Pastel', image: '/images/shoes/6-mint.jpg' },
        { color: 'Tím Lavender', image: '/images/shoes/6-lavender.jpg' }
      ]
    },
    7: {
      thumbnail: '/images/shoes/7.jpg',
      images: ['/images/shoes/7.jpg', '/images/shoes/7-coral.jpg', '/images/shoes/7-blue.jpg'],
      colorVariants: [
        { color: 'Xanh Neon Lime', image: '/images/shoes/7.jpg' },
        { color: 'Cam San Hô Coral', image: '/images/shoes/7-coral.jpg' },
        { color: 'Xanh Electric Blue', image: '/images/shoes/7-blue.jpg' }
      ]
    },
    8: {
      thumbnail: '/images/shoes/8.jpg',
      images: ['/images/shoes/8.jpg', '/images/shoes/8-pink.jpg', '/images/shoes/8-blue.jpg'],
      colorVariants: [
        { color: 'Trắng Cam Sail Ekiden', image: '/images/shoes/8.jpg' },
        { color: 'Hồng Hyper Pink', image: '/images/shoes/8-pink.jpg' },
        { color: 'Xanh Racer Blue', image: '/images/shoes/8-blue.jpg' }
      ]
    },
    9: {
      thumbnail: '/images/shoes/9.jpg',
      images: ['/images/shoes/9.jpg', '/images/shoes/9-blue.jpg', '/images/shoes/9-red.jpg'],
      colorVariants: [
        { color: 'Đen Vàng Solar', image: '/images/shoes/9.jpg' },
        { color: 'Xanh Cyan Tốc Độ', image: '/images/shoes/9-blue.jpg' },
        { color: 'Đỏ Solar Red', image: '/images/shoes/9-red.jpg' }
      ]
    },
    10: {
      thumbnail: '/images/shoes/10.jpg',
      images: ['/images/shoes/10.jpg', '/images/shoes/10-black.jpg'],
      colorVariants: [
        { color: 'Trắng All White', image: '/images/shoes/10.jpg' },
        { color: 'Đen Triple Black', image: '/images/shoes/10-black.jpg' }
      ]
    },
    11: {
      thumbnail: '/images/shoes/11.jpg',
      images: ['/images/shoes/11.jpg', '/images/shoes/11-black.jpg'],
      colorVariants: [
        { color: 'Trắng Đen Classic', image: '/images/shoes/11.jpg' },
        { color: 'Đen Trắng OG', image: '/images/shoes/11-black.jpg' }
      ]
    },
    12: {
      thumbnail: '/images/shoes/12.jpg',
      images: ['/images/shoes/12.jpg', '/images/shoes/12-blue.jpg'],
      colorVariants: [
        { color: 'Hồng Cam Coral', image: '/images/shoes/12.jpg' },
        { color: 'Xanh Electric Blue', image: '/images/shoes/12-blue.jpg' }
      ]
    },
    13: {
      thumbnail: '/images/shoes/13.jpg',
      images: ['/images/shoes/13.jpg', '/images/shoes/13-blue.jpg', '/images/shoes/13-yellow.jpg'],
      colorVariants: [
        { color: 'Cam Đồng Guava', image: '/images/shoes/13.jpg' },
        { color: 'Xanh Biển Chrome', image: '/images/shoes/13-blue.jpg' },
        { color: 'Vàng Chanh Solar', image: '/images/shoes/13-yellow.jpg' }
      ]
    },
    14: {
      thumbnail: '/images/shoes/14.jpg',
      images: ['/images/shoes/14.jpg', '/images/shoes/14-purple.jpg', '/images/shoes/14-green.jpg'],
      colorVariants: [
        { color: 'Trắng Đỏ Fold-Over', image: '/images/shoes/14.jpg' },
        { color: 'Tím Đen Solar', image: '/images/shoes/14-purple.jpg' },
        { color: 'Xanh Lá Lục Bảo', image: '/images/shoes/14-green.jpg' }
      ]
    },
    15: {
      thumbnail: '/images/shoes/15.jpg',
      images: ['/images/shoes/15.jpg', '/images/shoes/15-blue.jpg'],
      colorVariants: [
        { color: 'Đen Trắng King OG', image: '/images/shoes/15.jpg' },
        { color: 'Xanh Hoàng Gia Royal', image: '/images/shoes/15-blue.jpg' }
      ]
    },
    16: {
      thumbnail: '/images/shoes/16.jpg',
      images: ['/images/shoes/16.jpg', '/images/shoes/16-purple.jpg', '/images/shoes/16-green.jpg'],
      colorVariants: [
        { color: 'Xanh Ngọc Aqua', image: '/images/shoes/16.jpg' },
        { color: 'Tím Vàng Showtime', image: '/images/shoes/16-purple.jpg' },
        { color: 'Xanh Lá Volt', image: '/images/shoes/16-green.jpg' }
      ]
    },
    17: {
      thumbnail: '/images/shoes/17.jpg',
      images: ['/images/shoes/17.jpg', '/images/shoes/17-aqua.jpg', '/images/shoes/17-red.jpg'],
      colorVariants: [
        { color: 'Trắng Đen Off-White', image: '/images/shoes/17.jpg' },
        { color: 'Xanh Aqua', image: '/images/shoes/17-aqua.jpg' },
        { color: 'Đỏ Scarlet', image: '/images/shoes/17-red.jpg' }
      ]
    },
    18: {
      thumbnail: '/images/shoes/18.jpg',
      images: ['/images/shoes/18.jpg', '/images/shoes/18-pink.jpg', '/images/shoes/18-purple.jpg'],
      colorVariants: [
        { color: 'Tím Xanh Toxic', image: '/images/shoes/18.jpg' },
        { color: 'Hồng Aqua Miami', image: '/images/shoes/18-pink.jpg' },
        { color: 'Xanh Biển Team Blue', image: '/images/shoes/18-purple.jpg' }
      ]
    },
    19: {
      thumbnail: '/images/shoes/19.jpg',
      images: ['/images/shoes/19.jpg', '/images/shoes/19-blue.jpg', '/images/shoes/19-green.jpg'],
      colorVariants: [
        { color: 'Đen Cam Huấn Luyện', image: '/images/shoes/19.jpg' },
        { color: 'Xanh Dương Navy', image: '/images/shoes/19-blue.jpg' },
        { color: 'Xanh Rêu Quân Đội', image: '/images/shoes/19-green.jpg' }
      ]
    },
    20: {
      thumbnail: '/images/shoes/20.jpg',
      images: ['/images/shoes/20.jpg', '/images/shoes/20-blue.jpg', '/images/shoes/20-red.jpg'],
      colorVariants: [
        { color: 'Trắng Bạc Gum', image: '/images/shoes/20.jpg' },
        { color: 'Xanh Dương Thể Thao', image: '/images/shoes/20-blue.jpg' },
        { color: 'Đỏ Năng Động', image: '/images/shoes/20-red.jpg' }
      ]
    },
    21: {
      thumbnail: '/images/shoes/21.jpg',
      images: ['/images/shoes/21.jpg', '/images/shoes/21-blue.jpg', '/images/shoes/21-orange.jpg'],
      colorVariants: [
        { color: 'Đen Trắng Fuse', image: '/images/shoes/21.jpg' },
        { color: 'Xanh Dương Neon', image: '/images/shoes/21-blue.jpg' },
        { color: 'Cam Lửa Solar', image: '/images/shoes/21-orange.jpg' }
      ]
    },
    22: {
      thumbnail: '/images/shoes/22.jpg',
      images: ['/images/shoes/22.jpg', '/images/shoes/22-teal.jpg', '/images/shoes/22-pink.jpg'],
      colorVariants: [
        { color: 'Xanh Dương Racer', image: '/images/shoes/22.jpg' },
        { color: 'Xanh Ngọc Bích Teal', image: '/images/shoes/22-teal.jpg' },
        { color: 'Hồng Pastel Neon', image: '/images/shoes/22-pink.jpg' }
      ]
    },
    23: {
      thumbnail: '/images/shoes/23.jpg',
      images: ['/images/shoes/23.jpg', '/images/shoes/23-cyan.jpg', '/images/shoes/23-orange.jpg'],
      colorVariants: [
        { color: 'Trắng Cam Boston', image: '/images/shoes/23.jpg' },
        { color: 'Xanh Cyan Tốc Độ', image: '/images/shoes/23-cyan.jpg' },
        { color: 'Cam Solar Red', image: '/images/shoes/23-orange.jpg' }
      ]
    },
    24: {
      thumbnail: '/images/shoes/24.jpg',
      images: ['/images/shoes/24.jpg', '/images/shoes/24-red.jpg', '/images/shoes/24-green.jpg'],
      colorVariants: [
        { color: 'Đen Trắng Magnify', image: '/images/shoes/24.jpg' },
        { color: 'Đỏ Ruby Crimson', image: '/images/shoes/24-red.jpg' },
        { color: 'Xanh Lục Bảo', image: '/images/shoes/24-green.jpg' }
      ]
    },
    25: {
      thumbnail: '/images/shoes/25.jpg',
      images: ['/images/shoes/25.jpg', '/images/shoes/25-blue.jpg', '/images/shoes/25-orange.jpg'],
      colorVariants: [
        { color: 'Vàng Cát Nâu Tan', image: '/images/shoes/25.jpg' },
        { color: 'Xanh Biển Blue', image: '/images/shoes/25-blue.jpg' },
        { color: 'Cam Cháy Orange', image: '/images/shoes/25-orange.jpg' }
      ]
    },
    26: {
      thumbnail: '/images/shoes/26.jpg',
      images: ['/images/shoes/26.jpg', '/images/shoes/26-mint.jpg', '/images/shoes/26-purple.jpg'],
      colorVariants: [
        { color: 'Trắng Cam NMD', image: '/images/shoes/26.jpg' },
        { color: 'Xanh Mint Bạc', image: '/images/shoes/26-mint.jpg' },
        { color: 'Tím Khói Purple', image: '/images/shoes/26-purple.jpg' }
      ]
    },
    27: {
      thumbnail: '/images/shoes/27.jpg',
      images: ['/images/shoes/27.jpg', '/images/shoes/27-blue.jpg', '/images/shoes/27-purple.jpg'],
      colorVariants: [
        { color: 'Đen Triple Black', image: '/images/shoes/27.jpg' },
        { color: 'Trắng Xám Bạc', image: '/images/shoes/27-blue.jpg' },
        { color: 'Nâu Cát Warm Tan', image: '/images/shoes/27-purple.jpg' }
      ]
    },
    28: {
      thumbnail: '/images/shoes/28.jpg',
      images: ['/images/shoes/28.jpg', '/images/shoes/28-teal.jpg', '/images/shoes/28-amber.jpg'],
      colorVariants: [
        { color: 'Xanh Rêu Sage Green', image: '/images/shoes/28.jpg' },
        { color: 'Xanh Teal Ngọc', image: '/images/shoes/28-teal.jpg' },
        { color: 'Cam Hổ Phách', image: '/images/shoes/28-amber.jpg' }
      ]
    },
    29: {
      thumbnail: '/images/shoes/29.jpg',
      images: ['/images/shoes/29.jpg', '/images/shoes/29-orange.jpg', '/images/shoes/29-green.jpg'],
      colorVariants: [
        { color: 'Trắng Xanh Navy', image: '/images/shoes/29.jpg' },
        { color: 'Đen Trắng Core', image: '/images/shoes/29-orange.jpg' },
        { color: 'Xanh Lá Mạ', image: '/images/shoes/29-green.jpg' }
      ]
    },
    30: {
      thumbnail: '/images/shoes/30.jpg',
      images: ['/images/shoes/30.jpg', '/images/shoes/30-blue.jpg'],
      colorVariants: [
        { color: 'Xanh Lá Neon Lime', image: '/images/shoes/30.jpg' },
        { color: 'Xanh Dương Điện', image: '/images/shoes/30-blue.jpg' }
      ]
    }
  };

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const num = i + 1;
    const cfg = productConfigs[num];
    if (!cfg) continue;

    p.thumbnail = cfg.thumbnail;
    p.images = cfg.images;
    p.colorVariants = cfg.colorVariants;

    // Update variants so color name and image align with colorVariants
    if (p.variants && p.variants.length > 0) {
      const colors = cfg.colorVariants.map(cv => cv.color);
      p.variants = p.variants.map((v, vIdx) => {
        const assignedColor = colors[vIdx % colors.length];
        const assignedImg = cfg.colorVariants.find(cv => cv.color === assignedColor)?.image || cfg.thumbnail;
        return {
          ...v.toObject(),
          color: assignedColor,
          image: assignedImg
        };
      });
    }

    await p.save();
    console.log(`[SAVED P${num}] ${p.name} -> ${p.thumbnail} (${cfg.colorVariants.length} colors)`);
  }

  console.log('=== ALL 30 PRODUCTS DATABASE SYNC COMPLETE! ===');
  process.exit(0);
}

syncAllDatabase().catch(err => {
  console.error(err);
  process.exit(1);
});
