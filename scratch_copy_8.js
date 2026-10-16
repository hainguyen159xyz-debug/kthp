const fs = require('fs');
const brain = 'C:/Users/Admin/.gemini/antigravity-ide/brain/26842d50-b0a8-4308-9341-ae2ad0d0970f';

fs.copyFileSync(`${brain}/vaporfly3_white_orange_1792116030912.jpg`, 'public/images/shoes/8.jpg');
fs.copyFileSync(`${brain}/vaporfly3_pink_1792116052502.jpg`, 'public/images/shoes/8-pink.jpg');
fs.copyFileSync(`${brain}/vaporfly3_blue_1792116072286.jpg`, 'public/images/shoes/8-blue.jpg');
console.log('Product 8 images copied successfully!');
