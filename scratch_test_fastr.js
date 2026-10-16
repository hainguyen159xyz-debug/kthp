const https = require('https');
const fs = require('fs');

const codes = ['377901/02', '377901/03', '377082/01', '377082/02', '377082/03', '380006/02'];
codes.forEach(code => {
  https.get('https://images.puma.com/image/upload/b_rgb:ffffff,w_1000,h_1000/global/' + code + '/sv01/fnd/EEA/fmt/png/shoe', (res) => {
    console.log(code, res.statusCode);
    if (res.statusCode === 200) {
      res.pipe(fs.createWriteStream('test_fastr_' + code.replace('/', '_') + '.png'));
    }
  });
});
