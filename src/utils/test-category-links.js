const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(b));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function testCategoryLinks() {
  const catsRes = await get('http://localhost:5000/api/categories');
  console.log(`Kiểm tra ${catsRes.data.length} danh mục:`);
  for (const cat of catsRes.data) {
    const prodsRes = await get(`http://localhost:5000/api/products?category=${cat._id}`);
    console.log(`- Danh mục: "${cat.name}" (${cat.slug}) | ID: ${cat._id}`);
    console.log(`  Ảnh: ${cat.image}`);
    console.log(`  Mô tả/Tagline: "${cat.description}"`);
    console.log(`  Link đích: /products.html?category=${cat._id}`);
    console.log(`  Số sản phẩm tìm thấy: ${prodsRes.data ? prodsRes.data.length : 0}`);
  }
}

testCategoryLinks();
