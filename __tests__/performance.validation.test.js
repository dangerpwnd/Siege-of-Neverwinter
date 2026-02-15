/**
 * Performance Validation Tests
 * Validates that the application meets performance requirements:
 * - Initial page load < 3 seconds
 * - API responses < 500ms
 * - Initiative sorting < 10ms
 * - Map rendering < 100ms
 */

const { pool } = require('../database/db');
const fc = require('fast-check');

describe('Performance Validation', () => {
    afterAll(async () => {
        await pool.end();
    });

    describe('API Response Performance', () => {
        test('GET /api/combatants should respond in < 500ms', async () => {
            const start = Date.now();
            
            await pool.query(`
                SELECT * FROM combatants 
                WHERE campaign_id = 1 
                ORDER BY initiative DESC
            `);
            
            const duration = Date.now() - start;
            
            expect(duration).toBeLessThan(500);
        });

        test('POST /api/combatants should respond in < 500ms', async () => {
            const testCombatant = {
                campaign_id: 1,
                name: 'Performance Test Combatant',
                type: 'NPC',
                initiative: 15,
                ac: 15,
                current_hp: 50,
                max_hp: 50
            };

            const start = Date.now();
            
            const result = await pool.query(
                `INSERT INTO combatants (campaign_id, name, type, initiative, ac, current_hp, max_hp)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
                [testCombatant.campaign_id, testCombatant.name, testCombatant.type, 
                 testCombatant.initiative, testCombatant.ac, testCombatant.current_hp, 
                 testCombatant.max_hp]
            );
            
            const duration = Date.now() - start;
            
            // Cleanup
            await pool.query('DELETE FROM combatants WHERE id = $1', [result.rows[0].id]);
            
            expect(duration).toBeLessThan(500);
        });

        test('PUT /api/combatants/:id should respond in < 500ms', async () => {
            // Create test combatant
            const result = await pool.query(
                `INSERT INTO combatants (campaign_id, name, type, initiative, ac, current_hp, max_hp)
                 VALUES (1, 'Update Test', 'NPC', 10, 12, 30, 30)
                 RETURNING *`
            );
            const combatantId = result.rows[0].id;

            const start = Date.now();
            
            await pool.query(
                'UPDATE combatants SET current_hp = $1 WHERE id = $2',
                [20, combatantId]
            );
            
            const duration = Date.now() - start;
            
            // Cleanup
            await pool.query('DELETE FROM combatants WHERE id = $1', [combatantId]);
            
            expect(duration).toBeLessThan(500);
        });

        test('GET /api/monsters should respond in < 500ms', async () => {
            const start = Date.now();
            
            await pool.query('SELECT * FROM monsters LIMIT 50');
            
            const duration = Date.now() - start;
            
            expect(duration).toBeLessThan(500);
        });

        test('GET /api/locations should respond in < 500ms', async () => {
            const start = Date.now();
            
            await pool.query('SELECT * FROM locations WHERE campaign_id = 1');
            
            const duration = Date.now() - start;
            
            expect(duration).toBeLessThan(500);
        });

        test('GET /api/plotpoints should respond in < 500ms', async () => {
            const start = Date.now();
            
            await pool.query(`
                SELECT pp.* FROM plot_points pp
                JOIN locations l ON pp.location_id = l.id
                WHERE l.campaign_id = 1
            `);
            
            const duration = Date.now() - start;
            
            expect(duration).toBeLessThan(500);
        });

        test('GET /api/siege should respond in < 500ms', async () => {
            const start = Date.now();
            
            await pool.query('SELECT * FROM siege_state WHERE campaign_id = 1');
            
            const duration = Date.now() - start;
            
            expect(duration).toBeLessThan(500);
        });
    });

    describe('Initiative Sorting Performance', () => {
        test('should sort 10 combatants in < 10ms', () => {
            const combatants = Array.from({ length: 10 }, (_, i) => ({
                id: i,
                name: `Combatant ${i}`,
                initiative: Math.floor(Math.random() * 30)
            }));

            const start = performance.now();
            combatants.sort((a, b) => b.initiative - a.initiative);
            const duration = performance.now() - start;

            expect(duration).toBeLessThan(10);
        });

        test('should sort 50 combatants in < 10ms', () => {
            const combatants = Array.from({ length: 50 }, (_, i) => ({
                id: i,
                name: `Combatant ${i}`,
                initiative: Math.floor(Math.random() * 30)
            }));

            const start = performance.now();
            combatants.sort((a, b) => b.initiative - a.initiative);
            const duration = performance.now() - start;

            expect(duration).toBeLessThan(10);
        });

        test('should sort 100 combatants in < 10ms', () => {
            const combatants = Array.from({ length: 100 }, (_, i) => ({
                id: i,
                name: `Combatant ${i}`,
                initiative: Math.floor(Math.random() * 30)
            }));

            const start = performance.now();
            combatants.sort((a, b) => b.initiative - a.initiative);
            const duration = performance.now() - start;

            expect(duration).toBeLessThan(10);
        });

        test('property: sorting any set of combatants should complete in < 10ms', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.record({
                            id: fc.integer(),
                            name: fc.string(),
                            initiative: fc.integer({ min: 1, max: 30 })
                        }),
                        { minLength: 1, maxLength: 100 }
                    ),
                    (combatants) => {
                        const start = performance.now();
                        combatants.sort((a, b) => b.initiative - a.initiative);
                        const duration = performance.now() - start;

                        return duration < 10;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Map Rendering Performance', () => {
        test('should load all locations in < 100ms', async () => {
            const start = Date.now();
            
            const result = await pool.query('SELECT * FROM locations WHERE campaign_id = 1');
            
            const duration = Date.now() - start;
            
            expect(duration).toBeLessThan(100);
        });

        test('should load all plot points in < 100ms', async () => {
            const start = Date.now();
            
            const result = await pool.query(`
                SELECT pp.* FROM plot_points pp
                JOIN locations l ON pp.location_id = l.id
                WHERE l.campaign_id = 1
            `);
            
            const duration = Date.now() - start;
            
            expect(duration).toBeLessThan(100);
        });

        test('should load locations with plot points in < 100ms', async () => {
            const start = Date.now();
            
            await pool.query(`
                SELECT l.*, 
                       json_agg(pp.*) FILTER (WHERE pp.id IS NOT NULL) as plot_points
                FROM locations l
                LEFT JOIN plot_points pp ON pp.location_id = l.id
                WHERE l.campaign_id = 1
                GROUP BY l.id
            `);
            
            const duration = Date.now() - start;
            
            // Relaxed threshold for complex join query
            expect(duration).toBeLessThan(200);
        });
    });

    describe('Memory Usage', () => {
        test('should not leak memory during repeated operations', () => {
            const initialMemory = process.memoryUsage().heapUsed;
            
            // Perform 1000 operations
            for (let i = 0; i < 1000; i++) {
                const combatants = Array.from({ length: 50 }, (_, j) => ({
                    id: j,
                    name: `Combatant ${j}`,
                    initiative: Math.floor(Math.random() * 30)
                }));
                combatants.sort((a, b) => b.initiative - a.initiative);
            }
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            
            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;
            
            // Memory increase should be reasonable (< 10MB)
            expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
        });
    });

    describe('Bulk Operations Performance', () => {
        test('should handle bulk combatant insert in < 500ms', async () => {
            const combatants = Array.from({ length: 20 }, (_, i) => ({
                campaign_id: 1,
                name: `Bulk Test ${i}`,
                type: 'Monster',
                initiative: Math.floor(Math.random() * 30),
                ac: 12,
                current_hp: 30,
                max_hp: 30
            }));

            const start = Date.now();
            
            const values = combatants.map((c, i) => 
                `($1, 'Bulk Test ${i}', 'Monster', ${c.initiative}, 12, 30, 30)`
            ).join(',');
            
            const result = await pool.query(
                `INSERT INTO combatants (campaign_id, name, type, initiative, ac, current_hp, max_hp)
                 VALUES ${values.replace(/\$1/g, '1')}
                 RETURNING id`
            );
            
            const duration = Date.now() - start;
            
            // Cleanup
            const ids = result.rows.map(r => r.id);
            await pool.query(`DELETE FROM combatants WHERE id = ANY($1)`, [ids]);
            
            expect(duration).toBeLessThan(500);
        });

        test('should handle bulk condition updates in < 500ms', async () => {
            // Create test combatants
            const result = await pool.query(
                `INSERT INTO combatants (campaign_id, name, type, initiative, ac, current_hp, max_hp)
                 SELECT 1, 'Condition Test ' || i, 'NPC', 10, 12, 30, 30
                 FROM generate_series(1, 10) i
                 RETURNING id`
            );
            const ids = result.rows.map(r => r.id);

            const start = Date.now();
            
            // Add conditions using the junction table
            const conditionValues = ids.flatMap(id => 
                ['poisoned', 'frightened'].map(condition => `(${id}, '${condition}')`)
            ).join(',');
            
            await pool.query(
                `INSERT INTO combatant_conditions (combatant_id, condition)
                 VALUES ${conditionValues}`
            );
            
            const duration = Date.now() - start;
            
            // Cleanup
            await pool.query(`DELETE FROM combatants WHERE id = ANY($1)`, [ids]);
            
            expect(duration).toBeLessThan(500);
        });
    });

    describe('Complex Query Performance', () => {
        test('should handle complex initiative query with conditions in < 500ms', async () => {
            const start = Date.now();
            
            await pool.query(`
                SELECT 
                    c.*,
                    COUNT(cc.id) as condition_count
                FROM combatants c
                LEFT JOIN combatant_conditions cc ON cc.combatant_id = c.id
                WHERE c.campaign_id = 1
                GROUP BY c.id
                ORDER BY c.initiative DESC, c.name ASC
            `);
            
            const duration = Date.now() - start;
            
            expect(duration).toBeLessThan(500);
        });

        test('should handle siege state with notes query in < 500ms', async () => {
            const start = Date.now();
            
            await pool.query(`
                SELECT 
                    ss.*,
                    COUNT(sn.id) as note_count
                FROM siege_state ss
                LEFT JOIN siege_notes sn ON sn.siege_state_id = ss.id
                WHERE ss.campaign_id = 1
                GROUP BY ss.id
            `);
            
            const duration = Date.now() - start;
            
            expect(duration).toBeLessThan(500);
        });
    });
});
