const fs = require('fs');
const path = require('path');

const mappings = [
  { index: 1, colorVariants: [{ color: 'Đen', image: '/images/shoes/1.jpg' }, { color: 'Trắng', image: '/images/shoes/1-white.jpg' }] },
  { index: 2, colorVariants: [{ color: 'Hồng Pastel', image: '/images/shoes/2.jpg' }, { color: 'Xanh Bạc Hà', image: '/images/shoes/2-mint.jpg' }, { color: 'Tím Lavender', image: '/images/shoes/2-purple.jpg' }] },
  { index: 3, colorVariants: [{ color: 'Trắng Cổ Điển', image: '/images/shoes/3.jpg' }, { color: 'Xanh Dương Ice', image: '/images/shoes/3-blue.jpg' }, { color: 'Đỏ Crimson', image: '/images/shoes/3-red.jpg' }] },
  { index: 4, colorVariants: [{ color: 'Đỏ Đen', image: '/images/shoes/4.jpg' }, { color: 'Trắng Xanh', image: '/images/shoes/4-blue.jpg' }] },
  { index: 5, colorVariants: [{ color: 'Trắng Xanh', image: '/images/shoes/5.jpg' }, { color: 'Trắng Đen', image: '/images/shoes/5-black.jpg' }] },
  { index: 6, colorVariants: [{ color: 'Đen Trắng', image: '/images/shoes/6.jpg' }, { color: 'Xanh Mint Hồng', image: '/images/shoes/6-mint.jpg' }, { color: 'Tím Lavender', image: '/images/shoes/6-lavender.jpg' }] },
  { index: 7, colorVariants: [{ color: 'Xanh Neon', image: '/images/shoes/7.jpg' }, { color: 'Cam San Hô', image: '/images/shoes/7-coral.jpg' }, { color: 'Xanh Electric', image: '/images/shoes/7-blue.jpg' }] },
  { index: 8, colorVariants: [{ color: 'Vàng Cam', image: '/images/shoes/8.jpg' }, { color: 'Hồng Neon', image: '/images/shoes/8-pink.jpg' }, { color: 'Xanh Biển', image: '/images/shoes/8-blue.jpg' }] },
  { index: 9, colorVariants: [{ color: 'Đen Vàng Neon', image: '/images/shoes/9.jpg' }, { color: 'Đen Xanh Cyan', image: '/images/shoes/9-blue.jpg' }, { color: 'Đen Đỏ Solar', image: '/images/shoes/9-red.jpg' }] },
  { index: 10, colorVariants: [{ color: 'Trắng', image: '/images/shoes/10.jpg' }, { color: 'Đen', image: '/images/shoes/10-black.jpg' }] },
  { index: 11, colorVariants: [{ color: 'Trắng Đen', image: '/images/shoes/11.jpg' }, { color: 'Đen Trắng', image: '/images/shoes/11-black.jpg' }] },
  { index: 12, colorVariants: [{ color: 'Đen Trắng', image: '/images/shoes/12.jpg' }, { color: 'Trắng Bạc', image: '/images/shoes/12-white.jpg' }, { color: 'Xanh Electric', image: '/images/shoes/12-blue.jpg' }] },
  { index: 13, colorVariants: [{ color: 'Đồng Đỏ', image: '/images/shoes/13.jpg' }, { color: 'Xanh Biển Chrome', image: '/images/shoes/13-blue.jpg' }, { color: 'Vàng Chanh Solar', image: '/images/shoes/13-yellow.jpg' }] },
  { index: 14, colorVariants: [{ color: 'Xanh Đỏ Trắng', image: '/images/shoes/14.jpg' }, { color: 'Tím Đen Solar', image: '/images/shoes/14-purple.jpg' }, { color: 'Xanh Lá Lục Bảo', image: '/images/shoes/14-green.jpg' }] },
  { index: 15, colorVariants: [{ color: 'Đen Trắng', image: '/images/shoes/15.jpg' }, { color: 'Xanh Hoàng Gia', image: '/images/shoes/15-blue.jpg' }, { color: 'Đỏ Ruby', image: '/images/shoes/15-red.jpg' }] },
  { index: 16, colorVariants: [{ color: 'Xanh Đỏ', image: '/images/shoes/16.jpg' }, { color: 'Tím Vàng Showtime', image: '/images/shoes/16-purple.jpg' }, { color: 'Xanh Lá Cam Volt', image: '/images/shoes/16-green.jpg' }] },
  { index: 17, colorVariants: [{ color: 'Đen Xám', image: '/images/shoes/17.jpg' }, { color: 'Xanh Aqua', image: '/images/shoes/17-aqua.jpg' }, { color: 'Đỏ Crimson', image: '/images/shoes/17-red.jpg' }] },
  { index: 18, colorVariants: [{ color: 'Xanh Neon Độc Đáo', image: '/images/shoes/18.jpg' }, { color: 'Hồng Cam Toxic', image: '/images/shoes/18-pink.jpg' }, { color: 'Tím Nebula Galaxy', image: '/images/shoes/18-purple.jpg' }] },
  { index: 19, colorVariants: [{ color: 'Xám Cam', image: '/images/shoes/19.jpg' }, { color: 'Xanh Dương Navy', image: '/images/shoes/19-blue.jpg' }, { color: 'Xanh Rêu Quân Đội', image: '/images/shoes/19-green.jpg' }] },
  { index: 20, colorVariants: [{ color: 'Đen Trắng', image: '/images/shoes/20.jpg' }, { color: 'Xanh Dương Thể Thao', image: '/images/shoes/20-blue.jpg' }, { color: 'Đỏ Năng Động', image: '/images/shoes/20-red.jpg' }] },
  { index: 21, colorVariants: [{ color: 'Trắng Bạc', image: '/images/shoes/21.jpg' }, { color: 'Xanh Dương Neon', image: '/images/shoes/21-blue.jpg' }, { color: 'Cam Lửa', image: '/images/shoes/21-orange.jpg' }] },
  { index: 22, colorVariants: [{ color: 'Trắng Xám', image: '/images/shoes/22.jpg' }, { color: 'Xanh Ngọc Bích', image: '/images/shoes/22-teal.jpg' }, { color: 'Hồng Pastel', image: '/images/shoes/22-pink.jpg' }] },
  { index: 23, colorVariants: [{ color: 'Đen Trắng', image: '/images/shoes/23.jpg' }, { color: 'Xanh Cyan Tốc Độ', image: '/images/shoes/23-cyan.jpg' }, { color: 'Cam Solar', image: '/images/shoes/23-orange.jpg' }] },
  { index: 24, colorVariants: [{ color: 'Xanh Navy Tím', image: '/images/shoes/24.jpg' }, { color: 'Đỏ Ruby', image: '/images/shoes/24-red.jpg' }, { color: 'Xanh Lục Bảo', image: '/images/shoes/24-green.jpg' }] },
  { index: 25, colorVariants: [{ color: 'Đen Trắng', image: '/images/shoes/25.jpg' }, { color: 'Xanh Biển Đen', image: '/images/shoes/25-blue.jpg' }, { color: 'Cam Cháy Đen', image: '/images/shoes/25-orange.jpg' }] },
  { index: 26, colorVariants: [{ color: 'Vàng Cát Sa Mạc', image: '/images/shoes/26.jpg' }, { color: 'Xanh Mint Bạc', image: '/images/shoes/26-mint.jpg' }, { color: 'Tím Khói', image: '/images/shoes/26-purple.jpg' }] },
  { index: 27, colorVariants: [{ color: 'Cam Nâu Đất', image: '/images/shoes/27.jpg' }, { color: 'Xanh Biển Bạc', image: '/images/shoes/27-blue.jpg' }, { color: 'Tím Magenta', image: '/images/shoes/27-purple.jpg' }] },
  { index: 28, colorVariants: [{ color: 'Mận Chín Đen', image: '/images/shoes/28.jpg' }, { color: 'Xanh Teal Ngọc', image: '/images/shoes/28-teal.jpg' }, { color: 'Cam Hổ Phách', image: '/images/shoes/28-amber.jpg' }] },
  { index: 29, colorVariants: [{ color: 'Xanh Dương Đậm', image: '/images/shoes/29.jpg' }, { color: 'Cam Đỏ Lửa', image: '/images/shoes/29-orange.jpg' }, { color: 'Xanh Lá Mạ', image: '/images/shoes/29-green.jpg' }] },
  { index: 30, colorVariants: [{ color: 'Cam Neon Carbon', image: '/images/shoes/30.jpg' }, { color: 'Xanh Lá Neon', image: '/images/shoes/30-green.jpg' }, { color: 'Xanh Dương Điện', image: '/images/shoes/30-blue.jpg' }] }
];

let missing = 0;
for (const m of mappings) {
  for (const cv of m.colorVariants) {
    const fullPath = path.join(__dirname, '..', 'public', cv.image);
    if (!fs.existsSync(fullPath)) {
      console.error(`MISSING: ${cv.image} for shoe #${m.index}`);
      missing++;
    }
  }
}

if (missing === 0) {
  console.log(`ALL ${mappings.reduce((acc, m) => acc + m.colorVariants.length, 0)} variant images verified exist on disk!`);
} else {
  console.error(`Found ${missing} missing images!`);
}
