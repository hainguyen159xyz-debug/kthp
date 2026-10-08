const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function clean() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Product = require('../models/Product');
  const Inventory = require('../models/Inventory');

  const testProds = await Product.find({
    $or: [
      { name: /Test/i },
      { name: /Unpurchased/i }
    ]
  });

  console.log('Found test products to delete:', testProds.length);
  for (const p of testProds) {
    await Inventory.deleteMany({ product: p._id });
    await Product.deleteOne({ _id: p._id });
    console.log('Deleted:', p.name);
  }

  // Ensure top 8 real shoes are marked featured: true
  const shoes = await Product.find({}).sort({ createdAt: 1 }).limit(8);
  for (const s of shoes) {
    s.featured = true;
    await s.save();
  }

  const remaining = await Product.countDocuments();
  console.log('Remaining real shoes in database:', remaining);
  await mongoose.disconnect();
}

clean().catch(console.error);
