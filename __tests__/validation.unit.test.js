/**
 * Unit Tests for Input Validation
 * Tests validation logic for initiative, HP, AC, and stat modifiers
 * Requirements: 1.1, 2.2
 */

const {
  validateInitiative,
  validateHP,
  validateAC,
  validateStatModifier,
  validateString,
  sanitizeString,
  validateNumber
} = require('../server/utils/validation');

describe('Initiative Validation', () => {
  test('should accept valid initiative values', () => {
    const result1 = validateInitiative(15);
    expect(result1.valid).toBe(true);
    expect(result1.value).toBe(15);

    const result2 = validateInitiative(0);
    expect(result2.valid).toBe(true);
    expect(result2.value).toBe(0);

    const result3 = validateInitiative(-5);
    expect(result3.valid).toBe(true);
    expect(result3.value).toBe(-5);
  });

  test('should reject initiative values outside valid range', () => {
    const result1 = validateInitiative(100);
    expect(result1.valid).toBe(false);
    expect(result1.error).toContain('at most 50');

    const result2 = validateInitiative(-20);
    expect(result2.valid).toBe(false);
    expect(result2.error).toContain('at least -10');
  });

  test('should reject non-numeric initiative values', () => {
    const result1 = validateInitiative('abc');
    expect(result1.valid).toBe(false);
    expect(result1.error).toContain('valid number');

    const result2 = validateInitiative(null);
    expect(result2.valid).toBe(false);
    expect(result2.error).toContain('required');

    const result3 = validateInitiative(undefined);
    expect(result3.valid).toBe(false);
    expect(result3.error).toContain('required');
  });

  test('should accept decimal initiative values', () => {
    const result = validateInitiative(15.5);
    expect(result.valid).toBe(true);
    expect(result.value).toBe(15.5);
  });
});

describe('HP Validation', () => {
  test('should accept valid current HP values', () => {
    const result1 = validateHP(30, false);
    expect(result1.valid).toBe(true);
    expect(result1.value).toBe(30);

    const result2 = validateHP(0, false);
    expect(result2.valid).toBe(true);
    expect(result2.value).toBe(0);
  });

  test('should prevent negative current HP values', () => {
    const result = validateHP(-10, false);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at least 0');
  });

  test('should accept valid max HP values', () => {
    const result = validateHP(50, true);
    expect(result.valid).toBe(true);
    expect(result.value).toBe(50);
  });

  test('should reject zero or negative max HP values', () => {
    const result1 = validateHP(0, true);
    expect(result1.valid).toBe(false);
    expect(result1.error).toContain('at least 1');

    const result2 = validateHP(-5, true);
    expect(result2.valid).toBe(false);
    expect(result2.error).toContain('at least 1');
  });

  test('should reject non-integer HP values', () => {
    const result = validateHP(25.5, false);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('integer');
  });

  test('should reject non-numeric HP values', () => {
    const result1 = validateHP('abc', false);
    expect(result1.valid).toBe(false);
    expect(result1.error).toContain('valid number');

    const result2 = validateHP(null, false);
    expect(result2.valid).toBe(false);
    expect(result2.error).toContain('required');
  });

  test('should reject HP values exceeding maximum', () => {
    const result = validateHP(10000, false);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at most 9999');
  });
});

describe('AC Validation', () => {
  test('should accept valid AC values', () => {
    const result1 = validateAC(15);
    expect(result1.valid).toBe(true);
    expect(result1.value).toBe(15);

    const result2 = validateAC(0);
    expect(result2.valid).toBe(true);
    expect(result2.value).toBe(0);

    const result3 = validateAC(30);
    expect(result3.valid).toBe(true);
    expect(result3.value).toBe(30);
  });

  test('should reject negative AC values', () => {
    const result = validateAC(-5);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at least 0');
  });

  test('should reject AC values exceeding maximum', () => {
    const result = validateAC(100);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at most 50');
  });

  test('should reject non-integer AC values', () => {
    const result = validateAC(15.5);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('integer');
  });

  test('should reject non-numeric AC values', () => {
    const result1 = validateAC('high');
    expect(result1.valid).toBe(false);
    expect(result1.error).toContain('valid number');

    const result2 = validateAC(null);
    expect(result2.valid).toBe(false);
    expect(result2.error).toContain('required');
  });
});

