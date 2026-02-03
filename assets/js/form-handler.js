/**
 * Form Handler Module
 * Handles order form validation, submission, and modal management
 */

(function() {
  'use strict';

  // DOM Elements
  const orderModal = document.getElementById('orderModal');
  const confirmationModal = document.getElementById('confirmationModal');
  const shippingForm = document.getElementById('shippingForm');
  const submitBtn = document.getElementById('submitOrderBtn');

  // Form fields
  const formFields = {
    firstName: document.getElementById('firstName'),
    lastName: document.getElementById('lastName'),
    email: document.getElementById('email'),
    phone: document.getElementById('phone'),
    addressLine1: document.getElementById('addressLine1'),
    addressLine2: document.getElementById('addressLine2'),
    city: document.getElementById('city'),
    state: document.getElementById('state'),
    postalCode: document.getElementById('postalCode'),
    country: document.getElementById('country'),
    privacyConsent: document.getElementById('privacyConsent'),
    website: document.getElementById('website') // Honeypot
  };

  /**
   * Validation Patterns
   */
  const patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\+]?[0-9\s\-\(\)]{10,20}$/,
    name: /^[a-zA-Z\s\-']{2,50}$/,
    postalCode: /^[a-zA-Z0-9\s\-]{3,10}$/
  };

  /**
   * Validation messages
   */
  const messages = {
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    invalidPhone: 'Please enter a valid phone number (10-20 digits)',
    invalidName: 'Please enter a valid name (2-50 characters)',
    invalidPostalCode: 'Please enter a valid postal code',
    privacyRequired: 'You must consent to the privacy policy to proceed'
  };

  /**
   * Open order form modal
   */
  window.openOrderForm = function() {
    const modal = document.getElementById('orderModal');
    const firstNameField = document.getElementById('firstName');
    
    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      
      // Focus first input for accessibility
      setTimeout(() => {
        if (firstNameField) {
          firstNameField.focus();
        }
      }, 100);
    }
  };

  /**
   * Close order form modal
   */
  window.closeOrderForm = function() {
    const modal = document.getElementById('orderModal');
    
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
      
      // Reset form if it was successfully submitted
      const wasSubmitted = modal.getAttribute('data-submitted') === 'true';
      if (wasSubmitted) {
        resetForm();
        modal.setAttribute('data-submitted', 'false');
      }
    }
  };

  /**
   * Open confirmation modal
   * @param {Object} orderData - Order data to display
   */
  function openConfirmation(orderData) {
    if (confirmationModal) {
      // Update confirmation details
      const orderIdDisplay = document.getElementById('orderIdDisplay');
      const emailDisplay = document.getElementById('emailDisplay');
      
      if (orderIdDisplay) {
        orderIdDisplay.textContent = orderData.orderId;
      }
      if (emailDisplay) {
        emailDisplay.textContent = orderData.email;
      }
      
      confirmationModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  };

  /**
   * Close confirmation modal
   */
  window.closeConfirmation = function() {
    const modal = document.getElementById('confirmationModal');
    
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  };

  /**
   * Validate a single field
   * @param {HTMLElement} field - Field to validate
   * @returns {boolean} - Whether field is valid
   */
  function validateField(field) {
    if (!field) return true;

    const fieldName = field.name;
    const value = field.value.trim();
    const errorElement = document.getElementById(`${fieldName}Error`);
    let isValid = true;
    let errorMessage = '';

    // Clear previous error
    if (errorElement) {
      errorElement.textContent = '';
    }
    field.classList.remove('error');

    // Check honeypot (should be empty)
    if (fieldName === 'website') {
      if (value !== '') {
        console.warn('Honeypot triggered - possible spam');
        return false;
      }
      return true;
    }

    // Required field validation
    if (field.required && !value) {
      isValid = false;
      errorMessage = messages.required;
    }
    // Email validation
    else if (fieldName === 'email' && value && !patterns.email.test(value)) {
      isValid = false;
      errorMessage = messages.invalidEmail;
    }
    // Phone validation
    else if (fieldName === 'phone' && value && !patterns.phone.test(value)) {
      isValid = false;
      errorMessage = messages.invalidPhone;
    }
    // Name validation
    else if ((fieldName === 'firstName' || fieldName === 'lastName') && value && !patterns.name.test(value)) {
      isValid = false;
      errorMessage = messages.invalidName;
    }
    // Postal code validation
    else if (fieldName === 'postalCode' && value && !patterns.postalCode.test(value)) {
      isValid = false;
      errorMessage = messages.invalidPostalCode;
    }
    // Checkbox validation
    else if (field.type === 'checkbox' && field.required && !field.checked) {
      isValid = false;
      errorMessage = messages.privacyRequired;
    }

    // Display error if invalid
    if (!isValid) {
      field.classList.add('error');
      if (errorElement) {
        errorElement.textContent = errorMessage;
      }
      field.setAttribute('aria-invalid', 'true');
    } else {
      field.setAttribute('aria-invalid', 'false');
    }

    return isValid;
  }

  /**
   * Validate entire form
   * @returns {boolean} - Whether form is valid
   */
  function validateForm() {
    let isValid = true;

    // Validate all fields
    Object.values(formFields).forEach(field => {
      if (field && field.name !== 'addressLine2') { // addressLine2 is optional
        if (!validateField(field)) {
          isValid = false;
        }
      }
    });

    return isValid;
  }

  /**
   * Generate unique order ID
   * @returns {string} - Unique order ID
   */
  function generateOrderId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `RJ-${timestamp}-${random}`;
  }

  /**
   * Get form data
   * @returns {Object} - Form data
   */
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
      product: 'Ramadan Journal v1',
      price: 'Rs. 2,300',
      paymentMethod: 'COD or Bank Transfer',
      privacyConsent: formFields.privacyConsent?.checked || false
    };
  }

  /**
   * Submit form data to Formspree
   * Target: jiyafatim@gmail.com
   * @param {Object} formData - Form data to submit
   */
  function submitFormData(formData) {
    // Get form element and action URL
    const form = document.getElementById('shippingForm');
    const formAction = form?.getAttribute('action');
    
    // Check if Formspree is configured
    if (!formAction || formAction.includes('YOUR_FORM_ID')) {
      console.error('⚠️ Formspree not configured');
      const setupMsg = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 FORMSPREE SETUP REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Quick Setup (2 minutes):

1. Visit: https://formspree.io
2. Sign up with jiyafatim@gmail.com
3. Create a new form
4. Copy your Form ID (e.g., xabc1234)
5. Open ramadan-journal.html (line ~432)
6. Replace YOUR_FORM_ID with your ID

Example:
<form action="https://formspree.io/f/xabc1234">

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 Contact us directly:
✉️  jiyafatim@gmail.com
📱 +92-XXX-XXXXXXX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `;
      alert(setupMsg);
      throw new Error('FORMSPREE_NOT_CONFIGURED');
    }
    
    // Generate order ID and timestamp
    const orderId = generateOrderId();
    const timestamp = new Date().toISOString();
    
    // Update hidden fields
    const orderIdField = document.getElementById('orderIdField');
    const timestampField = document.getElementById('timestampField');
    if (orderIdField) orderIdField.value = orderId;
    if (timestampField) timestampField.value = timestamp;
    
    // Update subject line with customer name
    const subjectField = form.querySelector('[name="_subject"]');
    if (subjectField) {
      subjectField.value = `New Ramadan Journal Order – ${formData.firstName} ${formData.lastName}`;
    }
    
    // Create FormData from form element
    const formDataObj = new FormData(form);
    
    // Add calculated fields
    formDataObj.set('orderId', orderId);
    formDataObj.set('timestamp', timestamp);
    formDataObj.set('price', formData.country === 'Pakistan' ? 'Rs. 2,300' : '£30');
    formDataObj.set('paymentMethod', formData.country === 'Pakistan' ? 'Cash on Delivery (COD)' : 'Bank Transfer');
    formDataObj.set('_replyto', formData.email); // Auto-reply to customer
    
    try {
      // Submit to Formspree
      console.log('📤 Submitting to Formspree...');
      const response = await fetch(formAction, {
        method: 'POST',
        body: formDataObj,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Formspree error:', errorData);
        throw new Error(errorData.error || 'Form submission failed. Please try again.');
      }
      
      const result = await response.json();
      console.log('✅ Formspree success:', result);
      
      // Store order data for confirmation
      formData.orderId = orderId;
      formData.timestamp = timestamp;
      
      return { success: true, orderId, ...result };
      
    } catch (error) {
      console.error('❌ Submission error:', error);
      throw error;
    }
  }

    /* EXAMPLE: Netlify Forms Integration
       Just add these attributes to the <form> tag:
       - data-netlify="true"
       - name="shipping-form"
       
       Then submit normally - Netlify handles the rest!
    */

    /* EXAMPLE: Custom Webhook
    try {
      const response = await fetch('/api/submit-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Order submission failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Submission error:', error);
      throw error;
    }
    */

    // For static demo, simulate API delay
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('✅ Demo mode: Order submitted successfully');
        resolve({ success: true, orderId: formData.orderId });
      }, 1500);
    });
  }

  /**
   * Handle form submission
   * @param {Event} e - Submit event
   */
  async function handleSubmit(e) {
    e.preventDefault();

    // Check honeypot
    if (formFields.website?.value.trim() !== '') {
      console.warn('Spam detected via honeypot');
      return;
    }

    // Validate form
    if (!validateForm()) {
      // Focus first error field
      const firstError = shippingForm.querySelector('.error');
      if (firstError) {
        firstError.focus();
      }
      return;
    }

    // Get form data
    const formData = getFormData();

    // Show loading state
    setSubmitButtonLoading(true);

    try {
      // Submit form data
      const result = await submitFormData(formData);

      console.log('Submission successful:', result);

      // Mark as submitted
      orderModal.setAttribute('data-submitted', 'true');

      // Close order modal
      closeOrderForm();

      // Show confirmation modal
      openConfirmation(formData);

      // Optional: Send analytics event
      if (typeof gtag !== 'undefined') {
        gtag('event', 'purchase', {
          transaction_id: formData.orderId,
          value: 2300,
          currency: 'PKR',
          items: [{
            item_name: 'Ramadan Journal v1',
            price: 2300,
            quantity: 1
          }]
        });
      }

      // Optional: Facebook Pixel
      if (typeof fbq !== 'undefined') {
        fbq('track', 'Purchase', {
          value: 2300,
          currency: 'PKR'
        });
      }

    } catch (error) {
      console.error('Form submission error:', error);
      
      let errorMessage = 'There was an error submitting your order. Please try again or contact us directly.';
      
      if (error.message === 'FORMSPREE_NOT_CONFIGURED') {
        errorMessage = `
          <strong>Form Service Not Configured</strong><br><br>
          To enable form submissions on GitHub Pages:<br><br>
          1. Go to <a href="https://formspree.io" target="_blank">formspree.io</a><br>
          2. Sign up for free<br>
          3. Create a new form<br>
          4. Copy your form ID<br>
          5. Replace YOUR_FORM_ID in ramadan-journal.html line 432<br><br>
          <strong>Contact us directly:</strong><br>
          Email: orders@arise-platform.com<br>
          Phone: +92-XXX-XXXXXXX
        `;
      }
      
      alert(errorMessage);
    } finally {
      setSubmitButtonLoading(false);
    }
  }

  /**
   * Set submit button loading state
   * @param {boolean} loading - Whether button is loading
   */
  function setSubmitButtonLoading(loading) {
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

  /**
   * Reset form
   */
  function resetForm() {
    if (shippingForm) {
      shippingForm.reset();
      
      // Clear all errors
      Object.values(formFields).forEach(field => {
        if (field) {
          field.classList.remove('error');
          field.setAttribute('aria-invalid', 'false');
          const errorElement = document.getElementById(`${field.name}Error`);
          if (errorElement) {
            errorElement.textContent = '';
          }
        }
      });
    }
  }

  /**
   * Attach event listeners
   */
  function attachEventListeners() {
    // Form submission
    if (shippingForm) {
      shippingForm.addEventListener('submit', handleSubmit);
    }

    // Real-time validation on blur
    Object.values(formFields).forEach(field => {
      if (field && field.name !== 'website') {
        field.addEventListener('blur', () => {
          if (field.value.trim() || field.required) {
            validateField(field);
          }
        });

        // Clear error on input
        field.addEventListener('input', () => {
          if (field.classList.contains('error')) {
            field.classList.remove('error');
            const errorElement = document.getElementById(`${field.name}Error`);
            if (errorElement) {
              errorElement.textContent = '';
            }
          }
        });
      }
    });

    // Close modals on overlay click
    if (orderModal) {
      const overlay = orderModal.querySelector('.modal-overlay');
      if (overlay) {
        overlay.addEventListener('click', closeOrderForm);
      }
    }

    if (confirmationModal) {
      const overlay = confirmationModal.querySelector('.modal-overlay');
      if (overlay) {
        overlay.addEventListener('click', closeConfirmation);
      }
    }

    // Close modals on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (orderModal?.style.display === 'flex') {
          closeOrderForm();
        }
        if (confirmationModal?.style.display === 'flex') {
          closeConfirmation();
        }
      }
    });

    // Auto-format phone number (optional enhancement)
    if (formFields.phone) {
      formFields.phone.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^\d\+\-\s\(\)]/g, '');
        e.target.value = value;
      });
    }
  }

  /**
   * Initialize form handler
   */
  function init() {
    console.log('Form handler initialized');
    attachEventListeners();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for external access
  window.FormHandler = {
    validateForm,
    getFormData,
    resetForm
  };

})();

/**
 * INTEGRATION INSTRUCTIONS
 * ========================
 * 
 * 1. NETLIFY FORMS (Easiest for static hosting)
 *    - Add to <form> tag: data-netlify="true" name="shipping-form"
 *    - Add hidden input: <input type="hidden" name="form-name" value="shipping-form" />
 *    - Submissions appear in Netlify dashboard
 *    - Setup email notifications in Netlify settings
 * 
 * 2. FORMSPREE (Simple API)
 *    - Sign up at https://formspree.io
 *    - Get your form ID
 *    - Uncomment Formspree code in submitFormData()
 *    - Replace YOUR_FORM_ID with actual ID
 * 
 * 3. GOOGLE SHEETS (via Apps Script or Zapier)
 *    - Create Google Sheet with columns matching form fields
 *    - Use Zapier webhook trigger → Google Sheets action
 *    - Or create Apps Script web app to receive POST
 * 
 * 4. EMAIL (SendGrid/Mailgun)
 *    - Create serverless function (Netlify/Vercel)
 *    - Use SendGrid/Mailgun API to send emails
 *    - See webhook-example.js for implementation
 * 
 * 5. reCAPTCHA (Anti-spam)
 *    - Sign up at https://www.google.com/recaptcha
 *    - Get site key and secret key
 *    - Add script: <script src="https://www.google.com/recaptcha/api.js"></script>
 *    - Add to form: <div class="g-recaptcha" data-sitekey="YOUR_SITE_KEY"></div>
 *    - Verify token on backend before processing
 */
