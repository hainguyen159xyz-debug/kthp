async function main() {
  const res = await fetch('http://localhost:5000/api/products?limit=50');
  const json = await res.json();
  const prods = json.data;
  console.log(`Fetched ${prods.length} products from API`);
  
  let validCount = 0;
  for (const p of prods) {
    const cvs = p.colorVariants || [];
    const imgs = cvs.map(c => c.image);
    const uniqueImgs = new Set(imgs);
    
    if (cvs.length < 2) {
      console.error(`FAIL: ${p.name} has only ${cvs.length} colors`);
    } else if (uniqueImgs.size !== cvs.length) {
      console.error(`FAIL: ${p.name} has duplicate images: ${imgs.join(', ')}`);
    } else {
      validCount++;
    }
  }

  console.log(`Result: ${validCount} / ${prods.length} products perfectly configured with 2-3 unique colorways!`);
}

main().catch(console.error);
