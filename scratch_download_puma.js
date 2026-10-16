const https = require('https');
const fs = require('fs');

const pumaItems = [
  // Product 12: Puma Future 7 Match
  { id: 12, code: '107931', col: '01', ext: '' },
  { id: 12, code: '107931', col: '02', ext: '-white' },
  { id: 12, code: '107931', col: '03', ext: '-blue' },
  // Product 15: Puma King Pro
  { id: 15, code: '108832', col: '01', ext: '' },
  { id: 15, code: '109034', col: '02', ext: '-blue' },
  { id: 15, code: '108832', col: '02', ext: '-red' },
  // Product 21: Puma Fuse 2.0
  { id: 21, code: '378811', col: '02', ext: '' },
  { id: 21, code: '376169', col: '06', ext: '-blue' },
  { id: 21, code: '378811', col: '01', ext: '-orange' },
  // Product 24: Puma Magnify Nitro 2
  { id: 24, code: '376909', col: '01', ext: '' },
  { id: 24, code: '376909', col: '03', ext: '-red' },
  { id: 24, code: '376909', col: '12', ext: '-green' },
  // Product 30: Puma Fast-R Nitro Elite
  { id: 30, code: '380006', col: '01', ext: '' },
  { id: 30, code: '377901', col: '01', ext: '-green' }
];

async function downloadPuma() {
  for (const item of pumaItems) {
    const url = `https://images.puma.com/image/upload/b_rgb:ffffff,w_1000,h_1000/global/${item.code}/${item.col}/sv01/fnd/EEA/fmt/png/shoe`;
    const target = `public/images/shoes/${item.id}${item.ext}.jpg`;
    
    await new Promise((resolve) => {
      https.get(url, (res) => {
        if (res.statusCode === 200) {
          const stream = fs.createWriteStream(target);
          res.pipe(stream);
          stream.on('finish', () => {
            console.log(`[SUCCESS] ${target} (${fs.statSync(target).size} bytes)`);
            resolve();
          });
        } else {
          console.log(`[FAILED ${res.statusCode}] ${target} from ${url}`);
          resolve();
        }
      }).on('error', (e) => {
        console.error(`[ERROR] ${target}:`, e.message);
        resolve();
      });
    });
  }
}

downloadPuma();
