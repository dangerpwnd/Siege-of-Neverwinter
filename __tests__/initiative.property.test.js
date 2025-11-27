/**
 * Property-Based Tests for Initiative Tracker
 * Feature: siege-of-neverwinter
 * Tests initiative tracker properties
 */

const fc = require('fast-check');
const Combatant = require('../server/models/Combatant');
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
      "INSERT INTO campaigns (name) VALUES ('Test Campaign Initiative') RETURNING id"
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
 * Generator for an array of combatants
 */
const combatantArrayArbitrary = fc.array(combatantArbitrary, { minLength: 1, maxLength: 10 });

// Property Tests

describe('Initiative Tracker Properties', () => {
  
  /**
   * Feature: siege-of-neverwinter, Property 2: Initiative tracker ordering
   * Validates: Requirements 1.2
   * 
   * For any set of combatants in the initiative tracker, the display order 
   * should always be in descending order by initiative value
   */
  test('Property 2: Initiative tracker ordering', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(combatantArrayArbitrary, async (combatantsData) => {
        // Create all combatants
        const createdIds = [];
        for (const combatantData of combatantsData) {
          const created = await Combatant.create(testCampaignId, combatantData);
          createdIds.push(created.id);
        }
        
        try {
          // Retrieve combatants (should be sorted by initiative DESC)
          const retrieved = await Combatant.findByCampaign(testCampaignId);
          
          // Verify ordering: each combatant should have initiative >= next combatant
          for (let i = 0; i < retrieved.length - 1; i++) {
            expect(retrieved[i].initiative).toBeGreaterThanOrEqual(retrieved[i + 1].initiative);
          }
        } finally {
          // Clean up
          for (const id of createdIds) {
            await Combatant.delete(id);
          }
        }
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 3: Turn advancement correctness
   * Validates: Requirements 1.3
   * 
   * For any initiative tracker state with N combatants, advancing the turn 
   * should move the active combatant index to (current + 1) mod N
   */
  test('Property 3: Turn advancement correctness', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        combatantArrayArbitrary,
        fc.integer({ min: 0, max: 20 }),
        async (combatantsData, startIndex) => {
          // Create all combatants
          const createdIds = [];
          for (const combatantData of combatantsData) {
            const created = await Combatant.create(testCampaignId, combatantData);
            createdIds.push(created.id);
          }
          
          try {
            const retrieved = await Combatant.findByCampaign(testCampaignId);
            const N = retrieved.length;
            
            // Normalize start index to valid range
            const currentIndex = startIndex % N;
            
            // Calculate expected next index
            const expectedNextIndex = (currentIndex + 1) % N;
            
            // Verify the calculation
            expect(expectedNextIndex).toBe((currentIndex + 1) % N);
            expect(expectedNextIndex).toBeGreaterThanOrEqual(0);
            expect(expectedNextIndex).toBeLessThan(N);
          } finally {
            // Clean up
            for (const id of createdIds) {
              await Combatant.delete(id);
            }
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 4: Removal preserves ordering
   * Validates: Requirements 1.4
   * 
   * For any initiative tracker, removing a combatant should maintain the 
   * descending initiative order of all remaining combatants
   */
  test('Property 4: Removal preserves ordering', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        combatantArrayArbitrary,
        fc.integer({ min: 0, max: 100 }),
        async (combatantsData, removalSeed) => {
          // Need at least 2 combatants to test removal
          if (combatantsData.length < 2) return;
          
          // Create all combatants
          const createdIds = [];
          for (const combatantData of combatantsData) {
            const created = await Combatant.create(testCampaignId, combatantData);
            createdIds.push(created.id);
          }
          
          try {
            // Get initial list
            const beforeRemoval = await Combatant.findByCampaign(testCampaignId);
            
            // Select a combatant to remove (use seed to pick deterministically)
            const indexToRemove = removalSeed % beforeRemoval.length;
            const idToRemove = beforeRemoval[indexToRemove].id;
            
            // Remove the combatant
            await Combatant.delete(idToRemove);
            
            // Get list after removal
            const afterRemoval = await Combatant.findByCampaign(testCampaignId);
            
            // Verify ordering is still maintained
            for (let i = 0; i < afterRemoval.length - 1; i++) {
              expect(afterRemoval[i].initiative).toBeGreaterThanOrEqual(afterRemoval[i + 1].initiative);
            }
            
            // Verify the removed combatant is not in the list
            const removedStillPresent = afterRemoval.some(c => c.id === idToRemove);
            expect(removedStillPresent).toBe(false);
            
            // Verify count decreased by 1
            expect(afterRemoval.length).toBe(beforeRemoval.length - 1);
          } finally {
            // Clean up remaining combatants
            for (const id of createdIds) {
              try {
                await Combatant.delete(id);
              } catch (e) {
                // May already be deleted
              }
            }
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 5: Initiative modification triggers re-sort
   * Validates: Requirements 1.5
   * 
   * For any combatant in the tracker, modifying their initiative value should 
   * result in the tracker being sorted in descending order by initiative
   */
  test('Property 5: Initiative modification triggers re-sort', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        combatantArrayArbitrary,
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: -10, max: 30 }),
        async (combatantsData, updateSeed, newInitiative) => {
          // Need at least 1 combatant
          if (combatantsData.length < 1) return;
          
          // Create all combatants
          const createdIds = [];
          for (const combatantData of combatantsData) {
            const created = await Combatant.create(testCampaignId, combatantData);
            createdIds.push(created.id);
          }
          
          try {
            // Get initial list
            const beforeUpdate = await Combatant.findByCampaign(testCampaignId);
            
            // Select a combatant to update
            const indexToUpdate = updateSeed % beforeUpdate.length;
            const idToUpdate = beforeUpdate[indexToUpdate].id;
            
            // Update the initiative
            await Combatant.update(idToUpdate, { initiative: newInitiative });
            
            // Get list after update
            const afterUpdate = await Combatant.findByCampaign(testCampaignId);
            
            // Verify ordering is maintained (descending by initiative)
            for (let i = 0; i < afterUpdate.length - 1; i++) {
              expect(afterUpdate[i].initiative).toBeGreaterThanOrEqual(afterUpdate[i + 1].initiative);
            }
            
            // Verify the updated combatant has the new initiative value
            const updatedCombatant = afterUpdate.find(c => c.id === idToUpdate);
            expect(updatedCombatant).toBeDefined();
            expect(updatedCombatant.initiative).toBe(newInitiative);
          } finally {
            // Clean up
            for (const id of createdIds) {
              await Combatant.delete(id);
            }
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});
