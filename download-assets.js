const fs = require('fs');
const https = require('https');

const images = [
  {
    url: 'https://file-s.s3.bitiful.net/file/ca1e204d805170d554a93.png',
    dest: 'public/images/secondme-logo.png'
  },
  {
    url: 'https://file-s.s3.bitiful.net/file/206979567958999813529.jpg',
    dest: 'public/images/towow-logo.png'
  }
];

const downloadImage = (url, dest) => {
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://www.google.com/' 
    }
  };

  const file = fs.createWriteStream(dest);
  https.get(url, options, (response) => {
    if (response.statusCode !== 200) {
      console.error(`Failed to download ${url}: Status Code ${response.statusCode}`);
      return;
    }
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${dest}`);
    });
  }).on('error', (err) => {
    fs.unlink(dest, () => {});
    console.error(`Error downloading ${url}: ${err.message}`);
  });
};

if (!fs.existsSync('public/images')) {
  fs.mkdirSync('public/images', { recursive: true });
}

images.forEach(img => downloadImage(img.url, img.dest));
