/**
 * Contact Form Module - Hard Copy Request
 * Handles contact form for requesting physical journal copies
 */

(function() {
  'use strict';

  const contactForm = document.getElementById('hardCopyContactForm');
  const submitBtn = document.getElementById('contactSubmitBtn');

  const patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\+]?[0-9\s\-\(\)]{10,20}$/,
    name: /^[a-zA-Z\s\-']{2,50}$/
  };

  function validateField(field) {
    if (!field) return true;
    
    const value = field.value.trim();
    const errorEl = document.getElementById(`${field.name}Error`);
    let isValid = true;
    let errorMsg = '';

    if (errorEl) errorEl.textContent = '';
    field.classList.remove('error');

    if (field.required && !value) {
      isValid = false;
      errorMsg = 'This field is required';
    } else if (field.name === 'email' && value && !patterns.email.test(value)) {
      isValid = false;
      errorMsg = 'Please enter a valid email';
    } else if (field.name === 'phone' && value && !patterns.phone.test(value)) {
      isValid = false;
      errorMsg = 'Please enter a valid phone number';
    } else if (field.name === 'name' && value && !patterns.name.test(value)) {
      isValid = false;
      errorMsg = 'Please enter a valid name';
    }

    if (!isValid) {
      field.classList.add('error');
      if (errorEl) errorEl.textContent = errorMsg;
    }

    return isValid;
  }

  function validateForm() {
    const fields = contactForm.querySelectorAll('input[required], textarea[required]');
    let isValid = true;
    
    fields.forEach(field => {
      if (!validateField(field)) isValid = false;
    });
    
    return isValid;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      const firstError = contactForm.querySelector('.error');
      if (firstError) firstError.focus();
      return;
    }

    const formData = new FormData(contactForm);
    const submitText = submitBtn.querySelector('.btn-text');
    const submitSpinner = submitBtn.querySelector('.btn-spinner');

    submitBtn.disabled = true;
    if (submitText) submitText.style.display = 'none';
    if (submitSpinner) submitSpinner.style.display = 'flex';

    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        contactForm.reset();
        alert('✅ Thank you! We will contact you shortly about your hard copy request.');
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      alert('❌ Error submitting form. Please email us directly at: jiyafatim@gmail.com');
    } finally {
      submitBtn.disabled = false;
      if (submitText) submitText.style.display = 'inline';
      if (submitSpinner) submitSpinner.style.display = 'none';
    }
  }

  function init() {
    if (!contactForm) return;

    contactForm.addEventListener('submit', handleSubmit);

    const fields = contactForm.querySelectorAll('input, textarea');
    fields.forEach(field => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.classList.contains('error')) {
          field.classList.remove('error');
          const errorEl = document.getElementById(`${field.name}Error`);
          if (errorEl) errorEl.textContent = '';
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
