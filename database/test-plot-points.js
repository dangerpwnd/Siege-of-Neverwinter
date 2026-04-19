/**
 * Test script for plot points seeding
 * Seeds the database and verifies plot points
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

async function testPlotPoints() {
  console.log('\n' + '='.repeat(60));
  logInfo('Testing Plot Points Seeding');
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
    logInfo('Verifying Plot Points');
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
    
    // Query plot points with location details
    const plotPointsResult = await pool.query(`
      SELECT 
        pp.id,
        pp.name,
        pp.description,
        pp.status,
        pp.coord_x,
        pp.coord_y,
        l.name as location_name,
        l.status as location_status
      FROM plot_points pp
      JOIN locations l ON pp.location_id = l.id
      WHERE l.campaign_id = $1
      ORDER BY pp.id
    `, [campaignId]);
    
    const plotPointCount = plotPointsResult.rows.length;
    
    logInfo(`Total plot points created: ${plotPointCount}\n`);
    
    // Display plot points
    for (const pp of plotPointsResult.rows) {
      logSuccess(`${pp.name} (${pp.status})`);
      logInfo(`  Location: ${pp.location_name} (${pp.location_status})`);
      logInfo(`  Coordinates: (${pp.coord_x}, ${pp.coord_y})`);
      logInfo(`  Description: ${pp.description.substring(0, 80)}...`);
      console.log('');
    }
    
    // Run validation tests
    console.log('='.repeat(60));
    logInfo('Running Validation Tests');
    console.log('='.repeat(60) + '\n');
    
    let allTestsPassed = true;
    
    // Test 1: Minimum count
    if (plotPointCount >= 3) {
      logSuccess(`Test 1: Minimum count met (${plotPointCount} >= 3)`);
    } else {
      logError(`Test 1: Minimum count not met (${plotPointCount} < 3)`);
      allTestsPassed = false;
    }
    
    // Test 2: All linked to locations
    const allLinked = plotPointsResult.rows.every(r => r.location_name);
    if (allLinked) {
      logSuccess('Test 2: All plot points linked to locations');
    } else {
      logError('Test 2: Some plot points not linked to locations');
      allTestsPassed = false;
    }
    
    // Test 3: Different statuses present
    const statuses = new Set(plotPointsResult.rows.map(r => r.status));
    const hasActive = statuses.has('active');
    const hasCompleted = statuses.has('completed');
    if (hasActive && hasCompleted) {
      logSuccess('Test 3: Both "active" and "completed" statuses present');
    } else {
      logError(`Test 3: Missing status types (active: ${hasActive}, completed: ${hasCompleted})`);
      allTestsPassed = false;
    }
    
    // Test 4: All have coordinates
    const allHaveCoords = plotPointsResult.rows.every(r => r.coord_x !== null && r.coord_y !== null);
    if (allHaveCoords) {
      logSuccess('Test 4: All plot points have coordinates');
    } else {
      logError('Test 4: Some plot points missing coordinates');
      allTestsPassed = false;
    }
    
    // Test 5: All have names
    const allHaveNames = plotPointsResult.rows.every(r => r.name && r.name.length > 0);
    if (allHaveNames) {
      logSuccess('Test 5: All plot points have names');
    } else {
      logError('Test 5: Some plot points missing names');
      allTestsPassed = false;
    }
    
    // Test 6: All have descriptions
    const allHaveDescriptions = plotPointsResult.rows.every(r => r.description && r.description.length > 0);
    if (allHaveDescriptions) {
      logSuccess('Test 6: All plot points have descriptions');
    } else {
      logError('Test 6: Some plot points missing descriptions');
      allTestsPassed = false;
    }
    
    // Test 7: Valid status values
    const validStatuses = ['active', 'completed', 'failed'];
    const allValidStatuses = plotPointsResult.rows.every(r => validStatuses.includes(r.status));
    if (allValidStatuses) {
      logSuccess('Test 7: All plot points have valid status values');
    } else {
      logError('Test 7: Some plot points have invalid status values');
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
  testPlotPoints()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = testPlotPoints;
