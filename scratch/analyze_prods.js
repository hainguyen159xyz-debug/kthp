const prods = require('./products_summary.json');
prods.forEach(p => {
  const cvs = p.colorVariants || [];
  const imgs = cvs.map(cv => cv.image);
  const uniqueImgs = new Set(imgs);
  console.log(`#${p.index} [${p.id}] ${p.name}`);
  console.log(`   Color count: ${cvs.length}, Unique images: ${uniqueImgs.size}`);
  console.log(`   Colors: ${cvs.map(cv => cv.color).join(', ')}`);
  console.log(`   Images: ${imgs.join(', ')}`);
  console.log(`   Variants in DB: ${(p.variantColors||[]).join(', ')}`);
});
