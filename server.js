const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const PORT = 3000;
const FOLDER = process.argv[2] || 'public';
const ROOT = path.join(__dirname, FOLDER);

const TYPES = {
  '.js': 'application/javascript; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ttf': 'font/ttf',
  '.css': 'text/css; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon'
};

function canCompress(type) {
  return type.startsWith('text/') || 
         type.startsWith('application/javascript') || 
         type.startsWith('application/json');
}

function cachePolicy(type) {
  if (type.startsWith('image/') || type.startsWith('font/')) {
    return 'public, max-age=86400';
  }
  return 'no-cache';
}

function send(req, res, data, type) {
  const etag = '"' + crypto.createHash('md5').update(data).digest('hex') + '"';
  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, {
      'ETag': etag,
      'Cache-Control': cachePolicy(type)
    });
    res.end();
    return;
  }
  const headers = {
    'Content-Type': type,
    'ETag': etag,
    'Cache-Control': cachePolicy(type)
  };

  const accept = req.headers['accept-encoding'] || '';
  if (data.length < 1024) {
    res.writeHead(200, headers);
    res.end(data);
    return;
  }
  if (canCompress(type) && accept.includes('gzip')) {
    headers['Content-Encoding'] = 'gzip';
    headers['Vary'] = 'Accept-Encoding';
    res.writeHead(200, headers);
    res.end(zlib.gzipSync(data));
    return;
  }
  res.writeHead(200, headers);
  res.end(data);
}

//читаем каталог нижк
const file = path.join(__dirname, 'products.json');
const products = JSON.parse(fs.readFileSync(file, 'utf8'));
console.log('Каталог в памяти: ' + products.length + ' товаров');

const server = http.createServer(function (req, res) {
  const address = new URL(req.url, 'http://localhost');
  
  if (address.pathname === '/api/products') {
    const all = products; //берется из памяти
    
    let search = address.searchParams.get('search') || '';
    search = search.toLowerCase();
    const found = [];
 
    for (let i = 0; i < all.length; i++) {
      if (all[i].name.toLowerCase().includes(search)) {
        found.push(all[i]);
      }
    }
    const page = Number(address.searchParams.get('page')) || 1;
    let limit = Number(address.searchParams.get('limit')) || 20;
    limit = Math.min(limit, 50);
  
    const start = (page - 1) * limit;
    const items = found.slice(start, start + limit);
 
    const answer = {
      items: items,
      total: found.length,
      page: page,
      pages: Math.ceil(found.length / limit)
    };
 
    const body = Buffer.from(JSON.stringify(answer));
    send(req, res, body, 'application/json; charset=utf-8');
    return;
  }

  let pathname = address.pathname;
  if (pathname === '/') {
    pathname = '/index.html';
  }

  const filePath = path.join(ROOT, pathname);
 
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Файл не найден');
    return;
  }
 
  const data = fs.readFileSync(filePath);
  const ext = path.extname(filePath);
  const type = TYPES[ext] || 'text/plain; charset=utf-8';
  
  send(req, res, data, type);
});
 
server.listen(PORT, function () {
  console.log('Открой в браузере: http://localhost:' + PORT);
});