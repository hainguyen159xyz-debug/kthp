const fs = require('fs');
const brain = 'C:/Users/Admin/.gemini/antigravity-ide/brain/26842d50-b0a8-4308-9341-ae2ad0d0970f';

fs.copyFileSync(`${brain}/deviate_nitro_neon_1792115886361.jpg`, 'public/images/shoes/7.jpg');
fs.copyFileSync(`${brain}/deviate_nitro_coral_1792115907730.jpg`, 'public/images/shoes/7-coral.jpg');
fs.copyFileSync(`${brain}/deviate_nitro_blue_1792115930745.jpg`, 'public/images/shoes/7-blue.jpg');
console.log('Product 7 images copied successfully!');
