/**
 * Property-Based Tests for Campaign Persistence
 * Feature: siege-of-neverwinter
 * Tests persistence and session management properties
 */

const fc = require('fast-check');
const Campaign = require('../server/models/Campaign');
const Combatant = require('../server/models/Combatant');
const db = require('../database/db');

// Test configuration
const NUM_RUNS = 100;

// Setup and teardown
let dbAvailable = false;

beforeAll(async () => {
  try {
    // Test database connection
    await db.query('SELECT 1');
    dbAvailable = true;
  } catch (error) {
    console.warn('Database not available. Property-based tests will be skipped.');
    console.warn('To run these tests, ensure PostgreSQL is running and DATABASE_URL is configured.');
    dbAvailable = false;
  }
});

afterAll(async () => {
  if (dbAvailable) {
    await db.pool.end();
  }
});

// Generators for property-based testing

/**
 * Generator for valid campaign data
 */
const campaignArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
});

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
 * Generator for siege state data
 */
const siegeStateArbitrary = fc.record({
  wall_integrity: fc.integer({ min: 0, max: 100 }),
  defender_morale: fc.integer({ min: 0, max: 100 }),
  supplies: fc.integer({ min: 0, max: 100 }),
  day_of_siege: fc.integer({ min: 1, max: 100 })
});

// Property Tests

