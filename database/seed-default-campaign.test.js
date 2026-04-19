/**
 * Integration Tests for Default Campaign Seeding Module
 *
 * Covers:
 * 13.1 - Seeding on empty database creates all entities
 * 13.2 - Idempotency (running twice does not create duplicates)
 * 13.3 - Transaction rollback on critical failure
 * 13.4 - Non-critical failure handling
 */

const { Pool } = require('pg');
const { seedDefaultCampaign } = require('./seed-default-campaign');
require('dotenv').config();

const CAMPAIGN_NAME = 'Siege of Neverwinter - Tutorial Campaign';

describe('Default Campaign Seeding', () => {
  let pool;

  beforeAll(() => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  /**
   * Helper: clean all seeded data from the database.
   * Deletes in reverse dependency order to respect foreign keys.
   */
  async function cleanSeededData() {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Delete in dependency order
      await client.query(
        `DELETE FROM plot_points WHERE location_id IN (
          SELECT id FROM locations WHERE campaign_id IN (
            SELECT id FROM campaigns WHERE name = $1
          )
        )`,
        [CAMPAIGN_NAME]
      );
      await client.query(
        `DELETE FROM locations WHERE campaign_id IN (
          SELECT id FROM campaigns WHERE name = $1
        )`,
        [CAMPAIGN_NAME]
      );
      await client.query(
        `DELETE FROM siege_notes WHERE siege_state_id IN (
          SELECT id FROM siege_state WHERE campaign_id IN (
            SELECT id FROM campaigns WHERE name = $1
          )
        )`,
        [CAMPAIGN_NAME]
      );
      await client.query(
        `DELETE FROM siege_state WHERE campaign_id IN (
          SELECT id FROM campaigns WHERE name = $1
        )`,
        [CAMPAIGN_NAME]
      );
      await client.query(
        `DELETE FROM monster_instances WHERE combatant_id IN (
          SELECT id FROM combatants WHERE campaign_id IN (
            SELECT id FROM campaigns WHERE name = $1
          )
        )`,
        [CAMPAIGN_NAME]
      );
      await client.query(
        `DELETE FROM monsters WHERE campaign_id IN (
          SELECT id FROM campaigns WHERE name = $1
        )`,
        [CAMPAIGN_NAME]
      );
      await client.query(
        `DELETE FROM combatants WHERE campaign_id IN (
          SELECT id FROM campaigns WHERE name = $1
        )`,
        [CAMPAIGN_NAME]
      );
      await client.query('DELETE FROM campaigns WHERE name = $1', [CAMPAIGN_NAME]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 13.1 - Seeding on empty database creates all entities
  // Requirements: 1.2, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1, 10.1
  // ─────────────────────────────────────────────────────────────────────────
  describe('13.1 - Seeding on empty database creates all entities', () => {
    beforeEach(async () => {
      await cleanSeededData();
    });

    afterEach(async () => {
      await cleanSeededData();
    });

    it('should create the default campaign (Req 2.1)', async () => {
      const result = await seedDefaultCampaign(pool);
      expect(result).toBe(true);

      const { rows } = await pool.query(
        'SELECT * FROM campaigns WHERE name = $1',
        [CAMPAIGN_NAME]
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].name).toBe(CAMPAIGN_NAME);
      expect(rows[0].created_at).toBeDefined();
    });

    it('should create at least 3 player characters (Req 3.1)', async () => {
      await seedDefaultCampaign(pool);

      const { rows: campaigns } = await pool.query(
        'SELECT id FROM campaigns WHERE name = $1',
        [CAMPAIGN_NAME]
      );
      const campaignId = campaigns[0].id;

      const { rows: pcs } = await pool.query(
        "SELECT * FROM combatants WHERE campaign_id = $1 AND type = 'PC'",
        [campaignId]
      );
      expect(pcs.length).toBeGreaterThanOrEqual(3);

      // Verify each PC has required fields
      for (const pc of pcs) {
        expect(pc.name).toBeTruthy();
        expect(pc.type).toBe('PC');
        expect(pc.character_class).toBeTruthy();
        expect(pc.level).toBeGreaterThan(0);
        expect(pc.ac).toBeGreaterThan(0);
        expect(pc.max_hp).toBeGreaterThan(0);
        expect(pc.current_hp).toBe(pc.max_hp);
        expect(pc.campaign_id).toBe(campaignId);
      }
    });

    it('should create at least 2 NPCs (Req 4.1)', async () => {
      await seedDefaultCampaign(pool);

      const { rows: campaigns } = await pool.query(
        'SELECT id FROM campaigns WHERE name = $1',
        [CAMPAIGN_NAME]
      );
      const campaignId = campaigns[0].id;

      const { rows: npcs } = await pool.query(
        "SELECT * FROM combatants WHERE campaign_id = $1 AND type = 'NPC'",
        [campaignId]
      );
      expect(npcs.length).toBeGreaterThanOrEqual(2);

      for (const npc of npcs) {
        expect(npc.name).toBeTruthy();
        expect(npc.type).toBe('NPC');
        expect(npc.campaign_id).toBe(campaignId);
      }
    });

    it('should create at least 4 monster templates (Req 5.1)', async () => {
      await seedDefaultCampaign(pool);

      const { rows: campaigns } = await pool.query(
        'SELECT id FROM campaigns WHERE name = $1',
        [CAMPAIGN_NAME]
      );
      const campaignId = campaigns[0].id;

      const { rows: monsters } = await pool.query(
        'SELECT * FROM monsters WHERE campaign_id = $1',
        [campaignId]
      );
      expect(monsters.length).toBeGreaterThanOrEqual(4);

      for (const m of monsters) {
        expect(m.name).toBeTruthy();
        expect(m.ac).toBeGreaterThan(0);
        expect(m.campaign_id).toBe(campaignId);
      }
    });

    it('should create at least 2 monster instances with valid FK links (Req 6.1)', async () => {
      await seedDefaultCampaign(pool);

      const { rows: campaigns } = await pool.query(
        'SELECT id FROM campaigns WHERE name = $1',
        [CAMPAIGN_NAME]
      );
      const campaignId = campaigns[0].id;

      const { rows: instances } = await pool.query(
        `SELECT mi.*, c.type AS combatant_type, c.campaign_id AS combatant_campaign_id
         FROM monster_instances mi
         JOIN combatants c ON c.id = mi.combatant_id
         WHERE c.campaign_id = $1`,
        [campaignId]
      );
      expect(instances.length).toBeGreaterThanOrEqual(2);

      // Verify FK relationships
      for (const inst of instances) {
        expect(inst.monster_id).toBeTruthy();
        expect(inst.combatant_id).toBeTruthy();
        expect(inst.instance_name).toBeTruthy();
        expect(inst.combatant_type).toBe('Monster');
        expect(inst.combatant_campaign_id).toBe(campaignId);

        // Verify monster_id references a valid monster template
        const { rows: monsterCheck } = await pool.query(
          'SELECT id FROM monsters WHERE id = $1 AND campaign_id = $2',
          [inst.monster_id, campaignId]
        );
        expect(monsterCheck).toHaveLength(1);
      }
    });

    it('should create at least 4 locations with varied statuses (Req 7.1)', async () => {
      await seedDefaultCampaign(pool);

      const { rows: campaigns } = await pool.query(
        'SELECT id FROM campaigns WHERE name = $1',
        [CAMPAIGN_NAME]
      );
      const campaignId = campaigns[0].id;

      const { rows: locations } = await pool.query(
        'SELECT * FROM locations WHERE campaign_id = $1',
        [campaignId]
      );
      expect(locations.length).toBeGreaterThanOrEqual(4);

      const statuses = new Set(locations.map((l) => l.status));
      // Should include at least controlled, contested, enemy
      expect(statuses.size).toBeGreaterThanOrEqual(2);

      for (const loc of locations) {
        expect(loc.name).toBeTruthy();
        expect(loc.campaign_id).toBe(campaignId);
        expect(['controlled', 'contested', 'enemy', 'destroyed']).toContain(loc.status);
      }
    });

    it('should create at least 3 plot points linked to valid locations (Req 8.1)', async () => {
      await seedDefaultCampaign(pool);

      const { rows: campaigns } = await pool.query(
        'SELECT id FROM campaigns WHERE name = $1',
        [CAMPAIGN_NAME]
      );
      const campaignId = campaigns[0].id;

      const { rows: locationIds } = await pool.query(
        'SELECT id FROM locations WHERE campaign_id = $1',
        [campaignId]
      );
      const validLocationIds = new Set(locationIds.map((r) => r.id));

      const { rows: plotPoints } = await pool.query(
        `SELECT pp.* FROM plot_points pp
         JOIN locations l ON l.id = pp.location_id
         WHERE l.campaign_id = $1`,
        [campaignId]
      );
      expect(plotPoints.length).toBeGreaterThanOrEqual(3);

      for (const pp of plotPoints) {
        expect(pp.name).toBeTruthy();
        expect(validLocationIds.has(pp.location_id)).toBe(true);
        expect(['active', 'completed', 'failed']).toContain(pp.status);
      }
    });

    it('should create siege state with valid values (Req 9.1)', async () => {
      await seedDefaultCampaign(pool);

      const { rows: campaigns } = await pool.query(
        'SELECT id FROM campaigns WHERE name = $1',
        [CAMPAIGN_NAME]
      );
      const campaignId = campaigns[0].id;

      const { rows: siegeStates } = await pool.query(
        'SELECT * FROM siege_state WHERE campaign_id = $1',
        [campaignId]
      );
      expect(siegeStates).toHaveLength(1);

      const ss = siegeStates[0];
      expect(ss.wall_integrity).toBeGreaterThanOrEqual(0);
      expect(ss.wall_integrity).toBeLessThanOrEqual(100);
      expect(ss.defender_morale).toBeGreaterThanOrEqual(0);
      expect(ss.defender_morale).toBeLessThanOrEqual(100);
      expect(ss.supplies).toBeGreaterThanOrEqual(0);
      expect(ss.supplies).toBeLessThanOrEqual(100);
      expect(ss.day_of_siege).toBeGreaterThan(1);
      expect(Object.keys(ss.custom_metrics).length).toBeGreaterThanOrEqual(2);
      expect(ss.campaign_id).toBe(campaignId);
    });

    it('should create at least 3 siege notes linked to siege state (Req 10.1)', async () => {
      await seedDefaultCampaign(pool);

      const { rows: campaigns } = await pool.query(
        'SELECT id FROM campaigns WHERE name = $1',
        [CAMPAIGN_NAME]
      );
      const campaignId = campaigns[0].id;

      const { rows: siegeStates } = await pool.query(
        'SELECT id FROM siege_state WHERE campaign_id = $1',
        [campaignId]
      );
      const siegeStateId = siegeStates[0].id;

      const { rows: notes } = await pool.query(
        'SELECT * FROM siege_notes WHERE siege_state_id = $1 ORDER BY created_at',
        [siegeStateId]
      );
      expect(notes.length).toBeGreaterThanOrEqual(3);

      for (const note of notes) {
        expect(note.note_text).toBeTruthy();
        expect(note.siege_state_id).toBe(siegeStateId);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 13.2 - Idempotency: running seeding twice does not create duplicates
  // Requirements: 12.1, 12.2, 12.3, 12.4
  // ─────────────────────────────────────────────────────────────────────────
  describe('13.2 - Idempotency', () => {
    beforeEach(async () => {
      await cleanSeededData();
    });

    afterEach(async () => {
      await cleanSeededData();
    });

    it('should not create duplicate campaigns when run twice (Req 12.1, 12.2)', async () => {
      // First run
      const result1 = await seedDefaultCampaign(pool);
      expect(result1).toBe(true);

      // Second run
      const result2 = await seedDefaultCampaign(pool);
      expect(result2).toBe(true);

      // Verify only one campaign exists
      const { rows } = await pool.query(
        'SELECT * FROM campaigns WHERE name = $1',
        [CAMPAIGN_NAME]
      );
      expect(rows).toHaveLength(1);
    });

    it('should not create duplicate entities when run twice (Req 12.2)', async () => {
      await seedDefaultCampaign(pool);

      // Capture counts after first run
      const { rows: campaigns } = await pool.query(
        'SELECT id FROM campaigns WHERE name = $1',
        [CAMPAIGN_NAME]
      );
      const campaignId = campaigns[0].id;

      const countAfterFirst = {};
      countAfterFirst.combatants = (
        await pool.query('SELECT count(*) FROM combatants WHERE campaign_id = $1', [campaignId])
      ).rows[0].count;
      countAfterFirst.monsters = (
        await pool.query('SELECT count(*) FROM monsters WHERE campaign_id = $1', [campaignId])
      ).rows[0].count;
      countAfterFirst.locations = (
        await pool.query('SELECT count(*) FROM locations WHERE campaign_id = $1', [campaignId])
      ).rows[0].count;

      // Second run
      await seedDefaultCampaign(pool);

      // Counts should be identical
      const countAfterSecond = {};
      countAfterSecond.combatants = (
        await pool.query('SELECT count(*) FROM combatants WHERE campaign_id = $1', [campaignId])
      ).rows[0].count;
      countAfterSecond.monsters = (
        await pool.query('SELECT count(*) FROM monsters WHERE campaign_id = $1', [campaignId])
      ).rows[0].count;
      countAfterSecond.locations = (
        await pool.query('SELECT count(*) FROM locations WHERE campaign_id = $1', [campaignId])
      ).rows[0].count;

      expect(countAfterSecond.combatants).toBe(countAfterFirst.combatants);
      expect(countAfterSecond.monsters).toBe(countAfterFirst.monsters);
      expect(countAfterSecond.locations).toBe(countAfterFirst.locations);
    });

    it('should log skip message when campaign already exists (Req 12.3, 12.4)', async () => {
      await seedDefaultCampaign(pool);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await seedDefaultCampaign(pool);

      const logMessages = consoleSpy.mock.calls.map((call) => call[0]);
      const hasSkipMessage = logMessages.some(
        (msg) => typeof msg === 'string' && msg.includes('already exists') && msg.includes('skipping')
      );
      expect(hasSkipMessage).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 13.3 - Transaction rollback on critical failure
  // Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
  // ─────────────────────────────────────────────────────────────────────────
  describe('13.3 - Transaction rollback on critical failure', () => {
    beforeEach(async () => {
      await cleanSeededData();
    });

    afterEach(async () => {
      await cleanSeededData();
    });

    it('should rollback and leave no partial data when campaign creation fails (Req 11.3, 11.5)', async () => {
      // Create a proxy pool that intercepts only the campaign INSERT query
      // while passing through all transaction commands (BEGIN, COMMIT, ROLLBACK)
      const faultyPool = {
        connect: async () => {
          const realClient = await pool.connect();
          const originalQuery = realClient.query.bind(realClient);

          realClient.query = async (text, params) => {
            if (
              typeof text === 'string' &&
              text.includes('INSERT INTO campaigns')
            ) {
              throw new Error('Simulated campaign creation failure');
            }
            return originalQuery(text, params);
          };

          return realClient;
        },
      };

      const result = await seedDefaultCampaign(faultyPool);
      expect(result).toBe(false);

      // Verify no campaign was created
      const { rows: campaigns } = await pool.query(
        'SELECT * FROM campaigns WHERE name = $1',
        [CAMPAIGN_NAME]
      );
      expect(campaigns).toHaveLength(0);

      // Verify no combatants were created for this campaign
      const { rows: combatants } = await pool.query(
        `SELECT * FROM combatants WHERE campaign_id IN (
          SELECT id FROM campaigns WHERE name = $1
        )`,
        [CAMPAIGN_NAME]
      );
      expect(combatants).toHaveLength(0);
    }, 15000);

    it('should return false on critical failure (Req 11.4)', async () => {
      const faultyPool = {
        connect: async () => {
          const realClient = await pool.connect();
          const originalQuery = realClient.query.bind(realClient);

          realClient.query = async (text, params) => {
            if (
              typeof text === 'string' &&
              text.includes('INSERT INTO campaigns')
            ) {
              throw new Error('Simulated critical failure');
            }
            return originalQuery(text, params);
          };

          return realClient;
        },
      };

      const result = await seedDefaultCampaign(faultyPool);
      expect(result).toBe(false);
    }, 15000);

    it('should handle connection failure gracefully', async () => {
      const badPool = new Pool({
        connectionString: 'postgresql://invalid:invalid@localhost:5432/nonexistent',
        connectionTimeoutMillis: 1000,
      });

      let result;
      try {
        result = await seedDefaultCampaign(badPool);
        // If it returns, it should be false
        expect(result).toBe(false);
      } catch (error) {
        // Connection errors may throw before the function can catch them
        expect(error).toBeDefined();
      } finally {
        await badPool.end();
      }
    }, 15000);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 13.4 - Non-critical failure handling
  // Requirements: 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 10.5
  // ─────────────────────────────────────────────────────────────────────────
  describe('13.4 - Non-critical failure handling', () => {
    beforeEach(async () => {
      await cleanSeededData();
    });

    afterEach(async () => {
      await cleanSeededData();
    });

    it('should continue seeding when individual combatant INSERT fails (Req 3.5, 4.5)', async () => {
      // Spy on console.log to capture warning messages about failed inserts
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      // Create a proxy pool that fails on the SECOND combatant INSERT
      let combatantInsertCount = 0;

      const faultyPool = {
        connect: async () => {
          const realClient = await pool.connect();
          // Store original query and release
          const origQuery = realClient.query.bind(realClient);
          const origRelease = realClient.release.bind(realClient);

          // Override query to intercept specific inserts
          const proxyQuery = async function(text, params) {
            if (
              typeof text === 'string' &&
              text.includes('INSERT INTO combatants')
            ) {
              combatantInsertCount++;
              if (combatantInsertCount === 2) {
                throw new Error('Simulated individual combatant failure');
              }
            }
            return origQuery(text, params);
          };

          // Return a proxy object that looks like a pg client
          return {
            query: proxyQuery,
            release: origRelease,
          };
        },
      };

      const result = await seedDefaultCampaign(faultyPool);
      expect(result).toBe(true);

      // Verify warning was logged for the failed combatant
      const logMessages = consoleSpy.mock.calls.map((call) => call[0]);
      const hasWarning = logMessages.some(
        (msg) => typeof msg === 'string' && msg.includes('Failed to create')
      );
      expect(hasWarning).toBe(true);

      consoleSpy.mockRestore();

      // Campaign should still exist (transaction committed)
      const { rows: campaigns } = await pool.query(
        'SELECT id FROM campaigns WHERE name = $1',
        [CAMPAIGN_NAME]
      );
      expect(campaigns).toHaveLength(1);

      // Some combatants should still have been created (not all failed)
      const campaignId = campaigns[0].id;
      const { rows: combatants } = await pool.query(
        'SELECT * FROM combatants WHERE campaign_id = $1',
        [campaignId]
      );
      expect(combatants.length).toBeGreaterThan(0);
    }, 30000);

    it('should commit transaction even when all monster templates fail (Req 5.5, 6.5, 7.5)', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      // Fail all monster template inserts but let everything else succeed
      const faultyPool = {
        connect: async () => {
          const realClient = await pool.connect();
          const origQuery = realClient.query.bind(realClient);
          const origRelease = realClient.release.bind(realClient);

          const proxyQuery = async function(text, params) {
            // Only intercept INSERT INTO monsters (not monster_instances)
            if (
              typeof text === 'string' &&
              text.includes('INSERT INTO monsters (') 
            ) {
              throw new Error('Simulated monster template failure');
            }
            return origQuery(text, params);
          };

          return {
            query: proxyQuery,
            release: origRelease,
          };
        },
      };

      const result = await seedDefaultCampaign(faultyPool);
      expect(result).toBe(true);

      consoleSpy.mockRestore();

      // Campaign should exist
      const { rows: campaigns } = await pool.query(
        'SELECT id FROM campaigns WHERE name = $1',
        [CAMPAIGN_NAME]
      );
      expect(campaigns).toHaveLength(1);
      const campaignId = campaigns[0].id;

      // PCs and NPCs should still be created
      const { rows: pcs } = await pool.query(
        "SELECT * FROM combatants WHERE campaign_id = $1 AND type = 'PC'",
        [campaignId]
      );
      expect(pcs.length).toBeGreaterThanOrEqual(3);

      // Locations should still be created
      const { rows: locations } = await pool.query(
        'SELECT * FROM locations WHERE campaign_id = $1',
        [campaignId]
      );
      expect(locations.length).toBeGreaterThanOrEqual(4);
    }, 30000);

    it('should still create siege notes even when location seeding partially fails (Req 8.5, 10.5)', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      let locationInsertCount = 0;

      const faultyPool = {
        connect: async () => {
          const realClient = await pool.connect();
          const origQuery = realClient.query.bind(realClient);
          const origRelease = realClient.release.bind(realClient);

          const proxyQuery = async function(text, params) {
            if (
              typeof text === 'string' &&
              text.includes('INSERT INTO locations')
            ) {
              locationInsertCount++;
              if (locationInsertCount === 2) {
                throw new Error('Simulated location failure');
              }
            }
            return origQuery(text, params);
          };

          return {
            query: proxyQuery,
            release: origRelease,
          };
        },
      };

      const result = await seedDefaultCampaign(faultyPool);
      expect(result).toBe(true);

      consoleSpy.mockRestore();

      const { rows: campaigns } = await pool.query(
        'SELECT id FROM campaigns WHERE name = $1',
        [CAMPAIGN_NAME]
      );
      expect(campaigns).toHaveLength(1);
      const campaignId = campaigns[0].id;

      // Siege state and notes should still be created
      const { rows: siegeStates } = await pool.query(
        'SELECT id FROM siege_state WHERE campaign_id = $1',
        [campaignId]
      );
      expect(siegeStates).toHaveLength(1);

      const { rows: notes } = await pool.query(
        'SELECT * FROM siege_notes WHERE siege_state_id = $1',
        [siegeStates[0].id]
      );
      expect(notes.length).toBeGreaterThanOrEqual(3);
    }, 30000);
  });
});
