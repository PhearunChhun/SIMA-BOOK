const fs = require('fs');

const data = JSON.parse(fs.readFileSync('book_data.json', 'utf8'));

// Normalize parts and titles
data.toc.forEach(item => {
  const s = item.spread;
  if (s >= 1 && s <= 6) {
    item.part = 'Prologue & Dedication';
  } else if (s >= 7 && s <= 15) {
    item.part = 'Zodiac Timeline (2014–2026)';
  } else if (s >= 16 && s <= 79) {
    item.part = 'Part I: The SIMA Story';
  } else if (s >= 80 && s <= 141) {
    item.part = 'Part II: The SIMA Ideology';
  } else if (s >= 142 && s <= 199) {
    item.part = 'Part III: The SIMA Methodology';
  } else if (s >= 200 && s <= 253) {
    item.part = 'Part IV: The SIMA Action & Architecture';
  } else if (s >= 254) {
    item.part = 'Epilogue & Bio';
  }

  // Clean title
  item.title = item.title
    .replace(/^Chapter\s+(\d+)\s+The\s+SIMA\s+(?:Story|Ideology|Methodology|Architecture)\s*/i, 'Chapter $1: ')
    .replace(/^Chapter\s+(\d+)\s+SIMA\s+(?:Story|Ideology|Methodology|Amazing Innovations?):\s*/i, 'Chapter $1: ')
    .replace(/^Chapter\s+(\d+)\s+/i, 'Chapter $1: ')
    .replace(/\s+/g, ' ')
    .trim();
});

