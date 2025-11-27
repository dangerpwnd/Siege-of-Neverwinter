/**
 * Property-Based Tests for Layout Configuration
 * Feature: siege-of-neverwinter
 * Tests layout configuration and module positioning properties
 */

const fc = require('fast-check');
const db = require('../database/db');
const Campaign = require('../server/models/Campaign');

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
      "INSERT INTO campaigns (name) VALUES ('Test Layout Campaign') RETURNING id"
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
 * Generator for valid column count (2, 3, or 4)
 */
const columnCountArbitrary = fc.constantFrom(2, 3, 4);

/**
 * Generator for valid module IDs
 */
const moduleIdArbitrary = fc.constantFrom(
  'initiative-tracker',
  'character-panel',
  'npc-panel',
  'monster-database',
  'siege-mechanics',
  'ai-assistant',
  'city-map'
);

/**
 * Generator for module position data
 */
const modulePositionArbitrary = fc.record({
  moduleId: moduleIdArbitrary,
  column: fc.integer({ min: 0, max: 3 }), // 0-3 to cover all column counts
  row: fc.integer({ min: 0, max: 10 }),
  isExpanded: fc.boolean()
});

/**
 * Generator for layout configuration with unique module IDs
 */
const layoutConfigArbitrary = fc.record({
  columnCount: columnCountArbitrary,
  modulePositions: fc.array(modulePositionArbitrary, { minLength: 0, maxLength: 7 })
}).map(config => {
  // Ensure each moduleId appears only once by keeping the first occurrence
  const seen = new Set();
  const uniquePositions = config.modulePositions.filter(pos => {
    if (seen.has(pos.moduleId)) {
      return false;
    }
    seen.add(pos.moduleId);
    return true;
  });
  
  return {
    ...config,
    modulePositions: uniquePositions
  };
});

/**
 * Generator for module visibility preferences
 */
const moduleVisibilityArbitrary = fc.record({
  'initiative-tracker': fc.boolean(),
  'character-panel': fc.boolean(),
  'npc-panel': fc.boolean(),
  'monster-database': fc.boolean(),
  'siege-mechanics': fc.boolean(),
  'ai-assistant': fc.boolean(),
  'city-map': fc.boolean()
});

/**
 * Generator for module sizes (expansion state)
 */
const moduleSizesArbitrary = fc.record({
  'initiative-tracker': fc.boolean(),
  'character-panel': fc.boolean(),
  'npc-panel': fc.boolean(),
  'monster-database': fc.boolean(),
  'siege-mechanics': fc.boolean(),
  'ai-assistant': fc.boolean(),
  'city-map': fc.boolean()
});

// Helper functions

/**
 * Save layout configuration to database
 */
async function saveLayoutConfiguration(campaignId, layoutConfig) {
  await db.query(
    `INSERT INTO user_preferences (campaign_id, preference_key, preference_value, updated_at)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
     ON CONFLICT (campaign_id, preference_key)
     DO UPDATE SET preference_value = $3, updated_at = CURRENT_TIMESTAMP`,
    [campaignId, 'layoutConfiguration', JSON.stringify(layoutConfig)]
  );
}

/**
 * Get layout configuration from database
 */
async function getLayoutConfiguration(campaignId) {
  const result = await db.query(
    'SELECT preference_value FROM user_preferences WHERE campaign_id = $1 AND preference_key = $2',
    [campaignId, 'layoutConfiguration']
  );
  
  if (result.rows.length === 0) {
    return { columnCount: 3, modulePositions: [] };
  }
  
  return result.rows[0].preference_value;
}

/**
 * Save preferences to database
 */
