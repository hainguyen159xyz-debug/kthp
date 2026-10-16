const https = require('https');
const fs = require('fs');
const Jimp = require('jimp');

const adidasList = [
  {
    id: 9,
    url: 'https://assets.adidas.com/images/w_800,f_auto,q_auto/08cd4a33b6f645f181ecb19d4fd6cb69_9366/Adizero_Adios_Pro_3_Running_Shoes_White_IG6426_HM1.jpg'
  },
  {
    id: 14,
    url: 'https://assets.adidas.com/images/w_800,f_auto,q_auto/1f976c3527cc4fe6b7599108119380c6_9366/Predator_Elite_Fold-Over_Tongue_Firm_Ground_Soccer_Cleats_David_Beckham_White_KJ4200_22_model.jpg'
  },
  {
    id: 20,
    url: 'https://assets.adidas.com/images/w_800,f_auto,q_auto/2920cc074b4648e38dcb66bb3dc8eace_9366/Giay_Tap_Dropset_4_trang_JR4666_HM1.jpg'
  },
  {
    id: 23,
    url: 'https://assets.adidas.com/images/w_800,f_auto,q_auto/74ee685618424bce99d96b02f02ef318_9366/Giay_Adizero_Boston_12_trang_JQ2554_HM1.jpg'
  },
  {
    id: 26,
    url: 'https://assets.adidas.com/images/w_800,f_auto,q_auto/c6967016cd6a44a9b35caf9000f9ead4_9366/NMD_R1_Shoes_White_HQ4463_012_hover_standard.jpg'
  }
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        const stream = fs.createWriteStream(dest);
        res.pipe(stream);
        stream.on('finish', resolve);
      } else {
        reject(new Error(`Status ${res.statusCode} for ${url}`));
      }
    }).on('error', reject);
  });
}

async function processToStudioWhite(srcPath, destPath) {
  const image = await Jimp.read(srcPath);
  const width = image.bitmap.width;
  const height = image.bitmap.height;

  const visited = new Uint8Array(width * height);
  const queue = [];

  const bgR = image.bitmap.data[0];
  const bgG = image.bitmap.data[1];
  const bgB = image.bitmap.data[2];

  function isBg(x, y) {
    const idx = (y * width + x) * 4;
    const r = image.bitmap.data[idx];
    const g = image.bitmap.data[idx + 1];
    const b = image.bitmap.data[idx + 2];
    const d = Math.hypot(r - bgR, g - bgG, b - bgB);
    return d < 35 || (r > 220 && g > 220 && b > 220 && Math.abs(r - g) < 15 && Math.abs(g - b) < 15);
  }

  for (let x = 0; x < width; x++) {
    if (isBg(x, 0)) { queue.push(x); visited[x] = 1; }
    if (isBg(x, height - 1)) { queue.push((height - 1) * width + x); visited[(height - 1) * width + x] = 1; }
  }
  for (let y = 0; y < height; y++) {
    if (isBg(0, y)) { queue.push(y * width); visited[y * width] = 1; }
    if (isBg(width - 1, y)) { queue.push(y * width + (width - 1)); visited[y * width + (width - 1)] = 1; }
  }

  let head = 0;
  while (head < queue.length) {
    const pos = queue[head++];
    const cx = pos % width;
    const cy = Math.floor(pos / width);

    const neighbors = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const npos = ny * width + nx;
        if (!visited[npos] && isBg(nx, ny)) {
          visited[npos] = 1;
          queue.push(npos);
        }
      }
    }
  }

  let minX = width, minY = height, maxX = 0, maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const npos = y * width + x;
      if (visited[npos]) {
        image.bitmap.data[idx] = 255;
        image.bitmap.data[idx + 1] = 255;
        image.bitmap.data[idx + 2] = 255;
      } else {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const shoeW = maxX - minX;
  const shoeH = maxY - minY;
  const shoeCrop = image.clone().crop(minX, minY, shoeW, shoeH);

  const canvas = new Jimp(1000, 1000, 0xFFFFFFFF);
  const targetW = 860;
  const scale = targetW / shoeW;
  const targetH = Math.round(shoeH * scale);
  shoeCrop.resize(targetW, targetH);

  const posX = Math.round((1000 - targetW) / 2);
  const posY = Math.round((1000 - targetH) / 2);
  canvas.composite(shoeCrop, posX, posY);

  await canvas.writeAsync(destPath);
  console.log(`Successfully generated studio white image: ${destPath}`);
}

async function run() {
  for (const item of adidasList) {
    const tmp = `temp_adidas_${item.id}.jpg`;
    const target = `public/images/shoes/${item.id}.jpg`;
    try {
      await download(item.url, tmp);
      await processToStudioWhite(tmp, target);
      fs.unlinkSync(tmp);
    } catch (e) {
      console.error(`Error processing Adidas ${item.id}:`, e.message);
    }
  }
}

run();
