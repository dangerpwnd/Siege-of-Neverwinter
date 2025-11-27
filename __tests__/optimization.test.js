/**
 * Tests for performance optimizations
 */

const { pool } = require('../database/db');

describe('Performance Optimizations', () => {
    describe('Database Connection Pool', () => {
        test('should have connection pool configured', () => {
            expect(pool).toBeDefined();
            expect(pool.options.max).toBe(20);
            expect(pool.options.min).toBe(2);
            expect(pool.options.idleTimeoutMillis).toBe(30000);
        });

        test('should be able to execute queries', async () => {
            const result = await pool.query('SELECT 1 as test');
            expect(result.rows[0].test).toBe(1);
        });
    });

    describe('Database Indexes', () => {
        test('should have indexes on combatants table', async () => {
            const result = await pool.query(`
                SELECT indexname 
                FROM pg_indexes 
                WHERE tablename = 'combatants'
            `);
            
            const indexNames = result.rows.map(row => row.indexname);
            
            // Check for key indexes
            expect(indexNames).toContain('idx_combatants_campaign');
            expect(indexNames).toContain('idx_combatants_initiative');
            expect(indexNames).toContain('idx_combatants_campaign_initiative');
        });

        test('should have indexes on locations table', async () => {
            const result = await pool.query(`
                SELECT indexname 
                FROM pg_indexes 
                WHERE tablename = 'locations'
            `);
            
            const indexNames = result.rows.map(row => row.indexname);
            expect(indexNames).toContain('idx_locations_campaign');
        });

        test('should have JSONB indexes on monsters table', async () => {
            const result = await pool.query(`
                SELECT indexname, indexdef
                FROM pg_indexes 
                WHERE tablename = 'monsters' AND indexdef LIKE '%GIN%'
            `);
            
            expect(result.rows.length).toBeGreaterThan(0);
        });
    });

    describe('Query Performance', () => {
        test('initiative query should be fast', async () => {
            const start = Date.now();
            
            await pool.query(`
                SELECT * FROM combatants 
                WHERE campaign_id = 1 
                ORDER BY initiative DESC
            `);
            
            const duration = Date.now() - start;
            
            // Should complete in less than 100ms
            expect(duration).toBeLessThan(100);
        });

        test('location query should be fast', async () => {
            const start = Date.now();
            
            await pool.query(`
                SELECT * FROM locations 
                WHERE campaign_id = 1
            `);
            
            const duration = Date.now() - start;
            
            // Should complete in less than 100ms
            expect(duration).toBeLessThan(100);
        });
    });

    describe('Initiative Sorting Performance', () => {
        test('should sort large combatant arrays quickly', () => {
            // Generate 100 random combatants
            const combatants = Array.from({ length: 100 }, (_, i) => ({
                id: i,
                name: `Combatant ${i}`,
                initiative: Math.floor(Math.random() * 30)
            }));

            const start = performance.now();
            
            // Sort by initiative descending
            combatants.sort((a, b) => b.initiative - a.initiative);
            
            const duration = performance.now() - start;

            // Should complete in less than 10ms
            expect(duration).toBeLessThan(10);

            // Verify sort is correct
            for (let i = 1; i < combatants.length; i++) {
                expect(combatants[i].initiative).toBeLessThanOrEqual(combatants[i - 1].initiative);
            }
        });
    });
});
