# Input Validation and Error Handling Implementation

## Overview
This document describes the input validation and error handling implementation for the Siege of Neverwinter application, completing Task 13 and subtask 13.1.

## Components Implemented

### 1. Server-Side Validation (`server/utils/validation.js`)

Comprehensive validation utilities for all numeric and string inputs:

#### Numeric Validation
- **validateInitiative()**: Validates initiative values (-10 to 50, allows decimals)
- **validateHP()**: Validates HP values (current: 0-9999, max: 1-9999, integers only)
- **validateAC()**: Validates AC values (0-50, integers only)
- **validateStatModifier()**: Validates stat modifiers (-10 to 20, integers only)
- **validateAbilityScore()**: Validates ability scores (1-30, integers only)
- **validateLevel()**: Validates character levels (1-20, integers only)
- **validateSiegeMetric()**: Validates siege metrics (0-100, allows decimals)

#### String Validation & Sanitization
- **sanitizeString()**: Removes XSS attack vectors:
  - Removes `<script>` tags
  - Removes event handlers (onclick, onerror, etc.)
  - Removes `javascript:` protocol
  - Removes `data:text/html` protocol
  - Trims whitespace
- **validateString()**: Validates string length and requirements

#### Enum Validation
- **validateCombatantType()**: Validates PC/NPC/Monster types
- **validateLocationStatus()**: Validates location statuses
- **validatePlotPointStatus()**: Validates plot point statuses

### 2. Error Handling Middleware (`server/middleware/errorHandler.js`)

Centralized error handling for the Express server:

#### Custom Error Classes
- **ValidationError**: For input validation failures (400)
- **NotFoundError**: For missing resources (404)
- **DatabaseError**: For database operation failures (500)

#### Error Handler Features
- Translates PostgreSQL error codes to user-friendly messages
- Handles JSON parsing errors
- Provides detailed errors in development, sanitized in production
- Logs all errors for debugging
- Returns consistent error response format

#### Middleware Functions
- **errorHandler**: Main error handling middleware
- **notFoundHandler**: 404 handler for undefined routes
- **asyncHandler**: Wraps async route handlers to catch errors
- **createValidationError**: Helper to create validation errors

### 3. Client-Side Validation (`client/js/validation.js`)

Frontend validation matching server-side rules:

#### Validation Functions
- Mirrors all server-side numeric validators
- Client-side XSS sanitization using browser APIs
- Real-time validation feedback

#### UI Integration
- **showError()**: Displays validation errors next to inputs
- **clearError()**: Removes error messages
- **setupValidation()**: Attaches validators to form fields
- **preventNegativeHP()**: Prevents negative HP input

### 4. Error Boundary System (`client/js/errorBoundary.js`)

Frontend error handling and recovery:

#### ErrorBoundary Class
- Catches and handles JavaScript errors in modules
- Displays user-friendly error messages
- Provides recovery options (reload/dismiss)
- Wraps functions with automatic error handling

#### Features
- Global error handler for uncaught exceptions
- Promise rejection handling
- Module-specific error isolation
- API call error handling
- Error notifications

### 5. Error Styling (`client/styles/main.css`)

Visual feedback for validation states:

- Error state styling (red borders, background)
- Success state styling (green borders)
- Disabled state styling
- Error boundary component styling
- Error notification animations

## Model Integration

The validation utilities are integrated into the Combatant model:

- **validate()** method uses new validation functions
- **create()** method sanitizes string inputs
- **update()** method sanitizes and validates partial updates
- Prevents negative HP values automatically

## Unit Tests (`__tests__/validation.unit.test.js`)

Comprehensive test coverage (39 tests, all passing):

### Test Suites
1. **Initiative Validation** (4 tests)
   - Valid values, range limits, non-numeric inputs, decimals

2. **HP Validation** (6 tests)
   - Current/max HP, negative prevention, integer requirement, range limits

3. **AC Validation** (5 tests)
   - Valid values, negative prevention, range limits, integer requirement

4. **Stat Modifier Validation** (4 tests)
   - Valid range, limits, integer requirement, non-numeric inputs

5. **Input Sanitization** (7 tests)
   - Script tag removal, event handler removal, protocol removal
   - Safe content preservation, whitespace trimming

6. **String Validation** (7 tests)
   - Required/optional fields, length limits, sanitization, type checking

7. **Number Validation Edge Cases** (5 tests)
   - NaN, Infinity, string numbers, zero handling

## Requirements Coverage

### Requirement 1.1 (Initiative Tracking)
- ✅ Initiative values validated (-10 to 50)
- ✅ Non-numeric values rejected
- ✅ User-friendly error messages

### Requirement 2.2 (HP Updates)
- ✅ HP values validated (0-9999)
- ✅ Negative HP values prevented
- ✅ Max HP must be positive
- ✅ Integer values enforced

### All Requirements (Error Handling)
- ✅ Validation for all numeric inputs
- ✅ XSS prevention through sanitization
- ✅ User-friendly error messages
- ✅ Error boundaries for module failures
- ✅ Database error handling
- ✅ API error handling

## Usage Examples

### Server-Side
```javascript
const { validateHP, sanitizeString } = require('./utils/validation');

// Validate HP
const result = validateHP(currentHP, false);
if (!result.valid) {
  throw new ValidationError(result.error);
}

// Sanitize user input
const safeName = sanitizeString(userInput);
```

### Client-Side
```javascript
// Setup validation on input
const hpInput = document.getElementById('hp-input');
setupValidation(hpInput, (value) => validateHP(value, false));

// Prevent negative HP
preventNegativeHP(hpInput);

// Create error boundary for module
const boundary = createErrorBoundary('#initiative-tracker', 'Initiative Tracker');
```

## Security Features

1. **XSS Prevention**
   - Script tag removal
   - Event handler stripping
   - Protocol sanitization
   - HTML entity encoding (client-side)

2. **Input Validation**
   - Type checking
   - Range validation
   - Format validation
   - Required field enforcement

3. **Error Information Disclosure**
   - Detailed errors in development
   - Sanitized errors in production
   - No stack traces in production

## Testing

Run validation tests:
```bash
npm test -- validation.unit.test.js
```

All 39 tests pass successfully, covering:
- Valid input acceptance
- Invalid input rejection
- Edge case handling
- XSS prevention
- Error message clarity

## Future Enhancements

1. Rate limiting for API endpoints
2. CSRF token validation
3. Input history tracking
4. Validation rule configuration
5. Custom validation rules per campaign
6. Batch validation for bulk operations
7. Validation error analytics

## Conclusion

The implementation provides comprehensive input validation and error handling for both server and client sides, ensuring data integrity, preventing XSS attacks, and providing excellent user experience through clear error messages and recovery options.
