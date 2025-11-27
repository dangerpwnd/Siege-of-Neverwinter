/**
 * Property-Based Tests for Monster Database
 * Feature: siege-of-neverwinter
 * Tests monster database properties including list access, stat blocks, instances, and persistence
 */

const fc = require('fast-check');
const { Monster, Combatant } = require('../server/models');
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
      "INSERT INTO campaigns (name) VALUES ('Test Campaign - Monster Database') RETURNING id"
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
 * Generator for monster data with all required fields
 */
const monsterArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  ac: fc.integer({ min: 0, max: 30 }),
  hp_formula: fc.option(
    fc.oneof(
      fc.constant('1d8'),
      fc.constant('2d8+2'),
      fc.constant('4d8+4'),
      fc.constant('8d10+16'),
      fc.constant('12d12+24')
    ),
    { nil: null }
  ),
  speed: fc.option(fc.constantFrom('30 ft.', '40 ft.', '30 ft., fly 60 ft.', '20 ft., swim 40 ft.'), { nil: null }),
  stat_str: fc.integer({ min: 1, max: 30 }),
  stat_dex: fc.integer({ min: 1, max: 30 }),
  stat_con: fc.integer({ min: 1, max: 30 }),
  stat_int: fc.integer({ min: 1, max: 30 }),
  stat_wis: fc.integer({ min: 1, max: 30 }),
  stat_cha: fc.integer({ min: 1, max: 30 }),
  saves: fc.option(fc.record({
    strength: fc.integer({ min: -5, max: 15 }),
    dexterity: fc.integer({ min: -5, max: 15 })
  }), { nil: null }),
  skills: fc.option(fc.record({
    perception: fc.integer({ min: -5, max: 15 }),
    stealth: fc.integer({ min: -5, max: 15 })
  }), { nil: null }),
  resistances: fc.array(fc.constantFrom('fire', 'cold', 'poison', 'slashing'), { maxLength: 3 }),
  immunities: fc.array(fc.constantFrom('poison', 'psychic'), { maxLength: 2 }),
  senses: fc.option(fc.constantFrom('darkvision 60 ft.', 'blindsight 30 ft.', 'tremorsense 60 ft.'), { nil: null }),
  languages: fc.option(fc.constantFrom('Common', 'Draconic', 'Infernal', 'understands Common but can\'t speak'), { nil: null }),
  cr: fc.option(fc.constantFrom('0', '1/4', '1/2', '1', '2', '5', '10', '15', '20'), { nil: null }),
  attacks: fc.array(fc.record({
    name: fc.constantFrom('Bite', 'Claw', 'Slam', 'Breath Weapon'),
    bonus: fc.integer({ min: 0, max: 15 }),
    damage: fc.constantFrom('1d6+2', '2d8+4', '3d10+5'),
    type: fc.constantFrom('piercing', 'slashing', 'bludgeoning', 'fire'),
    description: fc.option(fc.string({ maxLength: 100 }), { nil: null })
  }), { minLength: 0, maxLength: 3 }),
  abilities: fc.array(fc.record({
    name: fc.constantFrom('Pack Tactics', 'Keen Smell', 'Magic Resistance'),
    description: fc.string({ minLength: 10, maxLength: 100 })
  }), { minLength: 0, maxLength: 2 }),
  lore: fc.option(fc.string({ maxLength: 200 }), { nil: null })
});

/**
 * Generator for instance names
 * Note: We trim the strings because sanitizeString in the model trims input
 */
const instanceNameArbitrary = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0)
  .map(s => s.trim());

/**
 * Generator for initiative values
 */
const initiativeArbitrary = fc.integer({ min: -10, max: 30 });

// Property Tests

