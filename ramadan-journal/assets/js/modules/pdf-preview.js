/**
 * =============================================================================
 * PDF PREVIEW MODULE - Modular, Accessible PDF Viewer
 * =============================================================================
 * 
 * Purpose: Display PDF preview with pages 1-5 unlocked, pages 6+ locked
 * Pattern: IIFE (Immediately Invoked Function Expression) - no global pollution
 * Dependencies: PDF.js (loaded via CDN)
 * 
 * Features:
 * - Lazy rendering (only render when visible)
 * - Thumbnail strip for navigation
 * - Lock overlay for pages 6+
 * - Keyboard navigation (Arrow keys, Home, End)
 * - Accessible (ARIA labels, focus management)
 * - Responsive canvas sizing
 * 
 * Public API:
 * - init(): Initialize module when PDF section is visible
 * - unlockFullPdf(): Remove locks (called after successful order)
 * 
 * Refactor Decisions:
 * 1. Separated from main.js for single responsibility
 * 2. Uses closure for private state (pdfDoc, currentPage, etc.)
 * 3. Exposes minimal API via window.pdfPreviewModule
 * 4. Graceful fallback to iframe if PDF.js fails
 * 
 * =============================================================================
 */

(function() {
  'use strict';

  /**
   * ===========================================================================
   * CONFIGURATION
   * ===========================================================================
   */
  const CONFIG = {
    pdfUrl: 'publications/Ramadan_Journal_Sample_5_Pages.pdf',
    previewPages: 5,           // Number of unlocked pages
    totalPagesExpected: 30,    // Total pages in full journal
    scale: 1.5,                // Initial zoom
    minScale: 0.5,
    maxScale: 3.0,
    scaleStep: 0.25,
    workerSrc: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  };

  /**
   * ===========================================================================
   * STATE (Private to this module)
   * ===========================================================================
   */
  let pdfDoc = null;
  let currentPage = 1;
  let currentScale = CONFIG.scale;
  let pageRendering = false;
  let pageNumPending = null;
  let isUnlocked = false;  // Set to true after order completion

  // DOM Elements (cached for performance)
  let canvas, ctx, loadingIndicator, lockedMessage, thumbnailGallery;
  let prevPageBtn, nextPageBtn, zoomInBtn, zoomOutBtn;
  let currentPageSpan, totalPagesSpan;

  /**
   * ===========================================================================
   * UTILITY FUNCTIONS
   * ===========================================================================
   */

  /**
   * Log debug messages with module prefix
   */
  function debug(...args) {
    if (window.RamadanJournal && window.RamadanJournal.config.debugMode) {
      console.log('[PDF Preview]', ...args);
    }
  }

  /**
   * Announce message to screen readers
   */
  function announce(message) {
    const liveRegion = document.getElementById('live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }

  /**
   * ===========================================================================
   * PDF.js INITIALIZATION
   * ===========================================================================
   */

  /**
   * Initialize PDF.js library and set worker source
   * @returns {boolean} True if PDF.js is available
   */
  function initPDFjs() {
    if (typeof pdfjsLib === 'undefined') {
      console.error('PDF.js library not loaded');
      showFallbackIframe();
      return false;
    }

    // Set worker source for PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = CONFIG.workerSrc;
    debug('PDF.js initialized');
    return true;
  }

  /**
   * ===========================================================================
   * PDF LOADING
   * ===========================================================================
   */

  /**
   * Load PDF document from URL
   */
  async function loadPDF() {
    if (!initPDFjs()) return;

    try {
      showLoading(true);
      debug('Loading PDF from:', CONFIG.pdfUrl);

      // Configure PDF.js loading task
      const loadingTask = pdfjsLib.getDocument({
        url: CONFIG.pdfUrl,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true,
        withCredentials: false
      });

      // Progress callback
      loadingTask.onProgress = function(progress) {
        if (progress.total > 0) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          updateLoadingText(`Loading preview... ${percent}%`);
        }
      };

      // Wait for PDF to load
      pdfDoc = await loadingTask.promise;
      
      // Update total pages
      CONFIG.totalPagesExpected = pdfDoc.numPages;
      if (totalPagesSpan) {
        totalPagesSpan.textContent = CONFIG.previewPages;
      }

      debug(`PDF loaded successfully: ${pdfDoc.numPages} pages`);
      announce(`PDF preview loaded with ${CONFIG.previewPages} pages available`);

      // Render first page
      await renderPage(currentPage);
      
      // Generate thumbnails
      generateThumbnails();
      
      // Update UI controls
      updatePageControls();
      showLoading(false);

    } catch (error) {
      console.error('Error loading PDF:', error);
      showError(getErrorMessage(error));
      showLoading(false);
      showFallbackIframe(); // Graceful degradation
    }
  }

  /**
   * Get user-friendly error message based on error type
   */
  function getErrorMessage(error) {
    if (error.name === 'MissingPDFException') {
      return 'PDF file not found. Please contact support.';
    } else if (error.name === 'InvalidPDFException') {
      return 'The PDF file appears to be corrupted. Please contact support.';
    } else if (error.message && error.message.includes('CORS')) {
      return 'PDF could not be loaded due to security restrictions. Try refreshing the page.';
    } else {
      return 'Failed to load PDF preview. Please try again or contact support.';
    }
  }

  /**
   * ===========================================================================
   * PAGE RENDERING
   * ===========================================================================
   */

  /**
   * Render a specific page to canvas
   * @param {number} pageNum - Page number to render (1-indexed)
   */
  async function renderPage(pageNum) {
    if (!pdfDoc || !canvas || !ctx) {
      debug('Cannot render: missing pdfDoc or canvas');
      return;
    }

    // Check if page is locked
    if (pageNum > CONFIG.previewPages && !isUnlocked) {
      showLockedMessage(true);
      canvas.style.display = 'none';
      return;
    } else {
      showLockedMessage(false);
      canvas.style.display = 'block';
    }

    // Prevent concurrent renders
    if (pageRendering) {
      pageNumPending = pageNum;
      return;
    }

    pageRendering = true;
    debug(`Rendering page ${pageNum}...`);

    try {
      // Fetch page
      const page = await pdfDoc.getPage(pageNum);
      
      // Calculate viewport
      const viewport = page.getViewport({ scale: currentScale });
      
      // Set canvas dimensions to match viewport
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render page to canvas
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      
      pageRendering = false;
      debug(`Page ${pageNum} rendered successfully`);
      announce(`Now viewing page ${pageNum} of ${CONFIG.previewPages}`);

      // Render pending page if any
      if (pageNumPending !== null) {
        const pending = pageNumPending;
        pageNumPending = null;
        renderPage(pending);
      }

    } catch (error) {
      console.error('Error rendering page:', error);
      pageRendering = false;
      showError('Failed to render page. Please try again.');
    }
  }

  /**
   * ===========================================================================
   * THUMBNAIL GENERATION
   * ===========================================================================
   */

  /**
   * Generate thumbnail strip for pages 1-5 (and locked placeholders for 6+)
   */
  async function generateThumbnails() {
    if (!pdfDoc || !thumbnailGallery) return;

    debug('Generating thumbnails...');
    thumbnailGallery.innerHTML = '';

    // Generate thumbnails for preview pages
    for (let i = 1; i <= CONFIG.previewPages; i++) {
      await createThumbnail(i, false);
    }

    // Generate locked thumbnails for remaining pages (demo)
    const totalPages = Math.min(10, CONFIG.totalPagesExpected); // Show max 10 thumbs
    for (let i = CONFIG.previewPages + 1; i <= totalPages; i++) {
      createLockedThumbnail(i);
    }

    debug('Thumbnails generated');
  }

  /**
   * Create single thumbnail for a page
   */
  async function createThumbnail(pageNum, isLocked) {
    try {
      const page = await pdfDoc.getPage(pageNum);
      const scale = 0.3; // Small scale for thumbnails
      const viewport = page.getViewport({ scale });

      // Create canvas for thumbnail
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = viewport.width;
      thumbCanvas.height = viewport.height;
      const thumbCtx = thumbCanvas.getContext('2d');

      // Render to thumbnail canvas
      await page.render({
        canvasContext: thumbCtx,
        viewport: viewport
      }).promise;

      // Create thumbnail element
      const thumbDiv = document.createElement('div');
      thumbDiv.className = 'pdf-thumbnail';
      thumbDiv.setAttribute('role', 'button');
      thumbDiv.setAttribute('tabindex', '0');
      thumbDiv.setAttribute('aria-label', `Go to page ${pageNum}`);
      thumbDiv.dataset.page = pageNum;

      if (pageNum === currentPage) {
        thumbDiv.classList.add('active');
      }

      thumbDiv.appendChild(thumbCanvas);

      // Add page number label
      const label = document.createElement('span');
      label.className = 'thumb-label';
      label.textContent = pageNum;
      thumbDiv.appendChild(label);

      // Click handler
      thumbDiv.addEventListener('click', () => {
        goToPage(pageNum);
      });

      // Keyboard handler
      thumbDiv.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goToPage(pageNum);
        }
      });

      thumbnailGallery.appendChild(thumbDiv);

    } catch (error) {
      console.error(`Error creating thumbnail for page ${pageNum}:`, error);
    }
  }

  /**
   * Create locked thumbnail placeholder
   */
  function createLockedThumbnail(pageNum) {
    const thumbDiv = document.createElement('div');
    thumbDiv.className = 'pdf-thumbnail locked';
    thumbDiv.setAttribute('role', 'button');
    thumbDiv.setAttribute('aria-label', `Page ${pageNum} - Locked`);
    thumbDiv.setAttribute('aria-disabled', 'true');

    // Lock icon
    const lockIcon = document.createElement('div');
    lockIcon.className = 'lock-icon';
    lockIcon.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="2"/>
        <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" stroke-width="2"/>
      </svg>
    `;

    const label = document.createElement('span');
    label.className = 'thumb-label';
    label.textContent = pageNum;

    thumbDiv.appendChild(lockIcon);
    thumbDiv.appendChild(label);
    thumbnailGallery.appendChild(thumbDiv);
  }

  /**
   * ===========================================================================
   * NAVIGATION CONTROLS
   * ===========================================================================
   */

  /**
   * Navigate to specific page
   */
  function goToPage(pageNum) {
    if (pageNum < 1 || pageNum > CONFIG.totalPagesExpected) return;
    if (pageNum > CONFIG.previewPages && !isUnlocked) {
      showLockedMessage(true);
      return;
    }

    currentPage = pageNum;
    renderPage(currentPage);
    updatePageControls();
    updateActiveThumbnail();

    // Update current page display
    if (currentPageSpan) {
      currentPageSpan.textContent = currentPage;
    }
  }

  /**
   * Go to previous page
   */
  function onPrevPage() {
    if (currentPage <= 1) return;
    goToPage(currentPage - 1);
  }

  /**
   * Go to next page
   */
  function onNextPage() {
    if (currentPage >= CONFIG.previewPages && !isUnlocked) {
      showLockedMessage(true);
      return;
    }
    if (currentPage >= CONFIG.totalPagesExpected) return;
    goToPage(currentPage + 1);
  }

  /**
   * Zoom in
   */
  function onZoomIn() {
    if (currentScale >= CONFIG.maxScale) return;
    currentScale = Math.min(currentScale + CONFIG.scaleStep, CONFIG.maxScale);
    renderPage(currentPage);
    announce(`Zoomed in to ${Math.round(currentScale * 100)}%`);
  }

  /**
   * Zoom out
   */
  function onZoomOut() {
    if (currentScale <= CONFIG.minScale) return;
    currentScale = Math.max(currentScale - CONFIG.scaleStep, CONFIG.minScale);
    renderPage(currentPage);
    announce(`Zoomed out to ${Math.round(currentScale * 100)}%`);
  }

  /**
   * Update control button states
   */
  function updatePageControls() {
    if (prevPageBtn) {
      prevPageBtn.disabled = (currentPage <= 1);
    }
    if (nextPageBtn) {
      const maxPage = isUnlocked ? CONFIG.totalPagesExpected : CONFIG.previewPages;
      nextPageBtn.disabled = (currentPage >= maxPage);
    }
    if (zoomInBtn) {
      zoomInBtn.disabled = (currentScale >= CONFIG.maxScale);
    }
    if (zoomOutBtn) {
      zoomOutBtn.disabled = (currentScale <= CONFIG.minScale);
    }
  }

  /**
   * Update active thumbnail
   */
  function updateActiveThumbnail() {
    if (!thumbnailGallery) return;

    const thumbnails = thumbnailGallery.querySelectorAll('.pdf-thumbnail');
    thumbnails.forEach((thumb, index) => {
      if (parseInt(thumb.dataset.page) === currentPage) {
        thumb.classList.add('active');
        thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        thumb.classList.remove('active');
      }
    });
  }

  /**
   * ===========================================================================
   * KEYBOARD NAVIGATION
   * ===========================================================================
   */

  /**
   * Handle keyboard navigation
   */
  function handleKeyboard(e) {
    // Only handle if focus is on PDF viewer area
    const pdfSection = document.getElementById('preview');
    if (!pdfSection || !pdfSection.contains(document.activeElement)) return;

    switch(e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        onPrevPage();
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        onNextPage();
        break;
      case 'Home':
        e.preventDefault();
        goToPage(1);
        break;
      case 'End':
        e.preventDefault();
        const maxPage = isUnlocked ? CONFIG.totalPagesExpected : CONFIG.previewPages;
        goToPage(maxPage);
        break;
      case '+':
      case '=':
        e.preventDefault();
        onZoomIn();
        break;
      case '-':
      case '_':
        e.preventDefault();
        onZoomOut();
        break;
    }
  }

  /**
   * ===========================================================================
   * UI FEEDBACK
   * ===========================================================================
   */

  /**
   * Show/hide loading indicator
   */
  function showLoading(show) {
    if (!loadingIndicator) return;
    loadingIndicator.style.display = show ? 'flex' : 'none';
  }

  /**
   * Update loading text
   */
  function updateLoadingText(text) {
    if (!loadingIndicator) return;
    const textEl = loadingIndicator.querySelector('p');
    if (textEl) {
      textEl.textContent = text;
    }
  }

  /**
   * Show/hide locked message overlay
   */
  function showLockedMessage(show) {
    if (!lockedMessage) return;
    lockedMessage.style.display = show ? 'flex' : 'none';
    if (show) {
      announce('This page is locked. Order the full journal to unlock all pages.');
    }
  }

  /**
   * Show error message
   */
  function showError(message) {
    if (!loadingIndicator) return;
    loadingIndicator.style.display = 'flex';
    loadingIndicator.innerHTML = `
      <div class="error-content">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <path d="M12 8V12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <circle cx="12" cy="16" r="1" fill="currentColor"/>
        </svg>
        <p>${message}</p>
      </div>
    `;
    announce(message);
  }

  /**
   * Show fallback iframe when PDF.js fails
   */
  function showFallbackIframe() {
    const pdfCanvasWrapper = document.querySelector('.pdf-canvas-wrapper');
    if (!pdfCanvasWrapper) return;

    debug('Falling back to iframe');
    
    pdfCanvasWrapper.innerHTML = `
      <iframe 
        src="${CONFIG.pdfUrl}" 
        width="100%" 
        height="600" 
        style="border: 1px solid #ddd; border-radius: 8px;"
        title="Ramadan Journal PDF Preview">
      </iframe>
      <p style="text-align: center; margin-top: 1rem; color: #666;">
        PDF viewer loaded. Navigation controls are not available in fallback mode.
      </p>
    `;
  }

  /**
   * ===========================================================================
   * PUBLIC API
   * ===========================================================================
   */

  /**
   * Initialize PDF preview module
   */
  function init() {
    debug('Initializing PDF preview module...');

    // Cache DOM elements
    canvas = document.getElementById('pdfCanvas');
    loadingIndicator = document.getElementById('loadingIndicator');
    lockedMessage = document.getElementById('lockedMessage');
    thumbnailGallery = document.getElementById('thumbnailGallery');
    
    prevPageBtn = document.getElementById('prevPage');
    nextPageBtn = document.getElementById('nextPage');
    zoomInBtn = document.getElementById('zoomIn');
    zoomOutBtn = document.getElementById('zoomOut');
    currentPageSpan = document.getElementById('currentPage');
    totalPagesSpan = document.getElementById('totalPages');

    if (!canvas) {
      console.error('PDF canvas not found');
      return;
    }

    ctx = canvas.getContext('2d');

    // Attach control event listeners
    if (prevPageBtn) prevPageBtn.addEventListener('click', onPrevPage);
    if (nextPageBtn) nextPageBtn.addEventListener('click', onNextPage);
    if (zoomInBtn) zoomInBtn.addEventListener('click', onZoomIn);
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', onZoomOut);

    // Keyboard navigation
    document.addEventListener('keydown', handleKeyboard);

    // Load PDF
    loadPDF();

    debug('PDF preview module initialized');
  }

  /**
   * Unlock full PDF (called after successful order)
   * NOTE: This is client-side demo only. In production, backend would
   * provide signed URL to full PDF after payment confirmation.
   */
  function unlockFullPdf() {
    debug('Unlocking full PDF...');
    isUnlocked = true;
    
    // Update total pages
    if (totalPagesSpan) {
      totalPagesSpan.textContent = CONFIG.totalPagesExpected;
    }
    
    // Re-generate thumbnails with all pages unlocked
    generateThumbnails();
    
    // Update controls
    updatePageControls();
    
    // Hide locked message if showing
    showLockedMessage(false);
    
    announce('Full PDF unlocked! All pages are now available.');
    
    debug('Full PDF unlocked');
  }

  /**
   * ===========================================================================
   * EXPOSE PUBLIC API
   * ===========================================================================
   */
  window.pdfPreviewModule = {
    init: init,
    unlockFullPdf: unlockFullPdf,
    version: '2.0.0'
  };

})();
