/**
 * Test script specifically for location seeding
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

async function testLocationSeeding() {
  console.log('\n' + '='.repeat(60));
  logInfo('Testing Location Seeding');
  console.log('='.repeat(60) + '\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // Clear existing tutorial campaign
    logInfo('Clearing existing tutorial campaign...');
    await pool.query("DELETE FROM campaigns WHERE name = 'Siege of Neverwinter - Tutorial Campaign'");
    logSuccess('Cleared existing data\n');
    
    // Run seeding
    logInfo('Running seeding process...\n');
    const seedResult = await seedDefaultCampaign(pool);
    
    if (!seedResult) {
      logError('Seeding failed');
      return false;
    }
    
    console.log('\n' + '='.repeat(60));
    logInfo('Verifying Locations');
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
    
    // Query locations
    const locationsResult = await pool.query(`
      SELECT 
        id,
        name,
        status,
        description,
        coord_x,
        coord_y,
        coord_width,
        coord_height
      FROM locations
      WHERE campaign_id = $1
      ORDER BY name
    `, [campaignId]);
    
    const locationCount = locationsResult.rows.length;
    
    logInfo(`Total locations created: ${locationCount}\n`);
    
    // Display locations by status
    const byStatus = {};
    for (const location of locationsResult.rows) {
      if (!byStatus[location.status]) {
        byStatus[location.status] = [];
      }
      byStatus[location.status].push(location);
    }
    
    for (const [status, locations] of Object.entries(byStatus)) {
      logInfo(`${status.toUpperCase()} (${locations.length} locations):`);
      for (const loc of locations) {
        logSuccess(`  • ${loc.name}`);
        logInfo(`    - Position: (${loc.coord_x}, ${loc.coord_y}), Size: ${loc.coord_width}x${loc.coord_height}`);
        logInfo(`    - ${loc.description.substring(0, 60)}...`);
      }
      console.log('');
    }
    
    // Run validation tests
    console.log('='.repeat(60));
    logInfo('Running Validation Tests');
    console.log('='.repeat(60) + '\n');
    
    let allTestsPassed = true;
    
    // Test 1: Minimum count (at least 4)
    if (locationCount >= 4) {
      logSuccess(`Test 1: Minimum count met (${locationCount} >= 4)`);
    } else {
      logError(`Test 1: Minimum count not met (${locationCount} < 4)`);
      allTestsPassed = false;
    }
    
    // Test 2: Has different statuses
    const statuses = new Set(locationsResult.rows.map(r => r.status));
    const hasControlled = statuses.has('controlled');
    const hasContested = statuses.has('contested');
    const hasEnemy = statuses.has('enemy');
    
    if (hasControlled && hasContested && hasEnemy) {
      logSuccess('Test 2: Has locations with different statuses (controlled, contested, enemy)');
    } else {
      logError(`Test 2: Missing status types (controlled: ${hasControlled}, contested: ${hasContested}, enemy: ${hasEnemy})`);
      allTestsPassed = false;
    }
    
    // Test 3: All have coordinates
    const allHaveCoords = locationsResult.rows.every(r => 
      r.coord_x !== null && r.coord_y !== null && 
      r.coord_width !== null && r.coord_height !== null
    );
    if (allHaveCoords) {
      logSuccess('Test 3: All locations have map coordinates');
    } else {
      logError('Test 3: Some locations missing coordinates');
      allTestsPassed = false;
    }
    
    // Test 4: All have names and descriptions
    const allHaveDetails = locationsResult.rows.every(r => r.name && r.description);
    if (allHaveDetails) {
      logSuccess('Test 4: All locations have names and descriptions');
    } else {
      logError('Test 4: Some locations missing names or descriptions');
      allTestsPassed = false;
    }
    
    // Test 5: Valid coordinate values
    const allValidCoords = locationsResult.rows.every(r => 
      r.coord_x >= 0 && r.coord_y >= 0 && 
      r.coord_width > 0 && r.coord_height > 0
    );
    if (allValidCoords) {
      logSuccess('Test 5: All locations have valid coordinate values');
    } else {
      logError('Test 5: Some locations have invalid coordinates');
      allTestsPassed = false;
    }
    
    // Test 6: Unique names
    const uniqueNames = new Set(locationsResult.rows.map(r => r.name));
    if (uniqueNames.size === locationCount) {
      logSuccess('Test 6: All location names are unique');
    } else {
      logError('Test 6: Duplicate location names found');
      allTestsPassed = false;
    }
    
    // Test 7: Valid status values
    const validStatuses = ['controlled', 'contested', 'enemy', 'destroyed'];
    const allValidStatuses = locationsResult.rows.every(r => validStatuses.includes(r.status));
    if (allValidStatuses) {
      logSuccess('Test 7: All locations have valid status values');
    } else {
      logError('Test 7: Some locations have invalid status values');
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
  testLocationSeeding()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = testLocationSeeding;
