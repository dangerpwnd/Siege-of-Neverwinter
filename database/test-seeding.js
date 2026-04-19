/**
 * Test script for default campaign seeding
 * Seeds the database and verifies monster instances
 */

const { Pool } = require('pg');
const { seedDefaultCampaign } = require('./seed-default-campaign');
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m'
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

function logWarning(message) {
  console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

async function testSeeding() {
  console.log('\n' + '='.repeat(60));
  logInfo('Testing Default Campaign Seeding');
  console.log('='.repeat(60) + '\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // Run seeding
    logInfo('Running seeding process...\n');
    const seedResult = await seedDefaultCampaign(pool);
    
    if (!seedResult) {
      logError('Seeding failed');
      return false;
    }
    
    console.log('\n' + '='.repeat(60));
    logInfo('Verifying Monster Instances');
    console.log('='.repeat(60) + '\n');
    
    // Get campaign ID
    const campaignResult = await pool.query(
      "SELECT id FROM campaigns WHERE name = 'Siege of Neverwinter - Tutorial Campaign'"
    );
    
    if (campaignResult.rows.length === 0) {
      logError('Tutorial campaign not found');
      return false;
    }
    
    const campaignId = campaignResult.rows[0].id;
    
    // Query monster instances with details
    const instancesResult = await pool.query(`
      SELECT 
        mi.id,
        mi.instance_name,
        c.name as combatant_name,
        c.type,
        c.ac,
        c.current_hp,
        c.max_hp,
        c.save_strength,
        c.save_dexterity,
        c.save_constitution,
        m.name as monster_template_name,
        m.cr,
        m.hp_formula
      FROM monster_instances mi
      JOIN combatants c ON mi.combatant_id = c.id
      JOIN monsters m ON mi.monster_id = m.id
      WHERE c.campaign_id = $1
      ORDER BY m.name, mi.instance_name
    `, [campaignId]);
    
    const instanceCount = instancesResult.rows.length;
    
    logInfo(`Total monster instances created: ${instanceCount}\n`);
    
    // Group by monster type
    const byType = {};
    for (const instance of instancesResult.rows) {
      if (!byType[instance.monster_template_name]) {
        byType[instance.monster_template_name] = [];
      }
      byType[instance.monster_template_name].push(instance);
    }
    
    // Display instances by type
    for (const [monsterName, instances] of Object.entries(byType)) {
      logInfo(`${monsterName} (${instances.length} instances):`);
      for (const inst of instances) {
        logSuccess(`  • ${inst.instance_name}`);
        logInfo(`    - Type: ${inst.type}, AC: ${inst.ac}, HP: ${inst.current_hp}/${inst.max_hp}, CR: ${inst.cr}`);
      }
      console.log('');
    }
    
    // Run validation tests
    console.log('='.repeat(60));
    logInfo('Running Validation Tests');
    console.log('='.repeat(60) + '\n');
    
    let allTestsPassed = true;
    
    // Test 1: Minimum count
    if (instanceCount >= 2) {
      logSuccess(`Test 1: Minimum count met (${instanceCount} >= 2)`);
    } else {
      logError(`Test 1: Minimum count not met (${instanceCount} < 2)`);
      allTestsPassed = false;
    }
    
    // Test 2: All have type "Monster"
    const allMonsters = instancesResult.rows.every(r => r.type === 'Monster');
    if (allMonsters) {
      logSuccess('Test 2: All instances have type "Monster"');
    } else {
      logError('Test 2: Some instances do not have type "Monster"');
      allTestsPassed = false;
    }
    
    // Test 3: All linked to templates
    const allLinked = instancesResult.rows.every(r => r.monster_template_name);
    if (allLinked) {
      logSuccess('Test 3: All instances linked to monster templates');
    } else {
      logError('Test 3: Some instances not linked to templates');
      allTestsPassed = false;
    }
    
    // Test 4: Unique instance names
    const uniqueNames = new Set(instancesResult.rows.map(r => r.instance_name));
    if (uniqueNames.size === instanceCount) {
      logSuccess('Test 4: All instance names are unique');
    } else {
      logError('Test 4: Duplicate instance names found');
      allTestsPassed = false;
    }
    
    // Test 5: Valid stats
    const allValidStats = instancesResult.rows.every(r => r.ac > 0 && r.max_hp > 0);
    if (allValidStats) {
      logSuccess('Test 5: All instances have valid stats (AC > 0, HP > 0)');
    } else {
      logError('Test 5: Some instances have invalid stats');
      allTestsPassed = false;
    }
    
    // Test 6: Instance names follow pattern
    const namePattern = /^.+ \d+$/;
    const allFollowPattern = instancesResult.rows.every(r => namePattern.test(r.instance_name));
    if (allFollowPattern) {
      logSuccess('Test 6: All instance names follow pattern "Name #"');
    } else {
      logError('Test 6: Some instance names do not follow pattern');
      allTestsPassed = false;
    }
    
    // Test 7: Combatant name matches instance name
    const namesMatch = instancesResult.rows.every(r => r.instance_name === r.combatant_name);
    if (namesMatch) {
      logSuccess('Test 7: Instance names match combatant names');
    } else {
      logError('Test 7: Some instance names do not match combatant names');
      allTestsPassed = false;
    }
    
    console.log('\n' + '='.repeat(60));
    if (allTestsPassed) {
      logSuccess('ALL TESTS PASSED! ✨');
    } else {
      logError('SOME TESTS FAILED');
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
  testSeeding()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = testSeeding;
