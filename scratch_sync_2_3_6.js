const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./src/models/Product');

async function updateSync() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Product 2: Adidas Ultraboost Light
  const p2 = await Product.findOne({ name: /Ultraboost Light/i });
  if (p2) {
    p2.images = ['/images/shoes/2.jpg', '/images/shoes/2-white.jpg', '/images/shoes/2-mint.jpg'];
    p2.colorVariants = [
      { color: 'Đen Core Black', image: '/images/shoes/2.jpg' },
      { color: 'Trắng Cloud White', image: '/images/shoes/2-white.jpg' },
      { color: 'Xanh Mint Bạc Hà', image: '/images/shoes/2-mint.jpg' }
    ];
    // update variants
    p2.variants = p2.variants.map(v => {
      if (v.color.includes('Hồng') || v.color.includes('Đen')) {
        return { ...v.toObject(), color: 'Đen Core Black', image: '/images/shoes/2.jpg' };
      } else if (v.color.includes('Tím') || v.color.includes('Trắng')) {
        return { ...v.toObject(), color: 'Trắng Cloud White', image: '/images/shoes/2-white.jpg' };
      } else {
        return { ...v.toObject(), color: 'Xanh Mint Bạc Hà', image: '/images/shoes/2-mint.jpg' };
      }
    });
    await p2.save();
    console.log('Updated Product 2!');
  }

  // Product 3: Puma Velocity Nitro 2
  const p3 = await Product.findOne({ name: /Velocity Nitro 2/i });
  if (p3) {
    p3.images = ['/images/shoes/3.jpg', '/images/shoes/3-blue.jpg', '/images/shoes/3-red.jpg'];
    p3.colorVariants = [
      { color: 'Trắng Cổ Điển', image: '/images/shoes/3.jpg' },
      { color: 'Xanh Royal Blue', image: '/images/shoes/3-blue.jpg' },
      { color: 'Đỏ Crimson Red', image: '/images/shoes/3-red.jpg' }
    ];
    await p3.save();
    console.log('Updated Product 3!');
  }

  // Product 6: Nike Dunk Low Retro Panda
  const p6 = await Product.findOne({ name: /Dunk Low/i });
  if (p6) {
    p6.images = ['/images/shoes/6.jpg', '/images/shoes/6-mint.jpg', '/images/shoes/6-lavender.jpg'];
    p6.colorVariants = [
      { color: 'Đen Trắng Panda', image: '/images/shoes/6.jpg' },
      { color: 'Xanh Mint Pastel', image: '/images/shoes/6-mint.jpg' },
      { color: 'Tím Lavender', image: '/images/shoes/6-lavender.jpg' }
    ];
    await p6.save();
    console.log('Updated Product 6!');
  }

  process.exit(0);
}

updateSync();
