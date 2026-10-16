const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');

const updates = [
  // 1. Nike Air Zoom Pegasus 40
  {
    nameRegex: /Pegasus 40/i,
    colorVariants: [
      { color: 'Đen', image: '/images/shoes/1.jpg' },
      { color: 'Trắng', image: '/images/shoes/1-white.jpg' }
    ],
    images: ['/images/shoes/1.jpg', '/images/shoes/1-white.jpg']
  },
  // 4. Nike Air Jordan 1 Low
  {
    nameRegex: /Jordan 1 Low/i,
    colorVariants: [
      { color: 'Đỏ Đen', image: '/images/shoes/4.jpg' },
      { color: 'Trắng Xanh', image: '/images/shoes/4-blue.jpg' }
    ],
    images: ['/images/shoes/4.jpg', '/images/shoes/4-blue.jpg']
  },
  // 5. Adidas Stan Smith Primegreen
  {
    nameRegex: /Stan Smith/i,
    colorVariants: [
      { color: 'Trắng Xanh', image: '/images/shoes/5.jpg' },
      { color: 'Trắng Đen', image: '/images/shoes/5-black.jpg' }
    ],
    images: ['/images/shoes/5.jpg', '/images/shoes/5-black.jpg']
  },
  // 10. Nike Air Force 1 07
  {
    nameRegex: /Air Force 1/i,
    colors: ['Trắng', 'Đen'],
    colorVariants: [
      { color: 'Trắng', image: '/images/shoes/10.jpg' },
      { color: 'Đen', image: '/images/shoes/10-black.jpg' }
    ],
    images: ['/images/shoes/10.jpg', '/images/shoes/10-black.jpg'],
    addBlackVariants: true
  },
  // 11. Adidas Samba OG Classic
  {
    nameRegex: /Samba OG/i,
    colorVariants: [
      { color: 'Trắng Đen', image: '/images/shoes/11.jpg' },
      { color: 'Đen Trắng', image: '/images/shoes/11-black.jpg' }
    ],
    images: ['/images/shoes/11.jpg', '/images/shoes/11-black.jpg']
  }
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    const products = await Product.find({});
    console.log(`Processing ${products.length} products...`);

    for (const prod of products) {
      const specificUpdate = updates.find(u => u.nameRegex.test(prod.name));

      if (specificUpdate) {
        prod.colorVariants = specificUpdate.colorVariants;
        prod.images = specificUpdate.images;
        if (specificUpdate.colors) {
          prod.colors = specificUpdate.colors;
        }

        if (specificUpdate.addBlackVariants) {
          // Ensure variants for 'Đen' exist for Air Force 1
          const existingBlack = prod.variants.some(v => v.color === 'Đen');
          if (!existingBlack) {
            const sizes = [39, 40, 41, 42, 43];
            sizes.forEach(sz => {
              prod.variants.push({
                sku: `AF1-BLK-${sz}`,
                size: sz,
                color: 'Đen',
                image: '/images/shoes/10-black.jpg',
                stockQuantity: 10,
                price: prod.salePrice,
                importPrice: prod.costPrice
              });
            });
          }
        }

        // Map images to variants
        prod.variants.forEach(v => {
          const match = prod.colorVariants.find(cv => cv.color.toLowerCase() === (v.color || '').toLowerCase());
          if (match) v.image = match.image;
        });

        await prod.save();

        // Update inventory records if variants were added
        if (specificUpdate.addBlackVariants) {
          for (const v of prod.variants) {
            await Inventory.findOneAndUpdate(
              { product: prod._id, size: v.size, color: v.color },
              {
                sku: v.sku,
                quantity: v.stockQuantity,
                reservedQuantity: 0,
                availableQuantity: v.stockQuantity
              },
              { upsert: true }
            );
          }
        }

        console.log(`✓ Updated dedicated colorways for: ${prod.name}`);
      } else {
        // Fallback for remaining products: associate each color in prod.colors with its own entry in colorVariants
        const mainImage = (prod.images && prod.images[0]) || '/images/shoes/1.jpg';
        const colors = prod.colors && prod.colors.length > 0
          ? prod.colors
          : [...new Set((prod.variants || []).map(v => v.color))];

        prod.colorVariants = colors.map((col, idx) => ({
          color: col,
          image: (prod.images && prod.images[idx]) || mainImage
        }));

        prod.variants.forEach(v => {
          const match = prod.colorVariants.find(cv => cv.color.toLowerCase() === (v.color || '').toLowerCase());
          if (match) v.image = match.image;
          else v.image = mainImage;
        });

        await prod.save();
        console.log(`✓ Synchronized colorVariants for: ${prod.name} (${prod.colorVariants.length} colors)`);
      }
    }

    console.log('All products successfully updated with colorVariants!');
  } catch (err) {
    console.error('Update error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
