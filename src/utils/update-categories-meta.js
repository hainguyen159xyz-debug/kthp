require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

const updateData = [
  {
    slug: 'running',
    name: 'Giày Chạy Bộ',
    description: 'Chạy xa hơn. Bứt phá giới hạn.',
    image: '/images/categories/running.jpg'
  },
  {
    slug: 'lifestyle',
    name: 'Giày Thể Thao Hằng Ngày',
    description: 'Phong cách riêng. Chất riêng.',
    image: '/images/categories/lifestyle.jpg'
  },
  {
    slug: 'basketball',
    name: 'Giày Bóng Rổ',
    description: 'Bứt phá trên mọi sân đấu.',
    image: '/images/categories/basketball.jpg'
  },
  {
    slug: 'football',
    name: 'Giày Bóng Đá',
    description: 'Làm chủ từng pha bóng.',
    image: '/images/categories/football.jpg'
  },
  {
    slug: 'training',
    name: 'Giày Tập Luyện',
    description: 'Mạnh mẽ trong từng chuyển động.',
    image: '/images/categories/training.jpg'
  }
];

async function updateCategories() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected.');

  for (const item of updateData) {
    const res = await Category.findOneAndUpdate(
      { slug: item.slug },
      {
        $set: {
          name: item.name,
          description: item.description,
          image: item.image,
          status: 'active',
          isActive: true
        }
      },
      { new: true }
    );
    if (res) {
      console.log(`Updated ${item.slug} -> ${res.name} (Image: ${res.image})`);
    } else {
      console.warn(`Category slug ${item.slug} not found!`);
    }
  }

  const all = await Category.find();
  console.log(`\nTổng số danh mục hiện tại: ${all.length}`);
  all.forEach(c => console.log(`- ${c._id}: ${c.name} (${c.slug}) -> ${c.image}`));

  await mongoose.disconnect();
}

updateCategories();