describe('Campaign Persistence Properties', () => {
  
  /**
   * Feature: siege-of-neverwinter, Property 38: Application state persistence completeness
   * Validates: Requirements 10.1
   * 
   * For any application state including characters, NPCs, monsters, initiative, and siege data,
   * closing the application should save all data types
   */
  test('Property 38: Application state persistence completeness', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        campaignArbitrary,
        fc.array(combatantArbitrary, { minLength: 1, maxLength: 5 }),
        siegeStateArbitrary,
        async (campaignData, combatantsData, siegeData) => {
          let campaignId;
          
          try {
            // Create campaign
            const campaign = await Campaign.create(campaignData);
            campaignId = campaign.id;
            
            // Add combatants
            const createdCombatants = [];
            for (const combatantData of combatantsData) {
              const combatant = await Combatant.create(campaignId, combatantData);
              createdCombatants.push(combatant);
            }
            
            // Update siege state
            await db.query(
              `UPDATE siege_state 
               SET wall_integrity = $1, defender_morale = $2, supplies = $3, day_of_siege = $4
               WHERE campaign_id = $5`,
              [siegeData.wall_integrity, siegeData.defender_morale, siegeData.supplies, 
               siegeData.day_of_siege, campaignId]
            );
            
            // Get complete state (simulates saving)
            const state = await Campaign.getCompleteState(campaignId);
            
            // Verify all data types are present
            expect(state.campaign).toBeDefined();
            expect(state.campaign.id).toBe(campaignId);
            expect(state.combatants).toBeDefined();
            expect(state.combatants.length).toBe(combatantsData.length);
            expect(state.siegeState).toBeDefined();
            expect(state.monsters).toBeDefined();
            expect(state.locations).toBeDefined();
            expect(state.preferences).toBeDefined();
            
            // Verify combatant data is complete
            for (const combatant of state.combatants) {
              expect(combatant.name).toBeDefined();
              expect(combatant.type).toBeDefined();
              expect(combatant.ac).toBeDefined();
              expect(combatant.current_hp).toBeDefined();
              expect(combatant.max_hp).toBeDefined();
            }
            
            // Verify siege state data is complete
            expect(state.siegeState.wall_integrity).toBe(siegeData.wall_integrity);
            expect(state.siegeState.defender_morale).toBe(siegeData.defender_morale);
            expect(state.siegeState.supplies).toBe(siegeData.supplies);
            expect(state.siegeState.day_of_siege).toBe(siegeData.day_of_siege);
            
          } finally {
            // Clean up
            if (campaignId) {
              await Campaign.delete(campaignId);
            }
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 39: Session state restoration round-trip
   * Validates: Requirements 10.2
   * 
   * For any complete application state, closing and reopening the application 
   * should restore all data to the exact same state
   */
  test('Property 39: Session state restoration round-trip', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        campaignArbitrary,
        fc.array(combatantArbitrary, { minLength: 1, maxLength: 3 }),
        async (campaignData, combatantsData) => {
          let originalCampaignId;
          let restoredCampaignId;
          
          try {
            // Create original campaign with data
            const originalCampaign = await Campaign.create(campaignData);
            originalCampaignId = originalCampaign.id;
            
            // Add combatants
            for (const combatantData of combatantsData) {
              await Combatant.create(originalCampaignId, combatantData);
            }
            
            // Export state (simulates closing application)
            const exportedState = await Campaign.getCompleteState(originalCampaignId);
            
            // Import state (simulates reopening application)
            const restoredCampaign = await Campaign.restoreState(exportedState);
            restoredCampaignId = restoredCampaign.id;
            
            // Get restored state
            const restoredState = await Campaign.getCompleteState(restoredCampaignId);
            
            // Verify campaign data matches
            expect(restoredState.campaign.name).toBe(exportedState.campaign.name);
            
            // Verify combatant count matches
            expect(restoredState.combatants.length).toBe(exportedState.combatants.length);
            
            // Verify each combatant's data matches (order may differ, so sort by name)
            const originalCombatants = exportedState.combatants.sort((a, b) => 
              a.name.localeCompare(b.name)
            );
            const restoredCombatants = restoredState.combatants.sort((a, b) => 
              a.name.localeCompare(b.name)
            );
            
            for (let i = 0; i < originalCombatants.length; i++) {
              expect(restoredCombatants[i].name).toBe(originalCombatants[i].name);
              expect(restoredCombatants[i].type).toBe(originalCombatants[i].type);
              expect(restoredCombatants[i].ac).toBe(originalCombatants[i].ac);
              expect(restoredCombatants[i].current_hp).toBe(originalCombatants[i].current_hp);
              expect(restoredCombatants[i].max_hp).toBe(originalCombatants[i].max_hp);
              expect(restoredCombatants[i].initiative).toBe(originalCombatants[i].initiative);
            }
            
            // Verify siege state exists
            expect(restoredState.siegeState).toBeDefined();
            
          } finally {
            // Clean up
            if (originalCampaignId) {
              await Campaign.delete(originalCampaignId);
            }
            if (restoredCampaignId) {
              await Campaign.delete(restoredCampaignId);
            }
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 40: Data modification persistence
   * Validates: Requirements 10.4
   * 
   * For any data modification, the change should either be immediately persisted 
   * to storage or a save function should be available to persist it
   */
  test('Property 40: Data modification persistence', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        campaignArbitrary,
        combatantArbitrary,
        fc.integer({ min: 0, max: 500 }),
        async (campaignData, combatantData, newHP) => {
          let campaignId;
          
          try {
            // Create campaign and combatant
            const campaign = await Campaign.create(campaignData);
            campaignId = campaign.id;
            
            const combatant = await Combatant.create(campaignId, combatantData);
            
            // Modify data (update HP)
            await Combatant.update(combatant.id, { current_hp: newHP });
            
            // Touch campaign to update timestamp (simulates auto-save)
            const touchedCampaign = await Campaign.touch(campaignId);
            
            // Verify campaign was touched
            expect(touchedCampaign).toBeDefined();
            expect(touchedCampaign.id).toBe(campaignId);
            
            // Retrieve combatant to verify modification persisted
            const retrievedCombatant = await Combatant.findById(combatant.id);
            
            // Verify modification was persisted
            expect(retrievedCombatant).toBeDefined();
            expect(retrievedCombatant.current_hp).toBe(newHP);
            
            // Verify we can get complete state with the modification
            const state = await Campaign.getCompleteState(campaignId);
            const stateCombatant = state.combatants.find(c => c.id === combatant.id);
            
            expect(stateCombatant).toBeDefined();
            expect(stateCombatant.current_hp).toBe(newHP);
            
          } finally {
            // Clean up
            if (campaignId) {
              await Campaign.delete(campaignId);
            }
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});
