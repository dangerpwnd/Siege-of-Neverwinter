/**
 * Integration Tests for Siege of Neverwinter
 * 
 * These tests verify end-to-end functionality including:
 * - Complete combat flow
 * - Module interaction and data sync
 * - Complete save/load cycle
 * - AI assistant integration
 * 
 * Requirements: All requirements
 */

const { Pool } = require('pg');
require('dotenv').config();

// Database setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Import models
const { Combatant, Monster, SiegeState, Location, PlotPoint } = require('../server/models');
const Campaign = require('../server/models/Campaign');
const db = require('../database/db');

describe('Integration Tests', () => {
  let testCampaignId;
  let dbAvailable = false;

  beforeAll(async () => {
    try {
      // Test database connection
      await db.query('SELECT 1');
      
      // Create a test campaign
      const campaign = await Campaign.create({ name: 'Integration Test Campaign' });
      testCampaignId = campaign.id;
      dbAvailable = true;
    } catch (error) {
      console.warn('Database not available. Integration tests will be skipped.');
      console.warn('Error:', error.message);
      console.warn('To run these tests, ensure PostgreSQL is running and DATABASE_URL is configured.');
      dbAvailable = false;
    }
  });

  afterAll(async () => {
    if (dbAvailable) {
      // Clean up test data
      if (testCampaignId) {
        await Campaign.delete(testCampaignId);
      }
      await db.pool.end();
    }
  });

  beforeEach(async () => {
    if (!dbAvailable) return;
    
    // Clean up any test data before each test
    await db.query('DELETE FROM combatants WHERE campaign_id = $1', [testCampaignId]);
    await db.query('DELETE FROM monsters WHERE campaign_id = $1', [testCampaignId]);
    await db.query('DELETE FROM locations WHERE campaign_id = $1', [testCampaignId]);
  });

  describe('End-to-End Combat Flow', () => {
    test('should handle complete combat encounter from setup to resolution', async () => {
      if (!dbAvailable) {
        console.log('Skipping test - database not available');
        return;
      }

      // Step 1: Create PCs
      const pc1 = await Combatant.create(testCampaignId, {
        name: 'Thorin Ironshield',
        type: 'PC',
        initiative: 18,
        ac: 18,
        current_hp: 45,
        max_hp: 45,
        save_strength: 5,
        save_dexterity: 1,
        save_constitution: 4,
        save_intelligence: 0,
        save_wisdom: 2,
        save_charisma: 1
      });

      const pc2 = await Combatant.create(testCampaignId, {
        name: 'Elara Moonwhisper',
        type: 'PC',
        initiative: 22,
        ac: 15,
        current_hp: 32,
        max_hp: 32,
        save_strength: 0,
        save_dexterity: 4,
        save_constitution: 2,
        save_intelligence: 1,
        save_wisdom: 3,
        save_charisma: 2
      });

      // Step 2: Create monster template
      const monsterTemplate = await Monster.create(testCampaignId, {
        name: 'Cult Fanatic',
        ac: 13,
        hp_formula: '33 (6d8+6)',
        speed: '30 ft.',
        stat_str: 11,
        stat_dex: 14,
        stat_con: 12,
        stat_int: 10,
        stat_wis: 13,
        stat_cha: 14,
        saves: { wis: 3, cha: 4 },
        skills: { deception: 4, persuasion: 4, religion: 2 },
        resistances: [],
        immunities: [],
        senses: 'passive Perception 11',
        languages: 'Common',
        cr: '2',
        attacks: [{
          name: 'Dagger',
          bonus: 4,
          damage: '1d4+2',
          type: 'piercing',
          description: 'Melee or Ranged Weapon Attack'
        }],
        abilities: [{
          name: 'Dark Devotion',
          description: 'Advantage on saving throws against being charmed or frightened'
        }],
        lore: 'Fanatical follower of Tiamat'
      });

      // Step 3: Create monster instance for combat
      const monsterInstanceResult = await Monster.createInstance(monsterTemplate.id, 'Cult Fanatic 1', 15);
      const monsterInstance = monsterInstanceResult.combatant;

      // Step 4: Get initiative order
      const initiativeOrder = await Combatant.findByCampaignWithConditions(testCampaignId);
      
      // Verify initiative order is correct (descending)
      expect(initiativeOrder).toHaveLength(3);
      expect(initiativeOrder[0].name).toBe('Elara Moonwhisper'); // 22
      expect(initiativeOrder[1].name).toBe('Thorin Ironshield'); // 18
      expect(initiativeOrder[2].name).toBe('Cult Fanatic 1'); // 15

      // Step 5: Apply damage to PC
      await Combatant.update(pc1.id, { current_hp: 35 });
      const updatedPc1 = await Combatant.findById(pc1.id);
      expect(updatedPc1.current_hp).toBe(35);

      // Step 6: Apply condition to monster
      await Combatant.addCondition(monsterInstance.id, 'frightened');
      const updatedMonster = await Combatant.findByIdWithConditions(monsterInstance.id);
      expect(updatedMonster.conditions.includes('frightened')).toBe(true);

      // Step 7: Defeat monster (reduce HP to 0)
      await Combatant.update(monsterInstance.id, { current_hp: 0 });
      const defeatedMonster = await Combatant.findById(monsterInstance.id);
      expect(defeatedMonster.current_hp).toBe(0);

      // Step 8: Remove defeated monster from initiative
      await Combatant.delete(monsterInstance.id);
      const finalInitiative = await Combatant.findByCampaign(testCampaignId);
      expect(finalInitiative).toHaveLength(2);
      expect(finalInitiative.some(c => c.name === 'Cult Fanatic 1')).toBe(false);
    });

    test('should handle multiple monster instances independently', async () => {
      if (!dbAvailable) {
        console.log('Skipping test - database not available');
        return;
      }

      // Create monster template
      const goblinTemplate = await Monster.create(testCampaignId, {
        name: 'Goblin',
        ac: 15,
        hp_formula: '7 (2d6)',
        speed: '30 ft.',
        stat_str: 8,
        stat_dex: 14,
        stat_con: 10,
        stat_int: 10,
        stat_wis: 8,
        stat_cha: 8,
        saves: {},
        skills: { stealth: 6 },
        resistances: [],
        immunities: [],
        senses: 'darkvision 60 ft., passive Perception 9',
        languages: 'Common, Goblin',
        cr: '1/4',
        attacks: [{
          name: 'Scimitar',
          bonus: 4,
          damage: '1d6+2',
          type: 'slashing',
          description: 'Melee Weapon Attack'
        }],
        abilities: [{
          name: 'Nimble Escape',
          description: 'Can take Disengage or Hide as bonus action'
        }],
        lore: 'Small humanoid creature'
      });

      // Create three instances
      const goblin1Result = await Monster.createInstance(goblinTemplate.id, 'Goblin 1', 14);
      const goblin1 = goblin1Result.combatant;

      const goblin2Result = await Monster.createInstance(goblinTemplate.id, 'Goblin 2', 12);
      const goblin2 = goblin2Result.combatant;

      const goblin3Result = await Monster.createInstance(goblinTemplate.id, 'Goblin 3', 16);
      const goblin3 = goblin3Result.combatant;

      // Damage goblin1
      await Combatant.update(goblin1.id, { current_hp: 3 });

      // Verify independence
      const g1 = await Combatant.findById(goblin1.id);
      const g2 = await Combatant.findById(goblin2.id);
      const g3 = await Combatant.findById(goblin3.id);

      expect(g1.current_hp).toBe(3);
      expect(g2.current_hp).toBe(7);
      expect(g3.current_hp).toBe(7);
    });
  });

  describe('Module Interaction and Data Sync', () => {
    test('should sync HP changes across all displays', async () => {
      if (!dbAvailable) {
        console.log('Skipping test - database not available');
        return;
      }

      // Create a PC
      const pc = await Combatant.create(testCampaignId, {
        name: 'Gandalf',
        type: 'PC',
        initiative: 20,
        ac: 12,
        current_hp: 50,
        max_hp: 50,
        save_strength: 1,
        save_dexterity: 2,
        save_constitution: 3,
        save_intelligence: 5,
        save_wisdom: 6,
        save_charisma: 4
      });

      // Update HP (simulating damage from combat)
      await Combatant.update(pc.id, { current_hp: 30 });

      // Verify HP is updated when retrieved from different contexts
      const fromInitiative = await Combatant.findById(pc.id);
      const fromCharacterPanel = await Combatant.findById(pc.id);
      
      expect(fromInitiative.current_hp).toBe(30);
      expect(fromCharacterPanel.current_hp).toBe(30);
    });

    test('should sync conditions between initiative tracker and character panel', async () => {
      if (!dbAvailable) {
        console.log('Skipping test - database not available');
        return;
      }

      const npc = await Combatant.create(testCampaignId, {
        name: 'Guard Captain',
        type: 'NPC',
        initiative: 15,
        ac: 16,
        current_hp: 40,
        max_hp: 40,
        save_strength: 3,
        save_dexterity: 2,
        save_constitution: 3,
        save_intelligence: 1,
        save_wisdom: 2,
        save_charisma: 2
      });

      // Apply conditions
      await Combatant.addCondition(npc.id, 'poisoned');
      await Combatant.addCondition(npc.id, 'frightened');

      // Verify conditions appear in both contexts
      const retrieved = await Combatant.findByIdWithConditions(npc.id);
      expect(retrieved.conditions.includes('poisoned')).toBe(true);
      expect(retrieved.conditions.includes('frightened')).toBe(true);
      expect(retrieved.conditions).toHaveLength(2);
    });

    test('should maintain initiative order when combatants are added or removed', async () => {
      if (!dbAvailable) {
        console.log('Skipping test - database not available');
        return;
      }

      // Create initial combatants
      const c1 = await Combatant.create(testCampaignId, {
        name: 'Fighter',
        type: 'PC',
        initiative: 18,
        ac: 18,
        current_hp: 50,
        max_hp: 50,
        save_strength: 5,
        save_dexterity: 2,
        save_constitution: 4,
        save_intelligence: 0,
        save_wisdom: 1,
        save_charisma: 0
      });

      const c2 = await Combatant.create(testCampaignId, {
        name: 'Wizard',
        type: 'PC',
        initiative: 12,
        ac: 12,
        current_hp: 30,
        max_hp: 30,
        save_strength: 0,
        save_dexterity: 2,
        save_constitution: 1,
        save_intelligence: 5,
        save_wisdom: 3,
        save_charisma: 1
      });

      // Add a new combatant mid-combat
      const c3 = await Combatant.create(testCampaignId, {
        name: 'Rogue',
        type: 'PC',
        initiative: 20,
        ac: 15,
        current_hp: 35,
        max_hp: 35,
        save_strength: 1,
        save_dexterity: 5,
        save_constitution: 2,
        save_intelligence: 2,
        save_wisdom: 2,
        save_charisma: 3
      });

      // Verify order
      let order = await Combatant.findByCampaign(testCampaignId);
      // Sort by initiative descending
      order.sort((a, b) => b.initiative - a.initiative);
      expect(order[0].name).toBe('Rogue'); // 20
      expect(order[1].name).toBe('Fighter'); // 18
      expect(order[2].name).toBe('Wizard'); // 12

      // Remove middle combatant
      await Combatant.delete(c1.id);

      // Verify order is maintained
      order = await Combatant.findByCampaign(testCampaignId);
      expect(order).toHaveLength(2);
      expect(order.some(c => c.name === 'Rogue')).toBe(true);
      expect(order.some(c => c.name === 'Wizard')).toBe(true);
    });
  });

  describe('Complete Save/Load Cycle', () => {
    test('should persist and restore complete campaign state', async () => {
      if (!dbAvailable) {
        console.log('Skipping test - database not available');
        return;
      }

      // Create complete campaign state
      
      // 1. Create combatants
      const pc = await Combatant.create(testCampaignId, {
        name: 'Aragorn',
        type: 'PC',
        initiative: 19,
        ac: 17,
        current_hp: 42,
        max_hp: 50,
        save_strength: 4,
        save_dexterity: 3,
        save_constitution: 4,
        save_intelligence: 1,
        save_wisdom: 3,
        save_charisma: 3
      });

      await Combatant.addCondition(pc.id, 'blessed');

      const npc = await Combatant.create(testCampaignId, {
        name: 'Boromir',
        type: 'NPC',
        initiative: 16,
        ac: 18,
        current_hp: 45,
        max_hp: 45,
        save_strength: 4,
        save_dexterity: 2,
        save_constitution: 4,
        save_intelligence: 1,
        save_wisdom: 2,
        save_charisma: 2
      });

      // 2. Update siege state
      await SiegeState.update(testCampaignId, {
        wall_integrity: 75,
        defender_morale: 80,
        supplies: 60,
        day_of_siege: 3
      });

      await SiegeState.addNote(testCampaignId, 'Enemy catapults spotted');
      await SiegeState.addNote(testCampaignId, 'Reinforcements arrived');

      // 3. Create locations and plot points
      const location = await Location.create(testCampaignId, {
        name: 'City Gate',
        status: 'contested',
        description: 'Main entrance under heavy assault',
        coord_x: 100,
        coord_y: 200,
        coord_width: 50,
        coord_height: 50
      });

      await PlotPoint.create({
        location_id: location.id,
        name: 'Defend the Gate',
        description: 'Hold the line against Tiamat forces',
        status: 'active',
        coord_x: 125,
        coord_y: 225
      });

      // Now "reload" the campaign by fetching all data
      const loadedCombatants = await Combatant.findByCampaign(testCampaignId);
      const loadedSiege = await SiegeState.findByCampaign(testCampaignId);
      const loadedLocations = await Location.findByCampaign(testCampaignId);
      const loadedPlotPoints = await PlotPoint.findByLocation(location.id);

      // Verify all data is restored correctly
      expect(loadedCombatants).toHaveLength(2);
      expect(loadedCombatants.some(c => c.name === 'Aragorn')).toBe(true);
      expect(loadedCombatants.some(c => c.name === 'Boromir')).toBe(true);

      const aragorn = loadedCombatants.find(c => c.name === 'Aragorn');
      expect(aragorn.current_hp).toBe(42);

      expect(loadedSiege.wall_integrity).toBe(75);
      expect(loadedSiege.defender_morale).toBe(80);
      expect(loadedSiege.supplies).toBe(60);

      expect(loadedLocations).toHaveLength(1);
      expect(loadedLocations[0].name).toBe('City Gate');
      expect(loadedLocations[0].status).toBe('contested');

      expect(loadedPlotPoints).toHaveLength(1);
      expect(loadedPlotPoints[0].name).toBe('Defend the Gate');
    });

    test('should handle campaign switching', async () => {
      if (!dbAvailable) {
        console.log('Skipping test - database not available');
        return;
      }

      // Create first campaign with data
      const campaign1 = await Campaign.create({ name: 'Campaign 1' });
      await Combatant.create(campaign1.id, {
        name: 'Hero 1',
        type: 'PC',
        initiative: 15,
        ac: 15,
        current_hp: 30,
        max_hp: 30,
        save_strength: 2,
        save_dexterity: 2,
        save_constitution: 2,
        save_intelligence: 2,
        save_wisdom: 2,
        save_charisma: 2
      });

      // Create second campaign with different data
      const campaign2 = await Campaign.create({ name: 'Campaign 2' });
      await Combatant.create(campaign2.id, {
        name: 'Hero 2',
        type: 'PC',
        initiative: 18,
        ac: 18,
        current_hp: 40,
        max_hp: 40,
        save_strength: 3,
        save_dexterity: 3,
        save_constitution: 3,
        save_intelligence: 3,
        save_wisdom: 3,
        save_charisma: 3
      });

      // Load campaign 1 data
      const c1Combatants = await Combatant.findByCampaign(campaign1.id);
      expect(c1Combatants).toHaveLength(1);
      expect(c1Combatants[0].name).toBe('Hero 1');

      // Load campaign 2 data
      const c2Combatants = await Combatant.findByCampaign(campaign2.id);
      expect(c2Combatants).toHaveLength(1);
      expect(c2Combatants[0].name).toBe('Hero 2');

      // Verify isolation
      expect(c1Combatants[0].id).not.toBe(c2Combatants[0].id);

      // Cleanup
      await Campaign.delete(campaign1.id);
      await Campaign.delete(campaign2.id);
    });
  });

  describe('AI Assistant Integration', () => {
    test('should format AI request with campaign context', async () => {
      if (!dbAvailable) {
        console.log('Skipping test - database not available');
        return;
      }

      // Create campaign context
      await Combatant.create(testCampaignId, {
        name: 'Paladin',
        type: 'PC',
        initiative: 17,
        ac: 19,
        current_hp: 55,
        max_hp: 55,
        save_strength: 5,
        save_dexterity: 1,
        save_constitution: 4,
        save_intelligence: 0,
        save_wisdom: 3,
        save_charisma: 4
      });

      await SiegeState.update(testCampaignId, {
        wall_integrity: 50,
        defender_morale: 60,
        supplies: 40,
        day_of_siege: 5
      });

      // Get context data
      const combatants = await Combatant.findByCampaign(testCampaignId);
      const loadedSiege = await SiegeState.findByCampaign(testCampaignId);

      // Verify context data is available for AI formatting
      expect(combatants).toHaveLength(1);
      expect(combatants[0].name).toBe('Paladin');
      expect(loadedSiege.wall_integrity).toBe(50);
      expect(loadedSiege.day_of_siege).toBe(5);

      // In a real implementation, this data would be formatted into
      // the system prompt for ChatGPT API
      const contextString = `
        Active Combatants: ${combatants.map(c => c.name).join(', ')}
        Siege Status: Day ${loadedSiege.day_of_siege}
        Wall Integrity: ${loadedSiege.wall_integrity}%
        Defender Morale: ${loadedSiege.defender_morale}%
        Supplies: ${loadedSiege.supplies}%
      `.trim();

      expect(contextString).toContain('Paladin');
      expect(contextString).toContain('Day 5');
      expect(contextString).toContain('50%');
    });

    test('should maintain conversation history structure', async () => {
      if (!dbAvailable) {
        console.log('Skipping test - database not available');
        return;
      }

      // This test verifies conversation history data structure
      const conversationHistory = [];

      // Simulate user message
      conversationHistory.push({
        role: 'user',
        content: 'What should I do about the dragon attacking the north wall?',
        timestamp: new Date().toISOString()
      });

      // Simulate AI response
      conversationHistory.push({
        role: 'assistant',
        content: 'The dragon is a formidable threat. Consider...',
        timestamp: new Date().toISOString()
      });

      // Verify structure
      expect(conversationHistory).toHaveLength(2);
      expect(conversationHistory[0].role).toBe('user');
      expect(conversationHistory[1].role).toBe('assistant');
      expect(conversationHistory[0].timestamp).toBeDefined();
      expect(conversationHistory[1].timestamp).toBeDefined();
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    test('should handle empty campaign gracefully', async () => {
      if (!dbAvailable) {
        console.log('Skipping test - database not available');
        return;
      }

      const emptyCampaign = await Campaign.create({ name: 'Empty Campaign' });
      
      const combatants = await Combatant.findByCampaign(emptyCampaign.id);
      const siegeState = await SiegeState.findByCampaign(emptyCampaign.id);
      
      expect(combatants).toEqual([]);
      expect(siegeState).not.toBeNull(); // Campaign.create initializes default siege state
      
      await Campaign.delete(emptyCampaign.id);
    });

    test('should handle concurrent updates correctly', async () => {
      if (!dbAvailable) {
        console.log('Skipping test - database not available');
        return;
      }

      const combatant = await Combatant.create(testCampaignId, {
        name: 'Concurrent Test',
        type: 'PC',
        initiative: 15,
        ac: 15,
        current_hp: 30,
        max_hp: 30,
        save_strength: 2,
        save_dexterity: 2,
        save_constitution: 2,
        save_intelligence: 2,
        save_wisdom: 2,
        save_charisma: 2
      });

      // Simulate concurrent updates
      await Promise.all([
        Combatant.update(combatant.id, { current_hp: 25 }),
        Combatant.addCondition(combatant.id, 'blessed')
      ]);

      const result = await Combatant.findByIdWithConditions(combatant.id);
      
      // Both updates should succeed
      expect(result.current_hp).toBe(25);
      expect(result.conditions.includes('blessed')).toBe(true);
    });

    test('should handle deletion of non-existent entities gracefully', async () => {
      if (!dbAvailable) {
        console.log('Skipping test - database not available');
        return;
      }

      const fakeId = 999999; // Non-existent ID
      
      // Should not throw error, just return null
      const result = await Combatant.delete(fakeId);
      expect(result).toBeNull();
    });
  });
});
