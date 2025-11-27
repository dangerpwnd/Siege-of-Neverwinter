# Testing Guide

## Overview

This project includes two types of tests:

1. **Validation Tests** - Unit tests that verify model validation logic without requiring a database
2. **Property-Based Tests** - Tests that verify data completeness properties using fast-check (requires database)

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test -- models.validation.test.js
npm test -- models.property.test.js
```

## Test Types

### Validation Tests (`models.validation.test.js`)
These tests verify that model validation functions correctly reject invalid data and accept valid data. They do not require a database connection and will always run.

**Coverage:**
- Combatant validation (required fields, type validation, HP/AC bounds)
- Monster validation (stat ranges, required fields)
- SiegeState validation (value ranges 0-100)
- Location validation (status values, required fields)
- PlotPoint validation (status values, required fields)

### Property-Based Tests (`models.property.test.js`)
These tests use fast-check to generate random valid data and verify that data completeness properties hold across all inputs. They require a PostgreSQL database connection.

**Properties Tested:**
- **Property 1**: Combatant data completeness (Requirements 1.1)
- **Property 9**: Character data storage completeness (Requirements 2.5)
- **Property 14**: NPC data storage completeness (Requirements 4.1)

Each property test runs 100 iterations with randomly generated data.

## Database Setup for Property Tests

To run property-based tests, you need:

1. PostgreSQL installed and running
2. Database created: `siege_of_neverwinter`
3. Environment variable configured in `.env`:
   ```
   DATABASE_URL=postgresql://postgres:password@localhost:5432/siege_of_neverwinter
   ```
4. Schema initialized:
   ```bash
   npm run db:migrate
   ```

If the database is not available, property-based tests will be automatically skipped with a warning message.

## Test Configuration

- Test framework: Jest
- Property-based testing library: fast-check
- Configuration: `jest.config.js`
- Number of property test runs: 100 (configurable in test file)

## Writing New Tests

### Adding Validation Tests
Add new test cases to `__tests__/models.validation.test.js` following the existing pattern:

```javascript
test('should validate something', () => {
  const data = { /* test data */ };
  const errors = Model.validate(data);
  expect(errors).toEqual([]);
});
```

### Adding Property Tests
Add new property tests to `__tests__/models.property.test.js`:

1. Create a generator using fast-check arbitraries
2. Write the property test with proper documentation
3. Include the property number and requirements reference
4. Add database availability check

```javascript
test('Property X: Description', async () => {
  if (!dbAvailable) {
    console.log('Skipping test - database not available');
    return;
  }
  
  await fc.assert(
    fc.asyncProperty(arbitrary, async (data) => {
      // Test logic
    }),
    { numRuns: NUM_RUNS }
  );
});
```