describe('Monster Database Properties', () => {
  
  /**
   * Feature: siege-of-neverwinter, Property 19: Monster list accessibility
   * Validates: Requirements 5.1
   * 
   * For any monster database state, accessing the monster section should return 
   * the list of all available monsters
   */
  test('Property 19: Monster list accessibility', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(monsterArbitrary, { minLength: 1, maxLength: 5 }),
        async (monstersData) => {
          // Create multiple monsters
          const createdMonsters = [];
          for (const monsterData of monstersData) {
            const monster = await Monster.create(testCampaignId, monsterData);
            createdMonsters.push(monster);
          }
          
          // Access the monster list (simulating what the UI would do)
          const retrievedMonsters = await Monster.findByCampaign(testCampaignId);
          
          // Verify all created monsters are in the list
          expect(retrievedMonsters).toBeDefined();
          expect(Array.isArray(retrievedMonsters)).toBe(true);
          expect(retrievedMonsters.length).toBeGreaterThanOrEqual(createdMonsters.length);
          
          // Verify each created monster is accessible
          for (const created of createdMonsters) {
            const found = retrievedMonsters.find(m => m.id === created.id);
            expect(found).toBeDefined();
            expect(found.name).toBe(created.name);
          }
          
          // Clean up
          for (const monster of createdMonsters) {
            await Monster.delete(monster.id);
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 20: Monster stat block completeness
   * Validates: Requirements 5.2
   * 
   * For any monster in the database, viewing it should display AC, HP, attacks, 
   * and special abilities
   */
  test('Property 20: Monster stat block completeness', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(monsterArbitrary, async (monsterData) => {
        // Create monster
        const created = await Monster.create(testCampaignId, monsterData);
        
        // Retrieve monster (simulating viewing the stat block)
        const retrieved = await Monster.findById(created.id);
        
        // Verify all required stat block fields are present
        expect(retrieved).toBeDefined();
        
        // AC is required
        expect(retrieved.ac).toBeDefined();
        expect(typeof retrieved.ac).toBe('number');
        
        // HP information is present (even if null)
        expect(retrieved).toHaveProperty('hp_formula');
        
        // Attacks field exists (even if empty array)
        expect(retrieved).toHaveProperty('attacks');
        
        // Abilities field exists (even if empty array)
        expect(retrieved).toHaveProperty('abilities');
        
        // Verify stat block has all ability scores
        expect(retrieved.stat_str).toBeDefined();
        expect(retrieved.stat_dex).toBeDefined();
        expect(retrieved.stat_con).toBeDefined();
        expect(retrieved.stat_int).toBeDefined();
        expect(retrieved.stat_wis).toBeDefined();
        expect(retrieved.stat_cha).toBeDefined();
        
        // Clean up
        await Monster.delete(created.id);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 21: Monster instance data completeness
   * Validates: Requirements 5.3
   * 
   * For any monster, creating an instance should copy all stat block fields 
   * to the new instance
   */
  test('Property 21: Monster instance data completeness', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        monsterArbitrary,
        instanceNameArbitrary,
        initiativeArbitrary,
        async (monsterData, instanceName, initiative) => {
          // Create monster template
          const template = await Monster.create(testCampaignId, monsterData);
          
          // Create instance
          const instance = await Monster.createInstance(template.id, instanceName, initiative);
          
          // Verify instance has all required data
          expect(instance).toBeDefined();
          expect(instance.combatant).toBeDefined();
          expect(instance.template).toBeDefined();
          
          // Verify combatant has copied stat block data
          const combatant = instance.combatant;
          expect(combatant.name).toBe(instanceName);
          expect(combatant.type).toBe('Monster');
          expect(combatant.initiative).toBe(initiative);
          expect(combatant.ac).toBe(template.ac);
          
          // Verify HP was calculated/set
          expect(combatant.current_hp).toBeDefined();
          expect(combatant.max_hp).toBeDefined();
          expect(combatant.current_hp).toBeGreaterThan(0);
          expect(combatant.max_hp).toBeGreaterThan(0);
          
          // Verify saving throws are present
          expect(combatant.save_strength).toBeDefined();
          expect(combatant.save_dexterity).toBeDefined();
          expect(combatant.save_constitution).toBeDefined();
          expect(combatant.save_intelligence).toBeDefined();
          expect(combatant.save_wisdom).toBeDefined();
          expect(combatant.save_charisma).toBeDefined();
          
          // Clean up
          await Combatant.delete(combatant.id);
          await Monster.delete(template.id);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 22: Monster instance independence
   * Validates: Requirements 5.4
   * 
   * For any monster type, creating multiple instances should result in independent 
   * HP tracking where modifying one instance's HP does not affect other instances
   */
  test('Property 22: Monster instance independence', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        monsterArbitrary,
        fc.integer({ min: 2, max: 4 }), // Number of instances
        fc.integer({ min: 1, max: 50 }), // HP damage amount
        async (monsterData, numInstances, damage) => {
          // Create monster template
          const template = await Monster.create(testCampaignId, monsterData);
          
          // Create multiple instances
          const instances = [];
          for (let i = 0; i < numInstances; i++) {
            const instance = await Monster.createInstance(
              template.id,
              `${template.name} ${i + 1}`,
              10 + i
            );
            instances.push(instance);
          }
          
          // Record initial HP for all instances
          const initialHPs = instances.map(inst => inst.combatant.current_hp);
          
          // Modify HP of the first instance
          const firstInstance = instances[0];
          const newHP = Math.max(0, firstInstance.combatant.current_hp - damage);
          await Combatant.update(firstInstance.combatant.id, { current_hp: newHP });
          
          // Verify first instance HP changed
          const updatedFirst = await Combatant.findById(firstInstance.combatant.id);
          expect(updatedFirst.current_hp).toBe(newHP);
          
          // Verify other instances' HP remained unchanged
          for (let i = 1; i < instances.length; i++) {
            const otherInstance = await Combatant.findById(instances[i].combatant.id);
            expect(otherInstance.current_hp).toBe(initialHPs[i]);
            expect(otherInstance.current_hp).not.toBe(newHP);
          }
          
          // Clean up
          for (const instance of instances) {
            await Combatant.delete(instance.combatant.id);
          }
          await Monster.delete(template.id);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 23: Monster data persistence round-trip
   * Validates: Requirements 5.5
   * 
   * For any monster added to the database, it should be retrievable in a subsequent 
   * session with all data intact
   */
  test('Property 23: Monster data persistence round-trip', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(monsterArbitrary, async (monsterData) => {
        // Create monster (simulating adding to database)
        const created = await Monster.create(testCampaignId, monsterData);
        
        // Simulate session end and restart by retrieving from database
        const retrieved = await Monster.findById(created.id);
        
        // Verify all data persisted correctly
        expect(retrieved).toBeDefined();
        expect(retrieved.id).toBe(created.id);
        expect(retrieved.name).toBe(created.name);
        expect(retrieved.ac).toBe(created.ac);
        expect(retrieved.hp_formula).toBe(created.hp_formula);
        expect(retrieved.speed).toBe(created.speed);
        
        // Verify ability scores
        expect(retrieved.stat_str).toBe(created.stat_str);
        expect(retrieved.stat_dex).toBe(created.stat_dex);
        expect(retrieved.stat_con).toBe(created.stat_con);
        expect(retrieved.stat_int).toBe(created.stat_int);
        expect(retrieved.stat_wis).toBe(created.stat_wis);
        expect(retrieved.stat_cha).toBe(created.stat_cha);
        
        // Verify optional fields
        expect(retrieved.senses).toBe(created.senses);
        expect(retrieved.languages).toBe(created.languages);
        expect(retrieved.cr).toBe(created.cr);
        expect(retrieved.lore).toBe(created.lore);
        
        // Verify arrays (resistances, immunities)
        if (created.resistances) {
          expect(retrieved.resistances).toEqual(created.resistances);
        }
        if (created.immunities) {
          expect(retrieved.immunities).toEqual(created.immunities);
        }
        
        // Verify JSONB fields (saves, skills, attacks, abilities)
        // These are stored as JSONB and may need parsing
        if (created.saves) {
          const retrievedSaves = typeof retrieved.saves === 'string' 
            ? JSON.parse(retrieved.saves) 
            : retrieved.saves;
          const createdSaves = typeof created.saves === 'string'
            ? JSON.parse(created.saves)
            : created.saves;
          expect(retrievedSaves).toEqual(createdSaves);
        }
        
        if (created.attacks) {
          const retrievedAttacks = typeof retrieved.attacks === 'string'
            ? JSON.parse(retrieved.attacks)
            : retrieved.attacks;
          const createdAttacks = typeof created.attacks === 'string'
            ? JSON.parse(created.attacks)
            : created.attacks;
          expect(retrievedAttacks).toEqual(createdAttacks);
        }
        
        if (created.abilities) {
          const retrievedAbilities = typeof retrieved.abilities === 'string'
            ? JSON.parse(retrieved.abilities)
            : retrieved.abilities;
          const createdAbilities = typeof created.abilities === 'string'
            ? JSON.parse(created.abilities)
            : created.abilities;
          expect(retrievedAbilities).toEqual(createdAbilities);
        }
        
        // Clean up
        await Monster.delete(created.id);
      }),
      { numRuns: NUM_RUNS }
    );
  });
});
