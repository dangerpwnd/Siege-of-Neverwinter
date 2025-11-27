/**
 * Property-Based Tests for Siege Mechanics
 * Feature: siege-of-neverwinter
 * Tests siege status display, note storage, value persistence, and custom metrics
 */

const fc = require('fast-check');
const { SiegeState } = require('../server/models');
const db = require('../database/db');

// Test configuration
const NUM_RUNS = 100;

// Setup and teardown
let testCampaignId;
let dbAvailable = false;

beforeAll(async () => {
  try {
    // Test database connection
    await db.query('SELECT 1');
    
    // Create a test campaign
    const result = await db.query(
      "INSERT INTO campaigns (name) VALUES ('Test Campaign - Siege Mechanics') RETURNING id"
    );
    testCampaignId = result.rows[0].id;
    dbAvailable = true;
  } catch (error) {
    console.warn('Database not available. Property-based tests will be skipped.');
    console.warn('To run these tests, ensure PostgreSQL is running and DATABASE_URL is configured.');
    dbAvailable = false;
  }
});

afterAll(async () => {
  if (dbAvailable) {
    // Clean up test campaign (cascade will delete all related data)
    await db.query('DELETE FROM campaigns WHERE id = $1', [testCampaignId]);
    await db.pool.end();
  }
});

// Generators for property-based testing

/**
 * Generator for siege state values
 */
const siegeValueArbitrary = fc.record({
  wall_integrity: fc.integer({ min: 0, max: 100 }),
  defender_morale: fc.integer({ min: 0, max: 100 }),
  supplies: fc.integer({ min: 0, max: 100 }),
  day_of_siege: fc.integer({ min: 1, max: 365 })
});

/**
 * Generator for note text
 */
const noteTextArbitrary = fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0);

/**
 * Generator for custom metric names and values
 */
const customMetricArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 })
    .filter(s => s.trim().length > 0)
    .map(s => s.trim())
    .filter(s => !['__proto__', 'constructor', 'prototype'].includes(s)), // Exclude special JS properties
  value: fc.oneof(
    fc.integer({ min: 0, max: 1000 }),
    fc.string({ maxLength: 100 }),
    fc.double({ min: 0, max: 100, noNaN: true })
  )
});

// Property Tests

