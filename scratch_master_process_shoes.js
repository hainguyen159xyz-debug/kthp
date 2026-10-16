const Jimp = require('jimp');
const fs = require('fs');

async function centerOnWhite(srcPath, destPath, targetW = 860) {
  const image = await Jimp.read(srcPath);
  const w = image.bitmap.width;
  const h = image.bitmap.height;

  // Find bounding box of non-white / non-transparent pixels
  let minX = w, minY = h, maxX = 0, maxY = 0;
  
  image.scan(0, 0, w, h, (x, y, idx) => {
    const a = image.bitmap.data[idx + 3];
    const r = image.bitmap.data[idx];
    const g = image.bitmap.data[idx + 1];
    const b = image.bitmap.data[idx + 2];

    // If opaque and not almost white background
    if (a > 20 && !(r > 248 && g > 248 && b > 248)) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  });

  if (minX >= maxX || minY >= maxY) {
    minX = 0; minY = 0; maxX = w; maxY = h;
  }

  const cropW = maxX - minX;
  const cropH = maxY - minY;
  const cropped = image.clone().crop(minX, minY, cropW, cropH);

  const canvas = new Jimp(1000, 1000, 0xFFFFFFFF);
  const scale = targetW / cropW;
  const finalH = Math.min(Math.round(cropH * scale), 860);
  cropped.resize(targetW, finalH);

  const posX = Math.round((1000 - targetW) / 2);
  const posY = Math.round((1000 - finalH) / 2);
  canvas.composite(cropped, posX, posY);

  await canvas.writeAsync(destPath);
  console.log(`[DONE] ${destPath}`);
}

async function processBFS(srcPath, destPath, targetW = 860) {
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
  const scale = targetW / shoeW;
  const targetH = Math.round(shoeH * scale);
  shoeCrop.resize(targetW, targetH);

  const posX = Math.round((1000 - targetW) / 2);
  const posY = Math.round((1000 - targetH) / 2);
  canvas.composite(shoeCrop, posX, posY);

  await canvas.writeAsync(destPath);
  console.log(`[DONE BFS] ${destPath}`);
}

async function createColorVariant(basePath, destPath, hueShiftDeg, satMultiplier = 1) {
  const image = await Jimp.read(basePath);
  const w = image.bitmap.width;
  const h = image.bitmap.height;

  image.scan(0, 0, w, h, (x, y, idx) => {
    const r = image.bitmap.data[idx];
    const g = image.bitmap.data[idx + 1];
    const b = image.bitmap.data[idx + 2];

    // Only modify foreground shoe pixels, leave pure white (#FFFFFF) completely untouched!
    if (!(r >= 250 && g >= 250 && b >= 250)) {
      // Convert RGB to HSL
      const rn = r / 255, gn = g / 255, bn = b / 255;
      const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
      let hue, sat, lum = (max + min) / 2;

      if (max === min) {
        hue = sat = 0;
      } else {
        const d = max - min;
        sat = lum > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case rn: hue = (gn - bn) / d + (gn < bn ? 6 : 0); break;
          case gn: hue = (bn - rn) / d + 2; break;
          case bn: hue = (rn - gn) / d + 4; break;
        }
        hue /= 6;
      }

      // Apply hue shift
      hue = (hue + hueShiftDeg / 360) % 1;
      if (hue < 0) hue += 1;
      sat = Math.min(1, Math.max(0, sat * satMultiplier));

      // Convert HSL back to RGB
      function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      }

      let rout, gout, bout;
      if (sat === 0) {
        rout = gout = bout = lum;
      } else {
        const q = lum < 0.5 ? lum * (1 + sat) : lum + sat - lum * sat;
        const p = 2 * lum - q;
        rout = hue2rgb(p, q, hue + 1/3);
        gout = hue2rgb(p, q, hue);
        bout = hue2rgb(p, q, hue - 1/3);
      }

      image.bitmap.data[idx] = Math.round(rout * 255);
      image.bitmap.data[idx + 1] = Math.round(gout * 255);
      image.bitmap.data[idx + 2] = Math.round(bout * 255);
    }
  });

  await image.writeAsync(destPath);
  console.log(`[VARIANT DONE] ${destPath}`);
}

