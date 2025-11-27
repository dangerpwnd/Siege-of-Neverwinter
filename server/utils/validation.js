/**
 * Validation and Sanitization Utilities
 * Provides input validation and XSS prevention
 */

/**
 * Sanitize string input to prevent XSS attacks
 * Removes potentially dangerous HTML/script tags
 */
function sanitizeString(input) {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');
  
  return sanitized.trim();
}

/**
 * Validate and sanitize numeric input
 * Returns null if invalid, otherwise returns the number
 */
function validateNumber(value, options = {}) {
  const { min, max, allowFloat = true, fieldName = 'Value' } = options;
  
  // Handle null/undefined
  if (value === null || value === undefined) {
    return { valid: false, error: `${fieldName} is required`, value: null };
  }
  
  // Convert to number
  const num = Number(value);
  
  // Check if it's a valid number
  if (isNaN(num) || !isFinite(num)) {
    return { valid: false, error: `${fieldName} must be a valid number`, value: null };
  }
  
  // Check if float is allowed
  if (!allowFloat && !Number.isInteger(num)) {
    return { valid: false, error: `${fieldName} must be an integer`, value: null };
  }
  
  // Check min constraint
  if (min !== undefined && num < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}`, value: null };
  }
  
  // Check max constraint
  if (max !== undefined && num > max) {
    return { valid: false, error: `${fieldName} must be at most ${max}`, value: null };
  }
  
  return { valid: true, error: null, value: num };
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
  const min = isMax ? 1 : 0; // Max HP must be at least 1, current HP can be 0
  
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
 * Validate stat modifier (saving throws, ability modifiers)
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
 * Validate ability score
 */
function validateAbilityScore(value, fieldName = 'Ability score') {
  return validateNumber(value, {
    min: 1,
    max: 30,
    allowFloat: false,
    fieldName
  });
}

/**
 * Validate character level
 */
function validateLevel(value) {
  return validateNumber(value, {
    min: 1,
    max: 20,
    allowFloat: false,
    fieldName: 'Level'
  });
}

/**
 * Validate siege metric (0-100 percentage)
 */
function validateSiegeMetric(value, fieldName = 'Siege metric') {
  return validateNumber(value, {
    min: 0,
    max: 100,
    allowFloat: true,
    fieldName
  });
}

/**
 * Validate and sanitize string input
 */
function validateString(value, options = {}) {
  const { minLength = 0, maxLength = 1000, required = false, fieldName = 'Field' } = options;
  
  // Handle null/undefined
  if (value === null || value === undefined || value === '') {
    if (required) {
      return { valid: false, error: `${fieldName} is required`, value: null };
    }
    return { valid: true, error: null, value: '' };
  }
  
  // Check type
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a string`, value: null };
  }
  
  // Sanitize
  const sanitized = sanitizeString(value);
  
  // Check length
  if (sanitized.length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters`, value: null };
  }
  
  if (sanitized.length > maxLength) {
    return { valid: false, error: `${fieldName} must be at most ${maxLength} characters`, value: null };
  }
  
  return { valid: true, error: null, value: sanitized };
}

/**
 * Validate enum value
 */
function validateEnum(value, allowedValues, fieldName = 'Value') {
  if (!allowedValues.includes(value)) {
    return {
      valid: false,
      error: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      value: null
    };
  }
  
  return { valid: true, error: null, value };
}

/**
 * Validate combatant type
 */
function validateCombatantType(value) {
  return validateEnum(value, ['PC', 'NPC', 'Monster'], 'Combatant type');
}

/**
 * Validate location status
 */
function validateLocationStatus(value) {
  return validateEnum(value, ['controlled', 'contested', 'enemy', 'destroyed'], 'Location status');
}

/**
 * Validate plot point status
 */
function validatePlotPointStatus(value) {
  return validateEnum(value, ['active', 'completed', 'failed'], 'Plot point status');
}

/**
 * Batch validate multiple fields
 * Returns { valid: boolean, errors: object, values: object }
 */
function validateFields(fields) {
  const errors = {};
  const values = {};
  let isValid = true;
  
  Object.keys(fields).forEach(key => {
    const { validator, value } = fields[key];
    const result = validator(value);
    
    if (!result.valid) {
      errors[key] = result.error;
      isValid = false;
    } else {
      values[key] = result.value;
    }
  });
  
  return { valid: isValid, errors, values };
}

module.exports = {
  sanitizeString,
  validateNumber,
  validateInitiative,
  validateHP,
  validateAC,
  validateStatModifier,
  validateAbilityScore,
  validateLevel,
  validateSiegeMetric,
  validateString,
  validateEnum,
  validateCombatantType,
  validateLocationStatus,
  validatePlotPointStatus,
  validateFields
};