describe('Stat Modifier Validation', () => {
  test('should accept valid stat modifier values', () => {
    const result1 = validateStatModifier(5);
    expect(result1.valid).toBe(true);
    expect(result1.value).toBe(5);

    const result2 = validateStatModifier(0);
    expect(result2.valid).toBe(true);
    expect(result2.value).toBe(0);

    const result3 = validateStatModifier(-3);
    expect(result3.valid).toBe(true);
    expect(result3.value).toBe(-3);
  });

  test('should reject stat modifiers outside valid range', () => {
    const result1 = validateStatModifier(25);
    expect(result1.valid).toBe(false);
    expect(result1.error).toContain('at most 20');

    const result2 = validateStatModifier(-15);
    expect(result2.valid).toBe(false);
    expect(result2.error).toContain('at least -10');
  });

  test('should reject non-integer stat modifiers', () => {
    const result = validateStatModifier(2.5);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('integer');
  });

  test('should reject non-numeric stat modifiers', () => {
    const result = validateStatModifier('high');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('valid number');
  });
});

describe('Input Sanitization', () => {
  test('should remove script tags from input', () => {
    const input = 'Hello <script>alert("XSS")</script> World';
    const sanitized = sanitizeString(input);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('</script>');
    expect(sanitized).toContain('Hello');
    expect(sanitized).toContain('World');
  });

  test('should remove event handlers from input', () => {
    const input1 = '<div onclick="alert(\'XSS\')">Click me</div>';
    const sanitized1 = sanitizeString(input1);
    expect(sanitized1).not.toContain('onclick');

    const input2 = '<img onerror="alert(\'XSS\')" src="x">';
    const sanitized2 = sanitizeString(input2);
    expect(sanitized2).not.toContain('onerror');
  });

  test('should remove javascript: protocol', () => {
    const input = '<a href="javascript:alert(\'XSS\')">Link</a>';
    const sanitized = sanitizeString(input);
    expect(sanitized.toLowerCase()).not.toContain('javascript:');
  });

  test('should remove data:text/html protocol', () => {
    const input = '<a href="data:text/html,<script>alert(\'XSS\')</script>">Link</a>';
    const sanitized = sanitizeString(input);
    expect(sanitized.toLowerCase()).not.toContain('data:text/html');
  });

  test('should preserve safe content', () => {
    const input = 'This is a safe string with numbers 123 and symbols !@#';
    const sanitized = sanitizeString(input);
    expect(sanitized).toBe(input.trim());
  });

  test('should handle non-string input', () => {
    expect(sanitizeString(123)).toBe(123);
    expect(sanitizeString(null)).toBe(null);
    expect(sanitizeString(undefined)).toBe(undefined);
  });

  test('should trim whitespace', () => {
    const input = '  Hello World  ';
    const sanitized = sanitizeString(input);
    expect(sanitized).toBe('Hello World');
  });
});

describe('String Validation', () => {
  test('should accept valid strings', () => {
    const result = validateString('Test Character', {
      required: true,
      minLength: 1,
      maxLength: 100,
      fieldName: 'Name'
    });
    expect(result.valid).toBe(true);
    expect(result.value).toBe('Test Character');
  });

  test('should reject empty required strings', () => {
    const result = validateString('', {
      required: true,
      fieldName: 'Name'
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('required');
  });

  test('should accept empty optional strings', () => {
    const result = validateString('', {
      required: false,
      fieldName: 'Notes'
    });
    expect(result.valid).toBe(true);
    expect(result.value).toBe('');
  });

  test('should reject strings that are too short', () => {
    const result = validateString('AB', {
      minLength: 3,
      fieldName: 'Name'
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at least 3 characters');
  });

  test('should reject strings that are too long', () => {
    const longString = 'A'.repeat(101);
    const result = validateString(longString, {
      maxLength: 100,
      fieldName: 'Name'
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at most 100 characters');
  });

  test('should sanitize strings during validation', () => {
    const result = validateString('<script>alert("XSS")</script>Test', {
      required: true,
      fieldName: 'Name'
    });
    expect(result.valid).toBe(true);
    expect(result.value).not.toContain('<script>');
    expect(result.value).toContain('Test');
  });

  test('should reject non-string input', () => {
    const result = validateString(123, {
      required: true,
      fieldName: 'Name'
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must be a string');
  });
});

describe('Number Validation Edge Cases', () => {
  test('should reject NaN', () => {
    const result = validateNumber(NaN, { fieldName: 'Test' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('valid number');
  });

  test('should reject Infinity', () => {
    const result = validateNumber(Infinity, { fieldName: 'Test' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('valid number');
  });

  test('should reject -Infinity', () => {
    const result = validateNumber(-Infinity, { fieldName: 'Test' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('valid number');
  });

  test('should handle string numbers', () => {
    const result = validateNumber('42', { fieldName: 'Test' });
    expect(result.valid).toBe(true);
    expect(result.value).toBe(42);
  });

  test('should handle zero', () => {
    const result = validateNumber(0, { min: 0, fieldName: 'Test' });
    expect(result.valid).toBe(true);
    expect(result.value).toBe(0);
  });
});
