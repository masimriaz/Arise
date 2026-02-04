/**
 * Main Application Orchestrator
 */
(function() {
  'use strict';

  const CONFIG = {
    pdfPreviewSelector: '#preview',
    lazyLoadThreshold: 200,
    debugMode: false
  };

  function debug(...args) {
    if (CONFIG.debugMode) {
      console.log('[RJ Main]', ...args);
    }
  }

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

  function isNearViewport(element, threshold = 0) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    return (rect.top <= windowHeight + threshold && rect.bottom >= -threshold);
  }

  function initSmoothScroll() {
    const scrollLinks = document.querySelectorAll('a[href^="#"]');
    scrollLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return;
        
        const target = document.querySelector(href);
        if (!target) return;
        
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        if (history.pushState) {
          history.pushState(null, null, href);
        }
        
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });
  }

  let pdfModuleLoaded = false;
  
  function lazyLoadPdfModule() {
    if (pdfModuleLoaded) return;
    
    const pdfSection = document.querySelector(CONFIG.pdfPreviewSelector);
    if (!pdfSection) return;
    
    if (isNearViewport(pdfSection, CONFIG.lazyLoadThreshold)) {
      pdfModuleLoaded = true;
      
      if (typeof window.pdfPreviewModule !== 'undefined') {
        window.pdfPreviewModule.init();
        debug('PDF module initialized');
      }
      
      window.removeEventListener('scroll', scrollHandler);
    }
  }
  
  const scrollHandler = debounce(lazyLoadPdfModule, 100);

  function initCounter() {
    const counterElement = document.getElementById('buyersRemaining');
    if (!counterElement) return;
    
    let currentCount = parseInt(counterElement.textContent) || 43;
    
    const updateInterval = setInterval(() => {
      if (currentCount > 20 && Math.random() < 0.1) {
        currentCount--;
        counterElement.textContent = currentCount;
        counterElement.style.transform = 'scale(1.2)';
        setTimeout(() => {
          counterElement.style.transform = 'scale(1)';
        }, 200);
      }
      
      if (currentCount <= 20) {
        clearInterval(updateInterval);
      }
    }, 30000);
  }

  function initAccessibility() {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'live-region';
    document.body.appendChild(liveRegion);
  }

  function init() {
    initSmoothScroll();
    initAccessibility();
    initCounter();
    
    if (typeof window.uiModule !== 'undefined') {
      window.uiModule.init();
    }
    
    if (typeof window.formModule !== 'undefined') {
      window.formModule.init();
    }
    
    window.addEventListener('scroll', scrollHandler);
    lazyLoadPdfModule();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.RamadanJournal = {
    version: '2.0.0',
    config: CONFIG,
    utils: { debug, isNearViewport }
  };

})();

function scrollToPreview() {
  const preview = document.getElementById('preview');
  if (preview) {
    preview.scrollIntoView({ behavior: 'smooth' });
  }
}
