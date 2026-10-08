const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const GENDER_MAP = {
  // Men
  'Nike Air Jordan 1 Low': 'men',
  'Nike ZoomX Vaporfly 3': 'men',
  'Adidas Adizero Adios Pro 3': 'men',
  'Adidas Predator Elite FT': 'men',
  'Puma Future 7 Match FG/AG': 'men',
  'Nike Mercurial Superfly 9 Academy': 'men',
  'Puma King Pro 21 FG/AG': 'men',
  'Nike Giannis Freak 5': 'men',
  'Adidas Dame 8 EXTPLY': 'men',
  'Puma MB.03 LaMelo Ball': 'men',
  'Nike Metcon 9 Training': 'men',
  'Adidas Dropset 2 Trainer': 'men',
  'Puma Fuse 2.0 Workout Trainer': 'men',
  'Puma Fast-R Nitro Elite Carbon': 'men',

  // Women
  'Adidas Ultraboost Light': 'women',
  'Puma Velocity Nitro 2': 'women',
  'Nike Invincible 3 Max Cushion': 'women',
  'Adidas Boston 12 Energy Rods': 'women',
  'Puma Magnify Nitro 2 Comfort': 'women',
  'Adidas Supernova Rise Dreamstrike': 'women',
  'Nike InfinityRN 4 Flyknit': 'women',
  'Adidas NMD_R1 V3 Urban': 'women',
  'Puma RS-X Efekt Remastered': 'women',

  // Unisex
  'Nike Air Zoom Pegasus 40': 'unisex',
  'Adidas Stan Smith Primegreen': 'unisex',
  'Nike Dunk Low Retro Panda': 'unisex',
  'Nike Air Force 1 07 All White': 'unisex',
  'Adidas Samba OG Classic': 'unisex',
  'Nike Air Max 270 Lifestyle': 'unisex',
  'Puma Deviate Nitro Elite 2': 'unisex'
};

async function updateGender() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Product = require('../models/Product');

  const prods = await Product.find({});
  console.log('Total products to process:', prods.length);

  for (const p of prods) {
    const gender = GENDER_MAP[p.name] || 'men';
    p.gender = gender;
    await p.save();
    console.log(`Updated ${p.name} -> gender: ${gender}`);
  }

  const menCount = await Product.countDocuments({ gender: { $in: ['men', 'unisex'] } });
  const womenCount = await Product.countDocuments({ gender: { $in: ['women', 'unisex'] } });
  const unisexCount = await Product.countDocuments({ gender: 'unisex' });

  console.log(`Summary: Men available: ${menCount}, Women available: ${womenCount}, Unisex: ${unisexCount}`);
  await mongoose.disconnect();
}

updateGender().catch(console.error);
