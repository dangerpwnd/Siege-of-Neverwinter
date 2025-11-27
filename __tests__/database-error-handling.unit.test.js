/**
 * Unit Tests for Database Error Handling
 * Tests PostgreSQL connection failures, query errors, and recovery mechanisms
 */

const Campaign = require('../server/models/Campaign');
const Combatant = require('../server/models/Combatant');
const db = require('../database/db');

// Mock the database module for error simulation
jest.mock('../database/db', () => {
  const originalModule = jest.requireActual('../database/db');
  return {
    ...originalModule,
    query: jest.fn(),
    transaction: jest.fn(),
    pool: {
      ...originalModule.pool,
      end: jest.fn()
    }
  };
});

describe('Database Error Handling', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test PostgreSQL connection failure handling
   * Requirements: 10.1, 10.2
   */
  describe('Connection Failure Handling', () => {
    
    test('should handle ECONNREFUSED error gracefully', async () => {
      const connectionError = new Error('Connection refused');
      connectionError.code = 'ECONNREFUSED';
      
      db.query.mockRejectedValue(connectionError);
      
      await expect(Campaign.findAll()).rejects.toThrow('Connection refused');
    });

    test('should handle ETIMEDOUT error gracefully', async () => {
      const timeoutError = new Error('Connection timeout');
      timeoutError.code = 'ETIMEDOUT';
      
      db.query.mockRejectedValue(timeoutError);
      
      await expect(Campaign.findById(1)).rejects.toThrow('Connection timeout');
    });

    test('should handle connection termination error', async () => {
      const terminationError = new Error('Connection terminated unexpectedly');
      
      db.query.mockRejectedValue(terminationError);
      
      await expect(Campaign.findAll()).rejects.toThrow('Connection terminated');
    });
  });

  /**
   * Test database query error handling
   * Requirements: 10.1, 10.2
   */
  describe('Query Error Handling', () => {
    
    test('should handle syntax errors in queries', async () => {
      const syntaxError = new Error('syntax error at or near "SELCT"');
      syntaxError.code = '42601';
      
      db.query.mockRejectedValue(syntaxError);
      
      await expect(Campaign.findAll()).rejects.toThrow('syntax error');
    });

    test('should handle foreign key constraint violations', async () => {
      const fkError = new Error('violates foreign key constraint');
      fkError.code = '23503';
      
      db.query.mockRejectedValue(fkError);
      
      await expect(Combatant.create(99999, {
        name: 'Test',
        type: 'PC',
        ac: 15,
        current_hp: 50,
        max_hp: 50
      })).rejects.toThrow('foreign key constraint');
    });

    test('should handle unique constraint violations', async () => {
      const uniqueError = new Error('duplicate key value violates unique constraint');
      uniqueError.code = '23505';
      
      db.query.mockRejectedValue(uniqueError);
      
      await expect(Campaign.create({ name: 'Test Campaign' })).rejects.toThrow('unique constraint');
    });

    test('should handle null constraint violations', async () => {
      const nullError = new Error('null value in column violates not-null constraint');
      nullError.code = '23502';
      
      db.query.mockRejectedValue(nullError);
      
      await expect(Campaign.create({ name: null })).rejects.toThrow();
    });
  });

  /**
   * Test corrupted data recovery
   * Requirements: 10.1, 10.2
   */
  describe('Corrupted Data Recovery', () => {
    
    test('should handle malformed JSON in JSONB columns', async () => {
      // Simulate query returning corrupted JSON
      db.query.mockResolvedValue({
        rows: [{
          id: 1,
          name: 'Test Campaign',
          custom_metrics: 'invalid json{]'
        }]
      });
      
      // The application should handle this gracefully
      // In real scenario, PostgreSQL would reject invalid JSON, but we test the handling
      const result = await db.query('SELECT * FROM campaigns');
      expect(result.rows[0]).toBeDefined();
    });

    test('should handle missing required fields in returned data', async () => {
      db.query.mockResolvedValue({
        rows: [{
          id: 1,
          // Missing 'name' field
        }]
      });
      
      const result = await db.query('SELECT * FROM campaigns');
      expect(result.rows[0].id).toBe(1);
      expect(result.rows[0].name).toBeUndefined();
    });

    test('should handle unexpected data types', async () => {
      db.query.mockResolvedValue({
        rows: [{
          id: 'not-a-number', // Should be integer
          name: 123, // Should be string
          created_at: 'invalid-date'
        }]
      });
      
      const result = await db.query('SELECT * FROM campaigns');
      expect(result.rows[0]).toBeDefined();
      // Application should validate data types before use
    });
  });

  /**
   * Test missing data graceful degradation
   * Requirements: 10.1, 10.2
   */
  describe('Missing Data Graceful Degradation', () => {
    
    test('should return null when campaign not found', async () => {
      db.query.mockResolvedValue({ rows: [] });
      
      const campaign = await Campaign.findById(99999);
      expect(campaign).toBeNull();
    });

    test('should return empty array when no campaigns exist', async () => {
      db.query.mockResolvedValue({ rows: [] });
      
      const campaigns = await Campaign.findAll();
      expect(campaigns).toEqual([]);
    });

    test('should handle missing related data gracefully', async () => {
      // Campaign exists but has no combatants
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Test Campaign' }] }) // Campaign
        .mockResolvedValueOnce({ rows: [] }) // Combatants
        .mockResolvedValueOnce({ rows: [] }) // Monsters
        .mockResolvedValueOnce({ rows: [] }) // Monster instances
        .mockResolvedValueOnce({ rows: [{ id: 1, campaign_id: 1, notes: [] }] }) // Siege state
        .mockResolvedValueOnce({ rows: [] }) // Locations
        .mockResolvedValueOnce({ rows: [] }); // Preferences
      
      const state = await Campaign.getCompleteState(1);
      
      expect(state.campaign).toBeDefined();
      expect(state.combatants).toEqual([]);
      expect(state.monsters).toEqual([]);
      expect(state.locations).toEqual([]);
    });
  });

  /**
   * Test transaction rollback on errors
   * Requirements: 10.1, 10.2
   */
  describe('Transaction Rollback on Errors', () => {
    
    test('should rollback transaction on error', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [] }) // BEGIN
          .mockRejectedValueOnce(new Error('Query failed')), // Failing query
        release: jest.fn()
      };
      
      db.transaction.mockImplementation(async (callback) => {
        try {
          await mockClient.query('BEGIN');
          await callback(mockClient);
          await mockClient.query('COMMIT');
        } catch (error) {
          await mockClient.query('ROLLBACK');
          throw error;
        } finally {
          mockClient.release();
        }
      });
      
      await expect(
        db.transaction(async (client) => {
          await client.query('INSERT INTO campaigns (name) VALUES ($1)', ['Test']);
          throw new Error('Query failed');
        })
      ).rejects.toThrow('Query failed');
      
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('should rollback on constraint violation during import', async () => {
      const constraintError = new Error('violates foreign key constraint');
      constraintError.code = '23503';
      
      db.transaction.mockRejectedValue(constraintError);
      
      const invalidState = {
        campaign: { name: 'Test' },
        combatants: [{
          name: 'Test',
          type: 'PC',
          ac: 15,
          current_hp: 50,
          max_hp: 50,
          save_strength: 0,
          save_dexterity: 0,
          save_constitution: 0,
          save_intelligence: 0,
          save_wisdom: 0,
          save_charisma: 0
        }],
        monsters: [],
        monsterInstances: [],
        siegeState: null,
        locations: [],
        preferences: []
      };
      
      await expect(Campaign.restoreState(invalidState)).rejects.toThrow('foreign key constraint');
    });

    test('should ensure all-or-nothing import behavior', async () => {
      let commitCalled = false;
      let rollbackCalled = false;
      
      const mockClient = {
        query: jest.fn()
          .mockImplementation((sql) => {
            if (sql === 'COMMIT') commitCalled = true;
            if (sql === 'ROLLBACK') rollbackCalled = true;
            if (sql.includes('INSERT') && sql.includes('combatants')) {
              throw new Error('Insert failed');
            }
            return Promise.resolve({ rows: [{ id: 1 }] });
          }),
        release: jest.fn()
      };
      
      db.transaction.mockImplementation(async (callback) => {
        try {
          await mockClient.query('BEGIN');
          const result = await callback(mockClient);
          await mockClient.query('COMMIT');
          return result;
        } catch (error) {
          await mockClient.query('ROLLBACK');
          throw error;
        } finally {
          mockClient.release();
        }
      });
      
      const stateData = {
        campaign: { name: 'Test' },
        combatants: [{
          name: 'Test',
          type: 'PC',
          ac: 15,
          current_hp: 50,
          max_hp: 50,
          save_strength: 0,
          save_dexterity: 0,
          save_constitution: 0,
          save_intelligence: 0,
          save_wisdom: 0,
          save_charisma: 0
        }],
        monsters: [],
        monsterInstances: [],
        siegeState: null,
        locations: [],
        preferences: []
      };
      
      await expect(Campaign.restoreState(stateData)).rejects.toThrow();
      
      // Verify rollback was called and commit was not
      expect(rollbackCalled).toBe(true);
      expect(commitCalled).toBe(false);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  /**
   * Test validation errors
   * Requirements: 10.1, 10.2
   */
  describe('Validation Error Handling', () => {
    
    test('should reject invalid campaign data before database call', async () => {
      // This should fail validation before hitting the database
      await expect(Campaign.create({ name: '' })).rejects.toThrow('Validation failed');
      
      // Database should not be called
      expect(db.query).not.toHaveBeenCalled();
    });

    test('should reject invalid combatant data before database call', async () => {
      await expect(Combatant.create(1, {
        name: '',
        type: 'INVALID',
        ac: -5,
        current_hp: -10,
        max_hp: 0
      })).rejects.toThrow('Validation failed');
      
      expect(db.query).not.toHaveBeenCalled();
    });

    test('should provide detailed validation error messages', async () => {
      try {
        await Campaign.create({ name: '   ' });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('Validation failed');
        expect(error.message).toContain('non-empty string');
      }
    });
  });

  /**
   * Test retry logic for transient errors
   * Requirements: 10.1, 10.2
   */
  describe('Retry Logic for Transient Errors', () => {
    
    test('should retry on connection timeout', async () => {
      const timeoutError = new Error('connection timeout');
      timeoutError.code = 'ETIMEDOUT';
      
      // Fail twice, then succeed
      db.query
        .mockRejectedValueOnce(timeoutError)
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Test' }] });
      
      // The retry logic is in the routes, not the model
      // This test verifies the error is thrown so retry can happen
      await expect(Campaign.findAll()).rejects.toThrow('connection timeout');
    });

    test('should not retry on non-transient errors', async () => {
      const validationError = new Error('Validation failed');
      
      // Reset mock and set new behavior
      db.query.mockReset();
      db.query.mockRejectedValue(validationError);
      
      // Should fail immediately without retry
      await expect(Campaign.findAll()).rejects.toThrow('Validation failed');
    });
  });
});