async function main() {
  console.log('--- STARTING MASTER SHOE PROCESSING ---');

  // 1. Product 13: Nike Mercurial Superfly 9 Academy
  if (fs.existsSync('test_unisport_superfly.jpg')) {
    const uniImg = await Jimp.read('test_unisport_superfly.jpg');
    // Top shoe is in y: 80 to 520, x: 20 to 980
    const topShoe = uniImg.clone().crop(30, 90, 940, 440);
    const canvas = new Jimp(1000, 1000, 0xFFFFFFFF);
    topShoe.resize(850, Jimp.AUTO);
    canvas.composite(topShoe, 75, Math.round((1000 - topShoe.bitmap.height) / 2));
    await canvas.writeAsync('public/images/shoes/13.jpg');
    console.log('[DONE] public/images/shoes/13.jpg');

    // Create 13-blue and 13-yellow variants with pure white background
    await createColorVariant('public/images/shoes/13.jpg', 'public/images/shoes/13-blue.jpg', 180, 1.1);
    await createColorVariant('public/images/shoes/13.jpg', 'public/images/shoes/13-yellow.jpg', 60, 1.2);
  }

  // 2. Product 16: Nike Giannis Freak 5
  if (fs.existsSync('test_freak5.png')) {
    await centerOnWhite('test_freak5.png', 'public/images/shoes/16.jpg', 840);
    await createColorVariant('public/images/shoes/16.jpg', 'public/images/shoes/16-purple.jpg', 90, 1.1);
    await createColorVariant('public/images/shoes/16.jpg', 'public/images/shoes/16-green.jpg', 220, 1.2);
  }

  // 3. Product 17: Adidas Dame 8 EXTPLY
  if (fs.existsSync('test_dame8_real.jpg')) {
    await processBFS('test_dame8_real.jpg', 'public/images/shoes/17.jpg', 840);
    await createColorVariant('public/images/shoes/17.jpg', 'public/images/shoes/17-aqua.jpg', 190, 1.2);
    await createColorVariant('public/images/shoes/17.jpg', 'public/images/shoes/17-red.jpg', 340, 1.3);
  }

  // 4. Product 19: Nike Metcon 9 Training
  const pastMetcon = 'C:/Users/Admin/.gemini/antigravity-ide/brain/11de91f0-c27f-47f3-8b02-1a3b59d7b052/nike_metcon_workout_1791967957281.jpg';
  if (fs.existsSync(pastMetcon)) {
    await centerOnWhite(pastMetcon, 'public/images/shoes/19.jpg', 850);
    await createColorVariant('public/images/shoes/19.jpg', 'public/images/shoes/19-blue.jpg', 200, 1.2);
    await createColorVariant('public/images/shoes/19.jpg', 'public/images/shoes/19-green.jpg', 110, 1.1);
  }

  // 5. Product 22: Nike Invincible 3 Max Cushion
  if (fs.existsSync('test_invincible3.png')) {
    await centerOnWhite('test_invincible3.png', 'public/images/shoes/22.jpg', 850);
    await createColorVariant('public/images/shoes/22.jpg', 'public/images/shoes/22-teal.jpg', 160, 1.1);
    await createColorVariant('public/images/shoes/22.jpg', 'public/images/shoes/22-pink.jpg', 300, 1.2);
  }

  // 6. Product 25: Nike Air Max 270 Lifestyle
  if (fs.existsSync('test_nike_270.png')) {
    await centerOnWhite('test_nike_270.png', 'public/images/shoes/25.jpg', 850);
    await createColorVariant('public/images/shoes/25.jpg', 'public/images/shoes/25-blue.jpg', 210, 1.2);
    await createColorVariant('public/images/shoes/25.jpg', 'public/images/shoes/25-orange.jpg', 30, 1.3);
  }

  // 7. Product 28: Nike InfinityRN 4 Flyknit
  if (fs.existsSync('test_infinityrn4.png')) {
    await centerOnWhite('test_infinityrn4.png', 'public/images/shoes/28.jpg', 850);
    await createColorVariant('public/images/shoes/28.jpg', 'public/images/shoes/28-teal.jpg', 170, 1.1);
    await createColorVariant('public/images/shoes/28.jpg', 'public/images/shoes/28-amber.jpg', 40, 1.2);
  }

  // 8. Product 29: Adidas Supernova Rise Dreamstrike
  if (fs.existsSync('test_jq0524.png')) {
    await centerOnWhite('test_jq0524.png', 'public/images/shoes/29.jpg', 850);
  }
  if (fs.existsSync('test_ih2504.png')) {
    await centerOnWhite('test_ih2504.png', 'public/images/shoes/29-orange.jpg', 850);
    await createColorVariant('public/images/shoes/29.jpg', 'public/images/shoes/29-green.jpg', 100, 1.1);
  }

  // 9. Product 30: Puma Fast-R Nitro Elite Carbon
  if (fs.existsSync('public/images/shoes/30-green.jpg')) {
    fs.copyFileSync('public/images/shoes/30-green.jpg', 'public/images/shoes/30.jpg');
    await createColorVariant('public/images/shoes/30.jpg', 'public/images/shoes/30-blue.jpg', 200, 1.2);
  }

  // 10. Product 9 variants (Adidas Adizero Adios Pro 3)
  if (fs.existsSync('public/images/shoes/9.jpg')) {
    await createColorVariant('public/images/shoes/9.jpg', 'public/images/shoes/9-blue.jpg', 190, 1.2);
    await createColorVariant('public/images/shoes/9.jpg', 'public/images/shoes/9-red.jpg', 330, 1.2);
  }

  // 11. Product 14 variants (Adidas Predator)
  if (fs.existsSync('public/images/shoes/14.jpg')) {
    await createColorVariant('public/images/shoes/14.jpg', 'public/images/shoes/14-purple.jpg', 270, 1.2);
    await createColorVariant('public/images/shoes/14.jpg', 'public/images/shoes/14-green.jpg', 120, 1.2);
  }

  // 12. Product 20 variants (Adidas Dropset 2)
  if (fs.existsSync('public/images/shoes/20.jpg')) {
    await createColorVariant('public/images/shoes/20.jpg', 'public/images/shoes/20-blue.jpg', 210, 1.2);
    await createColorVariant('public/images/shoes/20.jpg', 'public/images/shoes/20-red.jpg', 340, 1.2);
  }

  // 13. Product 23 variants (Adidas Boston 12)
  if (fs.existsSync('public/images/shoes/23.jpg')) {
    await createColorVariant('public/images/shoes/23.jpg', 'public/images/shoes/23-cyan.jpg', 170, 1.2);
    await createColorVariant('public/images/shoes/23.jpg', 'public/images/shoes/23-orange.jpg', 30, 1.2);
  }

  // 14. Product 26 variants (Adidas NMD_R1)
  if (fs.existsSync('public/images/shoes/26.jpg')) {
    await createColorVariant('public/images/shoes/26.jpg', 'public/images/shoes/26-mint.jpg', 160, 1.2);
    await createColorVariant('public/images/shoes/26.jpg', 'public/images/shoes/26-purple.jpg', 280, 1.2);
  }

  console.log('--- ALL PRODUCTS MASTER PROCESSING FINISHED ---');
}

main().catch(console.error);
