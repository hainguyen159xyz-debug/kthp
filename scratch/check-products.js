const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../src/models/Product');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const products = await Product.find({}, 'name colors images variants').lean();
    console.log('Total products:', products.length);
    products.forEach((p, idx) => {
      const vColors = [...new Set((p.variants || []).map(v => v.color))];
      console.log(`[${idx + 1}] ID:${p._id} | ${p.name} | Colors: ${JSON.stringify(p.colors)} | Images: ${JSON.stringify(p.images)} | Variant colors: ${JSON.stringify(vColors)}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
