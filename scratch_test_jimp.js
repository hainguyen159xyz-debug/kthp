const Jimp = require('jimp');

async function processImage() {
  const image = await Jimp.read('test_download.jpg');
  const width = image.bitmap.width;
  const height = image.bitmap.height;

  // Use BFS flood fill from outside borders (top, bottom, left, right edges)
  const visited = new Uint8Array(width * height);
  const queue = [];

  // Corner sample
  const bgR = image.bitmap.data[0];
  const bgG = image.bitmap.data[1];
  const bgB = image.bitmap.data[2];

  function isBg(x, y) {
    const idx = (y * width + x) * 4;
    const r = image.bitmap.data[idx];
    const g = image.bitmap.data[idx + 1];
    const b = image.bitmap.data[idx + 2];
    
    // Distance from background sample color or close to light gray/white
    const d = Math.hypot(r - bgR, g - bgG, b - bgB);
    return d < 35 || (r > 220 && g > 220 && b > 220 && Math.abs(r - g) < 15 && Math.abs(g - b) < 15);
  }

  // Seed all border pixels that match background
  for (let x = 0; x < width; x++) {
    if (isBg(x, 0)) { queue.push((0 * width) + x); visited[0 * width + x] = 1; }
    if (isBg(x, height - 1)) { queue.push(((height - 1) * width) + x); visited[(height - 1) * width + x] = 1; }
  }
  for (let y = 0; y < height; y++) {
    if (isBg(0, y)) { queue.push((y * width) + 0); visited[y * width + 0] = 1; }
    if (isBg(width - 1, y)) { queue.push((y * width) + (width - 1)); visited[y * width + (width - 1)] = 1; }
  }

  let head = 0;
  while (head < queue.length) {
    const pos = queue[head++];
    const cx = pos % width;
    const cy = Math.floor(pos / width);

    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1]
    ];

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

  // Set all visited pixels to pure solid white #FFFFFF
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

  console.log('Shoe bounding box:', { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY });

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

  await canvas.writeAsync('test_processed_bfs.jpg');
  console.log('Wrote test_processed_bfs.jpg!');
}

processImage().catch(console.error);
