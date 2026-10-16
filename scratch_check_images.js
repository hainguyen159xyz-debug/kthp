const fs = require('fs');

for (let i = 1; i <= 30; i++) {
  const p = 'public/images/shoes/' + i + '.jpg';
  if (fs.existsSync(p)) {
    const stat = fs.statSync(p);
    console.log('Product ' + i + ': size=' + stat.size + ', mtime=' + stat.mtime.toISOString());
  } else {
    console.log('Product ' + i + ': MISSING');
  }
}
