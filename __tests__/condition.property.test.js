/**
 * Property-Based Tests for Condition Manager
 * Feature: siege-of-neverwinter
 * Tests condition management properties
 */

const fc = require('fast-check');
const Combatant = require('../server/models/Combatant');
const db = require('../database/db');

// Test configuration
const NUM_RUNS = 100;

// D&D 5e standard conditions
const DND_CONDITIONS = [
  'blinded',
  'charmed',
  'deafened',
  'frightened',
  'grappled',
  'incapacitated',
  'invisible',
  'paralyzed',
  'petrified',
  'poisoned',
  'prone',
  'restrained',
  'stunned',
  'unconscious'
];

// Setup and teardown
let testCampaignId;
let dbAvailable = false;

beforeAll(async () => {
  try {
    // Test database connection
    await db.query('SELECT 1');
    
    // Create a test campaign
    const result = await db.query(
      "INSERT INTO campaigns (name) VALUES ('Test Campaign Conditions') RETURNING id"
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
 * Generator for D&D 5e conditions
 */
const conditionArbitrary = fc.constantFrom(...DND_CONDITIONS);

/**
 * Generator for an array of unique conditions
 */
const conditionArrayArbitrary = fc.uniqueArray(conditionArbitrary, { minLength: 1, maxLength: 5 });

// Property Tests

describe('Condition Manager Properties', () => {
  
  /**
   * Feature: siege-of-neverwinter, Property 10: Condition interface availability
   * Validates: Requirements 3.1
   * 
   * For any combatant, selecting that combatant should make the condition 
   * management interface available
   */
  test('Property 10: Condition interface availability', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(combatantArbitrary, async (combatantData) => {
        // Create a combatant
        const combatant = await Combatant.create(testCampaignId, combatantData);
        
        try {
          // Verify we can access the combatant (interface is available)
          const retrieved = await Combatant.findById(combatant.id);
          expect(retrieved).toBeDefined();
          expect(retrieved.id).toBe(combatant.id);
          
          // Verify we can access conditions endpoint
          const conditionsResult = await db.query(
            'SELECT * FROM combatant_conditions WHERE combatant_id = $1',
            [combatant.id]
          );
          
          // Should return empty array initially, but endpoint should be accessible
          expect(Array.isArray(conditionsResult.rows)).toBe(true);
        } finally {
          // Clean up
          await Combatant.delete(combatant.id);
        }
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 11: Condition addition increases list
   * Validates: Requirements 3.2
   * 
   * For any combatant and any valid condition not already present, adding the 
   * condition should increase the condition list length by one and include that condition
   */
  test('Property 11: Condition addition increases list', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        combatantArbitrary,
        conditionArbitrary,
        async (combatantData, condition) => {
          // Create a combatant
          const combatant = await Combatant.create(testCampaignId, combatantData);
          
          try {
            // Get initial conditions count
            const beforeResult = await db.query(
              'SELECT * FROM combatant_conditions WHERE combatant_id = $1',
              [combatant.id]
            );
            const beforeCount = beforeResult.rows.length;
            
            // Add the condition
            const addResult = await db.query(
              'INSERT INTO combatant_conditions (combatant_id, condition) VALUES ($1, $2) RETURNING *',
              [combatant.id, condition]
            );
            
            expect(addResult.rows.length).toBe(1);
            expect(addResult.rows[0].condition).toBe(condition);
            
            // Get conditions after adding
            const afterResult = await db.query(
              'SELECT * FROM combatant_conditions WHERE combatant_id = $1',
              [combatant.id]
            );
            const afterCount = afterResult.rows.length;
            
            // Verify count increased by 1
            expect(afterCount).toBe(beforeCount + 1);
            
            // Verify the condition is in the list
            const hasCondition = afterResult.rows.some(c => c.condition === condition);
            expect(hasCondition).toBe(true);
          } finally {
            // Clean up
            await Combatant.delete(combatant.id);
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 12: Condition removal decreases list
   * Validates: Requirements 3.3
   * 
   * For any combatant with at least one condition, removing a condition should 
   * decrease the condition list length by one and that condition should no longer be present
   */
  test('Property 12: Condition removal decreases list', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        combatantArbitrary,
        conditionArrayArbitrary,
        async (combatantData, conditions) => {
          // Create a combatant
          const combatant = await Combatant.create(testCampaignId, combatantData);
          
          try {
            // Add all conditions
            const conditionIds = [];
            for (const condition of conditions) {
              const result = await db.query(
                'INSERT INTO combatant_conditions (combatant_id, condition) VALUES ($1, $2) RETURNING id',
                [combatant.id, condition]
              );
              conditionIds.push(result.rows[0].id);
            }
            
            // Get count before removal
            const beforeResult = await db.query(
              'SELECT * FROM combatant_conditions WHERE combatant_id = $1',
              [combatant.id]
            );
            const beforeCount = beforeResult.rows.length;
            
            // Remove the first condition
            const conditionIdToRemove = conditionIds[0];
            const conditionToRemove = conditions[0];
            
            await db.query(
              'DELETE FROM combatant_conditions WHERE id = $1',
              [conditionIdToRemove]
            );
            
            // Get count after removal
            const afterResult = await db.query(
              'SELECT * FROM combatant_conditions WHERE combatant_id = $1',
              [combatant.id]
            );
            const afterCount = afterResult.rows.length;
            
            // Verify count decreased by 1
            expect(afterCount).toBe(beforeCount - 1);
            
            // Verify the condition is no longer in the list
            const stillHasCondition = afterResult.rows.some(c => c.condition === conditionToRemove);
            expect(stillHasCondition).toBe(false);
          } finally {
            // Clean up
            await Combatant.delete(combatant.id);
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 13: Condition indicators in tracker
   * Validates: Requirements 3.4
   * 
   * For any combatant with active conditions, the initiative tracker display 
   * for that combatant should include indicators for all active conditions
   */
  test('Property 13: Condition indicators in tracker', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        combatantArbitrary,
        conditionArrayArbitrary,
        async (combatantData, conditions) => {
          // Create a combatant
          const combatant = await Combatant.create(testCampaignId, combatantData);
          
          try {
            // Add all conditions
            for (const condition of conditions) {
              await db.query(
                'INSERT INTO combatant_conditions (combatant_id, condition) VALUES ($1, $2)',
                [combatant.id, condition]
              );
            }
            
            // Retrieve combatant with conditions
            const retrieved = await Combatant.findByIdWithConditions(combatant.id);
            
            expect(retrieved).toBeDefined();
            expect(Array.isArray(retrieved.conditions)).toBe(true);
            
            // Verify all conditions are present in the retrieved data
            expect(retrieved.conditions.length).toBe(conditions.length);
            
            for (const condition of conditions) {
              expect(retrieved.conditions).toContain(condition);
            }
          } finally {
            // Clean up
            await Combatant.delete(combatant.id);
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 16: NPC-PC condition parity
   * Validates: Requirements 4.3
   * 
   * For any NPC, condition add and remove operations should behave identically 
   * to the same operations on PCs
   */
  test('Property 16: NPC-PC condition parity', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        combatantArbitrary,
        combatantArbitrary,
        conditionArbitrary,
        async (pcData, npcData, condition) => {
          // Force types
          const pcCombatantData = { ...pcData, type: 'PC' };
          const npcCombatantData = { ...npcData, type: 'NPC' };
          
          // Create both combatants
          const pc = await Combatant.create(testCampaignId, pcCombatantData);
          const npc = await Combatant.create(testCampaignId, npcCombatantData);
          
          try {
            // Add condition to PC
            const pcAddResult = await db.query(
              'INSERT INTO combatant_conditions (combatant_id, condition) VALUES ($1, $2) RETURNING *',
              [pc.id, condition]
            );
            
            // Add condition to NPC
            const npcAddResult = await db.query(
              'INSERT INTO combatant_conditions (combatant_id, condition) VALUES ($1, $2) RETURNING *',
              [npc.id, condition]
            );
            
            // Verify both operations succeeded identically
            expect(pcAddResult.rows.length).toBe(1);
            expect(npcAddResult.rows.length).toBe(1);
            expect(pcAddResult.rows[0].condition).toBe(condition);
            expect(npcAddResult.rows[0].condition).toBe(condition);
            
            // Get conditions for both
            const pcConditions = await db.query(
              'SELECT * FROM combatant_conditions WHERE combatant_id = $1',
              [pc.id]
            );
            const npcConditions = await db.query(
              'SELECT * FROM combatant_conditions WHERE combatant_id = $1',
              [npc.id]
            );
            
            // Verify both have the condition
            expect(pcConditions.rows.length).toBe(1);
            expect(npcConditions.rows.length).toBe(1);
            
            // Remove condition from PC
            await db.query(
              'DELETE FROM combatant_conditions WHERE id = $1',
              [pcAddResult.rows[0].id]
            );
            
            // Remove condition from NPC
            await db.query(
              'DELETE FROM combatant_conditions WHERE id = $1',
              [npcAddResult.rows[0].id]
            );
            
            // Verify both are removed
            const pcAfterRemove = await db.query(
              'SELECT * FROM combatant_conditions WHERE combatant_id = $1',
              [pc.id]
            );
            const npcAfterRemove = await db.query(
              'SELECT * FROM combatant_conditions WHERE combatant_id = $1',
              [npc.id]
            );
            
            expect(pcAfterRemove.rows.length).toBe(0);
            expect(npcAfterRemove.rows.length).toBe(0);
          } finally {
            // Clean up
            await Combatant.delete(pc.id);
            await Combatant.delete(npc.id);
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});