// Add key milestones if missing
const milestones = [
  { spread: 1, pageLeft: 1, pageRight: 2, part: 'Prologue & Dedication', title: 'Front Cover & Title Page' },
  { spread: 4, pageLeft: 7, pageRight: 8, part: 'Prologue & Dedication', title: 'Dedication: To Dreamers & Innovators' },
  { spread: 6, pageLeft: 11, pageRight: 12, part: 'Prologue & Dedication', title: 'Introduction: The Spirit of VP.Start' },
  { spread: 7, pageLeft: 13, pageRight: 14, part: 'Zodiac Timeline (2014–2026)', title: '2014 (Horse) & 2015 (Goat): In The Beginning' },
  { spread: 8, pageLeft: 15, pageRight: 16, part: 'Zodiac Timeline (2014–2026)', title: '2016 (Monkey): The EDC Breakthrough' },
  { spread: 9, pageLeft: 17, pageRight: 18, part: 'Zodiac Timeline (2014–2026)', title: '2017 (Rooster) & 2018 (Dog): Raising the Voice' },
  { spread: 10, pageLeft: 19, pageRight: 20, part: 'Zodiac Timeline (2014–2026)', title: '2019 (Pig): Success & Transformation' },
  { spread: 11, pageLeft: 21, pageRight: 22, part: 'Zodiac Timeline (2014–2026)', title: '2020 (Rat) & 2021 (Ox): Generosity & Resilience' },
  { spread: 12, pageLeft: 23, pageRight: 24, part: 'Zodiac Timeline (2014–2026)', title: '2022 (Tiger): The Sen Sok Campus & IoT Expansion' },
  { spread: 13, pageLeft: 25, pageRight: 26, part: 'Zodiac Timeline (2014–2026)', title: '2023 (Rabbit): Global Outreach & Partnerships' },
  { spread: 14, pageLeft: 27, pageRight: 28, part: 'Zodiac Timeline (2014–2026)', title: '2024 (Dragon) & 2025 (Snake): International Voice' },
  { spread: 15, pageLeft: 29, pageRight: 30, part: 'Zodiac Timeline (2014–2026)', title: '2026 (Horse): The New Angkorian Generation' },
  { spread: 21, pageLeft: 41, pageRight: 42, part: 'Part I: The SIMA Story', title: 'Chapter 1: The Journey of a Thousand Miles Begins' },
  { spread: 27, pageLeft: 53, pageRight: 54, part: 'Part I: The SIMA Story', title: 'Chapter 2: Learning to Learn in the SIMA Way' },
  { spread: 29, pageLeft: 57, pageRight: 58, part: 'Part I: The SIMA Story', title: 'Chapter 3: Engineering the SIMA Revolution' },
  { spread: 34, pageLeft: 67, pageRight: 68, part: 'Part I: The SIMA Story', title: 'Chapter 4: The Birth of a Company, the Rebirth of a CEO' },
  { spread: 37, pageLeft: 73, pageRight: 74, part: 'Part I: The SIMA Story', title: 'Chapter 5: The Reluctant CEO' },
  { spread: 44, pageLeft: 87, pageRight: 88, part: 'Part I: The SIMA Story', title: 'Chapter 6: The Growing Pains of VP.Start' },
  { spread: 48, pageLeft: 95, pageRight: 96, part: 'Part I: The SIMA Story', title: 'Chapter 7: VP.Start Corporate Culture' },
  { spread: 52, pageLeft: 103, pageRight: 104, part: 'Part I: The SIMA Story', title: 'Chapter 8: The Unbreakable Team' },
  { spread: 60, pageLeft: 119, pageRight: 120, part: 'Part I: The SIMA Story', title: 'Chapter 9: An Ordinary Voice or a SIMA Voice?' },
  { spread: 65, pageLeft: 129, pageRight: 130, part: 'Part I: The SIMA Story', title: 'Chapter 10: Difficulties Along the SIMA Journey' },
  { spread: 68, pageLeft: 135, pageRight: 136, part: 'Part I: The SIMA Story', title: 'Chapter 11: The SIMA Journey to the Global Stage' },
  { spread: 73, pageLeft: 145, pageRight: 146, part: 'Part I: The SIMA Story', title: 'Chapter 12: The SIMA Journey Past, Present and Future' },
  { spread: 80, pageLeft: 159, pageRight: 160, part: 'Part II: The SIMA Ideology', title: 'Chapter 1: Innovation through Technology' },
  { spread: 83, pageLeft: 165, pageRight: 166, part: 'Part II: The SIMA Ideology', title: 'Chapter 2: Remember the Big Picture' },
  { spread: 86, pageLeft: 171, pageRight: 172, part: 'Part II: The SIMA Ideology', title: 'Chapter 3: Idea Driven, Not Product-Driven' },
  { spread: 90, pageLeft: 179, pageRight: 180, part: 'Part II: The SIMA Ideology', title: 'Chapter 4: Data-Driven, Not Feelings-Driven' },
  { spread: 96, pageLeft: 191, pageRight: 192, part: 'Part II: The SIMA Ideology', title: 'Chapter 5: Break the Rules' },
  { spread: 142, pageLeft: 283, pageRight: 284, part: 'Part III: The SIMA Methodology', title: 'Chapter 1: Changing Plans on the Fly' },
  { spread: 146, pageLeft: 291, pageRight: 292, part: 'Part III: The SIMA Methodology', title: 'Chapter 2: The Negative Sales Pitch' },
  { spread: 149, pageLeft: 297, pageRight: 298, part: 'Part III: The SIMA Methodology', title: 'Chapter 3: Smart Teamwork Comes First' },
  { spread: 153, pageLeft: 305, pageRight: 306, part: 'Part III: The SIMA Methodology', title: 'Chapter 4: A Day in the Life of an Innovator' },
  { spread: 157, pageLeft: 313, pageRight: 314, part: 'Part III: The SIMA Methodology', title: 'Chapter 5: Branding is Everything' },
  { spread: 183, pageLeft: 365, pageRight: 366, part: 'Part III: The SIMA Methodology', title: 'Chapter 11: Cybersecurity in an Interconnected World' },
  { spread: 188, pageLeft: 375, pageRight: 376, part: 'Part III: The SIMA Methodology', title: 'Chapter 12: The Time is Now for Mission' },
  { spread: 200, pageLeft: 399, pageRight: 400, part: 'Part IV: The SIMA Action & Architecture', title: 'Chapter 1: The Architecture of Innovation' },
  { spread: 201, pageLeft: 401, pageRight: 402, part: 'Part IV: The SIMA Action & Architecture', title: 'Chapter 2: Ecosolutions for Cambodia' },
  { spread: 206, pageLeft: 411, pageRight: 412, part: 'Part IV: The SIMA Action & Architecture', title: 'Chapter 3: The Overarching Framework' },
  { spread: 211, pageLeft: 421, pageRight: 422, part: 'Part IV: The SIMA Action & Architecture', title: 'Chapter 4: Grid Modernization with DRC & SCADA' },
  { spread: 250, pageLeft: 499, pageRight: 500, part: 'Part IV: The SIMA Action & Architecture', title: 'Chapter 12: The Future of SIMA - Hardware to Software' },
  { spread: 254, pageLeft: 507, pageRight: 508, part: 'Epilogue & Bio', title: 'About the Writer: Geoff Dean' }
];

// Combine and sort
const merged = [];
const seenSpreads = new Set();
milestones.forEach(m => {
  merged.push(m);
  seenSpreads.add(m.spread);
});

data.toc.forEach(t => {
  if (!seenSpreads.has(t.spread)) {
    merged.push(t);
    seenSpreads.add(t.spread);
  }
});

merged.sort((a, b) => a.spread - b.spread);
data.toc = merged;

fs.writeFileSync('book_data.json', JSON.stringify(data, null, 2));
console.log('Normalized TOC with', data.toc.length, 'entries.');
