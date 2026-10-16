const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./src/models/Product');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await Product.find({}).sort({ createdAt: 1 }).lean();
  products.forEach((p, idx) => {
    const id = idx + 1;
    console.log(`[P${id}] ${p.name}`);
    console.log(`  Thumbnail: ${p.thumbnail}`);
    console.log(`  Images: ${(p.images || []).join(', ')}`);
    if (p.colorVariants && p.colorVariants.length) {
      console.log(`  Colors: ` + p.colorVariants.map(c => `${c.color} -> ${c.image}`).join(' | '));
    }
  });
  process.exit(0);
}
main();
