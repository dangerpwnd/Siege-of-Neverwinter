/**
 * Unit Tests for Model Validation
 * Tests validation logic without requiring database connection
 */

const { Combatant, Monster, SiegeState, Location, PlotPoint } = require('../server/models');

describe('Combatant Model Validation', () => {
  test('should validate required fields', () => {
    const invalidData = {};
    const errors = Combatant.validate(invalidData);
    
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.includes('Name'))).toBe(true);
    expect(errors.some(e => e.includes('Type'))).toBe(true);
    expect(errors.some(e => e.includes('AC'))).toBe(true);
    expect(errors.some(e => e.includes('HP'))).toBe(true);
  });

  test('should accept valid combatant data', () => {
    const validData = {
      name: 'Test Character',
      type: 'PC',
      ac: 15,
      current_hp: 30,
      max_hp: 30,
      save_strength: 2,
      save_dexterity: 3,
      save_constitution: 2,
      save_intelligence: 0,
      save_wisdom: 1,
      save_charisma: 0
    };
    
    const errors = Combatant.validate(validData);
    expect(errors).toEqual([]);
  });

  test('should reject invalid type', () => {
    const invalidData = {
      name: 'Test',
      type: 'INVALID',
      ac: 15,
      current_hp: 30,
      max_hp: 30
    };
    
    const errors = Combatant.validate(invalidData);
    expect(errors.some(e => e.includes('type'))).toBe(true);
  });

  test('should reject negative AC', () => {
    const invalidData = {
      name: 'Test',
      type: 'PC',
      ac: -5,
      current_hp: 30,
      max_hp: 30
    };
    
    const errors = Combatant.validate(invalidData);
    expect(errors.some(e => e.includes('AC'))).toBe(true);
  });

  test('should reject negative HP', () => {
    const invalidData = {
      name: 'Test',
      type: 'PC',
      ac: 15,
      current_hp: -10,
      max_hp: 30
    };
    
    const errors = Combatant.validate(invalidData);
    expect(errors.some(e => e.includes('Current HP'))).toBe(true);
  });
});

describe('Monster Model Validation', () => {
  test('should validate required fields', () => {
    const invalidData = {};
    const errors = Monster.validate(invalidData);
    
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.includes('Name'))).toBe(true);
    expect(errors.some(e => e.includes('AC'))).toBe(true);
  });

  test('should accept valid monster data', () => {
    const validData = {
      name: 'Goblin',
      ac: 15,
      hp_formula: '2d6+2',
      stat_str: 8,
      stat_dex: 14,
      stat_con: 10,
      stat_int: 10,
      stat_wis: 8,
      stat_cha: 8,
      saves: {},
      skills: {},
      attacks: [],
      abilities: []
    };
    
    const errors = Monster.validate(validData);
    expect(errors).toEqual([]);
  });

  test('should reject invalid stat values', () => {
    const invalidData = {
      name: 'Test Monster',
      ac: 15,
      stat_str: 50 // Invalid: too high
    };
    
    const errors = Monster.validate(invalidData);
    expect(errors.some(e => e.includes('stat_str'))).toBe(true);
  });
});

describe('SiegeState Model Validation', () => {
  test('should validate value ranges', () => {
    const invalidData = {
      wall_integrity: 150, // Invalid: > 100
      defender_morale: -10, // Invalid: < 0
      supplies: 200 // Invalid: > 100
    };
    
    const errors = SiegeState.validate(invalidData);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.includes('Wall integrity'))).toBe(true);
    expect(errors.some(e => e.includes('Defender morale'))).toBe(true);
    expect(errors.some(e => e.includes('Supplies'))).toBe(true);
  });

  test('should accept valid siege state data', () => {
    const validData = {
      wall_integrity: 75,
      defender_morale: 80,
      supplies: 60,
      day_of_siege: 5,
      custom_metrics: { 'artillery': 10 }
    };
    
    const errors = SiegeState.validate(validData);
    expect(errors).toEqual([]);
  });
});

describe('Location Model Validation', () => {
  test('should validate required fields', () => {
    const invalidData = {};
    const errors = Location.validate(invalidData);
    
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.includes('Name'))).toBe(true);
  });

  test('should accept valid location data', () => {
    const validData = {
      name: 'Castle Never',
      status: 'controlled',
      description: 'The main castle',
      coord_x: 100,
      coord_y: 200,
      coord_width: 50,
      coord_height: 50
    };
    
    const errors = Location.validate(validData);
    expect(errors).toEqual([]);
  });

  test('should reject invalid status', () => {
    const invalidData = {
      name: 'Test Location',
      status: 'INVALID'
    };
    
    const errors = Location.validate(invalidData);
    expect(errors.some(e => e.includes('Status'))).toBe(true);
  });
});

describe('PlotPoint Model Validation', () => {
  test('should validate required fields', () => {
    const invalidData = {};
    const errors = PlotPoint.validate(invalidData);
    
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.includes('Name'))).toBe(true);
    expect(errors.some(e => e.includes('location_id'))).toBe(true);
  });

  test('should accept valid plot point data', () => {
    const validData = {
      name: 'Rescue Mission',
      location_id: 1,
      description: 'Save the prisoners',
      status: 'active',
      coord_x: 150,
      coord_y: 250
    };
    
    const errors = PlotPoint.validate(validData);
    expect(errors).toEqual([]);
  });

  test('should reject invalid status', () => {
    const invalidData = {
      name: 'Test Plot',
      location_id: 1,
      status: 'INVALID'
    };
    
    const errors = PlotPoint.validate(invalidData);
    expect(errors.some(e => e.includes('Status'))).toBe(true);
  });
});
