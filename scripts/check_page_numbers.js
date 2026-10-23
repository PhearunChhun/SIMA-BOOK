const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function check() {
  const data = new Uint8Array(fs.readFileSync('The SIMA Journey Book .pdf'));
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  console.log('Total PDF pages:', pdf.numPages);

  const sample = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 50, 100, 127, 128, 129, 200, 250, 254];
  for (const i of sample) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    const str = tc.items.map(x => x.str).join(' ').replace(/\s+/g, ' ').trim();
    const bottomItems = tc.items.filter(x => x.transform[5] < 60);
    const bottomText = bottomItems.map(x => x.str).join(' ').trim();
    console.log(`PDF Page ${i}: [Bottom: "${bottomText}"] ${str.slice(0, 100)}...`);
  }
}
check().catch(console.error);
