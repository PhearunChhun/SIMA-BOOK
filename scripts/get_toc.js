const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function getToc() {
  const data = new Uint8Array(fs.readFileSync('The SIMA Journey Book .pdf'));
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  console.log('Pages count:', pdf.numPages);
  for (let i = 1; i <= 35; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    const str = tc.items.map(x => x.str).join(' ').trim();
    if (str) {
      console.log(`=== Page ${i} ===`);
      console.log(str.slice(0, 300));
    }
  }
}
getToc().catch(console.error);
