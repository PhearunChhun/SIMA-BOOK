/**
 * THE SIMA JOURNEY — ULTRA-FAST 3D DIGITAL FLIPBOOK
 * High-performance mobile & desktop engine powered by optimized WebP page assets,
 * StPageFlip physics, procedural audio, instant live search, and touch swipe gestures.
 */

(function () {
  'use strict';

  // --- Global Application State ---
  const state = {
    bookData: null,
    currentSpread: 1, // 1 to 254
    totalSpreads: 254,
    totalPages: 508,
    viewMode: 'flip', // 'flip' or 'spread'
    theme: localStorage.getItem('sima_theme') || 'obsidian',
    soundEnabled: localStorage.getItem('sima_sound') !== 'false',
    bookmarks: JSON.parse(localStorage.getItem('sima_bookmarks') || '[]'),

    // Zoom & Pan for Spread mode
    zoom: 1.0,
    pan: { x: 0, y: 0 },
    isPanning: false,
    panStart: { x: 0, y: 0 },

    // Auto-Play Slideshow
    autoplayActive: false,
    autoplayTimer: null,
    autoplayIntervalMs: 5000,

    // Flipbook instance & audio
    pageFlip: null,
    audioCtx: null,

    // Mobile touch tracking
    touchStartX: 0,
    touchStartY: 0,
    touchStartTime: 0
  };

  // --- DOM Elements Cache ---
  const DOM = {
    app: document.getElementById('app'),
    topNav: document.getElementById('topNav'),
    bottomDock: document.getElementById('bottomDock'),
    readingStage: document.getElementById('readingStage'),
    bookWrapper: document.getElementById('bookWrapper'),
    flipbook: document.getElementById('flipbook'),
    spreadWrapper: document.getElementById('spreadWrapper'),
    spreadViewport: document.getElementById('spreadViewport'),
    spreadCard: document.getElementById('spreadCard'),
    spreadImg: document.getElementById('spreadImg'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingStatusText: document.getElementById('loadingStatusText'),
    loadingProgressBar: document.getElementById('loadingProgressBar'),

    // Nav Buttons
    btnToc: document.getElementById('btnToc'),
    btnSearch: document.getElementById('btnSearch'),
    btnThumbs: document.getElementById('btnThumbs'),
    btnBookmark: document.getElementById('btnBookmark'),
    bookmarkIcon: document.getElementById('bookmarkIcon'),
    btnViewMode: document.getElementById('btnViewMode'),
    viewModeLabel: document.getElementById('viewModeLabel'),
    btnTheme: document.getElementById('btnTheme'),
    themeMenu: document.getElementById('themeMenu'),
    btnAudio: document.getElementById('btnAudio'),
    audioIcon: document.getElementById('audioIcon'),
    btnHelp: document.getElementById('btnHelp'),
    btnFullscreen: document.getElementById('btnFullscreen'),
    fsIcon: document.getElementById('fsIcon'),

    // Stage Nav Arrows
    navPrev: document.getElementById('navPrev'),
    navNext: document.getElementById('navNext'),

    // Dock Controls
    btnFirst: document.getElementById('btnFirst'),
    btnPrevDock: document.getElementById('btnPrevDock'),
    btnNextDock: document.getElementById('btnNextDock'),
    btnLast: document.getElementById('btnLast'),
    pageScrubber: document.getElementById('pageScrubber'),
    scrubberTooltip: document.getElementById('scrubberTooltip'),
    pageIndicator: document.getElementById('pageIndicator'),
    spreadIndicator: document.getElementById('spreadIndicator'),
    currentChapterPill: document.getElementById('currentChapterPill'),
    jumpInput: document.getElementById('jumpInput'),
    btnJumpGo: document.getElementById('btnJumpGo'),
    zoomControls: document.getElementById('zoomControls'),
    btnZoomIn: document.getElementById('btnZoomIn'),
    btnZoomOut: document.getElementById('btnZoomOut'),
    btnZoomReset: document.getElementById('btnZoomReset'),
    zoomLevelText: document.getElementById('zoomLevelText'),
    btnAutoplay: document.getElementById('btnAutoplay'),
    autoplayIcon: document.getElementById('autoplayIcon'),

    // Drawers & Modals
    tocDrawer: document.getElementById('tocDrawer'),
    closeToc: document.getElementById('closeToc'),
    tocList: document.getElementById('tocList'),
    searchDrawer: document.getElementById('searchDrawer'),
    closeSearch: document.getElementById('closeSearch'),
    searchInput: document.getElementById('searchInput'),
    clearSearch: document.getElementById('clearSearch'),
    searchMeta: document.getElementById('searchMeta'),
    searchResultsList: document.getElementById('searchResultsList'),
    thumbsDrawer: document.getElementById('thumbsDrawer'),
    closeThumbs: document.getElementById('closeThumbs'),
    thumbsGrid: document.getElementById('thumbsGrid'),
    bookmarksDrawer: document.getElementById('bookmarksDrawer'),
    closeBookmarks: document.getElementById('closeBookmarks'),
    bookmarksList: document.getElementById('bookmarksList'),
    helpModal: document.getElementById('helpModal'),
    closeHelp: document.getElementById('closeHelp'),
    drawerBackdrop: document.getElementById('drawerBackdrop')
  };

  // --- Procedural Web Audio API Sound Engine ---
  function initAudioContext() {
    if (!state.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        state.audioCtx = new AudioContextClass();
      }
    }
    if (state.audioCtx && state.audioCtx.state === 'suspended') {
      state.audioCtx.resume();
    }
  }

  function playPaperTurnSound() {
    if (!state.soundEnabled) return;
    try {
      initAudioContext();
      if (!state.audioCtx) return;
      const ctx = state.audioCtx;
      const now = ctx.currentTime;

      const bufferSize = Math.floor(ctx.sampleRate * 0.22); // ~220ms
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.07;
        b6 = white * 0.115926;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(380, now);
      filter.frequency.exponentialRampToValueAtTime(1500, now + 0.1);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.22);
      filter.Q.setValueAtTime(1.6, now);

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.35, now + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      whiteNoise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.23);
    } catch (e) {
      // Audio autoplay policy catch
    }
  }

  // --- Theme Management ---
  function applyTheme(themeName) {
    state.theme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('sima_theme', themeName);

    document.querySelectorAll('.theme-opt').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.setTheme === themeName);
    });
  }

  // --- Audio State Toggle ---
  function updateAudioButton() {
    if (state.soundEnabled) {
      DOM.btnAudio.classList.remove('active');
      DOM.audioIcon.innerHTML = `<path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>`;
      DOM.btnAudio.title = "Mute Flip Sound (M)";
    } else {
      DOM.btnAudio.classList.add('active');
      DOM.audioIcon.innerHTML = `<path fill="currentColor" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27l4.01 4.01H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>`;
      DOM.btnAudio.title = "Unmute Flip Sound (M)";
    }
  }

  // --- Bookmark Management ---
  function updateBookmarkButton() {
    const isBookmarked = state.bookmarks.includes(state.currentSpread);
    DOM.btnBookmark.classList.toggle('active', isBookmarked);
    if (isBookmarked) {
      DOM.bookmarkIcon.innerHTML = `<path fill="currentColor" d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3l7 3V5c0-1.1-.9-2-2-2z"/>`;
      DOM.btnBookmark.title = "Remove Bookmark (B)";
    } else {
      DOM.bookmarkIcon.innerHTML = `<path fill="currentColor" d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3l7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z"/>`;
      DOM.btnBookmark.title = "Bookmark Current Page (B)";
    }
  }

  function toggleBookmark() {
    const s = state.currentSpread;
    const idx = state.bookmarks.indexOf(s);
    if (idx > -1) {
      state.bookmarks.splice(idx, 1);
    } else {
      state.bookmarks.push(s);
      state.bookmarks.sort((a, b) => a - b);
    }
    localStorage.setItem('sima_bookmarks', JSON.stringify(state.bookmarks));
    updateBookmarkButton();
    renderBookmarksDrawer();
  }

  function renderBookmarksDrawer() {
    if (state.bookmarks.length === 0) {
      DOM.bookmarksList.innerHTML = `<div class="empty-state">No bookmarks yet. Click the Bookmark icon in the header or press 'B' to save pages!</div>`;
      return;
    }
    DOM.bookmarksList.innerHTML = state.bookmarks.map(spreadNum => {
      const pLeft = (spreadNum - 1) * 2 + 1;
      const pRight = spreadNum * 2;
      const chapter = getChapterForSpread(spreadNum);
      return `
        <div class="bookmark-card" data-jump-spread="${spreadNum}">
          <div class="bookmark-info">
            <span class="bookmark-page">Spread ${spreadNum} (Pages ${pLeft}–${pRight})</span>
            <span class="bookmark-chapter">${chapter}</span>
          </div>
          <button class="bookmark-remove" data-remove-spread="${spreadNum}" title="Delete Bookmark">✕</button>
        </div>
      `;
    }).join('');

    DOM.bookmarksList.querySelectorAll('.bookmark-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.bookmark-remove')) return;
        const targetSpread = parseInt(card.dataset.jumpSpread, 10);
        goToSpread(targetSpread);
        closeAllDrawers();
      });
    });

    DOM.bookmarksList.querySelectorAll('.bookmark-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const removeSpread = parseInt(btn.dataset.removeSpread, 10);
        state.bookmarks = state.bookmarks.filter(x => x !== removeSpread);
        localStorage.setItem('sima_bookmarks', JSON.stringify(state.bookmarks));
        updateBookmarkButton();
        renderBookmarksDrawer();
      });
    });
  }

  // --- Helper: Get Chapter Title for Spread ---
  function getChapterForSpread(spreadNum) {
    if (!state.bookData || !state.bookData.toc) return `Spread ${spreadNum}`;
    let match = state.bookData.toc[0]?.title || `Spread ${spreadNum}`;
    for (const item of state.bookData.toc) {
      if (item.spread <= spreadNum) {
        match = item.title;
      } else {
        break;
      }
    }
    return match;
  }

  // --- Preload Near Images ---
  function preloadNearbyImages(spreadNum) {
    const targets = [spreadNum - 1, spreadNum + 1, spreadNum + 2].filter(s => s >= 1 && s <= state.totalSpreads);
    targets.forEach(s => {
      // Preload spread
      const imgSpread = new Image();
      imgSpread.src = `assets/spreads/spread_${s}.webp`;

      // Preload single pages
      const pL = (s - 1) * 2 + 1;
      const pR = s * 2;
      const imgL = new Image();
      imgL.src = `assets/pages/page_${pL}.webp`;
      const imgR = new Image();
      imgR.src = `assets/pages/page_${pR}.webp`;
    });
  }

  // --- Render Spread in Mode 2 (Cinema Spread View) ---
  function updateSpreadView() {
    if (state.viewMode !== 'spread') return;
    const spreadNum = state.currentSpread;
    const src = `assets/spreads/spread_${spreadNum}.webp`;

    if (DOM.spreadImg.src !== src) {
      DOM.spreadImg.src = src;
    }
    applySpreadZoomAndPan();
    preloadNearbyImages(spreadNum);
  }

  function applySpreadZoomAndPan() {
    DOM.spreadCard.style.transform = `scale(${state.zoom}) translate(${state.pan.x}px, ${state.pan.y}px)`;
    DOM.zoomLevelText.textContent = `${Math.round(state.zoom * 100)}%`;
  }

  // --- UI Synchronizer ---
  function updateUIState() {
    const s = state.currentSpread;
    const pLeft = (s - 1) * 2 + 1;
    const pRight = s * 2;
    const chapter = getChapterForSpread(s);
    const isPortrait = state.viewMode === 'flip' && state.pageFlip && state.pageFlip.getOrientation() === 'portrait';

    // Update Indicators
    if (isPortrait) {
      const pageIdx = state.pageFlip.getCurrentPageIndex();
      const pageNum = pageIdx + 1;
      DOM.pageIndicator.textContent = `Page ${pageNum} of ${state.totalPages}`;
      DOM.spreadIndicator.textContent = `p. ${pageNum}`;
      DOM.scrubberTooltip.textContent = `Page ${pageNum}`;
      DOM.pageScrubber.value = Math.min(state.totalSpreads, Math.floor(pageIdx / 2) + 1);
    } else {
      DOM.pageIndicator.textContent = `Pages ${pLeft}–${pRight} of ${state.totalPages}`;
      DOM.spreadIndicator.textContent = `Spread ${s} of ${state.totalSpreads}`;
      DOM.scrubberTooltip.textContent = `Spread ${s} (p.${pLeft}–${pRight})`;
      DOM.pageScrubber.value = s;
    }

    DOM.currentChapterPill.textContent = chapter;
    DOM.currentChapterPill.title = chapter;

    // Update Nav Buttons
    const canPrev = isPortrait ? state.pageFlip.getCurrentPageIndex() > 0 : s > 1;
    const canNext = isPortrait ? state.pageFlip.getCurrentPageIndex() < state.totalPages - 1 : s < state.totalSpreads;

    DOM.navPrev.disabled = !canPrev;
    DOM.navNext.disabled = !canNext;
    DOM.btnPrevDock.disabled = !canPrev;
    DOM.btnNextDock.disabled = !canNext;
    DOM.btnFirst.disabled = !canPrev;
    DOM.btnLast.disabled = !canNext;

    // Update Active TOC & Thumbs
    document.querySelectorAll('.toc-entry').forEach(el => {
      el.classList.toggle('active', parseInt(el.dataset.spread, 10) === s);
    });
    document.querySelectorAll('.thumb-card').forEach(el => {
      el.classList.toggle('active', parseInt(el.dataset.spread, 10) === s);
    });

    updateBookmarkButton();

    if (state.viewMode === 'spread') {
      updateSpreadView();
    } else {
      preloadNearbyImages(s);
    }
  }

  // --- Navigation Core ---
  function goToSpread(spreadNum, skipFlipAnim = false) {
    if (spreadNum < 1) spreadNum = 1;
    if (spreadNum > state.totalSpreads) spreadNum = state.totalSpreads;

    if (state.currentSpread === spreadNum && !skipFlipAnim) return;

    const prevSpreadNum = state.currentSpread;
    state.currentSpread = spreadNum;
    playPaperTurnSound();

    if (state.viewMode === 'flip' && state.pageFlip) {
      const targetPageIndex = (spreadNum - 1) * 2;
      try {
        if (!skipFlipAnim && spreadNum === prevSpreadNum + 1) {
          state.pageFlip.flipNext('bottom');
        } else if (!skipFlipAnim && spreadNum === prevSpreadNum - 1) {
          state.pageFlip.flipPrev('bottom');
        } else {
          state.pageFlip.turnToPage(targetPageIndex);
        }
      } catch (e) {
        state.pageFlip.turnToPage(targetPageIndex);
      }
    } else if (state.viewMode === 'spread') {
      const card = DOM.spreadCard;
      card.classList.remove('flipping-next', 'flipping-prev');
      void card.offsetWidth;
      if (spreadNum > prevSpreadNum) {
        card.classList.add('flipping-next');
      } else {
        card.classList.add('flipping-prev');
      }
      setTimeout(() => card.classList.remove('flipping-next', 'flipping-prev'), 450);
    }

    updateUIState();
  }

  function nextSpread() {
    if (state.viewMode === 'flip' && state.pageFlip) {
      if (state.pageFlip.getCurrentPageIndex() < state.totalPages - 1) {
        state.pageFlip.flipNext('bottom');
      }
    } else if (state.currentSpread < state.totalSpreads) {
      goToSpread(state.currentSpread + 1);
    }
  }

  function prevSpread() {
    if (state.viewMode === 'flip' && state.pageFlip) {
      if (state.pageFlip.getCurrentPageIndex() > 0) {
        state.pageFlip.flipPrev('bottom');
      }
    } else if (state.currentSpread > 1) {
      goToSpread(state.currentSpread - 1);
    }
  }

  // --- View Mode Toggle (3D Flip vs Cinema Spread) ---
  function setViewMode(mode) {
    state.viewMode = mode;
    if (mode === 'spread') {
      DOM.bookWrapper.style.display = 'none';
      DOM.spreadWrapper.style.display = 'flex';
      DOM.viewModeLabel.textContent = '3D Flip Book';
      DOM.btnViewMode.title = 'Switch to 3D Realistic Flip Book (Z)';
      DOM.zoomControls.style.display = 'flex';
      updateSpreadView();
    } else {
      DOM.spreadWrapper.style.display = 'none';
      DOM.bookWrapper.style.display = 'flex';
      DOM.viewModeLabel.textContent = 'Spread View';
      DOM.btnViewMode.title = 'Switch to Full Spread & Deep Zoom View (Z)';
      DOM.zoomControls.style.display = 'none';
      if (state.pageFlip) {
        state.pageFlip.update();
        state.pageFlip.turnToPage((state.currentSpread - 1) * 2);
      }
      preloadNearbyImages(state.currentSpread);
    }
  }

  // --- Auto-Play Slideshow ---
  function toggleAutoplay() {
    state.autoplayActive = !state.autoplayActive;
    DOM.btnAutoplay.classList.toggle('active', state.autoplayActive);
    if (state.autoplayActive) {
      DOM.autoplayIcon.innerHTML = `<path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`;
      DOM.btnAutoplay.title = "Pause Slideshow";
      state.autoplayTimer = setInterval(() => {
        if (state.currentSpread >= state.totalSpreads) {
          goToSpread(1);
        } else {
          nextSpread();
        }
      }, state.autoplayIntervalMs);
    } else {
      DOM.autoplayIcon.innerHTML = `<path fill="currentColor" d="M8 5v14l11-7z"/>`;
      DOM.btnAutoplay.title = "Auto-Play Slideshow";
      if (state.autoplayTimer) clearInterval(state.autoplayTimer);
    }
  }

  // --- Side Drawers & Modals ---
  function openDrawer(drawerEl) {
    closeAllDrawers();
    drawerEl.classList.add('open');
    DOM.drawerBackdrop.classList.add('show');
  }

  function closeAllDrawers() {
    [DOM.tocDrawer, DOM.searchDrawer, DOM.thumbsDrawer, DOM.bookmarksDrawer].forEach(d => d.classList.remove('open'));
    DOM.helpModal.classList.remove('show');
    DOM.drawerBackdrop.classList.remove('show');
    DOM.themeMenu.classList.remove('show');
  }

  // --- Table of Contents Setup ---
  function initTableOfContents() {
    if (!state.bookData || !state.bookData.toc) return;

    function renderFilteredTOC(filter) {
      const items = state.bookData.toc.filter(item => {
        if (filter === 'all') return true;
        const p = item.part.toLowerCase();
        if (filter === 'timeline') return p.includes('timeline');
        if (filter === 'story') return p.includes('story');
        if (filter === 'ideology') return p.includes('ideology');
        if (filter === 'methodology') return p.includes('methodology');
        if (filter === 'architecture') return p.includes('architecture') || p.includes('action');
        return true;
      });

      let currentPart = '';
      let html = '';

      items.forEach(item => {
        if (item.part !== currentPart) {
          currentPart = item.part;
          html += `<div class="toc-part-header">${currentPart}</div>`;
        }
        const isActive = item.spread === state.currentSpread;
        html += `
          <div class="toc-entry ${isActive ? 'active' : ''}" data-spread="${item.spread}">
            <span class="toc-entry-title">${item.title}</span>
            <span class="toc-entry-badge">p.${item.pageLeft}–${item.pageRight}</span>
          </div>
        `;
      });

      DOM.tocList.innerHTML = html;

      DOM.tocList.querySelectorAll('.toc-entry').forEach(entry => {
        entry.addEventListener('click', () => {
          const spread = parseInt(entry.dataset.spread, 10);
          goToSpread(spread);
          closeAllDrawers();
        });
      });
    }

    renderFilteredTOC('all');

    // Filter Tabs
    document.querySelectorAll('.toc-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.toc-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderFilteredTOC(tab.dataset.filter);
      });
    });
  }

  // --- Live Full-Text Search ---
  function initLiveSearch() {
    if (!state.bookData || !state.bookData.searchIndex) return;

    let debounceTimer = null;

    function executeSearch(query) {
      query = query.trim();
      if (!query) {
        DOM.clearSearch.style.display = 'none';
        DOM.searchMeta.textContent = 'Type a word to search across 508 pages';
        DOM.searchResultsList.innerHTML = '';
        return;
      }

      DOM.clearSearch.style.display = 'block';
      const qLower = query.toLowerCase();
      const results = [];

      for (const item of state.bookData.searchIndex) {
        const textLower = item.text.toLowerCase();
        const matchIdx = textLower.indexOf(qLower);
        if (matchIdx !== -1) {
          const start = Math.max(0, matchIdx - 40);
          const end = Math.min(item.text.length, matchIdx + query.length + 60);
          let snippet = item.text.slice(start, end);
          if (start > 0) snippet = '...' + snippet;
          if (end < item.text.length) snippet = snippet + '...';

          const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
          const highlighted = snippet.replace(re, '<mark>$1</mark>');

          results.push({
            spread: item.spread,
            pageLeft: item.pageLeft,
            pageRight: item.pageRight,
            title: item.title,
            snippet: highlighted
          });
        }
      }

      DOM.searchMeta.textContent = `Found ${results.length} matching spread${results.length === 1 ? '' : 's'}`;

      if (results.length === 0) {
        DOM.searchResultsList.innerHTML = `<div class="empty-state">No occurrences found for "${query}". Try another keyword.</div>`;
        return;
      }

      DOM.searchResultsList.innerHTML = results.map(r => `
        <div class="search-result-card" data-jump-spread="${r.spread}">
          <div class="search-result-header">
            <span>Spread ${r.spread} (Pages ${r.pageLeft}–${r.pageRight})</span>
            <span>${r.title}</span>
          </div>
          <div class="search-result-snippet">${r.snippet}</div>
        </div>
      `).join('');

      DOM.searchResultsList.querySelectorAll('.search-result-card').forEach(card => {
        card.addEventListener('click', () => {
          const s = parseInt(card.dataset.jumpSpread, 10);
          goToSpread(s);
          closeAllDrawers();
        });
      });
    }

    DOM.searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => executeSearch(e.target.value), 180);
    });

    DOM.clearSearch.addEventListener('click', () => {
      DOM.searchInput.value = '';
      executeSearch('');
      DOM.searchInput.focus();
    });

    document.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        DOM.searchInput.value = chip.dataset.query;
        executeSearch(chip.dataset.query);
      });
    });
  }

  // --- Thumbnails Grid Initialization with Native WebP Images ---
  function initThumbnailsGrid() {
    let html = '';
    for (let s = 1; s <= state.totalSpreads; s++) {
      const pLeft = (s - 1) * 2 + 1;
      const pRight = s * 2;
      html += `
        <div class="thumb-card ${s === state.currentSpread ? 'active' : ''}" data-spread="${s}">
          <div class="thumb-preview">
            <img src="assets/thumbs/thumb_${s}.webp" loading="lazy" alt="Spread ${s}" width="324" height="243" />
          </div>
          <div class="thumb-info">
            <span>Spread ${s}</span>
            <span>p.${pLeft}–${pRight}</span>
          </div>
        </div>
      `;
    }
    DOM.thumbsGrid.innerHTML = html;

    DOM.thumbsGrid.querySelectorAll('.thumb-card').forEach(card => {
      card.addEventListener('click', () => {
        const s = parseInt(card.dataset.spread, 10);
        goToSpread(s);
        closeAllDrawers();
      });
    });
  }

  // --- Mode 1: Initialize StPageFlip with Pre-rendered WebP Pages ---
  function initFlipBook() {
    if (!window.St || !window.St.PageFlip) {
      console.warn('St.PageFlip not loaded, using Spread mode');
      setViewMode('spread');
      return;
    }

    const container = DOM.flipbook;
    container.innerHTML = '';

    // Collect all 508 single page URLs
    const pageUrls = [];
    for (let p = 1; p <= state.totalPages; p++) {
      pageUrls.push(`assets/pages/page_${p}.webp`);
    }

    try {
      state.pageFlip = new window.St.PageFlip(container, {
        width: 432,
        height: 648,
        size: 'stretch',
        minWidth: 160,
        maxWidth: 864,
        minHeight: 220,
        maxHeight: 1296,
        maxShadowOpacity: 0.5,
        showCover: false,
        usePortrait: true,
        flippingTime: 550,
        mobileScrollSupport: true,
        useMouseEvents: true,
        swipeDistance: 25
      });

      // Load directly from hardware-accelerated WebP page images
      state.pageFlip.loadFromImages(pageUrls);

      state.pageFlip.on('flip', (e) => {
        const pageIdx = e.data;
        const newSpread = Math.floor(pageIdx / 2) + 1;
        state.currentSpread = newSpread;
        playPaperTurnSound();
        updateUIState();
      });

      state.pageFlip.on('changeState', (e) => {
        if (e.data === 'flipping') {
          playPaperTurnSound();
        }
      });

      state.pageFlip.on('changeOrientation', () => {
        updateUIState();
      });

    } catch (err) {
      console.error('Error initializing StPageFlip with images:', err);
      setViewMode('spread');
    }
  }

  // --- Mobile Touch Gestures (Swiping & Tap Navigation) ---
  function initMobileTouchGestures() {
    const stage = DOM.readingStage;

    stage.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        state.touchStartX = e.touches[0].clientX;
        state.touchStartY = e.touches[0].clientY;
        state.touchStartTime = Date.now();
      }
    }, { passive: true });

    stage.addEventListener('touchend', (e) => {
      if (e.changedTouches.length !== 1) return;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - state.touchStartX;
      const deltaY = touchEndY - state.touchStartY;
      const elapsed = Date.now() - state.touchStartTime;

      // Horizontal swipe detection (> 35px, predominantly horizontal, < 400ms)
      if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3 && elapsed < 400) {
        if (deltaX < 0) {
          nextSpread(); // Swipe Left -> Next
        } else {
          prevSpread(); // Swipe Right -> Prev
        }
      }
    }, { passive: true });
  }

  // --- Spread Mode: Zoom, Pan & Mobile Pinch-Zoom Handlers ---
  function initSpreadZoomAndPan() {
    const vp = DOM.spreadViewport;

    DOM.btnZoomIn.addEventListener('click', () => {
      state.zoom = Math.min(3.0, state.zoom + 0.25);
      applySpreadZoomAndPan();
    });

    DOM.btnZoomOut.addEventListener('click', () => {
      state.zoom = Math.max(1.0, state.zoom - 0.25);
      if (state.zoom === 1.0) state.pan = { x: 0, y: 0 };
      applySpreadZoomAndPan();
    });

    DOM.btnZoomReset.addEventListener('click', () => {
      state.zoom = 1.0;
      state.pan = { x: 0, y: 0 };
      applySpreadZoomAndPan();
    });

    vp.addEventListener('wheel', (e) => {
      if (state.viewMode !== 'spread') return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      state.zoom = Math.min(3.0, Math.max(1.0, state.zoom + delta));
      if (state.zoom === 1.0) state.pan = { x: 0, y: 0 };
      applySpreadZoomAndPan();
    }, { passive: false });

    // Desktop Mouse Pan
    vp.addEventListener('mousedown', (e) => {
      if (state.zoom <= 1.0) return;
      state.isPanning = true;
      vp.classList.add('grabbing');
      state.panStart = { x: e.clientX - state.pan.x, y: e.clientY - state.pan.y };
    });

    window.addEventListener('mousemove', (e) => {
      if (!state.isPanning) return;
      state.pan.x = e.clientX - state.panStart.x;
      state.pan.y = e.clientY - state.panStart.y;
      applySpreadZoomAndPan();
    });

    window.addEventListener('mouseup', () => {
      if (state.isPanning) {
        state.isPanning = false;
        vp.classList.remove('grabbing');
      }
    });

    // Mobile Multi-Touch Pinch-to-Zoom & Pan
    let initialPinchDistance = 0;
    let initialZoom = 1.0;

    vp.addEventListener('touchstart', (e) => {
      if (state.viewMode !== 'spread') return;
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDistance = Math.hypot(dx, dy);
        initialZoom = state.zoom;
      } else if (e.touches.length === 1 && state.zoom > 1.0) {
        state.isPanning = true;
        state.panStart = { x: e.touches[0].clientX - state.pan.x, y: e.touches[0].clientY - state.pan.y };
      }
    }, { passive: true });

    vp.addEventListener('touchmove', (e) => {
      if (state.viewMode !== 'spread') return;
      if (e.touches.length === 2 && initialPinchDistance > 0) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDistance = Math.hypot(dx, dy);
        const factor = currentDistance / initialPinchDistance;
        state.zoom = Math.min(3.0, Math.max(1.0, initialZoom * factor));
        if (state.zoom === 1.0) state.pan = { x: 0, y: 0 };
        applySpreadZoomAndPan();
      } else if (e.touches.length === 1 && state.isPanning) {
        state.pan.x = e.touches[0].clientX - state.panStart.x;
        state.pan.y = e.touches[0].clientY - state.panStart.y;
        applySpreadZoomAndPan();
      }
    }, { passive: true });

    vp.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        initialPinchDistance = 0;
      }
      if (e.touches.length === 0) {
        state.isPanning = false;
      }
    }, { passive: true });
  }

  // --- Keyboard Shortcuts ---
  function initKeyboardControls() {
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        if (e.key === 'Escape') {
          document.activeElement.blur();
          closeAllDrawers();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          nextSpread();
          break;
        case ' ':
          e.preventDefault();
          if (e.shiftKey) prevSpread();
          else nextSpread();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          prevSpread();
          break;
        case 'Home':
          e.preventDefault();
          goToSpread(1);
          break;
        case 'End':
          e.preventDefault();
          goToSpread(state.totalSpreads);
          break;
        case 'z':
        case 'Z':
          e.preventDefault();
          setViewMode(state.viewMode === 'flip' ? 'spread' : 'flip');
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          state.soundEnabled = !state.soundEnabled;
          localStorage.setItem('sima_sound', state.soundEnabled);
          updateAudioButton();
          break;
        case 'b':
        case 'B':
          e.preventDefault();
          toggleBookmark();
          break;
        case 't':
        case 'T':
          e.preventDefault();
          if (DOM.tocDrawer.classList.contains('open')) closeAllDrawers();
          else openDrawer(DOM.tocDrawer);
          break;
        case 's':
        case 'S':
          e.preventDefault();
          if (DOM.searchDrawer.classList.contains('open')) closeAllDrawers();
          else {
            openDrawer(DOM.searchDrawer);
            DOM.searchInput.focus();
          }
          break;
        case 'g':
        case 'G':
          e.preventDefault();
          if (DOM.thumbsDrawer.classList.contains('open')) closeAllDrawers();
          else openDrawer(DOM.thumbsDrawer);
          break;
        case '+':
        case '=':
          if (state.viewMode === 'spread') {
            e.preventDefault();
            state.zoom = Math.min(3.0, state.zoom + 0.25);
            applySpreadZoomAndPan();
          }
          break;
        case '-':
        case '_':
          if (state.viewMode === 'spread') {
            e.preventDefault();
            state.zoom = Math.max(1.0, state.zoom - 0.25);
            if (state.zoom === 1.0) state.pan = { x: 0, y: 0 };
            applySpreadZoomAndPan();
          }
          break;
        case '0':
          if (state.viewMode === 'spread') {
            e.preventDefault();
            state.zoom = 1.0;
            state.pan = { x: 0, y: 0 };
            applySpreadZoomAndPan();
          }
          break;
        case '?':
          e.preventDefault();
          DOM.helpModal.classList.toggle('show');
          break;
        case 'Escape':
          closeAllDrawers();
          break;
      }
    });
  }

  // --- Fullscreen Toggle ---
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      DOM.fsIcon.innerHTML = `<path fill="currentColor" d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>`;
    } else {
      document.exitFullscreen().catch(() => {});
      DOM.fsIcon.innerHTML = `<path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>`;
    }
  }

  // --- Bind Event Listeners ---
  function bindEvents() {
    DOM.navPrev.addEventListener('click', prevSpread);
    DOM.navNext.addEventListener('click', nextSpread);

    DOM.btnPrevDock.addEventListener('click', prevSpread);
    DOM.btnNextDock.addEventListener('click', nextSpread);
    DOM.btnFirst.addEventListener('click', () => goToSpread(1));
    DOM.btnLast.addEventListener('click', () => goToSpread(state.totalSpreads));

    DOM.pageScrubber.addEventListener('input', (e) => {
      const s = parseInt(e.target.value, 10);
      const pLeft = (s - 1) * 2 + 1;
      const pRight = s * 2;
      DOM.scrubberTooltip.textContent = `Spread ${s} (p.${pLeft}–${pRight})`;
      DOM.scrubberTooltip.style.left = `${((s - 1) / (state.totalSpreads - 1)) * 100}%`;
    });

    DOM.pageScrubber.addEventListener('change', (e) => {
      const s = parseInt(e.target.value, 10);
      goToSpread(s);
    });

    DOM.btnJumpGo.addEventListener('click', () => {
      const pageVal = parseInt(DOM.jumpInput.value, 10);
      if (!isNaN(pageVal) && pageVal >= 1 && pageVal <= state.totalPages) {
        const spreadNum = Math.ceil(pageVal / 2);
        goToSpread(spreadNum);
        DOM.jumpInput.value = '';
      }
    });

    DOM.jumpInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        DOM.btnJumpGo.click();
      }
    });

    DOM.btnViewMode.addEventListener('click', () => {
      setViewMode(state.viewMode === 'flip' ? 'spread' : 'flip');
    });

    DOM.btnTheme.addEventListener('click', (e) => {
      e.stopPropagation();
      DOM.themeMenu.classList.toggle('show');
    });

    document.querySelectorAll('.theme-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        applyTheme(opt.dataset.setTheme);
        DOM.themeMenu.classList.remove('show');
      });
    });

    DOM.btnAudio.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      localStorage.setItem('sima_sound', state.soundEnabled);
      updateAudioButton();
    });

    DOM.btnBookmark.addEventListener('click', toggleBookmark);
    DOM.btnAutoplay.addEventListener('click', toggleAutoplay);

    DOM.btnToc.addEventListener('click', () => openDrawer(DOM.tocDrawer));
    DOM.closeToc.addEventListener('click', closeAllDrawers);

    DOM.btnSearch.addEventListener('click', () => {
      openDrawer(DOM.searchDrawer);
      DOM.searchInput.focus();
    });
    DOM.closeSearch.addEventListener('click', closeAllDrawers);

    DOM.btnThumbs.addEventListener('click', () => openDrawer(DOM.thumbsDrawer));
    DOM.closeThumbs.addEventListener('click', closeAllDrawers);

    DOM.closeBookmarks.addEventListener('click', closeAllDrawers);
    DOM.drawerBackdrop.addEventListener('click', closeAllDrawers);

    DOM.btnHelp.addEventListener('click', () => DOM.helpModal.classList.add('show'));
    DOM.closeHelp.addEventListener('click', () => DOM.helpModal.classList.remove('show'));
    DOM.helpModal.addEventListener('click', (e) => {
      if (e.target === DOM.helpModal) DOM.helpModal.classList.remove('show');
    });

    DOM.btnFullscreen.addEventListener('click', toggleFullscreen);

    window.addEventListener('click', (e) => {
      if (!e.target.closest('.theme-dropdown')) {
        DOM.themeMenu.classList.remove('show');
      }
    });

    window.addEventListener('resize', () => {
      if (state.viewMode === 'spread') {
        updateSpreadView();
      } else if (state.pageFlip) {
        state.pageFlip.update();
      }
    });
  }

  // --- Main Bootstrapper ---
  async function init() {
    applyTheme(state.theme);
    updateAudioButton();
    updateBookmarkButton();
    bindEvents();
    initKeyboardControls();
    initSpreadZoomAndPan();
    initMobileTouchGestures();


    try {
      DOM.loadingStatusText.textContent = "Loading book chapters & index...";
      DOM.loadingProgressBar.style.width = "40%";

      const resp = await fetch('book_data.json');
      state.bookData = await resp.json();
      state.totalSpreads = state.bookData.totalSpreads;
      state.totalPages = state.bookData.totalPages;
      DOM.pageScrubber.max = state.totalSpreads;

      initTableOfContents();
      initLiveSearch();
      initThumbnailsGrid();
      renderBookmarksDrawer();

      DOM.loadingProgressBar.style.width = "80%";
      DOM.loadingStatusText.textContent = "Loading book engine...";

      // Initialize Flipbook with WebP image pages
      initFlipBook();

      // Initial View Update
      DOM.loadingProgressBar.style.width = "100%";
      updateUIState();

      // Dismiss Loading Overlay instantly
      setTimeout(() => {
        DOM.loadingOverlay.classList.add('hidden');
      }, 150);

    } catch (err) {
      console.error('Initialization error:', err);
      setViewMode('spread');
      setTimeout(() => {
        DOM.loadingOverlay.classList.add('hidden');
      }, 300);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
