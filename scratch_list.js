const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./src/models/Product');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await Product.find({}).sort({ createdAt: 1 }).lean();
  console.log('Total products:', products.length);
  const summary = products.map((p, idx) => ({
    no: idx + 1,
    id: p._id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    thumbnail: p.thumbnail,
    colorVariants: (p.colorVariants || []).map(c => ({ color: c.color, image: c.image }))
  }));
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
