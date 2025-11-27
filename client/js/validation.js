/**
 * Client-Side Validation Utilities
 * Provides input validation and sanitization for the frontend
 */

/**
 * Sanitize string input to prevent XSS attacks
 */
function sanitizeString(input) {
  if (typeof input !== 'string') {
    return input;
  }

  // Create a temporary div to use browser's built-in HTML escaping
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML.trim();
}

/**
 * Validate numeric input
 */
function validateNumber(value, options = {}) {
  const { min, max, allowFloat = true, fieldName = 'Value' } = options;
  
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: `${fieldName} is required` };
  }
  
  const num = Number(value);
  
  if (isNaN(num) || !isFinite(num)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }
  
  if (!allowFloat && !Number.isInteger(num)) {
    return { valid: false, error: `${fieldName} must be a whole number` };
  }
  
  if (min !== undefined && num < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}` };
  }
  
  if (max !== undefined && num > max) {
    return { valid: false, error: `${fieldName} must be at most ${max}` };
  }
  
  return { valid: true, value: num };
}

/**
 * Validate initiative value
 */
function validateInitiative(value) {
  return validateNumber(value, {
    min: -10,
    max: 50,
    allowFloat: true,
    fieldName: 'Initiative'
  });
}

/**
 * Validate HP value
 */
function validateHP(value, isMax = false) {
  const fieldName = isMax ? 'Max HP' : 'Current HP';
  const min = isMax ? 1 : 0;
  
  return validateNumber(value, {
    min,
    max: 9999,
    allowFloat: false,
    fieldName
  });
}

/**
 * Validate AC value
 */
function validateAC(value) {
  return validateNumber(value, {
    min: 0,
    max: 50,
    allowFloat: false,
    fieldName: 'AC'
  });
}

/**
 * Validate stat modifier
 */
function validateStatModifier(value, fieldName = 'Stat modifier') {
  return validateNumber(value, {
    min: -10,
    max: 20,
    allowFloat: false,
    fieldName
  });
}

/**
 * Show validation error message
 */
function showError(inputElement, message) {
  // Remove any existing error
  clearError(inputElement);
  
  // Add error class to input
  inputElement.classList.add('error');
  
  // Create error message element
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  errorDiv.setAttribute('role', 'alert');
  
  // Insert error message after input
  inputElement.parentNode.insertBefore(errorDiv, inputElement.nextSibling);
}

/**
 * Clear validation error message
 */
function clearError(inputElement) {
  inputElement.classList.remove('error');
  
  const errorMessage = inputElement.parentNode.querySelector('.error-message');
  if (errorMessage) {
    errorMessage.remove();
  }
}

/**
 * Validate form field on blur
 */
function setupValidation(inputElement, validator) {
  inputElement.addEventListener('blur', () => {
    const result = validator(inputElement.value);
    
    if (!result.valid) {
      showError(inputElement, result.error);
    } else {
      clearError(inputElement);
    }
  });
  
  // Clear error on input
  inputElement.addEventListener('input', () => {
    if (inputElement.classList.contains('error')) {
      clearError(inputElement);
    }
  });
}

/**
 * Prevent negative HP values in input
 */
function preventNegativeHP(inputElement) {
  inputElement.addEventListener('input', () => {
    const value = parseInt(inputElement.value);
    if (value < 0) {
      inputElement.value = 0;
    }
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sanitizeString,
    validateNumber,
    validateInitiative,
    validateHP,
    validateAC,
    validateStatModifier,
    showError,
    clearError,
    setupValidation,
    preventNegativeHP
  };
}
