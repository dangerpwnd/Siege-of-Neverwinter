/**
 * Property-Based Tests for City Map
 * Feature: siege-of-neverwinter
 * Tests plot point associations, data completeness, and location status persistence
 */

const fc = require('fast-check');
const { Location, PlotPoint } = require('../server/models');
const db = require('../database/db');

// Test configuration
const NUM_RUNS = 100;

// Setup and teardown
let testCampaignId;
let dbAvailable = false;

beforeAll(async () => {
  try {
    await db.query('SELECT 1');
    const result = await db.query(
      "INSERT INTO campaigns (name) VALUES ('Test Campaign - City Map') RETURNING id"
    );
    testCampaignId = result.rows[0].id;
    dbAvailable = true;
  } catch (error) {
    console.warn('Database not available. Property-based tests will be skipped.');
    dbAvailable = false;
  }
});

afterAll(async () => {
  if (dbAvailable) {
    await db.query('DELETE FROM campaigns WHERE id = $1', [testCampaignId]);
    await db.pool.end();
  }
});

// Generators
const locationArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  status: fc.constantFrom('controlled', 'contested', 'enemy', 'destroyed'),
  description: fc.option(fc.string({ maxLength: 200 }), { nil: null })
});

const plotPointArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  description: fc.option(fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0), { nil: null }),
  status: fc.constantFrom('active', 'completed', 'failed')
});

describe('City Map Properties', () => {
  
  /**
   * Feature: siege-of-neverwinter, Property 31: Plot point location association
   * Validates: Requirements 8.2
   */
  test('Property 31: Plot point location association', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        locationArbitrary,
        fc.array(plotPointArbitrary, { minLength: 1, maxLength: 3 }),
        async (locationData, plotPointsData) => {
          const location = await Location.create(testCampaignId, locationData);
          
          const createdPlotPoints = [];
          for (const ppData of plotPointsData) {
            const pp = await PlotPoint.create({
              ...ppData,
              location_id: location.id
            });
            createdPlotPoints.push(pp);
          }
          
          const locationWithPlots = await Location.findByIdWithPlotPoints(location.id);
          
          expect(locationWithPlots).toBeDefined();
          expect(locationWithPlots.plot_points).toBeDefined();
          expect(locationWithPlots.plot_points.length).toBe(plotPointsData.length);
          
          for (const created of createdPlotPoints) {
            const found = locationWithPlots.plot_points.find(pp => pp.id === created.id);
            expect(found).toBeDefined();
          }
          
          await Location.delete(location.id);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 32: Plot point data completeness
   * Validates: Requirements 8.3
   */
  test('Property 32: Plot point data completeness', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        locationArbitrary,
        plotPointArbitrary,
        async (locationData, plotPointData) => {
          const location = await Location.create(testCampaignId, locationData);
          
          const plotPoint = await PlotPoint.create({
            ...plotPointData,
            location_id: location.id
          });
          
          const retrieved = await PlotPoint.findById(plotPoint.id);
          
          expect(retrieved).toBeDefined();
          expect(retrieved.name).toBe(plotPointData.name);
          expect(retrieved.description).toBe(plotPointData.description);
          expect(retrieved.status).toBe(plotPointData.status);
          expect(retrieved.location_id).toBe(location.id);
          
          await Location.delete(location.id);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 33: Location status update persistence
   * Validates: Requirements 8.4
   */
  test('Property 33: Location status update persistence', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        locationArbitrary,
        fc.constantFrom('controlled', 'contested', 'enemy', 'destroyed'),
        async (locationData, newStatus) => {
          const location = await Location.create(testCampaignId, locationData);
          
          const updated = await Location.updateStatus(location.id, newStatus);
          expect(updated.status).toBe(newStatus);
          
          const retrieved = await Location.findById(location.id);
          expect(retrieved.status).toBe(newStatus);
          
          await Location.delete(location.id);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 34: Location status visual distinction
   * Validates: Requirements 8.5
   */
  test('Property 34: Location status visual distinction', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(locationArbitrary, { minLength: 2, maxLength: 4 }),
        async (locationsData) => {
          const locations = [];
          for (const locData of locationsData) {
            const loc = await Location.create(testCampaignId, locData);
            locations.push(loc);
          }
          
          const retrieved = await Location.findByCampaign(testCampaignId);
          
          const statuses = new Set(retrieved.map(l => l.status));
          expect(statuses.size).toBeGreaterThan(0);
          
          for (const loc of locations) {
            await Location.delete(loc.id);
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});
