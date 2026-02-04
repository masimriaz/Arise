/**
 * Form Handler Module
 * ============================================================================
 * Handles order form submission for Ramadan Journal
 * - Client-side validation with inline error messages
 * - Formspree integration with AJAX submission
 * - Honeypot spam prevention
 * - Order ID generation (UUID + timestamp)
 * - Success confirmation modal with order details
 * - GDPR-compliant consent handling
 * 
 * Pattern: IIFE (Immediately Invoked Function Expression)
 * Dependencies: Bootstrap 5 (for modal), jQuery (optional progressive enhancement)
 * ============================================================================
 */

const FormHandlerModule = (function() {
    'use strict';

    // ========================================================================
    // CONFIGURATION
    // ========================================================================
    const CONFIG = {
        formId: 'orderForm',
        submitBtnId: 'submitBtn',
        modalId: 'orderModal',
        confirmationModalId: 'confirmationModal',
        formspreeEndpoint: 'https://formspree.io/f/YOUR_FORM_ID', // Replace with actual ID
        honeypotField: '_gotcha'
    };

    // ========================================================================
    // VALIDATION PATTERNS
    // ========================================================================
    const PATTERNS = {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
        name: /^[a-zA-Z\s\-']{2,50}$/,
        postalCode: /^[a-zA-Z0-9\s\-]{3,10}$/
    };

    // ========================================================================
    // ERROR MESSAGES
    // ========================================================================
    const ERRORS = {
        required: 'This field is required',
        email: 'Please enter a valid email address',
        phone: 'Please enter a valid phone number',
        name: 'Please enter a valid name (2-50 characters, letters only)',
        postalCode: 'Please enter a valid postal code',
        consent: 'You must consent to data usage to proceed'
    };

    // ========================================================================
    // DOM REFERENCES
    // ========================================================================
    let elements = {
        form: null,
        submitBtn: null,
        modal: null,
        confirmationModal: null,
        fields: {}
    };

    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    function init() {
        // Cache DOM elements
        cacheElements();

        if (!elements.form) {
            console.error('Order form not found');
            return;
        }

        // Bind events
        bindEvents();

        console.log('Form handler initialized');
    }

    // ========================================================================
    // DOM ELEMENT CACHING
    // ========================================================================
    function cacheElements() {
        elements.form = document.getElementById(CONFIG.formId);
        elements.submitBtn = document.getElementById(CONFIG.submitBtnId);
        
        // Get Bootstrap modal instances
        const modalElement = document.getElementById(CONFIG.modalId);
        const confirmationModalElement = document.getElementById(CONFIG.confirmationModalId);
        
        if (modalElement) {
            elements.modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        }
        if (confirmationModalElement) {
            elements.confirmationModal = bootstrap.Modal.getInstance(confirmationModalElement) || new bootstrap.Modal(confirmationModalElement);
        }

        // Cache form fields
        if (elements.form) {
            elements.fields = {
                firstName: elements.form.querySelector('#firstName'),
                lastName: elements.form.querySelector('#lastName'),
                email: elements.form.querySelector('#email'),
                phone: elements.form.querySelector('#phone'),
                addressLine1: elements.form.querySelector('#addressLine1'),
                addressLine2: elements.form.querySelector('#addressLine2'),
                city: elements.form.querySelector('#city'),
                state: elements.form.querySelector('#state'),
                postalCode: elements.form.querySelector('#postalCode'),
                country: elements.form.querySelector('#country'),
                privacyConsent: elements.form.querySelector('#privacyConsent')
            };
        }
    }

    // ========================================================================
    // EVENT BINDING
    // ========================================================================
    function bindEvents() {
        // Form submission
        elements.form.addEventListener('submit', handleSubmit);

        // Real-time validation on blur
        Object.keys(elements.fields).forEach(fieldName => {
            const field = elements.fields[fieldName];
            if (field) {
                field.addEventListener('blur', () => validateField(fieldName));
                field.addEventListener('input', () => clearFieldError(fieldName));
            }
        });
    }

    // ========================================================================
    // FORM SUBMISSION
    // ========================================================================
    function handleSubmit(event) {
        event.preventDefault();

        // Check honeypot (spam prevention)
        const honeypot = elements.form.querySelector(`[name="${CONFIG.honeypotField}"]`);
        if (honeypot && honeypot.value !== '') {
            console.warn('Honeypot triggered - potential spam');
            return;
        }

        // Validate all fields
        if (!validateForm()) {
            announceToScreenReader('Please correct the errors in the form');
            return;
        }

        // Generate order ID
        const orderId = generateOrderId();

        // Populate hidden fields
        populateHiddenFields(orderId);

        // Submit form
        submitForm(orderId);
    }

    // ========================================================================
    // FORM VALIDATION
    // ========================================================================
    function validateForm() {
        let isValid = true;

        // Validate each required field
        const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'addressLine1', 'city', 'state', 'postalCode', 'country', 'privacyConsent'];

        requiredFields.forEach(fieldName => {
            if (!validateField(fieldName)) {
                isValid = false;
            }
        });

        return isValid;
    }

    function validateField(fieldName) {
        const field = elements.fields[fieldName];
        if (!field) return true;

        const value = field.type === 'checkbox' ? field.checked : field.value.trim();
        let errorMessage = '';

        // Required check
        if (!value) {
            errorMessage = ERRORS.required;
        }
        // Pattern validation
        else {
            switch (fieldName) {
                case 'email':
                    if (!PATTERNS.email.test(value)) {
                        errorMessage = ERRORS.email;
                    }
                    break;
                case 'phone':
                    if (!PATTERNS.phone.test(value)) {
                        errorMessage = ERRORS.phone;
                    }
                    break;
                case 'firstName':
                case 'lastName':
                    if (!PATTERNS.name.test(value)) {
                        errorMessage = ERRORS.name;
                    }
                    break;
                case 'postalCode':
                    if (!PATTERNS.postalCode.test(value)) {
                        errorMessage = ERRORS.postalCode;
                    }
                    break;
                case 'privacyConsent':
                    if (!value) {
                        errorMessage = ERRORS.consent;
                    }
                    break;
            }
        }

        // Show/hide error
        if (errorMessage) {
            showFieldError(fieldName, errorMessage);
            return false;
        } else {
            clearFieldError(fieldName);
            return true;
        }
    }

    function showFieldError(fieldName, message) {
        const field = elements.fields[fieldName];
        if (!field) return;

        // Add invalid class
        field.classList.add('is-invalid');

        // Set error message
        const errorElement = document.getElementById(`${fieldName}Error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }

        // Set aria-invalid
        field.setAttribute('aria-invalid', 'true');
    }

    function clearFieldError(fieldName) {
        const field = elements.fields[fieldName];
        if (!field) return;

        // Remove invalid class
        field.classList.remove('is-invalid');

        // Clear error message
        const errorElement = document.getElementById(`${fieldName}Error`);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }

        // Remove aria-invalid
        field.removeAttribute('aria-invalid');
    }

    // ========================================================================
    // ORDER ID GENERATION
    // Simple UUID-like + timestamp for uniqueness
    // For production, consider server-side generation
    // ========================================================================
    function generateOrderId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9).toUpperCase();
        return `RJ-${timestamp}-${random}`;
    }

    // ========================================================================
    // POPULATE HIDDEN FIELDS
    // ========================================================================
    function populateHiddenFields(orderId) {
        // Order ID
        const orderIdField = document.getElementById('orderIdField');
        if (orderIdField) {
            orderIdField.value = orderId;
        }

        // Timestamp
        const timestampField = document.getElementById('timestampField');
        if (timestampField) {
            timestampField.value = new Date().toISOString();
        }

        // Reply-to (customer email)
        const replyToField = document.getElementById('replyToField');
        const emailField = elements.fields.email;
        if (replyToField && emailField) {
            replyToField.value = emailField.value;
        }
    }

    // ========================================================================
    // FORM SUBMISSION (AJAX)
    // Formspree integration with proper error handling
    // ========================================================================
    function submitForm(orderId) {
        // Show loading state
        setSubmitButtonLoading(true);

        // Get form data
        const formData = new FormData(elements.form);

        // Submit to Formspree
        fetch(elements.form.action, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Form submission failed');
            }
        })
        .then(data => {
            handleSubmitSuccess(orderId);
        })
        .catch(error => {
            handleSubmitError(error);
        })
        .finally(() => {
            setSubmitButtonLoading(false);
        });
    }

    // ========================================================================
    // SUBMIT SUCCESS
    // ========================================================================
    function handleSubmitSuccess(orderId) {
        // Hide order modal
        if (elements.modal) {
            const modalElement = document.getElementById(CONFIG.modalId);
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
        }

        // Reset form
        elements.form.reset();

        // Show thank you toast notification
        showThankYouToast(orderId);

        // Announce success to screen readers
        announceToScreenReader('Order submitted successfully!');

        // Optional: Track conversion (Google Analytics, etc.)
        trackConversion(orderId);
    }

    // ========================================================================
    // SUBMIT ERROR
    // ========================================================================
    function handleSubmitError(error) {
        console.error('Form submission error:', error);

        // Show user-friendly error message
        alert('There was an error submitting your order. Please try again or contact us directly at jiyafatim@gmail.com');

        announceToScreenReader('Form submission failed. Please try again.');
    }

    // ========================================================================
    // THANK YOU TOAST NOTIFICATION
    // ========================================================================
    function showThankYouToast(orderId) {
        const toast = document.getElementById('thankYouToast');
        if (!toast) return;

        const closeBtn = toast.querySelector('.toast-close');
        const progress = toast.querySelector('.toast-progress');
        
        // Update order ID in message if needed
        const messageElement = toast.querySelector('.toast-message');
        if (messageElement && orderId) {
            const emailField = elements.fields.email;
            const email = emailField ? emailField.value : 'your email';
            messageElement.innerHTML = `Your order <strong>${orderId}</strong> has been submitted successfully. We'll send confirmation to <strong>${email}</strong> shortly.`;
        }

        // Show toast with fade-in animation
        toast.classList.add('show');

        // Start progress bar animation
        if (progress) {
            progress.style.animation = 'toastProgress 5s linear forwards';
        }

        // Auto-dismiss after 5 seconds
        const autoHideTimeout = setTimeout(() => {
            hideThankYouToast(toast);
        }, 5000);

        // Manual close button
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                clearTimeout(autoHideTimeout);
                hideThankYouToast(toast);
            }, { once: true });
        }
    }

    function hideThankYouToast(toast) {
        toast.classList.remove('show');
        toast.classList.add('hide');
        
        // Remove from DOM after animation completes
        setTimeout(() => {
            toast.classList.remove('hide');
            const progress = toast.querySelector('.toast-progress');
            if (progress) {
                progress.style.animation = 'none';
            }
        }, 500);
    }

    // ========================================================================
    // CONFIRMATION MODAL
    // ========================================================================
    function showConfirmationModal(orderId) {
        // Populate order details
        const confirmOrderIdElement = document.getElementById('confirmOrderId');
        if (confirmOrderIdElement) {
            confirmOrderIdElement.textContent = orderId;
        }

        const confirmEmailElement = document.getElementById('confirmEmail');
        const emailField = elements.fields.email;
        if (confirmEmailElement && emailField) {
            confirmEmailElement.textContent = emailField.value;
        }

        // Show modal
        if (elements.confirmationModal) {
            elements.confirmationModal.show();
        }
    }

    // ========================================================================
    // SUBMIT BUTTON LOADING STATE
    // ========================================================================
    function setSubmitButtonLoading(isLoading) {
        if (!elements.submitBtn) return;

        const btnText = elements.submitBtn.querySelector('.btn-text');
        const spinner = elements.submitBtn.querySelector('.spinner-border');

        if (isLoading) {
            elements.submitBtn.disabled = true;
            if (btnText) btnText.textContent = 'Submitting...';
            if (spinner) spinner.classList.remove('d-none');
        } else {
            elements.submitBtn.disabled = false;
            if (btnText) btnText.textContent = 'Complete Order';
            if (spinner) spinner.classList.add('d-none');
        }
    }

    // ========================================================================
    // CONVERSION TRACKING
    // Placeholder for analytics integration
    // ========================================================================
    function trackConversion(orderId) {
        // Example: Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'purchase', {
                'transaction_id': orderId,
                'value': 2300,
                'currency': 'PKR',
                'items': [{
                    'item_name': 'Ramadan Journal',
                    'price': 2300,
                    'quantity': 1
                }]
            });
        }

        // Example: Facebook Pixel
        if (typeof fbq !== 'undefined') {
            fbq('track', 'Purchase', {
                value: 2300,
                currency: 'PKR',
                content_name: 'Ramadan Journal'
            });
        }

        console.log('Conversion tracked:', orderId);
    }

    // ========================================================================
    // ACCESSIBILITY ANNOUNCEMENTS
    // ========================================================================
    function announceToScreenReader(message) {
        const liveRegion = document.getElementById('liveRegion');
        if (liveRegion) {
            liveRegion.textContent = message;
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================
    return {
        init: init,
        validateForm: validateForm,
        resetForm: () => elements.form ? elements.form.reset() : null
    };
})();

// ============================================================================
// AUTO-INITIALIZATION
// ============================================================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', FormHandlerModule.init);
} else {
    FormHandlerModule.init();
}
