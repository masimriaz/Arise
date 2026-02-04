/**
 * Form Handler Module - Order Form Validation & Submission
 * IIFE Pattern - No Global Pollution
 */
(function() {
  'use strict';

  const formFields = {
    firstName: null,
    lastName: null,
    email: null,
    phone: null,
    addressLine1: null,
    addressLine2: null,
    city: null,
    state: null,
    postalCode: null,
    country: null,
    privacyConsent: null,
    _gotcha: null
  };

  const patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\+]?[0-9\s\-\(\)]{10,20}$/,
    name: /^[a-zA-Z\s\-']{2,50}$/,
    postalCode: /^[a-zA-Z0-9\s\-]{3,10}$/
  };

  function validateField(field) {
    if (!field) return true;
    
    const fieldName = field.name;
    const value = field.value.trim();
    const errorElement = document.getElementById(`${fieldName}Error`);
    let isValid = true;
    let errorMessage = '';

    if (errorElement) errorElement.textContent = '';
    field.classList.remove('error');

    if (fieldName === '_gotcha') {
      return value === '';
    }

    if (field.required && !value) {
      isValid = false;
      errorMessage = 'This field is required';
    } else if (fieldName === 'email' && value && !patterns.email.test(value)) {
      isValid = false;
      errorMessage = 'Please enter a valid email address';
    } else if (fieldName === 'phone' && value && !patterns.phone.test(value)) {
      isValid = false;
      errorMessage = 'Please enter a valid phone number';
    } else if ((fieldName === 'firstName' || fieldName === 'lastName') && value && !patterns.name.test(value)) {
      isValid = false;
      errorMessage = 'Please enter a valid name (2-50 characters)';
    } else if (fieldName === 'postalCode' && value && !patterns.postalCode.test(value)) {
      isValid = false;
      errorMessage = 'Please enter a valid postal code';
    } else if (field.type === 'checkbox' && field.required && !field.checked) {
      isValid = false;
      errorMessage = 'You must consent to the privacy policy';
    }

    if (!isValid) {
      field.classList.add('error');
      if (errorElement) errorElement.textContent = errorMessage;
      field.setAttribute('aria-invalid', 'true');
    } else {
      field.setAttribute('aria-invalid', 'false');
    }

    return isValid;
  }

  function validateForm() {
    let isValid = true;
    Object.values(formFields).forEach(field => {
      if (field && field.name !== 'addressLine2' && field.name !== '_gotcha') {
        if (!validateField(field)) {
          isValid = false;
        }
      }
    });
    return isValid;
  }

  function generateOrderId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `RJ-${timestamp}-${random}`;
  }

  function getFormData() {
    return {
      orderId: generateOrderId(),
      timestamp: new Date().toISOString(),
      firstName: formFields.firstName?.value.trim() || '',
      lastName: formFields.lastName?.value.trim() || '',
      email: formFields.email?.value.trim() || '',
      phone: formFields.phone?.value.trim() || '',
      addressLine1: formFields.addressLine1?.value.trim() || '',
      addressLine2: formFields.addressLine2?.value.trim() || '',
      city: formFields.city?.value.trim() || '',
      state: formFields.state?.value.trim() || '',
      postalCode: formFields.postalCode?.value.trim() || '',
      country: formFields.country?.value || '',
      privacyConsent: formFields.privacyConsent?.checked || false
    };
  }

  async function submitFormData(formData) {
    const form = document.getElementById('shippingForm');
    const formAction = form?.getAttribute('action');
    
    if (!formAction || formAction.includes('YOUR_FORM_ID')) {
      alert('Formspree not configured. Update YOUR_FORM_ID in form action attribute.');
      throw new Error('FORMSPREE_NOT_CONFIGURED');
    }

    const formDataObj = new FormData(form);
    formDataObj.set('orderId', formData.orderId);
    formDataObj.set('timestamp', formData.timestamp);
    formDataObj.set('_replyto', formData.email);

    try {
      const response = await fetch(formAction, {
        method: 'POST',
        body: formDataObj,
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Form submission failed');
      }
      
      return { success: true, orderId: formData.orderId };
    } catch (error) {
      console.error('Submission error:', error);
      throw error;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (formFields._gotcha?.value.trim() !== '') {
      console.warn('Spam detected');
      return;
    }

    if (!validateForm()) {
      const firstError = document.querySelector('.error');
      if (firstError) firstError.focus();
      return;
    }

    const formData = getFormData();
    setSubmitButtonLoading(true);

    try {
      await submitFormData(formData);
      
      const orderModal = document.getElementById('orderModal');
      if (orderModal) {
        orderModal.setAttribute('data-submitted', 'true');
      }
      
      window.closeOrderForm();
      openConfirmation(formData);

      if (typeof window.pdfPreviewModule !== 'undefined') {
        setTimeout(() => {
          window.pdfPreviewModule.unlockFullPdf();
        }, 2000);
      }

    } catch (error) {
      alert('Order submission failed. Please try again or contact us directly.');
    } finally {
      setSubmitButtonLoading(false);
    }
  }

  function openConfirmation(orderData) {
    const confirmationModal = document.getElementById('confirmationModal');
    if (!confirmationModal) return;

    const orderIdDisplay = document.getElementById('orderIdDisplay');
    const emailDisplay = document.getElementById('emailDisplay');
    
    if (orderIdDisplay) orderIdDisplay.textContent = orderData.orderId;
    if (emailDisplay) emailDisplay.textContent = orderData.email;
    
    confirmationModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function setSubmitButtonLoading(loading) {
    const submitBtn = document.getElementById('submitOrderBtn');
    if (!submitBtn) return;

    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');

    if (loading) {
      submitBtn.disabled = true;
      if (btnText) btnText.style.display = 'none';
      if (btnSpinner) btnSpinner.style.display = 'flex';
    } else {
      submitBtn.disabled = false;
      if (btnText) btnText.style.display = 'inline';
      if (btnSpinner) btnSpinner.style.display = 'none';
    }
  }

  function resetForm() {
    const form = document.getElementById('shippingForm');
    if (!form) return;
    
    form.reset();
    Object.values(formFields).forEach(field => {
      if (field) {
        field.classList.remove('error');
        field.setAttribute('aria-invalid', 'false');
        const errorElement = document.getElementById(`${field.name}Error`);
        if (errorElement) errorElement.textContent = '';
      }
    });
  }

  function attachEventListeners() {
    const form = document.getElementById('shippingForm');
    if (form) {
      form.addEventListener('submit', handleSubmit);
    }

    Object.values(formFields).forEach(field => {
      if (field && field.name !== '_gotcha') {
        field.addEventListener('blur', () => {
          if (field.value.trim() || field.required) {
            validateField(field);
          }
        });

        field.addEventListener('input', () => {
          if (field.classList.contains('error')) {
            field.classList.remove('error');
            const errorElement = document.getElementById(`${field.name}Error`);
            if (errorElement) errorElement.textContent = '';
          }
        });
      }
    });
  }

  function init() {
    formFields.firstName = document.getElementById('firstName');
    formFields.lastName = document.getElementById('lastName');
    formFields.email = document.getElementById('email');
    formFields.phone = document.getElementById('phone');
    formFields.addressLine1 = document.getElementById('addressLine1');
    formFields.addressLine2 = document.getElementById('addressLine2');
    formFields.city = document.getElementById('city');
    formFields.state = document.getElementById('state');
    formFields.postalCode = document.getElementById('postalCode');
    formFields.country = document.getElementById('country');
    formFields.privacyConsent = document.getElementById('privacyConsent');
    formFields._gotcha = document.querySelector('[name="_gotcha"]');

    attachEventListeners();
  }

  window.formModule = {
    init: init,
    validateForm: validateForm,
    resetForm: resetForm
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
