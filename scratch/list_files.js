const fs = require('fs');
const path = require('path');

const dir = 'public/images/shoes';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jpg'));

console.log(`Total files: ${files.length}`);
files.sort((a,b) => {
  const numA = parseInt(a);
  const numB = parseInt(b);
  if (numA !== numB) return numA - numB;
  return a.localeCompare(b);
});
console.log(files.join(', '));