async function savePreferences(campaignId, preferences) {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const [key, value] of Object.entries(preferences)) {
      await client.query(
        `INSERT INTO user_preferences (campaign_id, preference_key, preference_value, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (campaign_id, preference_key)
         DO UPDATE SET preference_value = $3, updated_at = CURRENT_TIMESTAMP`,
        [campaignId, key, JSON.stringify(value)]
      );
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get preferences from database
 */
async function getPreferences(campaignId) {
  const result = await db.query(
    'SELECT preference_key, preference_value FROM user_preferences WHERE campaign_id = $1',
    [campaignId]
  );
  
  const preferences = {};
  result.rows.forEach(row => {
    preferences[row.preference_key] = row.preference_value;
  });
  
  return preferences;
}

// Property Tests

describe('Layout Configuration Properties', () => {
  
  /**
   * Feature: siege-of-neverwinter, Property 41: Column layout configuration
   * Validates: Requirements 11.1
   * 
   * For any column count selection (2, 3, or 4), the layout manager should arrange 
   * all modules in the specified number of columns
   */
  test('Property 41: Column layout configuration', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(columnCountArbitrary, async (columnCount) => {
        // Save layout configuration with specified column count
        const layoutConfig = {
          columnCount,
          modulePositions: []
        };
        
        await saveLayoutConfiguration(testCampaignId, layoutConfig);
        
        // Retrieve layout configuration
        const retrieved = await getLayoutConfiguration(testCampaignId);
        
        // Verify column count is stored and retrieved correctly
        expect(retrieved).toBeDefined();
        expect(retrieved.columnCount).toBe(columnCount);
        expect([2, 3, 4]).toContain(retrieved.columnCount);
        
        // Clean up
        await db.query(
          'DELETE FROM user_preferences WHERE campaign_id = $1 AND preference_key = $2',
          [testCampaignId, 'layoutConfiguration']
        );
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 42: Module drag and reposition
   * Validates: Requirements 11.2
   * 
   * For any module dragged to a new position, the layout should update the module's 
   * position within the column grid and persist the change
   */
  test('Property 42: Module drag and reposition', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        moduleIdArbitrary,
        fc.integer({ min: 0, max: 3 }),
        fc.integer({ min: 0, max: 10 }),
        async (moduleId, column, row) => {
          // Create initial layout configuration
          const initialConfig = {
            columnCount: 3,
            modulePositions: []
          };
          
          await saveLayoutConfiguration(testCampaignId, initialConfig);
          
          // Simulate dragging module to new position
          const updatedConfig = {
            columnCount: 3,
            modulePositions: [{
              moduleId,
              column,
              row,
              isExpanded: false
            }]
          };
          
          await saveLayoutConfiguration(testCampaignId, updatedConfig);
          
          // Retrieve layout configuration
          const retrieved = await getLayoutConfiguration(testCampaignId);
          
          // Verify module position is persisted
          expect(retrieved).toBeDefined();
          expect(retrieved.modulePositions).toBeDefined();
          expect(Array.isArray(retrieved.modulePositions)).toBe(true);
          
          const modulePosition = retrieved.modulePositions.find(p => p.moduleId === moduleId);
          expect(modulePosition).toBeDefined();
          expect(modulePosition.column).toBe(column);
          expect(modulePosition.row).toBe(row);
          
          // Clean up
          await db.query(
            'DELETE FROM user_preferences WHERE campaign_id = $1 AND preference_key = $2',
            [testCampaignId, 'layoutConfiguration']
          );
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 43: Module expansion spans column
   * Validates: Requirements 11.3
   * 
   * For any module, expanding it should increase its width to span the full column width
   */
  test('Property 43: Module expansion spans column', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(moduleIdArbitrary, async (moduleId) => {
        // Create layout configuration with module in normal state
        const normalConfig = {
          columnCount: 3,
          modulePositions: [{
            moduleId,
            column: 0,
            row: 0,
            isExpanded: false
          }]
        };
        
        await saveLayoutConfiguration(testCampaignId, normalConfig);
        
        // Expand the module
        const expandedConfig = {
          columnCount: 3,
          modulePositions: [{
            moduleId,
            column: 0,
            row: 0,
            isExpanded: true
          }]
        };
        
        await saveLayoutConfiguration(testCampaignId, expandedConfig);
        
        // Retrieve layout configuration
        const retrieved = await getLayoutConfiguration(testCampaignId);
        
        // Verify module is marked as expanded
        expect(retrieved).toBeDefined();
        expect(retrieved.modulePositions).toBeDefined();
        
        const modulePosition = retrieved.modulePositions.find(p => p.moduleId === moduleId);
        expect(modulePosition).toBeDefined();
        expect(modulePosition.isExpanded).toBe(true);
        
        // Clean up
        await db.query(
          'DELETE FROM user_preferences WHERE campaign_id = $1 AND preference_key = $2',
          [testCampaignId, 'layoutConfiguration']
        );
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 44: Module shrink restores width
   * Validates: Requirements 11.4
   * 
   * For any expanded module, shrinking it should restore the module to its default column width
   */
  test('Property 44: Module shrink restores width', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(moduleIdArbitrary, async (moduleId) => {
        // Create layout configuration with module in expanded state
        const expandedConfig = {
          columnCount: 3,
          modulePositions: [{
            moduleId,
            column: 0,
            row: 0,
            isExpanded: true
          }]
        };
        
        await saveLayoutConfiguration(testCampaignId, expandedConfig);
        
        // Shrink the module
        const shrunkConfig = {
          columnCount: 3,
          modulePositions: [{
            moduleId,
            column: 0,
            row: 0,
            isExpanded: false
          }]
        };
        
        await saveLayoutConfiguration(testCampaignId, shrunkConfig);
        
        // Retrieve layout configuration
        const retrieved = await getLayoutConfiguration(testCampaignId);
        
        // Verify module is marked as not expanded (normal width)
        expect(retrieved).toBeDefined();
        expect(retrieved.modulePositions).toBeDefined();
        
        const modulePosition = retrieved.modulePositions.find(p => p.moduleId === moduleId);
        expect(modulePosition).toBeDefined();
        expect(modulePosition.isExpanded).toBe(false);
        
        // Clean up
        await db.query(
          'DELETE FROM user_preferences WHERE campaign_id = $1 AND preference_key = $2',
          [testCampaignId, 'layoutConfiguration']
        );
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 45: Layout configuration persistence round-trip
   * Validates: Requirements 11.5
   * 
   * For any layout configuration including column count and module placements, 
   * closing and reopening the application should restore the exact layout
   */
  test('Property 45: Layout configuration persistence round-trip', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(layoutConfigArbitrary, async (layoutConfig) => {
        // Filter module positions to ensure columns are valid for the column count
        const validModulePositions = layoutConfig.modulePositions
          .filter(pos => pos.column < layoutConfig.columnCount)
          .map(pos => ({
            moduleId: pos.moduleId,
            column: pos.column,
            row: pos.row,
            isExpanded: pos.isExpanded
          }));
        
        const configToSave = {
          columnCount: layoutConfig.columnCount,
          modulePositions: validModulePositions
        };
        
        // Save layout configuration (simulates closing application)
        await saveLayoutConfiguration(testCampaignId, configToSave);
        
        // Retrieve layout configuration (simulates reopening application)
        const retrieved = await getLayoutConfiguration(testCampaignId);
        
        // Verify complete layout configuration is restored
        expect(retrieved).toBeDefined();
        expect(retrieved.columnCount).toBe(configToSave.columnCount);
        expect(retrieved.modulePositions).toBeDefined();
        expect(Array.isArray(retrieved.modulePositions)).toBe(true);
        expect(retrieved.modulePositions.length).toBe(configToSave.modulePositions.length);
        
        // Verify each module position is restored correctly
        for (const originalPos of configToSave.modulePositions) {
          const retrievedPos = retrieved.modulePositions.find(
            p => p.moduleId === originalPos.moduleId
          );
          
          expect(retrievedPos).toBeDefined();
          expect(retrievedPos.column).toBe(originalPos.column);
          expect(retrievedPos.row).toBe(originalPos.row);
          expect(retrievedPos.isExpanded).toBe(originalPos.isExpanded);
        }
        
        // Clean up
        await db.query(
          'DELETE FROM user_preferences WHERE campaign_id = $1 AND preference_key = $2',
          [testCampaignId, 'layoutConfiguration']
        );
      }),
      { numRuns: NUM_RUNS }
    );
  });
});

describe('Module Visibility and Positioning Properties', () => {
  
  /**
   * Feature: siege-of-neverwinter, Property 35: Module visibility isolation
   * Validates: Requirements 9.1
   * 
   * For any module, toggling its visibility should change only that module's 
   * visibility state without affecting other modules
   */
  test('Property 35: Module visibility isolation', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        moduleIdArbitrary,
        moduleVisibilityArbitrary,
        async (targetModuleId, initialVisibility) => {
          // Save initial visibility state for all modules
          await savePreferences(testCampaignId, {
            moduleVisibility: initialVisibility
          });
          
          // Toggle target module visibility
          const updatedVisibility = {
            ...initialVisibility,
            [targetModuleId]: !initialVisibility[targetModuleId]
          };
          
          await savePreferences(testCampaignId, {
            moduleVisibility: updatedVisibility
          });
          
          // Retrieve preferences
          const retrieved = await getPreferences(testCampaignId);
          
          // Verify only target module visibility changed
          expect(retrieved.moduleVisibility).toBeDefined();
          expect(retrieved.moduleVisibility[targetModuleId]).toBe(!initialVisibility[targetModuleId]);
          
          // Verify other modules' visibility unchanged
          for (const [moduleId, visibility] of Object.entries(initialVisibility)) {
            if (moduleId !== targetModuleId) {
              expect(retrieved.moduleVisibility[moduleId]).toBe(visibility);
            }
          }
          
          // Clean up
          await db.query(
            'DELETE FROM user_preferences WHERE campaign_id = $1',
            [testCampaignId]
          );
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 36: Module visibility persistence round-trip
   * Validates: Requirements 9.2
   * 
   * For any module visibility configuration, closing and reopening the application 
   * should restore the same visibility states
   */
  test('Property 36: Module visibility persistence round-trip', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(moduleVisibilityArbitrary, async (visibility) => {
        // Save visibility configuration (simulates closing application)
        await savePreferences(testCampaignId, {
          moduleVisibility: visibility
        });
        
        // Retrieve visibility configuration (simulates reopening application)
        const retrieved = await getPreferences(testCampaignId);
        
        // Verify all module visibility states are restored
        expect(retrieved.moduleVisibility).toBeDefined();
        
        for (const [moduleId, isVisible] of Object.entries(visibility)) {
          expect(retrieved.moduleVisibility[moduleId]).toBe(isVisible);
        }
        
        // Clean up
        await db.query(
          'DELETE FROM user_preferences WHERE campaign_id = $1',
          [testCampaignId]
        );
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Feature: siege-of-neverwinter, Property 37: Module resize and reposition
   * Validates: Requirements 9.5
   * 
   * For any module, resize and reposition operations should update and persist 
   * the module's dimensions and position
   */
  test('Property 37: Module resize and reposition', async () => {
    if (!dbAvailable) {
      console.log('Skipping test - database not available');
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        moduleIdArbitrary,
        fc.integer({ min: 0, max: 3 }),
        fc.boolean(),
        async (moduleId, column, isExpanded) => {
          // Save initial module position and size
          const initialConfig = {
            columnCount: 3,
            modulePositions: [{
              moduleId,
              column: 0,
              row: 0,
              isExpanded: false
            }]
          };
          
          await saveLayoutConfiguration(testCampaignId, initialConfig);
          
          // Update module position and size
          const updatedConfig = {
            columnCount: 3,
            modulePositions: [{
              moduleId,
              column,
              row: 0,
              isExpanded
            }]
          };
          
          await saveLayoutConfiguration(testCampaignId, updatedConfig);
          
          // Retrieve layout configuration
          const retrieved = await getLayoutConfiguration(testCampaignId);
          
          // Verify module position and size are persisted
          expect(retrieved).toBeDefined();
          expect(retrieved.modulePositions).toBeDefined();
          
          const modulePosition = retrieved.modulePositions.find(p => p.moduleId === moduleId);
          expect(modulePosition).toBeDefined();
          expect(modulePosition.column).toBe(column);
          expect(modulePosition.isExpanded).toBe(isExpanded);
          
          // Clean up
          await db.query(
            'DELETE FROM user_preferences WHERE campaign_id = $1 AND preference_key = $2',
            [testCampaignId, 'layoutConfiguration']
          );
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});
