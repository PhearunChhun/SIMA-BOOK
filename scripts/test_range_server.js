const http = require('http');
const fs = require('fs');
const path = require('path');

const filePath = path.resolve('The SIMA Journey Book .pdf');
const stat = fs.statSync(filePath);
const totalSize = stat.size;

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Accept-Ranges', 'bytes');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const range = req.headers.range;
  if (!range) {
    res.writeHead(200, {
      'Content-Length': totalSize,
      'Content-Type': 'application/pdf',
    });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  const parts = range.replace(/bytes=/, '').split('-');
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
  const chunksize = (end - start) + 1;

  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${totalSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunksize,
    'Content-Type': 'application/pdf',
  });
  fs.createReadStream(filePath, { start, end }).pipe(res);
});

server.listen(4567, () => {
  console.log('Range server listening on port 4567');
  
  // Test range request
  const testReq = http.request({
    host: 'localhost',
    port: 4567,
    headers: { Range: 'bytes=0-100' }
  }, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers['content-range']);
    let len = 0;
    res.on('data', chunk => len += chunk.length);
    res.on('end', () => {
      console.log('Received chunk size:', len);
      server.close();
    });
  });
  testReq.end();
});
