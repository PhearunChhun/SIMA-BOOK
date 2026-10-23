# The SIMA Journey — Interactive 3D Digital Flipbook

> **"Innovation through Technology: The Story and Philosophy of VP.Start"**  
> *Written by Geoff Dean • Featuring the Vision of Founder & CEO Phally Phoeurn*

An ultra-premium, interactive 3D digital flipbook built with **HTML5, Vanilla CSS, and modern JavaScript**, powered by **Mozilla PDF.js** and **StPageFlip**.

---

## 🌟 Key Highlights & Features

### 📖 Authentic 3D Book & Dual Reading Modes
1. **Mode 1: 3D Flip Book (Physics Page Curl)**
   - Authentic paper curl physics with dynamic shading, page bending curvature, spine shadow, and interactive corner peeling.
   - Turn pages naturally with mouse dragging, touching, clicking floating navigation arrows, or using keyboard controls.
   - Procedural paper rustle sound effect generated in real-time via the **Web Audio API** (zero external audio dependencies, instant acoustic feedback).
2. **Mode 2: Cinema Widescreen Spread & Deep Zoom**
   - View full original 4:3 two-page spreads (864×648 master resolution).
   - Dynamic 3D flip card transition between spreads.
   - **Deep Zoom Controls**: Smooth zoom from 100% up to 300% with intuitive drag-to-pan, ideal for inspecting fine schematic diagrams, DRC architectures, and formula details.

### ⚡ Instant Streaming with HTTP 206 Partial Content
- Even though the master high-resolution PDF is **226 MB (508 pages / 254 spreads)**, the application starts **in under a second**.
- Custom Node.js streaming server implements `Accept-Ranges: bytes` partial content streaming.
- PDF.js downloads only the specific byte ranges required for the currently visible pages, ensuring minimal memory footprint (~60MB RAM) and zero startup lag.

### 🔍 Live Instant Full-Text Search
- Pre-indexed search engine covering all 508 pages.
- Real-time search with highlighted `<mark>` snippets, match counters, and 1-click jump.
- Popular one-tap search chips for key themes: `Phally`, `DRC`, `EDC`, `SCADA`, `Cambodia`, `Angkorian`, `Einstein`, `IoT`.

### 📑 Interactive Table of Contents Drawer
- Structured across all 4 core pillars of the SIMA philosophy:
  - **Prologue & Dedication** (Spreads 1–6)
  - **Zodiac Timeline Journey 2014–2026** (Spreads 7–15: Horse, Goat, Monkey, Rooster, Dog, Pig, Rat, Ox, Tiger, Rabbit, Dragon, Snake, Horse)
  - **Part I: The SIMA Story** (Spreads 16–79: 12 Chapters)
  - **Part II: The SIMA Ideology** (Spreads 80–141: Innovation, Big Picture, Idea-Driven, Data-Driven, Rule-Breaking)
  - **Part III: The SIMA Methodology** (Spreads 142–199: Agile pivots, Teamwork, Branding, Cybersecurity)
  - **Part IV: The SIMA Action & Architecture** (Spreads 200–253: Ecosolutions, DRC, SCADA, Hardware-to-Software)
  - **Epilogue**: About Writer Geoff Dean (Spread 254)
- Tabbed filters for instant category browsing and direct spread jump.

### 🖼️ Visual Thumbnail Grid & 🔖 Bookmarks System
- Responsive gallery drawer displaying all 254 spreads with lazy-rendered thumbnails.
- LocalStorage-backed bookmarking system allowing readers to star and organize key passages.

### 🎨 4 Curated Ambient Reading Themes
1. **Executive Obsidian**: Deep midnight slate with gilded amber accents and frosted glassmorphism.
2. **Teak & Parchment**: Antique Cambodian hardwood desk and warm cream paper aesthetic.
3. **Gallery Editorial**: Crisp contemporary minimalist art-book layout.
4. **Cyber Grid**: Electric cyan and smart grid telemetry aesthetic honoring VP.Start's DRC technology.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>→</kbd> / <kbd>Space</kbd> / <kbd>PageDown</kbd> | Next Page / Spread |
| <kbd>←</kbd> / <kbd>Shift+Space</kbd> / <kbd>PageUp</kbd> | Previous Page / Spread |
| <kbd>Home</kbd> / <kbd>End</kbd> | First / Last Page |
| <kbd>Z</kbd> | Toggle 3D Flip Book vs Cinema Spread Mode |
| <kbd>F</kbd> | Toggle Fullscreen |
| <kbd>M</kbd> | Toggle Page Flip Sound Effect |
| <kbd>T</kbd> | Open / Close Table of Contents |
| <kbd>S</kbd> | Open / Close Live Search |
| <kbd>G</kbd> | Open / Close Thumbnail Grid |
| <kbd>B</kbd> | Bookmark Current Page |
| <kbd>+</kbd> / <kbd>-</kbd> / <kbd>0</kbd> | Zoom In / Zoom Out / Reset Zoom (Spread Mode) |
| <kbd>?</kbd> | Show Keyboard Shortcuts Help Modal |
| <kbd>Esc</kbd> | Close Open Drawers or Modals |

---

## 🚀 How to Run Locally

### 1. Start the Streaming Server
```bash
node server.js
```
*(or run `npm start` / `npm run dev`)*

### 2. Open in Browser
Visit:
```
http://localhost:3000
```

The application is completely self-contained with offline vendor assets (`lib/pdf.min.js`, `lib/page-flip.browser.js`, `lib/cmaps/`, and `lib/standard_fonts/`).
