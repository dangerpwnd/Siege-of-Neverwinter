/**
 * Property-Based Tests for Data Models
 * Feature: siege-of-neverwinter
 * Tests data model completeness properties
 */

const fc = require('fast-check');
const { Combatant, Monster, SiegeState, Location, PlotPoint } = require('../server/models');
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
      "INSERT INTO campaigns (name) VALUES ('Test Campaign') RETURNING id"
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
 * Generator for valid combatant data
 * Note: We don't include character_class and level here because they're PC-specific
 * and the validation will fail if type is not PC but these fields are present
 */
const combatantArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  type: fc.constantFrom('PC', 'NPC', 'Monster'),
  initiative: fc.integer({ min: -10, max: 30 }),
  ac: fc.integer({ min: 0, max: 30 }),
  current_hp: fc.integer({ min: 0, max: 500 }),
  max_hp: fc.integer({ min: 1, max: 500 }),
  save_strength: fc.integer({ min: -5, max: 15 }),
  save_dexterity: fc.integer({ min: -5, max: 15 }),
  save_constitution: fc.integer({ min: -5, max: 15 }),
  save_intelligence: fc.integer({ min: -5, max: 15 }),
  save_wisdom: fc.integer({ min: -5, max: 15 }),
  save_charisma: fc.integer({ min: -5, max: 15 })
});

/**
 * Generator for PC-specific data
 */
const pcArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  type: fc.constant('PC'),
  initiative: fc.integer({ min: -10, max: 30 }),
  ac: fc.integer({ min: 0, max: 30 }),
  current_hp: fc.integer({ min: 0, max: 500 }),
  max_hp: fc.integer({ min: 1, max: 500 }),
  save_strength: fc.integer({ min: -5, max: 15 }),
  save_dexterity: fc.integer({ min: -5, max: 15 }),
  save_constitution: fc.integer({ min: -5, max: 15 }),
  save_intelligence: fc.integer({ min: -5, max: 15 }),
  save_wisdom: fc.integer({ min: -5, max: 15 }),
  save_charisma: fc.integer({ min: -5, max: 15 }),
  character_class: fc.constantFrom('Fighter', 'Wizard', 'Rogue', 'Cleric', 'Paladin'),
  level: fc.integer({ min: 1, max: 20 }),
  notes: fc.option(fc.string({ maxLength: 200 }), { nil: null })
});

/**
 * Generator for NPC-specific data
 */
const npcArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  type: fc.constant('NPC'),
  initiative: fc.integer({ min: -10, max: 30 }),
  ac: fc.integer({ min: 0, max: 30 }),
  current_hp: fc.integer({ min: 0, max: 500 }),
  max_hp: fc.integer({ min: 1, max: 500 }),
  save_strength: fc.integer({ min: -5, max: 15 }),
  save_dexterity: fc.integer({ min: -5, max: 15 }),
  save_constitution: fc.integer({ min: -5, max: 15 }),
  save_intelligence: fc.integer({ min: -5, max: 15 }),
  save_wisdom: fc.integer({ min: -5, max: 15 }),
  save_charisma: fc.integer({ min: -5, max: 15 }),
  notes: fc.option(fc.string({ maxLength: 200 }), { nil: null })
});

// Property Tests

