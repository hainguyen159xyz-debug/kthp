const Jimp = require('jimp');
const fs = require('fs');

async function checkAll() {
  console.log('=== CHECKING ALL 30 PRODUCTS FOR PURE WHITE BACKGROUND ===');
  let allPass = true;

  for (let i = 1; i <= 30; i++) {
    const p = `public/images/shoes/${i}.jpg`;
    if (!fs.existsSync(p)) {
      console.log(`[P${i}] ERROR: File not found ${p}`);
      allPass = false;
      continue;
    }

    try {
      const img = await Jimp.read(p);
      const w = img.bitmap.width;
      const h = img.bitmap.height;

      // Sample 4 corners
      const c1 = Jimp.intToRGBA(img.getPixelColor(10, 10));
      const c2 = Jimp.intToRGBA(img.getPixelColor(w - 10, 10));
      const c3 = Jimp.intToRGBA(img.getPixelColor(10, h - 10));
      const c4 = Jimp.intToRGBA(img.getPixelColor(w - 10, h - 10));

      const isWhite = (c) => c.r >= 250 && c.g >= 250 && c.b >= 250;
      const cornerPass = isWhite(c1) && isWhite(c2) && isWhite(c3) && isWhite(c4);

      if (cornerPass) {
        console.log(`[P${i}] OK: ${w}x${h}, corners white (R:${c1.r}, G:${c1.g}, B:${c1.b})`);
      } else {
        console.log(`[P${i}] FAIL: corners not white -> TL(${c1.r},${c1.g},${c1.b}) TR(${c2.r},${c2.g},${c2.b})`);
        allPass = false;
      }
    } catch (e) {
      console.log(`[P${i}] ERROR reading ${p}:`, e.message);
      allPass = false;
    }
  }

  console.log('=== OVERALL RESULT:', allPass ? 'ALL 30 PRODUCTS PASS PURE WHITE BACKGROUND!' : 'SOME FAILED' );
}

checkAll();
