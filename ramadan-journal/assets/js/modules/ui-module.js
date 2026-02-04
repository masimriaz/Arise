/**
 * UI Module - Modal Management, Focus Trap, Animations
 * IIFE Pattern - No Global Pollution
 */
(function() {
  'use strict';

  let activeModal = null;
  let previousFocus = null;

  function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    function handleTab(e) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    }

    element.addEventListener('keydown', handleTab);
    
    return () => {
      element.removeEventListener('keydown', handleTab);
    };
  }

  window.openOrderForm = function() {
    const modal = document.getElementById('orderModal');
    const firstNameField = document.getElementById('firstName');
    
    if (!modal) return;

    previousFocus = document.activeElement;
    activeModal = modal;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    const cleanup = trapFocus(modal);
    modal.dataset.cleanupFn = 'set';
    
    setTimeout(() => {
      if (firstNameField) {
        firstNameField.focus();
      }
    }, 100);
  };

  window.closeOrderForm = function() {
    const modal = document.getElementById('orderModal');
    if (!modal) return;
    
    modal.style.display = 'none';
    document.body.style.overflow = '';
    activeModal = null;
    
    const wasSubmitted = modal.getAttribute('data-submitted') === 'true';
    if (wasSubmitted && window.formModule) {
      window.formModule.resetForm();
      modal.setAttribute('data-submitted', 'false');
    }
    
    if (previousFocus) {
      previousFocus.focus();
      previousFocus = null;
    }
  };

  window.closeConfirmation = function() {
    const modal = document.getElementById('confirmationModal');
    if (!modal) return;
    
    modal.style.display = 'none';
    document.body.style.overflow = '';
    activeModal = null;
    
    if (previousFocus) {
      previousFocus.focus();
      previousFocus = null;
    }
  };

  function handleEscape(e) {
    if (e.key === 'Escape') {
      const orderModal = document.getElementById('orderModal');
      const confirmationModal = document.getElementById('confirmationModal');
      
      if (orderModal?.style.display === 'flex') {
        window.closeOrderForm();
      } else if (confirmationModal?.style.display === 'flex') {
        window.closeConfirmation();
      }
    }
  }

  function init() {
    document.addEventListener('keydown', handleEscape);
    
    const orderModal = document.getElementById('orderModal');
    if (orderModal) {
      const overlay = orderModal.querySelector('.modal-overlay');
      if (overlay) {
        overlay.addEventListener('click', window.closeOrderForm);
      }
    }
    
    const confirmationModal = document.getElementById('confirmationModal');
    if (confirmationModal) {
      const overlay = confirmationModal.querySelector('.modal-overlay');
      if (overlay) {
        overlay.addEventListener('click', window.closeConfirmation);
      }
    }
  }

  window.uiModule = {
    init: init
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
