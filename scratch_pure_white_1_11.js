const Jimp = require('jimp');
const fs = require('fs');

async function ensurePureWhite(filePath) {
  const image = await Jimp.read(filePath);
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
    return d < 40 || (r >= 225 && g >= 225 && b >= 225 && Math.abs(r - g) < 15 && Math.abs(g - b) < 15);
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

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const npos = y * width + x;
      if (visited[npos]) {
        image.bitmap.data[idx] = 255;
        image.bitmap.data[idx + 1] = 255;
        image.bitmap.data[idx + 2] = 255;
      }
    }
  }

  await image.writeAsync(filePath);
  console.log(`[PURE WHITE APPLIED] ${filePath}`);
}

async function run() {
  const targets = [
    '1.jpg', '1-white.jpg',
    '2.jpg', '2-white.jpg', '2-mint.jpg',
    '3.jpg', '3-blue.jpg', '3-red.jpg',
    '4.jpg', '4-blue.jpg',
    '5.jpg', '5-black.jpg',
    '6.jpg', '6-mint.jpg', '6-lavender.jpg',
    '7.jpg', '7-coral.jpg', '7-blue.jpg',
    '8.jpg', '8-pink.jpg', '8-blue.jpg',
    '10.jpg', '10-black.jpg',
    '11.jpg', '11-black.jpg'
  ];

  for (const f of targets) {
    const p = `public/images/shoes/${f}`;
    if (fs.existsSync(p)) {
      await ensurePureWhite(p);
    }
  }
}

run().catch(console.error);