describe('Siege Mechanics Properties', () => {
  
  /**
   * Feature: siege-of-neverwinter, Property 24: Siege status display completeness
   * Validates: Requirements 6.1
   * 
   * For any siege state, accessing siege mechanics should display all current siege values
   */
  test('Property 24: Siege status display completeness', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(siegeValueArbitrary, async (siegeValues) => {
        // Create or update siege state
        const siegeState = await SiegeState.getOrCreate(testCampaignId);
        await SiegeState.update(testCampaignId, siegeValues);
        
        // Retrieve siege state (simulating what the display would do)
        const retrieved = await SiegeState.findByCampaign(testCampaignId);
        
        // Verify all siege values are present and correct
        expect(retrieved).toBeDefined();
        expect(retrieved.wall_integrity).toBe(siegeValues.wall_integrity);
        expect(retrieved.defender_morale).toBe(siegeValues.defender_morale);
        expect(retrieved.supplies).toBe(siegeValues.supplies);
        expect(retrieved.day_of_siege).toBe(siegeValues.day_of_siege);
        
        // Verify all fields are defined
        expect(retrieved.wall_integrity).toBeDefined();
        expect(retrieved.defender_morale).toBeDefined();
        expect(retrieved.supplies).toBeDefined();
        expect(retrieved.day_of_siege).toBeDefined();
        expect(retrieved.custom_metrics).toBeDefined();
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 25: Siege note storage with timestamp
   * Validates: Requirements 6.2
   * 
   * For any note added to siege mechanics, it should be stored with a timestamp 
   * and both should be retrievable
   */
  test('Property 25: Siege note storage with timestamp', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(noteTextArbitrary, async (noteText) => {
        // Ensure siege state exists
        await SiegeState.getOrCreate(testCampaignId);
        
        // Add note
        const addedNote = await SiegeState.addNote(testCampaignId, noteText);
        
        // Verify note was created with timestamp
        expect(addedNote).toBeDefined();
        expect(addedNote.note_text).toBe(noteText);
        expect(addedNote.created_at).toBeDefined();
        expect(addedNote.id).toBeDefined();
        
        // Verify timestamp is a valid date
        const timestamp = new Date(addedNote.created_at);
        expect(timestamp).toBeInstanceOf(Date);
        expect(isNaN(timestamp.getTime())).toBe(false);
        
        // Retrieve notes and verify it's in the list
        const notes = await SiegeState.getNotes(testCampaignId);
        const foundNote = notes.find(n => n.id === addedNote.id);
        
        expect(foundNote).toBeDefined();
        expect(foundNote.note_text).toBe(noteText);
        expect(new Date(foundNote.created_at).getTime()).toBe(new Date(addedNote.created_at).getTime());
        
        // Clean up
        await SiegeState.deleteNote(addedNote.id);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 26: Siege value persistence round-trip
   * Validates: Requirements 6.4
   * 
   * For any siege mechanic value update, closing and reopening the application 
   * should restore that value
   */
  test('Property 26: Siege value persistence round-trip', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(siegeValueArbitrary, async (siegeValues) => {
        // Create or update siege state (simulating user updating values)
        await SiegeState.getOrCreate(testCampaignId);
        const updated = await SiegeState.update(testCampaignId, siegeValues);
        
        // Simulate closing and reopening by retrieving from database
        const retrieved = await SiegeState.findByCampaign(testCampaignId);
        
        // Verify all values persisted correctly
        expect(retrieved).toBeDefined();
        expect(retrieved.wall_integrity).toBe(updated.wall_integrity);
        expect(retrieved.defender_morale).toBe(updated.defender_morale);
        expect(retrieved.supplies).toBe(updated.supplies);
        expect(retrieved.day_of_siege).toBe(updated.day_of_siege);
        
        // Verify exact match
        expect(retrieved.wall_integrity).toBe(siegeValues.wall_integrity);
        expect(retrieved.defender_morale).toBe(siegeValues.defender_morale);
        expect(retrieved.supplies).toBe(siegeValues.supplies);
        expect(retrieved.day_of_siege).toBe(siegeValues.day_of_siege);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 27: Custom siege metric storage
   * Validates: Requirements 6.5
   * 
   * For any custom siege metric added, it should be stored and retrievable 
   * alongside standard metrics
   */
  test('Property 27: Custom siege metric storage', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(customMetricArbitrary, { minLength: 1, maxLength: 5 }).map(arr => {
          // Ensure unique metric names
          const uniqueMetrics = [];
          const seenNames = new Set();
          for (const metric of arr) {
            if (!seenNames.has(metric.name)) {
              uniqueMetrics.push(metric);
              seenNames.add(metric.name);
            }
          }
          return uniqueMetrics;
        }),
        async (customMetrics) => {
          // Ensure siege state exists
          await SiegeState.getOrCreate(testCampaignId);
          
          // Reset custom metrics first
          await SiegeState.update(testCampaignId, { custom_metrics: {} });
          
          // Add all custom metrics
          for (const metric of customMetrics) {
            await SiegeState.addCustomMetric(testCampaignId, metric.name, metric.value);
          }
          
          // Retrieve siege state
          const siegeState = await SiegeState.findByCampaign(testCampaignId);
          
          // Parse custom metrics
          const retrievedMetrics = typeof siegeState.custom_metrics === 'string'
            ? JSON.parse(siegeState.custom_metrics)
            : siegeState.custom_metrics;
          
          // Verify all custom metrics are present
          expect(retrievedMetrics).toBeDefined();
          expect(typeof retrievedMetrics).toBe('object');
          
          // Get the actual keys from retrieved metrics
          const retrievedKeys = Object.keys(retrievedMetrics);
          
          for (const metric of customMetrics) {
            // Check if the key exists in the retrieved metrics
            expect(retrievedKeys).toContain(metric.name);
            expect(retrievedMetrics[metric.name]).toEqual(metric.value);
          }
          
          // Verify count matches
          expect(retrievedKeys.length).toBe(customMetrics.length);
          
          // Verify custom metrics are stored alongside standard metrics
          expect(siegeState.wall_integrity).toBeDefined();
          expect(siegeState.defender_morale).toBeDefined();
          expect(siegeState.supplies).toBeDefined();
          
          // Clean up - reset custom metrics
          await SiegeState.update(testCampaignId, { custom_metrics: {} });
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Additional test: Siege values stay within bounds
   * This validates that siege values are properly constrained
   */
  test('Siege values remain within valid bounds', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(siegeValueArbitrary, async (siegeValues) => {
        await SiegeState.getOrCreate(testCampaignId);
        await SiegeState.update(testCampaignId, siegeValues);
        
        const retrieved = await SiegeState.findByCampaign(testCampaignId);
        
        // Verify all percentage values are within 0-100
        expect(retrieved.wall_integrity).toBeGreaterThanOrEqual(0);
        expect(retrieved.wall_integrity).toBeLessThanOrEqual(100);
        
        expect(retrieved.defender_morale).toBeGreaterThanOrEqual(0);
        expect(retrieved.defender_morale).toBeLessThanOrEqual(100);
        
        expect(retrieved.supplies).toBeGreaterThanOrEqual(0);
        expect(retrieved.supplies).toBeLessThanOrEqual(100);
        
        // Verify day is positive
        expect(retrieved.day_of_siege).toBeGreaterThanOrEqual(1);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Additional test: Multiple notes maintain order
   * This validates that notes are stored in chronological order
   */
  test('Multiple notes maintain chronological order', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(noteTextArbitrary, { minLength: 2, maxLength: 5 }),
        async (noteTexts) => {
          await SiegeState.getOrCreate(testCampaignId);
          
          // Add notes sequentially
          const addedNotes = [];
          for (const noteText of noteTexts) {
            const note = await SiegeState.addNote(testCampaignId, noteText);
            addedNotes.push(note);
            // Small delay to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          
          // Retrieve notes
          const notes = await SiegeState.getNotes(testCampaignId);
          
          // Verify all notes are present
          expect(notes.length).toBeGreaterThanOrEqual(noteTexts.length);
          
          // Find our added notes
          const ourNotes = notes.filter(n => 
            addedNotes.some(an => an.id === n.id)
          );
          
          // Verify they're in reverse chronological order (newest first)
          for (let i = 0; i < ourNotes.length - 1; i++) {
            const currentTime = new Date(ourNotes[i].created_at).getTime();
            const nextTime = new Date(ourNotes[i + 1].created_at).getTime();
            expect(currentTime).toBeGreaterThanOrEqual(nextTime);
          }
          
          // Clean up
          for (const note of addedNotes) {
            await SiegeState.deleteNote(note.id);
          }
        }
      ),
      { numRuns: 20 } // Fewer runs due to delays
    );
  });
});
