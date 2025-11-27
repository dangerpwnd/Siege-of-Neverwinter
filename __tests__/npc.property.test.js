/**
 * Property-Based Tests for NPC Panel
 * Feature: siege-of-neverwinter
 * Tests NPC display parity, visual distinction, and deletion completeness
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
      "INSERT INTO campaigns (name) VALUES ('Test Campaign - NPC Panel') RETURNING id"
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
 * Generator for NPC data with all required fields
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
  character_class: fc.option(fc.constantFrom('Guard', 'Merchant', 'Noble', 'Soldier', 'Priest'), { nil: null }),
  level: fc.option(fc.integer({ min: 1, max: 20 }), { nil: null }),
  notes: fc.option(fc.string({ maxLength: 200 }), { nil: null })
});

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

// Property Tests

describe('NPC Panel Properties', () => {
  
  /**
   * Feature: siege-of-neverwinter, Property 15: NPC-PC display parity
   * Validates: Requirements 4.2
   * 
   * For any NPC, the display fields should match the display fields available for PCs
   */
  test('Property 15: NPC-PC display parity', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(npcArbitrary, pcArbitrary, async (npcData, pcData) => {
        // Create NPC and PC
        const npc = await Combatant.create(testCampaignId, npcData);
        const pc = await Combatant.create(testCampaignId, pcData);
        
        // Retrieve both
        const retrievedNPC = await Combatant.findById(npc.id);
        const retrievedPC = await Combatant.findById(pc.id);
        
        // Verify both have the same display fields
        // AC field
        expect(retrievedNPC.ac).toBeDefined();
        expect(retrievedPC.ac).toBeDefined();
        expect(typeof retrievedNPC.ac).toBe(typeof retrievedPC.ac);
        
        // HP fields
        expect(retrievedNPC.current_hp).toBeDefined();
        expect(retrievedPC.current_hp).toBeDefined();
        expect(typeof retrievedNPC.current_hp).toBe(typeof retrievedPC.current_hp);
        
        expect(retrievedNPC.max_hp).toBeDefined();
        expect(retrievedPC.max_hp).toBeDefined();
        expect(typeof retrievedNPC.max_hp).toBe(typeof retrievedPC.max_hp);
        
        // All six saving throw modifiers
        const saves = ['save_strength', 'save_dexterity', 'save_constitution', 
                       'save_intelligence', 'save_wisdom', 'save_charisma'];
        
        for (const save of saves) {
          expect(retrievedNPC[save]).toBeDefined();
          expect(retrievedPC[save]).toBeDefined();
          expect(typeof retrievedNPC[save]).toBe('number');
          expect(typeof retrievedPC[save]).toBe('number');
          expect(typeof retrievedNPC[save]).toBe(typeof retrievedPC[save]);
        }
        
        // Verify both have name field
        expect(retrievedNPC.name).toBeDefined();
        expect(retrievedPC.name).toBeDefined();
        expect(typeof retrievedNPC.name).toBe(typeof retrievedPC.name);
        
        // Clean up
        await Combatant.delete(npc.id);
        await Combatant.delete(pc.id);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 17: Combatant type visual distinction
   * Validates: Requirements 4.4
   * 
   * For any initiative tracker containing PCs, NPCs, and Monsters, 
   * each type should have distinct visual indicators
   */
  test('Property 17: Combatant type visual distinction', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        npcArbitrary,
        pcArbitrary,
        async (npcData, pcData) => {
          // Create NPC and PC
          const npc = await Combatant.create(testCampaignId, npcData);
          const pc = await Combatant.create(testCampaignId, pcData);
          
          // Retrieve both
          const retrievedNPC = await Combatant.findById(npc.id);
          const retrievedPC = await Combatant.findById(pc.id);
          
          // Verify type field exists and is distinct
          expect(retrievedNPC.type).toBeDefined();
          expect(retrievedPC.type).toBeDefined();
          
          expect(retrievedNPC.type).toBe('NPC');
          expect(retrievedPC.type).toBe('PC');
          
          // Verify types are different
          expect(retrievedNPC.type).not.toBe(retrievedPC.type);
          
          // Verify type is one of the valid values
          expect(['PC', 'NPC', 'Monster']).toContain(retrievedNPC.type);
          expect(['PC', 'NPC', 'Monster']).toContain(retrievedPC.type);
          
          // Clean up
          await Combatant.delete(npc.id);
          await Combatant.delete(pc.id);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 18: NPC deletion completeness
   * Validates: Requirements 4.5
   * 
   * For any NPC in the system, deleting it should remove it from all displays 
   * including the initiative tracker
   */
  test('Property 18: NPC deletion completeness', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(npcArbitrary, async (npcData) => {
        // Create NPC
        const npc = await Combatant.create(testCampaignId, npcData);
        
        // Verify NPC exists
        const beforeDelete = await Combatant.findById(npc.id);
        expect(beforeDelete).not.toBeNull();
        expect(beforeDelete.id).toBe(npc.id);
        
        // Verify NPC appears in campaign combatants list
        const combatantsBeforeDelete = await Combatant.findByCampaign(testCampaignId);
        const npcInList = combatantsBeforeDelete.find(c => c.id === npc.id);
        expect(npcInList).toBeDefined();
        expect(npcInList.type).toBe('NPC');
        
        // Delete NPC
        const deleted = await Combatant.delete(npc.id);
        expect(deleted).not.toBeNull();
        expect(deleted.id).toBe(npc.id);
        
        // Verify NPC no longer exists in database
        const afterDelete = await Combatant.findById(npc.id);
        expect(afterDelete).toBeNull();
        
        // Verify NPC no longer appears in campaign combatants list (initiative tracker)
        const combatantsAfterDelete = await Combatant.findByCampaign(testCampaignId);
        const npcStillInList = combatantsAfterDelete.find(c => c.id === npc.id);
        expect(npcStillInList).toBeUndefined();
        
        // Verify NPC no longer appears in NPC-specific list
        const npcsAfterDelete = await Combatant.findByCampaign(testCampaignId, 'NPC');
        const npcInNPCList = npcsAfterDelete.find(c => c.id === npc.id);
        expect(npcInNPCList).toBeUndefined();
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Additional test: NPC data storage completeness
   * This validates that all required NPC fields are stored and retrievable
   * Related to Property 14 from the design document
   */
  test('NPC data storage completeness', async () => {
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
        
        // Verify all required fields are present and correct type
        expect(retrieved).toBeDefined();
        expect(retrieved.name).toBeDefined();
        expect(typeof retrieved.name).toBe('string');
        
        expect(retrieved.ac).toBeDefined();
        expect(typeof retrieved.ac).toBe('number');
        
        expect(retrieved.current_hp).toBeDefined();
        expect(typeof retrieved.current_hp).toBe('number');
        
        expect(retrieved.max_hp).toBeDefined();
        expect(typeof retrieved.max_hp).toBe('number');
        
        // Verify all six saving throw modifiers
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
        
        // Verify type is NPC
        expect(retrieved.type).toBe('NPC');
        
        // Clean up
        await Combatant.delete(created.id);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Additional test: NPC condition management parity with PCs
   * This validates Property 16 from the design document
   */
  test('NPC condition management parity with PCs', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    const conditionArbitrary = fc.constantFrom(
      'blinded', 'charmed', 'deafened', 'frightened', 'grappled',
      'incapacitated', 'invisible', 'paralyzed', 'petrified', 'poisoned',
      'prone', 'restrained', 'stunned', 'unconscious'
    );
    
    await fc.assert(
      fc.asyncProperty(
        npcArbitrary,
        pcArbitrary,
        conditionArbitrary,
        async (npcData, pcData, condition) => {
          // Create NPC and PC
          const npc = await Combatant.create(testCampaignId, npcData);
          const pc = await Combatant.create(testCampaignId, pcData);
          
          // Add same condition to both
          const npcCondition = await Combatant.addCondition(npc.id, condition);
          const pcCondition = await Combatant.addCondition(pc.id, condition);
          
          // Verify both operations succeeded
          expect(npcCondition).toBeDefined();
          expect(pcCondition).toBeDefined();
          expect(npcCondition.condition).toBe(condition);
          expect(pcCondition.condition).toBe(condition);
          
          // Retrieve both with conditions
          const npcWithConditions = await Combatant.findByIdWithConditions(npc.id);
          const pcWithConditions = await Combatant.findByIdWithConditions(pc.id);
          
          // Verify both have the condition
          expect(npcWithConditions.conditions).toBeDefined();
          expect(pcWithConditions.conditions).toBeDefined();
          expect(npcWithConditions.conditions.length).toBeGreaterThan(0);
          expect(pcWithConditions.conditions.length).toBeGreaterThan(0);
          
          // Remove condition from both
          const npcRemoved = await Combatant.removeCondition(npc.id, condition);
          const pcRemoved = await Combatant.removeCondition(pc.id, condition);
          
          // Verify both removals succeeded
          expect(npcRemoved).toBeDefined();
          expect(pcRemoved).toBeDefined();
          
          // Clean up
          await Combatant.delete(npc.id);
          await Combatant.delete(pc.id);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});
