/**
 * Test script for monster instance seeding
 * Verifies that monster instances are created correctly
 */

const { Pool } = require('pg');
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function logSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.cyan}ℹ ${message}${colors.reset}`);
}

async function testMonsterInstances() {
  logInfo('Testing Monster Instance Seeding...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // Check if default campaign exists
    const campaignResult = await pool.query(
      "SELECT id FROM campaigns WHERE name = 'Siege of Neverwinter - Tutorial Campaign'"
    );
    
    if (campaignResult.rows.length === 0) {
      logError('Default campaign not found. Please run seeding first.');
      return false;
    }
    
    const campaignId = campaignResult.rows[0].id;
    logSuccess(`Found campaign with ID: ${campaignId}`);
    
    // Check monster instances
    const instancesResult = await pool.query(`
      SELECT 
        mi.id,
        mi.instance_name,
        c.name as combatant_name,
        c.type,
        c.ac,
        c.max_hp,
        m.name as monster_template_name,
        m.cr
      FROM monster_instances mi
      JOIN combatants c ON mi.combatant_id = c.id
      JOIN monsters m ON mi.monster_id = m.id
      WHERE c.campaign_id = $1
      ORDER BY mi.id
    `, [campaignId]);
    
    const instanceCount = instancesResult.rows.length;
    
    if (instanceCount === 0) {
      logError('No monster instances found');
      return false;
    }
    
    logSuccess(`Found ${instanceCount} monster instances\n`);
    
    // Verify each instance
    let allTestsPassed = true;
    
    for (const instance of instancesResult.rows) {
      logInfo(`Instance: ${instance.instance_name}`);
      
      // Test 1: Combatant type is "Monster"
      if (instance.type === 'Monster') {
        logSuccess(`  Type is "Monster"`);
      } else {
        logError(`  Type is "${instance.type}" (expected "Monster")`);
        allTestsPassed = false;
      }
      
      // Test 2: Instance name matches combatant name
      if (instance.instance_name === instance.combatant_name) {
        logSuccess(`  Instance name matches combatant name`);
      } else {
        logError(`  Name mismatch: "${instance.instance_name}" vs "${instance.combatant_name}"`);
        allTestsPassed = false;
      }
      
      // Test 3: Linked to monster template
      if (instance.monster_template_name) {
        logSuccess(`  Linked to template: ${instance.monster_template_name} (CR ${instance.cr})`);
      } else {
        logError(`  Not linked to monster template`);
        allTestsPassed = false;
      }
      
      // Test 4: Has valid stats
      if (instance.ac > 0 && instance.max_hp > 0) {
        logSuccess(`  Has valid stats (AC: ${instance.ac}, HP: ${instance.max_hp})`);
      } else {
        logError(`  Invalid stats (AC: ${instance.ac}, HP: ${instance.max_hp})`);
        allTestsPassed = false;
      }
      
      console.log('');
    }
    
    // Test 5: Minimum count requirement
    if (instanceCount >= 2) {
      logSuccess(`Meets minimum requirement (${instanceCount} >= 2 instances)`);
    } else {
      logError(`Does not meet minimum requirement (${instanceCount} < 2 instances)`);
      allTestsPassed = false;
    }
    
    // Test 6: Unique instance names
    const uniqueNames = new Set(instancesResult.rows.map(r => r.instance_name));
    if (uniqueNames.size === instanceCount) {
      logSuccess(`All instance names are unique`);
    } else {
      logError(`Duplicate instance names found`);
      allTestsPassed = false;
    }
    
    console.log('\n' + '='.repeat(60));
    if (allTestsPassed) {
      logSuccess('All tests passed!');
    } else {
      logError('Some tests failed');
    }
    console.log('='.repeat(60) + '\n');
    
    return allTestsPassed;
    
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
    return false;
  } finally {
    await pool.end();
  }
}

// Run test if called directly
if (require.main === module) {
  testMonsterInstances()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = testMonsterInstances;
