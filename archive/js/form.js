/* ============================================
   Form Validation — Contact Page
   ============================================ */

(function () {
  'use strict';

  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const fname = form.querySelector('#fname');
    const lname = form.querySelector('#lname');
    const email = form.querySelector('#email');
    const phone = form.querySelector('#phone');

    let valid = true;

    // Clear previous errors
    form.querySelectorAll('.form-error').forEach(function (el) { el.remove(); });
    form.querySelectorAll('input, textarea, select').forEach(function (el) {
      el.style.borderColor = 'rgba(0, 119, 182, 0.2)';
    });

    // Validate required fields
    [fname, lname, email, phone].forEach(function (field) {
      if (!field.value.trim()) {
        showError(field, 'This field is required');
        valid = false;
      }
    });

    // Validate email format
    if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      showError(email, 'Please enter a valid email address');
      valid = false;
    }

    // Validate phone format (basic)
    if (phone.value.trim() && !/^[\d\s\-\(\)\+]{7,}$/.test(phone.value)) {
      showError(phone, 'Please enter a valid phone number');
      valid = false;
    }

    if (valid) {
      // Show success message (no backend yet)
      var successMsg = document.createElement('div');
      successMsg.style.cssText = 'background: #38B2AC; color: white; padding: 1rem 1.5rem; border-radius: 0.75rem; margin-top: 1rem; font-weight: 500;';
      successMsg.textContent = 'Thank you! Your message has been received. We\'ll be in touch soon.';
      form.appendChild(successMsg);
      form.reset();

      setTimeout(function () {
        successMsg.remove();
      }, 5000);
    }
  });

  function showError(field, message) {
    field.style.borderColor = '#E53E3E';
    var error = document.createElement('span');
    error.className = 'form-error';
    error.style.cssText = 'color: #E53E3E; font-size: 0.8125rem; margin-top: 0.25rem; display: block;';
    error.textContent = message;
    field.parentElement.appendChild(error);
  }

  // Remove error on input
  form.querySelectorAll('input, textarea, select').forEach(function (field) {
    field.addEventListener('input', function () {
      this.style.borderColor = 'rgba(0, 119, 182, 0.2)';
      var error = this.parentElement.querySelector('.form-error');
      if (error) error.remove();
    });
  });

})();