describe('Data Model Completeness Properties', () => {
  
  /**
   * Feature: siege-of-neverwinter, Property 1: Combatant data completeness
   * Validates: Requirements 1.1
   * 
   * For any combatant added to the initiative tracker, retrieving that combatant 
   * should return all required fields (name, initiative, type, ac, currentHP, maxHP, saves)
   */
  test('Property 1: Combatant data completeness', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    await fc.assert(
      fc.asyncProperty(combatantArbitrary, async (combatantData) => {
        // Create combatant
        const created = await Combatant.create(testCampaignId, combatantData);
        
        // Retrieve combatant
        const retrieved = await Combatant.findById(created.id);
        
        // Verify all required fields are present and match
        // Note: name is sanitized (trimmed) during creation
        expect(retrieved).toBeDefined();
        expect(retrieved.name).toBe(combatantData.name.trim());
        expect(retrieved.type).toBe(combatantData.type);
        expect(retrieved.initiative).toBe(combatantData.initiative || 0);
        expect(retrieved.ac).toBe(combatantData.ac);
        expect(retrieved.current_hp).toBe(Math.max(0, combatantData.current_hp)); // HP is clamped to 0
        expect(retrieved.max_hp).toBe(combatantData.max_hp);
        expect(retrieved.save_strength).toBe(combatantData.save_strength || 0);
        expect(retrieved.save_dexterity).toBe(combatantData.save_dexterity || 0);
        expect(retrieved.save_constitution).toBe(combatantData.save_constitution || 0);
        expect(retrieved.save_intelligence).toBe(combatantData.save_intelligence || 0);
        expect(retrieved.save_wisdom).toBe(combatantData.save_wisdom || 0);
        expect(retrieved.save_charisma).toBe(combatantData.save_charisma || 0);
        
        // Clean up
        await Combatant.delete(created.id);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 9: Character data storage completeness
   * Validates: Requirements 2.5
   * 
   * For any PC created with name, class, level, and identifying information, 
   * all fields should be retrievable from storage
   */
  test('Property 9: Character data storage completeness', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    await fc.assert(
      fc.asyncProperty(pcArbitrary, async (pcData) => {
        // Create PC
        const created = await Combatant.create(testCampaignId, pcData);
        
        // Retrieve PC
        const retrieved = await Combatant.findById(created.id);
        
        // Verify all PC-specific fields are present and match
        // Note: name is sanitized (trimmed) during creation
        expect(retrieved).toBeDefined();
        expect(retrieved.name).toBe(pcData.name.trim());
        expect(retrieved.type).toBe('PC');
        expect(retrieved.character_class).toBe(pcData.character_class);
        expect(retrieved.level).toBe(pcData.level);
        expect(retrieved.ac).toBe(pcData.ac);
        expect(retrieved.current_hp).toBe(Math.max(0, pcData.current_hp)); // HP is clamped to 0
        expect(retrieved.max_hp).toBe(pcData.max_hp);
        expect(retrieved.save_strength).toBe(pcData.save_strength);
        expect(retrieved.save_dexterity).toBe(pcData.save_dexterity);
        expect(retrieved.save_constitution).toBe(pcData.save_constitution);
        expect(retrieved.save_intelligence).toBe(pcData.save_intelligence);
        expect(retrieved.save_wisdom).toBe(pcData.save_wisdom);
        expect(retrieved.save_charisma).toBe(pcData.save_charisma);
        
        // Clean up
        await Combatant.delete(created.id);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 14: NPC data storage completeness
   * Validates: Requirements 4.1
   * 
   * For any NPC created, all required fields (name, AC, HP, saving throw modifiers) 
   * should be stored and retrievable
   */
  test('Property 14: NPC data storage completeness', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    await fc.assert(
      fc.asyncProperty(npcArbitrary, async (npcData) => {
        // Create NPC
        const created = await Combatant.create(testCampaignId, npcData);
        
        // Retrieve NPC
        const retrieved = await Combatant.findById(created.id);
        
        // Verify all NPC-specific fields are present and match
        // Note: name is sanitized (trimmed) during creation
        expect(retrieved).toBeDefined();
        expect(retrieved.name).toBe(npcData.name.trim());
        expect(retrieved.type).toBe('NPC');
        expect(retrieved.ac).toBe(npcData.ac);
        expect(retrieved.current_hp).toBe(Math.max(0, npcData.current_hp)); // HP is clamped to 0
        expect(retrieved.max_hp).toBe(npcData.max_hp);
        expect(retrieved.save_strength).toBe(npcData.save_strength);
        expect(retrieved.save_dexterity).toBe(npcData.save_dexterity);
        expect(retrieved.save_constitution).toBe(npcData.save_constitution);
        expect(retrieved.save_intelligence).toBe(npcData.save_intelligence);
        expect(retrieved.save_wisdom).toBe(npcData.save_wisdom);
        expect(retrieved.save_charisma).toBe(npcData.save_charisma);
        
        // Clean up
        await Combatant.delete(created.id);
      }),
      { numRuns: NUM_RUNS }
    );
  });
});
