/**
 * PDF Preview Module
 * ============================================================================
 * Handles PDF rendering for Ramadan Journal preview
 * - Displays pages 1-5 with full interaction
 * - Locks pages 6+ with overlay and CTA
 * - Provides thumbnail navigation, keyboard controls, zoom
 * - Graceful fallback to iframe if PDF.js fails
 * 
 * Pattern: IIFE (Immediately Invoked Function Expression)
 * Dependencies: PDF.js (CDN loaded)
 * ============================================================================
 */

const PDFPreviewModule = (function() {
    'use strict';

    // ========================================================================
    // CONFIGURATION
    // ========================================================================
    const CONFIG = {
        pdfUrl: 'publications/Ramadan_Journal_Sample_5_Pages.pdf',
        maxPreviewPages: 5,  // Pages 1-5 are unlocked
        initialScale: 1.0,
        minScale: 0.5,
        maxScale: 3.0,
        scaleStep: 0.25,
        workerSrc: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
    };

    // ========================================================================
    // STATE MANAGEMENT
    // ========================================================================
    let state = {
        pdfDocument: null,
        currentPage: 1,
        totalPages: 0,
        currentScale: CONFIG.initialScale,
        isLoaded: false,
        isRendering: false
    };

    // ========================================================================
    // DOM REFERENCES (cached for performance)
    // ========================================================================
    const elements = {
        canvas: null,
        ctx: null,
        loadingIndicator: null,
        lockedMessage: null,
        currentPageSpan: null,
        totalPagesSpan: null,
        prevBtn: null,
        nextBtn: null,
        zoomInBtn: null,
        zoomOutBtn: null,
        thumbnailGallery: null
    };

    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    function init() {
        // Check if PDF.js is available
        if (typeof pdfjsLib === 'undefined') {
            console.error('PDF.js library not loaded');
            showFallback();
            return;
        }

        // Configure PDF.js worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = CONFIG.workerSrc;

        // Cache DOM elements
        cacheElements();

        // Verify required elements exist
        if (!elements.canvas) {
            console.error('PDF canvas element not found');
            return;
        }

        // Set up event listeners
        bindEvents();

        // Load the PDF
        loadPDF();

        // Announce to screen readers
        announceToScreenReader('PDF preview is loading');
    }

    // ========================================================================
    // DOM ELEMENT CACHING
    // ========================================================================
    function cacheElements() {
        elements.canvas = document.getElementById('pdfCanvas');
        elements.ctx = elements.canvas ? elements.canvas.getContext('2d') : null;
        elements.loadingIndicator = document.getElementById('loadingIndicator');
        elements.lockedMessage = document.getElementById('lockedMessage');
        elements.currentPageSpan = document.getElementById('currentPage');
        elements.totalPagesSpan = document.getElementById('totalPages');
        elements.prevBtn = document.getElementById('prevPage');
        elements.nextBtn = document.getElementById('nextPage');
        elements.zoomInBtn = document.getElementById('zoomIn');
        elements.zoomOutBtn = document.getElementById('zoomOut');
        elements.thumbnailGallery = document.getElementById('thumbnailGallery');
    }

    // ========================================================================
    // EVENT BINDING
    // ========================================================================
    function bindEvents() {
        // Navigation buttons
        if (elements.prevBtn) {
            elements.prevBtn.addEventListener('click', () => changePage(-1));
        }
        if (elements.nextBtn) {
            elements.nextBtn.addEventListener('click', () => changePage(1));
        }

        // Zoom buttons
        if (elements.zoomInBtn) {
            elements.zoomInBtn.addEventListener('click', () => changeZoom(CONFIG.scaleStep));
        }
        if (elements.zoomOutBtn) {
            elements.zoomOutBtn.addEventListener('click', () => changeZoom(-CONFIG.scaleStep));
        }

        // Keyboard navigation (accessibility)
        document.addEventListener('keydown', handleKeyboardNav);

        // Window resize (responsive canvas)
        window.addEventListener('resize', debounce(handleResize, 250));
    }

    // ========================================================================
    // PDF LOADING
    // ========================================================================
    function loadPDF() {
        showLoading(true);

        const loadingTask = pdfjsLib.getDocument({
            url: CONFIG.pdfUrl,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
            cMapPacked: true
        });

        loadingTask.promise
            .then(handlePDFLoad)
            .catch(handlePDFError);
    }

    function handlePDFLoad(pdf) {
        state.pdfDocument = pdf;
        state.totalPages = pdf.numPages;
        state.isLoaded = true;

        // Update UI with total pages (show only preview limit)
        if (elements.totalPagesSpan) {
            elements.totalPagesSpan.textContent = CONFIG.maxPreviewPages;
        }

        // Render first page
        renderPage(1);

        // Generate thumbnails
        generateThumbnails();

        // Hide loading
        showLoading(false);

        announceToScreenReader('PDF loaded successfully. Use arrow keys to navigate.');
    }

    function handlePDFError(error) {
        console.error('Error loading PDF:', error);
        showLoading(false);
        showFallback();
        announceToScreenReader('Error loading PDF preview. Showing fallback.');
    }

    // ========================================================================
    // PAGE RENDERING
    // ========================================================================
    function renderPage(pageNum) {
        if (!state.pdfDocument || state.isRendering) {
            return;
        }

        // Check if page is locked
        if (pageNum > CONFIG.maxPreviewPages) {
            showLockedMessage(true);
            return;
        } else {
            showLockedMessage(false);
        }

        state.isRendering = true;
        state.currentPage = pageNum;

        // Update UI
        if (elements.currentPageSpan) {
            elements.currentPageSpan.textContent = pageNum;
        }
        updateNavigationButtons();
        updateThumbnailHighlight();

        // Fetch and render the page
        state.pdfDocument.getPage(pageNum).then(page => {
            const viewport = page.getViewport({ scale: state.currentScale });

            // Set canvas dimensions
            elements.canvas.height = viewport.height;
            elements.canvas.width = viewport.width;

            const renderContext = {
                canvasContext: elements.ctx,
                viewport: viewport
            };

            const renderTask = page.render(renderContext);

            renderTask.promise
                .then(() => {
                    state.isRendering = false;
                    announceToScreenReader(`Page ${pageNum} of ${CONFIG.maxPreviewPages}`);
                })
                .catch(error => {
                    console.error('Error rendering page:', error);
                    state.isRendering = false;
                });
        });
    }

    // ========================================================================
    // NAVIGATION
    // ========================================================================
    function changePage(delta) {
        const newPage = state.currentPage + delta;

        // Validate page number
        if (newPage < 1 || newPage > state.totalPages) {
            return;
        }

        renderPage(newPage);
    }

    function updateNavigationButtons() {
        if (elements.prevBtn) {
            elements.prevBtn.disabled = state.currentPage <= 1;
        }
        if (elements.nextBtn) {
            // Enable next button only if within preview limit or total pages
            elements.nextBtn.disabled = state.currentPage >= Math.min(CONFIG.maxPreviewPages, state.totalPages);
        }
    }

    // ========================================================================
    // ZOOM CONTROLS
    // ========================================================================
    function changeZoom(delta) {
        const newScale = state.currentScale + delta;

        // Validate scale
        if (newScale < CONFIG.minScale || newScale > CONFIG.maxScale) {
            return;
        }

        state.currentScale = newScale;
        renderPage(state.currentPage);

        announceToScreenReader(`Zoom level ${Math.round(newScale * 100)}%`);
    }

    // ========================================================================
    // THUMBNAIL GENERATION
    // ========================================================================
    function generateThumbnails() {
        if (!elements.thumbnailGallery || !state.pdfDocument) {
            return;
        }

        // Clear existing thumbnails
        elements.thumbnailGallery.innerHTML = '';

        // Generate thumbnails for all pages (including locked ones for visual)
        const totalThumbnails = Math.min(state.totalPages, 10); // Limit to 10 for performance

        for (let i = 1; i <= totalThumbnails; i++) {
            generateThumbnail(i);
        }
    }

    function generateThumbnail(pageNum) {
        const thumbnailDiv = document.createElement('div');
        thumbnailDiv.className = 'thumbnail-item';
        thumbnailDiv.setAttribute('role', 'listitem');
        thumbnailDiv.setAttribute('data-page', pageNum);

        // Add locked class if beyond preview
        if (pageNum > CONFIG.maxPreviewPages) {
            thumbnailDiv.classList.add('thumbnail-locked');
        }

        // Create canvas for thumbnail
        const thumbnailCanvas = document.createElement('canvas');
        thumbnailDiv.appendChild(thumbnailCanvas);

        // Make thumbnail clickable (only if unlocked)
        if (pageNum <= CONFIG.maxPreviewPages) {
            thumbnailDiv.style.cursor = 'pointer';
            thumbnailDiv.setAttribute('tabindex', '0');
            thumbnailDiv.setAttribute('aria-label', `Go to page ${pageNum}`);
            
            thumbnailDiv.addEventListener('click', () => renderPage(pageNum));
            thumbnailDiv.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    renderPage(pageNum);
                }
            });
        } else {
            thumbnailDiv.setAttribute('aria-label', `Page ${pageNum} is locked`);
        }

        elements.thumbnailGallery.appendChild(thumbnailDiv);

        // Render thumbnail
        state.pdfDocument.getPage(pageNum).then(page => {
            const scale = 0.3;
            const viewport = page.getViewport({ scale });

            thumbnailCanvas.height = viewport.height;
            thumbnailCanvas.width = viewport.width;

            const renderContext = {
                canvasContext: thumbnailCanvas.getContext('2d'),
                viewport: viewport
            };

            page.render(renderContext);
        });
    }

    function updateThumbnailHighlight() {
        if (!elements.thumbnailGallery) {
            return;
        }

        // Remove active class from all thumbnails
        const thumbnails = elements.thumbnailGallery.querySelectorAll('.thumbnail-item');
        thumbnails.forEach(thumb => thumb.classList.remove('active'));

        // Add active class to current page thumbnail
        const currentThumbnail = elements.thumbnailGallery.querySelector(`[data-page="${state.currentPage}"]`);
        if (currentThumbnail) {
            currentThumbnail.classList.add('active');
        }
    }

    // ========================================================================
    // LOCKED MESSAGE
    // ========================================================================
    function showLockedMessage(show) {
        if (elements.lockedMessage) {
            elements.lockedMessage.style.display = show ? 'flex' : 'none';
        }
    }

    // ========================================================================
    // LOADING INDICATOR
    // ========================================================================
    function showLoading(show) {
        if (elements.loadingIndicator) {
            elements.loadingIndicator.style.display = show ? 'flex' : 'none';
        }
    }

    // ========================================================================
    // FALLBACK (iframe for older browsers)
    // ========================================================================
    function showFallback() {
        const canvasWrapper = document.querySelector('.pdf-canvas-wrapper');
        if (!canvasWrapper) return;

        canvasWrapper.innerHTML = `
            <div class="alert alert-warning w-100">
                <h4>PDF Preview Unavailable</h4>
                <p>Your browser doesn't support the PDF viewer. Please download the PDF to view it.</p>
                <a href="${CONFIG.pdfUrl}" class="btn btn-primary" target="_blank">
                    <i class="fas fa-download me-2"></i>Download PDF
                </a>
            </div>
            <iframe src="${CONFIG.pdfUrl}" 
                    width="100%" 
                    height="600px" 
                    style="border: none; margin-top: 1rem;">
            </iframe>
        `;
    }

    // ========================================================================
    // KEYBOARD NAVIGATION (Accessibility)
    // ========================================================================
    function handleKeyboardNav(event) {
        // Only handle if focus is on preview section
        const previewSection = document.getElementById('preview');
        if (!previewSection || !previewSection.contains(document.activeElement)) {
            return;
        }

        switch (event.key) {
            case 'ArrowLeft':
            case 'PageUp':
                event.preventDefault();
                changePage(-1);
                break;
            case 'ArrowRight':
            case 'PageDown':
                event.preventDefault();
                changePage(1);
                break;
            case 'Home':
                event.preventDefault();
                renderPage(1);
                break;
            case 'End':
                event.preventDefault();
                renderPage(CONFIG.maxPreviewPages);
                break;
            case '+':
            case '=':
                event.preventDefault();
                changeZoom(CONFIG.scaleStep);
                break;
            case '-':
            case '_':
                event.preventDefault();
                changeZoom(-CONFIG.scaleStep);
                break;
        }
    }

    // ========================================================================
    // RESPONSIVE RESIZE
    // ========================================================================
    function handleResize() {
        if (state.isLoaded && !state.isRendering) {
            renderPage(state.currentPage);
        }
    }

    // ========================================================================
    // ACCESSIBILITY ANNOUNCEMENTS
    // ========================================================================
    function announceToScreenReader(message) {
        const liveRegion = document.getElementById('liveRegion');
        if (liveRegion) {
            liveRegion.textContent = message;
            // Clear after announcement
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }

    // ========================================================================
    // UTILITY FUNCTIONS
    // ========================================================================
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ========================================================================
    // PUBLIC API
    // Expose only necessary methods
    // ========================================================================
    return {
        init: init,
        renderPage: renderPage,
        changePage: changePage,
        getCurrentPage: () => state.currentPage,
        getTotalPages: () => state.totalPages,
        isLoaded: () => state.isLoaded
    };
})();

// ============================================================================
// AUTO-INITIALIZATION
// Wait for DOM and PDF.js to be ready
// ============================================================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Delay init slightly to ensure PDF.js is loaded
        setTimeout(() => PDFPreviewModule.init(), 100);
    });
} else {
    setTimeout(() => PDFPreviewModule.init(), 100);
}
