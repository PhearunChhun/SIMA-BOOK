const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function findChapters() {
  const data = new Uint8Array(fs.readFileSync('The SIMA Journey Book .pdf'));
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  console.log(`Searching across ${pdf.numPages} spreads...`);
  const chapters = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    const str = tc.items.map(x => x.str).join(' ');
    
    // Look for Chapter or Part or Section headers
    const chapterMatch = str.match(/(Chapter\s+\d+[^.]+?)(?=\s{2,}|\.|\n|$)/i);
    const simaMatch = str.match(/(The SIMA [A-Za-z]+)/i);
    const yearMatch = str.match(/(20\d\d\s*\(Year of the [A-Za-z]+\))/i);
    
    const pageNumMatch = str.match(/(\d+)\s+(\d+)\s*$/);
    
    if (chapterMatch || yearMatch || i === 1 || i === 4 || i === 6 || i === 20 || i === pdf.numPages) {
      chapters.push({
        spread: i,
        bookPages: pageNumMatch ? `${pageNumMatch[1]}-${pageNumMatch[2]}` : `Spread ${i}`,
        chapter: chapterMatch ? chapterMatch[1].trim() : '',
        sima: simaMatch ? simaMatch[1].trim() : '',
        year: yearMatch ? yearMatch[1].trim() : '',
        preview: str.slice(0, 120).trim()
      });
    }
  }

  fs.writeFileSync('scripts/book_outline.json', JSON.stringify(chapters, null, 2));
  console.log(`Found ${chapters.length} chapter/milestone markers!`);
  chapters.slice(0, 30).forEach(c => console.log(`Spread ${c.spread} (p.${c.bookPages}): ${c.chapter || c.year || c.preview.slice(0, 40)}`));
}

findChapters().catch(console.error);
