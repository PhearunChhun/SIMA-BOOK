const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function extractFullBook() {
  console.log('Opening The SIMA Journey Book .pdf...');
  const data = new Uint8Array(fs.readFileSync('The SIMA Journey Book .pdf'));
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const numSpreads = pdf.numPages;
  console.log(`Extracting data across ${numSpreads} spreads (508 pages)...`);

  const spreads = [];
  const toc = [];
  const searchIndex = [];

  let currentPart = 'Introduction';
  let currentChapter = '';

  for (let s = 1; s <= numSpreads; s++) {
    const page = await pdf.getPage(s);
    const tc = await page.getTextContent();
    
    // Sort items by vertical position descending (top to bottom), then horizontal (left to right)
    const items = tc.items.map(item => ({
      str: item.str,
      x: item.transform[4],
      y: item.transform[5],
      width: item.width,
      height: item.height,
      fontName: item.fontName
    }));

    // Split items into Left page (x < 432) and Right page (x >= 432)
    // Spread width is 864, height is 648
    const leftItems = items.filter(it => it.x < 432);
    const rightItems = items.filter(it => it.x >= 432);

    const leftText = leftItems.map(it => it.str).join(' ').replace(/\s+/g, ' ').trim();
    const rightText = rightItems.map(it => it.str).join(' ').replace(/\s+/g, ' ').trim();
    const fullText = (leftText + ' ' + rightText).trim();

    const bookPageLeft = (s - 1) * 2 + 1;
    const bookPageRight = s * 2;

    // Detect Part headers
    const partMatch = fullText.match(/(PART\s+[I|V|X]+[^.]+?)(?=\s{2,}|\.|\n|$)/i) ||
                      fullText.match(/(The SIMA (?:Story|Ideology|Methodology|Action|Architecture))/i);
    if (partMatch) {
      currentPart = partMatch[1].trim();
    }

    // Detect Chapter headers
    const chapterMatch = fullText.match(/(Chapter\s+\d+[^.]+?)(?=\s{2,}|\.|\n|$)/i);
    const zodiacMatch = fullText.match(/(20\d\d\s*\(Year of the [A-Za-z]+\)[^.]+)/i);

    let title = '';
    if (chapterMatch) {
      currentChapter = chapterMatch[1].trim();
      title = currentChapter;
    } else if (zodiacMatch) {
      title = zodiacMatch[1].trim();
    } else if (s === 1) {
      title = 'Cover & Front Matter';
    } else if (s === 4) {
      title = 'Dedication';
    } else if (s === 6) {
      title = 'Introduction';
    } else if (s === 254) {
      title = 'About the Writer Geoff Dean';
    }

    if (title) {
      toc.push({
        spread: s,
        pageLeft: bookPageLeft,
        pageRight: bookPageRight,
        part: currentPart,
        title: title
      });
    }

    spreads.push({
      spread: s,
      pageLeft: bookPageLeft,
      pageRight: bookPageRight,
      hasText: fullText.length > 0,
      title: title || (currentChapter ? `${currentChapter} (cont.)` : `Spread ${s}`)
    });

    // Add to search index if has meaningful text
    if (fullText.length > 10) {
      searchIndex.push({
        spread: s,
        pageLeft: bookPageLeft,
        pageRight: bookPageRight,
        title: title || currentChapter || `Pages ${bookPageLeft}-${bookPageRight}`,
        text: fullText
      });
    }

    if (s % 50 === 0 || s === numSpreads) {
      console.log(`Processed spread ${s} / ${numSpreads}...`);
    }
  }

  const bookData = {
    title: 'The SIMA Journey',
    subtitle: 'Innovation through Technology: The Story and Philosophy of VP.Start',
    writer: 'Geoff Dean',
    totalSpreads: numSpreads,
    totalPages: numSpreads * 2,
    dimensions: {
      spreadWidth: 864,
      spreadHeight: 648,
      pageWidth: 432,
      pageHeight: 648,
      aspectRatio: 4 / 3
    },
    toc,
    spreads,
    searchIndex
  };

  fs.writeFileSync('book_data.json', JSON.stringify(bookData, null, 2));
  console.log('Saved book_data.json successfully!');
  console.log(`TOC items: ${toc.length}`);
  console.log(`Searchable spreads: ${searchIndex.length}`);
}

extractFullBook().catch(console.error);
