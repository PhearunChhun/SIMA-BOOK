const fs = require('fs');
const path = require('path');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function inspect() {
  const data = new Uint8Array(fs.readFileSync('The SIMA Journey Book .pdf'));
  console.log('Loaded file buffer, parsing PDF...');
  const loadingTask = pdfjsLib.getDocument({
    data,
    cMapUrl: path.join(__dirname, '../node_modules/pdfjs-dist/cmaps/'),
    cMapPacked: true,
    standardFontDataUrl: path.join(__dirname, '../node_modules/pdfjs-dist/standard_fonts/')
  });

  const pdf = await loadingTask.promise;
  console.log('PDF loaded successfully!');
  console.log('Number of pages:', pdf.numPages);

  const outline = await pdf.getOutline();
  console.log('Outline / Bookmarks:', JSON.stringify(outline, null, 2));

  const metadata = await pdf.getMetadata();
  console.log('Metadata:', JSON.stringify(metadata, null, 2));

  // Sample first 15 pages and some middle pages to extract titles and text
  console.log('\n--- Extracting sample pages text ---');
  const samplePages = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20, 50, 100, 150, 200, 250, 254];
  for (const pageNum of samplePages) {
    if (pageNum > pdf.numPages) continue;
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();
    const strings = textContent.items.map(item => item.str).filter(s => s.trim().length > 0);
    console.log(`\nPage ${pageNum} [Size: ${viewport.width}x${viewport.height}]:`);
    console.log(strings.slice(0, 15).join(' '));
  }
}

inspect().catch(err => console.error('Error:', err));
