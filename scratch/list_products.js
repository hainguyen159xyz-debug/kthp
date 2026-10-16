const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../src/models/Product');
const fs = require('fs');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await Product.find({}, 'name slug images colors colorVariants variants salePrice costPrice')
    .sort({ createdAt: 1 })
    .lean();

  console.log(`Total products: ${products.length}`);
  const summary = products.map((p, idx) => ({
    index: idx + 1,
    id: p._id.toString(),
    name: p.name,
    slug: p.slug,
    images: p.images,
    colors: p.colors,
    colorVariants: p.colorVariants,
    variantColors: [...new Set((p.variants || []).map(v => v.color))],
    variantSizes: [...new Set((p.variants || []).map(v => v.size))].sort((a,b)=>a-b)
  }));

  fs.writeFileSync('scratch/products_summary.json', JSON.stringify(summary, null, 2), 'utf-8');
  console.log('Saved to scratch/products_summary.json');
  await mongoose.disconnect();
}

main().catch(console.error);
