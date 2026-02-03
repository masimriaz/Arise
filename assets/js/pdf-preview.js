/**
 * PDF Preview Module
 * Handles PDF.js integration, page rendering, and preview restrictions
 * Uses Mozilla's PDF.js library for client-side PDF rendering
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    pdfUrl: './sisters/publications/Ramadan_Journal_v1.pdf',
    previewPages: 5,           // Number of free preview pages
    totalPages: 30,            // Approximate total pages (will be updated when PDF loads)
    scale: 1.5,                // Initial zoom scale
    minScale: 0.5,
    maxScale: 3.0,
    scaleStep: 0.25
  };

  // State
  let pdfDoc = null;
  let currentPage = 1;
  let currentScale = CONFIG.scale;
  let pageRendering = false;
  let pageNumPending = null;

  // DOM Elements (initialized in init function)
  let canvas = null;
  let ctx = null;
  let loadingIndicator = null;
  let lockedMessage = null;
  let thumbnailGallery = null;
  
  // Control elements
  let prevPageBtn = null;
  let nextPageBtn = null;
  let zoomInBtn = null;
  let zoomOutBtn = null;
  let currentPageSpan = null;
  let totalPagesSpan = null;

  /**
   * Initialize PDF.js and set worker source
   */
  function initPDFjs() {
    if (typeof pdfjsLib === 'undefined') {
      console.error('PDF.js library not loaded');
      showError('PDF viewer library failed to load. Please refresh the page.');
      return false;
    }

    // Set PDF.js worker source from CDN
    pdfjsLib.GlobalWorkerOptions.workerSrc = 
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    return true;
  }

  /**
   * Load the PDF document
   */
  async function loadPDF() {
    if (!initPDFjs()) return;

    try {
      showLoading(true);
      
      // Check if running on file:// protocol
      if (window.location.protocol === 'file:') {
        throw new Error('CORS_ERROR: Please run this page on a local web server. See browser console for instructions.');
      }
      
      // Load PDF document
      const loadingTask = pdfjsLib.getDocument(CONFIG.pdfUrl);
      
      loadingTask.onProgress = function(progress) {
        if (progress.total > 0) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          updateLoadingText(`Loading preview... ${percent}%`);
        }
      };

      pdfDoc = await loadingTask.promise;
      
      // Update total pages
      CONFIG.totalPages = pdfDoc.numPages;
      if (totalPagesSpan) {
        totalPagesSpan.textContent = CONFIG.previewPages;
      }

      console.log(`PDF loaded: ${CONFIG.totalPages} pages`);
      
      // Render first page
      await renderPage(currentPage);
      
      // Generate thumbnails
      generateThumbnails();
      
      // Update UI
      updatePageControls();
      showLoading(false);
      
    } catch (error) {
      console.error('Error loading PDF:', error);
      
      // Provide helpful error messages based on error type
      let errorMessage = 'Failed to load PDF preview.';
      
      if (window.location.protocol === 'file:') {
        errorMessage = `
          <strong>Local Server Required</strong><br><br>
          Please run a local web server to view the PDF preview.<br><br>
          <strong>Quick Fix (choose one):</strong><br><br>
          <strong>Option 1 - Python:</strong><br>
          <code>python -m http.server 8000</code><br><br>
          <strong>Option 2 - Node.js:</strong><br>
          <code>npx http-server -p 8000</code><br><br>
          <strong>Option 3 - PHP:</strong><br>
          <code>php -S localhost:8000</code><br><br>
          Then open: <code>http://localhost:8000/ramadan-journal.html</code>
        `;
      } else if (error.name === 'MissingPDFException') {
        errorMessage = `PDF file not found. Please ensure the file exists at: <code>${CONFIG.pdfUrl}</code>`;
      }
      
      showError(errorMessage);
      showLoading(false);
    }
  }

  /**
   * Render a specific page of the PDF
   * @param {number} pageNum - Page number to render (1-indexed)
   */
  async function renderPage(pageNum) {
    if (!pdfDoc || !canvas || !ctx) return;

    // Check if page is locked
    if (pageNum > CONFIG.previewPages) {
      showLockedMessage(true);
      return;
    } else {
      showLockedMessage(false);
    }

    pageRendering = true;

    try {
      // Fetch the page
      const page = await pdfDoc.getPage(pageNum);
      
      // Calculate viewport
      const viewport = page.getViewport({ scale: currentScale });
      
      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render page
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      const renderTask = page.render(renderContext);
      await renderTask.promise;
      
      pageRendering = false;

      // If there's a pending page render, execute it
      if (pageNumPending !== null) {
        renderPage(pageNumPending);
        pageNumPending = null;
      }

      console.log(`Rendered page ${pageNum}`);

    } catch (error) {
      console.error('Error rendering page:', error);
      pageRendering = false;
    }
  }

  /**
   * Queue page render if currently rendering
   * @param {number} pageNum - Page number to render
   */
  function queueRenderPage(pageNum) {
    if (pageRendering) {
      pageNumPending = pageNum;
    } else {
      renderPage(pageNum);
    }
  }

  /**
   * Navigate to previous page
   */
  function onPrevPage() {
    if (currentPage <= 1) return;
    currentPage--;
    currentPageSpan.textContent = currentPage;
    queueRenderPage(currentPage);
    updatePageControls();
    updateThumbnailActive();
  }

  /**
   * Navigate to next page
   */
  function onNextPage() {
    if (currentPage >= CONFIG.previewPages) return;
    currentPage++;
    currentPageSpan.textContent = currentPage;
    queueRenderPage(currentPage);
    updatePageControls();
    updateThumbnailActive();
  }

  /**
   * Zoom in
   */
  function onZoomIn() {
    if (currentScale >= CONFIG.maxScale) return;
    currentScale = Math.min(currentScale + CONFIG.scaleStep, CONFIG.maxScale);
    queueRenderPage(currentPage);
    updatePageControls();
  }

  /**
   * Zoom out
   */
  function onZoomOut() {
    if (currentScale <= CONFIG.minScale) return;
    currentScale = Math.max(currentScale - CONFIG.scaleStep, CONFIG.minScale);
    queueRenderPage(currentPage);
    updatePageControls();
  }

  /**
   * Update page control button states
   */
  function updatePageControls() {
    if (prevPageBtn) {
      prevPageBtn.disabled = currentPage <= 1;
    }
    if (nextPageBtn) {
      nextPageBtn.disabled = currentPage >= CONFIG.previewPages;
    }
    if (zoomOutBtn) {
      zoomOutBtn.disabled = currentScale <= CONFIG.minScale;
    }
    if (zoomInBtn) {
      zoomInBtn.disabled = currentScale >= CONFIG.maxScale;
    }
  }

  /**
   * Generate thumbnail previews
   */
  async function generateThumbnails() {
    if (!pdfDoc || !thumbnailGallery) return;

    thumbnailGallery.innerHTML = '';

    // Generate thumbnails for ALL pages (but mark locked ones)
    const pagesToShow = Math.min(CONFIG.totalPages, 12); // Limit to first 12 for performance
    
    for (let i = 1; i <= pagesToShow; i++) {
      try {
        const thumbnailItem = document.createElement('div');
        thumbnailItem.className = 'thumbnail-item';
        thumbnailItem.setAttribute('role', 'listitem');
        thumbnailItem.setAttribute('data-page', i);
        
        // Mark locked pages
        if (i > CONFIG.previewPages) {
          thumbnailItem.classList.add('locked');
          thumbnailItem.setAttribute('aria-label', `Page ${i} - Locked`);
          thumbnailItem.style.cursor = 'not-allowed';
        } else {
          thumbnailItem.setAttribute('aria-label', `Go to page ${i}`);
          thumbnailItem.style.cursor = 'pointer';
          
          // Add click handler for unlocked pages
          thumbnailItem.addEventListener('click', () => {
            if (i <= CONFIG.previewPages) {
              currentPage = i;
              currentPageSpan.textContent = currentPage;
              queueRenderPage(currentPage);
              updatePageControls();
              updateThumbnailActive();
              
              // Scroll to main viewer
              document.getElementById('pdfCanvas').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
            }
          });
        }

        // Create thumbnail canvas
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.className = 'thumbnail-canvas';
        thumbnailItem.appendChild(thumbCanvas);

        // Add page label
        const label = document.createElement('div');
        label.className = 'thumbnail-label';
        label.textContent = `Page ${i}`;
        thumbnailItem.appendChild(label);

        thumbnailGallery.appendChild(thumbnailItem);

        // Render thumbnail (only for preview pages to save resources)
        if (i <= CONFIG.previewPages) {
          await renderThumbnail(i, thumbCanvas);
        }

      } catch (error) {
        console.error(`Error generating thumbnail for page ${i}:`, error);
      }
    }

    // Mark first thumbnail as active
    updateThumbnailActive();
  }

  /**
   * Render a thumbnail
   * @param {number} pageNum - Page number
   * @param {HTMLCanvasElement} canvas - Canvas to render to
   */
  async function renderThumbnail(pageNum, canvas) {
    if (!pdfDoc) return;

    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 0.3 }); // Small scale for thumbnails
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const context = canvas.getContext('2d');
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
    } catch (error) {
      console.error(`Error rendering thumbnail ${pageNum}:`, error);
    }
  }

  /**
   * Update active thumbnail
   */
  function updateThumbnailActive() {
    if (!thumbnailGallery) return;

    const thumbnails = thumbnailGallery.querySelectorAll('.thumbnail-item');
    thumbnails.forEach(thumb => {
      const pageNum = parseInt(thumb.getAttribute('data-page'));
      if (pageNum === currentPage) {
        thumb.classList.add('active');
      } else {
        thumb.classList.remove('active');
      }
    });
  }

  /**
   * Show/hide loading indicator
   * @param {boolean} show - Whether to show the indicator
   */
  function showLoading(show) {
    if (loadingIndicator) {
      loadingIndicator.style.display = show ? 'flex' : 'none';
    }
  }

  /**
   * Update loading text
   * @param {string} text - Loading text to display
   */
  function updateLoadingText(text) {
    if (loadingIndicator) {
      const textElement = loadingIndicator.querySelector('p');
      if (textElement) {
        textElement.textContent = text;
      }
    }
  }

  /**
   * Show/hide locked message
   * @param {boolean} show - Whether to show the message
   */
  function showLockedMessage(show) {
    if (lockedMessage) {
      lockedMessage.style.display = show ? 'flex' : 'none';
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message to display
   */
  function showError(message) {
    if (loadingIndicator) {
      loadingIndicator.innerHTML = `
        <div style="text-align: center; color: #dc2626;">
          <svg style="width: 48px; height: 48px; margin: 0 auto 1rem;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 8V12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12" cy="16" r="1" fill="currentColor"/>
          </svg>
          <p style="margin: 0;">${message}</p>
        </div>
      `;
      loadingIndicator.style.display = 'flex';
    }
  }

  /**
   * Attach event listeners
   */
  function attachEventListeners() {
    if (prevPageBtn) {
      prevPageBtn.addEventListener('click', onPrevPage);
    }
    if (nextPageBtn) {
      nextPageBtn.addEventListener('click', onNextPage);
    }
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', onZoomIn);
    }
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', onZoomOut);
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return; // Don't interfere with form inputs
      }

      switch(e.key) {
        case 'ArrowLeft':
          onPrevPage();
          break;
        case 'ArrowRight':
          onNextPage();
          break;
        case '+':
        case '=':
          onZoomIn();
          break;
        case '-':
        case '_':
          onZoomOut();
          break;
      }
    });
  }

  /**
   * Initialize the PDF viewer
   */
  function init() {
    // Initialize DOM elements
    canvas = document.getElementById('pdfCanvas');
    ctx = canvas ? canvas.getContext('2d') : null;
    loadingIndicator = document.getElementById('loadingIndicator');
    lockedMessage = document.getElementById('lockedMessage');
    thumbnailGallery = document.getElementById('thumbnailGallery');
    prevPageBtn = document.getElementById('prevPage');
    nextPageBtn = document.getElementById('nextPage');
    zoomInBtn = document.getElementById('zoomIn');
    zoomOutBtn = document.getElementById('zoomOut');
    currentPageSpan = document.getElementById('currentPage');
    totalPagesSpan = document.getElementById('totalPages');
    
    // Check if required elements exist
    if (!canvas || !ctx) {
      console.warn('PDF canvas not found. Skipping PDF viewer initialization.');
      return;
    }

    console.log('Initializing PDF viewer...');
    console.log('PDF URL:', CONFIG.pdfUrl);
    attachEventListeners();
    loadPDF();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for external access if needed
  window.PDFPreview = {
    goToPage: function(pageNum) {
      if (pageNum >= 1 && pageNum <= CONFIG.previewPages) {
        currentPage = pageNum;
        currentPageSpan.textContent = currentPage;
        queueRenderPage(currentPage);
        updatePageControls();
        updateThumbnailActive();
      }
    },
    getCurrentPage: function() {
      return currentPage;
    },
    getPreviewLimit: function() {
      return CONFIG.previewPages;
    }
  };

})();
