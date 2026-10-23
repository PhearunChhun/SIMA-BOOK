const http = require('http');
const { spawn } = require('child_process');

async function benchmark() {
  console.log('Launching headless Chrome with CDP...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--disable-gpu',
    '--no-sandbox',
    'http://localhost:3000/render_test.html'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  // Fetch /json/list to get websocket debugger URL
  const tabs = await new Promise((resolve, reject) => {
    http.get('http://localhost:9223/json/list', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  console.log('Active Chrome tabs:', tabs.length);
  if (tabs.length > 0) {
    console.log('Target tab URL:', tabs[0].url);
  }

  chrome.kill();
}

benchmark().catch(console.error);
