// ========================================
// TOAST NOTIFICATION SYSTEM
// ========================================

const Toast = {
  container: null,

  // Initialize toast container
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  // Show a toast notification
  show(message, type = 'info', duration = 3000) {
    this.init();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = document.createElement('div');
    icon.className = 'toast-icon';

    const content = document.createElement('div');
    content.className = 'toast-content';

    let title = '';
    switch (type) {
      case 'success': title = 'Success'; break;
      case 'error': title = 'Error'; break;
      case 'warning': title = 'Warning'; break;
      case 'info': title = 'Info'; break;
    }

    content.innerHTML = `
      <p class="toast-title">${title}</p>
      <p class="toast-message">${message}</p>
    `;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = () => this.remove(toast);

    toast.appendChild(icon);
    toast.appendChild(content);
    toast.appendChild(closeBtn);

    this.container.appendChild(toast);

    // Auto remove after duration
    setTimeout(() => {
      this.remove(toast);
    }, duration);
  },

  // Remove a toast
  remove(toast) {
    toast.classList.add('removing');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  },

  // Shorthand methods
  success(message, duration) {
    this.show(message, 'success', duration);
  },

  error(message, duration) {
    this.show(message, 'error', duration);
  },

  warning(message, duration) {
    this.show(message, 'warning', duration);
  },

  info(message, duration) {
    this.show(message, 'info', duration);
  }
};

// ========================================
// LOADING SPINNER
// ========================================

const Spinner = {
  overlay: null,

  // Initialize spinner overlay
  init() {
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.className = 'spinner-overlay';
      this.overlay.innerHTML = `
        <div class="spinner-container">
          <div class="spinner"></div>
          <p class="spinner-text">Loading...</p>
        </div>
      `;
      document.body.appendChild(this.overlay);
    }
  },

  // Show spinner with optional message
  show(message = 'Loading...') {
    this.init();
    const text = this.overlay.querySelector('.spinner-text');
    if (text) text.textContent = message;
    this.overlay.classList.add('active');
  },

  // Hide spinner
  hide() {
    if (this.overlay) {
      this.overlay.classList.remove('active');
    }
  }
};

// ========================================
// FORM SUBMISSION WITH LOADING
// ========================================

function handleFormSubmit(form, options = {}) {
  const {
    loadingMessage = 'Submitting...',
    successMessage = 'Success!',
    errorMessage = 'An error occurred',
    showSpinner = true,
    showToast = true
  } = options;

  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', function(e) {
    // Add loading state to button
    if (submitBtn) {
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;
    }

    // Show spinner overlay
    if (showSpinner) {
      Spinner.show(loadingMessage);
    }
  });
}

// ========================================
// AUTO-APPLY TO ALL FORMS (Optional)
// ========================================

document.addEventListener('DOMContentLoaded', function() {
  // Auto-add loading to all forms with data-loading attribute
  document.querySelectorAll('form[data-loading="true"]').forEach(form => {
    handleFormSubmit(form);
  });

  // Handle delete confirmations with toast
  document.querySelectorAll('form[data-confirm]').forEach(form => {
    form.addEventListener('submit', function(e) {
      const message = form.dataset.confirm;
      if (!confirm(message)) {
        e.preventDefault();
        return false;
      }
    });
  });
});

// Make available globally
window.Toast = Toast;
window.Spinner = Spinner;
window.handleFormSubmit = handleFormSubmit;
