/**
 * Error Boundary Utility
 * Provides error handling and recovery for frontend modules
 */

class ErrorBoundary {
  constructor(containerElement, moduleName) {
    this.container = containerElement;
    this.moduleName = moduleName;
    this.hasError = false;
    this.setupGlobalErrorHandler();
  }

  /**
   * Setup global error handler for this module
   */
  setupGlobalErrorHandler() {
    window.addEventListener('error', (event) => {
      // Check if error is related to this module
      if (event.filename && event.filename.includes(this.moduleName)) {
        this.handleError(event.error || new Error(event.message));
        event.preventDefault();
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      // Handle promise rejections
      this.handleError(event.reason);
      event.preventDefault();
    });
  }

  /**
   * Handle error and display error UI
   */
  handleError(error) {
    console.error(`Error in ${this.moduleName}:`, error);
    this.hasError = true;
    this.renderErrorUI(error);
  }

  /**
   * Render error UI in the container
   */
  renderErrorUI(error) {
    const errorHTML = `
      <div class="error-boundary" role="alert">
        <div class="error-boundary__title">
          ⚠️ ${this.moduleName} Error
        </div>
        <div class="error-boundary__message">
          ${this.getErrorMessage(error)}
        </div>
        <div class="error-boundary__actions">
          <button class="error-boundary__button" onclick="location.reload()">
            Reload Page
          </button>
          <button class="error-boundary__button" onclick="this.closest('.error-boundary').remove()">
            Dismiss
          </button>
        </div>
      </div>
    `;

    // Insert error UI at the top of the container
    this.container.insertAdjacentHTML('afterbegin', errorHTML);
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(error) {
    if (!error) {
      return 'An unknown error occurred.';
    }

    // Network errors
    if (error.message && error.message.includes('fetch')) {
      return 'Unable to connect to the server. Please check your connection and try again.';
    }

    // Validation errors
    if (error.message && error.message.includes('Validation')) {
      return `Invalid data: ${error.message}`;
    }

    // Database errors
    if (error.message && error.message.includes('Database')) {
      return 'A database error occurred. Please try again later.';
    }

    // Default error message
    return error.message || 'Something went wrong. Please try again.';
  }

  /**
   * Wrap a function with error handling
   */
  wrap(fn) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handleError(error);
        throw error;
      }
    };
  }

  /**
   * Reset error state
   */
  reset() {
    this.hasError = false;
    const errorElements = this.container.querySelectorAll('.error-boundary');
    errorElements.forEach(el => el.remove());
  }

  /**
   * Check if module has error
   */
  hasErrorState() {
    return this.hasError;
  }
}

/**
 * Create error boundary for a module
 */
function createErrorBoundary(containerSelector, moduleName) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error(`Container ${containerSelector} not found for error boundary`);
    return null;
  }

  return new ErrorBoundary(container, moduleName);
}

/**
 * Global error handler for API calls
 */
async function handleAPICall(apiFunction, errorBoundary = null) {
  try {
    const response = await apiFunction();
    
    // Check if response is ok
    if (response && !response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error?.message || 'API request failed');
      error.status = response.status;
      throw error;
    }

    return response;
  } catch (error) {
    console.error('API call failed:', error);
    
    if (errorBoundary) {
      errorBoundary.handleError(error);
    }
    
    throw error;
  }
}

/**
 * Show user-friendly error notification
 */
function showErrorNotification(message, duration = 5000) {
  const notification = document.createElement('div');
  notification.className = 'error-notification';
  notification.textContent = message;
  notification.setAttribute('role', 'alert');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #dc3545;
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(notification);

  // Auto-remove after duration
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ErrorBoundary,
    createErrorBoundary,
    handleAPICall,
    showErrorNotification
  };
}
