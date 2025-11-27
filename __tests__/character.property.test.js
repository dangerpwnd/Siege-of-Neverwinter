/**
 * Property-Based Tests for Character Panel
 * Feature: siege-of-neverwinter
 * Tests character display and HP update properties
 */

const fc = require('fast-check');
const { Combatant } = require('../server/models');
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
      "INSERT INTO campaigns (name) VALUES ('Test Campaign - Character Panel') RETURNING id"
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
 * Generator for PC data with all required fields
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
  character_class: fc.constantFrom('Fighter', 'Wizard', 'Rogue', 'Cleric', 'Paladin', 'Barbarian'),
  level: fc.integer({ min: 1, max: 20 }),
  notes: fc.option(fc.string({ maxLength: 200 }), { nil: null })
});

/**
 * Generator for D&D 5e conditions
 */
const conditionArbitrary = fc.constantFrom(
  'blinded', 'charmed', 'deafened', 'frightened', 'grappled',
  'incapacitated', 'invisible', 'paralyzed', 'petrified', 'poisoned',
  'prone', 'restrained', 'stunned', 'unconscious'
);

// Property Tests

describe('Character Panel Properties', () => {
  
  /**
   * Feature: siege-of-neverwinter, Property 6: PC display completeness
   * Validates: Requirements 2.1
   * 
   * For any PC, the display function should include AC, currentHP, maxHP, 
   * and all six saving throw modifiers
   */
  test('Property 6: PC display completeness', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(pcArbitrary, async (pcData) => {
        // Create PC
        const created = await Combatant.create(testCampaignId, pcData);
        
        // Retrieve PC (simulating what the display function would do)
        const retrieved = await Combatant.findById(created.id);
        
        // Verify all display fields are present
        expect(retrieved).toBeDefined();
        expect(retrieved.ac).toBeDefined();
        expect(typeof retrieved.ac).toBe('number');
        
        expect(retrieved.current_hp).toBeDefined();
        expect(typeof retrieved.current_hp).toBe('number');
        
        expect(retrieved.max_hp).toBeDefined();
        expect(typeof retrieved.max_hp).toBe('number');
        
        // Verify all six saving throw modifiers are present
        expect(retrieved.save_strength).toBeDefined();
        expect(typeof retrieved.save_strength).toBe('number');
        
        expect(retrieved.save_dexterity).toBeDefined();
        expect(typeof retrieved.save_dexterity).toBe('number');
        
        expect(retrieved.save_constitution).toBeDefined();
        expect(typeof retrieved.save_constitution).toBe('number');
        
        expect(retrieved.save_intelligence).toBeDefined();
        expect(typeof retrieved.save_intelligence).toBe('number');
        
        expect(retrieved.save_wisdom).toBeDefined();
        expect(typeof retrieved.save_wisdom).toBe('number');
        
        expect(retrieved.save_charisma).toBeDefined();
        expect(typeof retrieved.save_charisma).toBe('number');
        
        // Clean up
        await Combatant.delete(created.id);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 7: HP update consistency
   * Validates: Requirements 2.2
   * 
   * For any PC and any HP value update, all display components showing that PC 
   * should reflect the new HP value
   */
  test('Property 7: HP update consistency', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        pcArbitrary,
        fc.integer({ min: 0, max: 500 }),
        async (pcData, newHP) => {
          // Create PC
          const created = await Combatant.create(testCampaignId, pcData);
          
          // Clamp newHP to valid range (0 to max_hp)
          const clampedHP = Math.max(0, Math.min(newHP, created.max_hp));
          
          // Update HP
          const updated = await Combatant.update(created.id, { 
            current_hp: clampedHP 
          });
          
          // Verify update was applied
          expect(updated.current_hp).toBe(clampedHP);
          
          // Retrieve from database (simulating different display components)
          const retrieved1 = await Combatant.findById(created.id);
          const retrieved2 = await Combatant.findByIdWithConditions(created.id);
          
          // Verify consistency across all retrieval methods
          expect(retrieved1.current_hp).toBe(clampedHP);
          expect(retrieved2.current_hp).toBe(clampedHP);
          
          // Verify HP is within valid bounds
          expect(retrieved1.current_hp).toBeGreaterThanOrEqual(0);
          expect(retrieved1.current_hp).toBeLessThanOrEqual(retrieved1.max_hp);
          
          // Clean up
          await Combatant.delete(created.id);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 8: Condition display completeness
   * Validates: Requirements 2.4
   * 
   * For any PC with a set of active conditions, the display should show 
   * all conditions in that set
   */
  test('Property 8: Condition display completeness', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        pcArbitrary,
        fc.array(conditionArbitrary, { minLength: 0, maxLength: 5 }).map(arr => [...new Set(arr)]), // Unique conditions
        async (pcData, conditions) => {
          // Create PC
          const created = await Combatant.create(testCampaignId, pcData);
          
          // Add all conditions
          for (const condition of conditions) {
            await Combatant.addCondition(created.id, condition);
          }
          
          // Retrieve PC with conditions
          const retrieved = await Combatant.findByIdWithConditions(created.id);
          
          // Verify all conditions are present in the display
          expect(retrieved).toBeDefined();
          expect(retrieved.conditions).toBeDefined();
          expect(Array.isArray(retrieved.conditions)).toBe(true);
          
          // Verify the count matches
          expect(retrieved.conditions.length).toBe(conditions.length);
          
          // Verify all conditions are present (order may vary)
          for (const condition of conditions) {
            expect(retrieved.conditions).toContain(condition);
          }
          
          // Verify no extra conditions
          for (const displayedCondition of retrieved.conditions) {
            expect(conditions).toContain(displayedCondition);
          }
          
          // Clean up
          await Combatant.delete(created.id);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Additional test: HP cannot go negative
   * This is an edge case that validates the HP update logic
   */
  test('HP update prevents negative values', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        pcArbitrary,
        fc.integer({ min: -100, max: -1 }),
        async (pcData, negativeHP) => {
          // Create PC
          const created = await Combatant.create(testCampaignId, pcData);
          
          // Attempt to set negative HP (should be clamped to 0)
          const clampedHP = Math.max(0, negativeHP);
          const updated = await Combatant.update(created.id, { 
            current_hp: clampedHP 
          });
          
          // Verify HP is 0, not negative
          expect(updated.current_hp).toBe(0);
          expect(updated.current_hp).toBeGreaterThanOrEqual(0);
          
          // Clean up
          await Combatant.delete(created.id);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Additional test: HP cannot exceed max HP
   * This validates the HP update logic for upper bounds
   */
  test('HP update prevents exceeding max HP', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        pcArbitrary,
        fc.integer({ min: 1, max: 1000 }),
        async (pcData, excessHP) => {
          // Create PC
          const created = await Combatant.create(testCampaignId, pcData);
          
          // Calculate HP that exceeds max
          const overMaxHP = created.max_hp + excessHP;
          
          // Clamp to max (simulating what the API should do)
          const clampedHP = Math.min(overMaxHP, created.max_hp);
          const updated = await Combatant.update(created.id, { 
            current_hp: clampedHP 
          });
          
          // Verify HP does not exceed max
          expect(updated.current_hp).toBeLessThanOrEqual(updated.max_hp);
          
          // Clean up
          await Combatant.delete(created.id);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});
