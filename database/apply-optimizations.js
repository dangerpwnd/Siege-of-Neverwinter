/**
 * Apply database optimizations
 * Run this script to add additional indexes and optimize the database
 */

const { pool } = require('./db');
const fs = require('fs');
const path = require('path');

async function applyOptimizations() {
    console.log('Applying database optimizations...');
    
    try {
        // Read the optimization SQL file
        const sqlPath = path.join(__dirname, 'optimize-indexes.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Execute the SQL
        await pool.query(sql);
        
        console.log('✓ Database optimizations applied successfully');
        console.log('✓ Additional indexes created');
        console.log('✓ JSONB indexes added for better JSON query performance');
        console.log('✓ Partial indexes created for active combatants');
        console.log('✓ Table statistics updated');
        
    } catch (error) {
        console.error('Error applying optimizations:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    applyOptimizations()
        .then(() => {
            console.log('\nOptimization complete!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\nOptimization failed:', error);
            process.exit(1);
        });
}

module.exports = { applyOptimizations };
