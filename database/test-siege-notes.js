/**
 * Test script for siege notes seeding
 * Verifies that siege notes are created correctly
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

async function testSiegeNotes() {
  console.log('\n' + '='.repeat(60));
  logInfo('Testing Siege Notes Seeding');
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
    logInfo('Verifying Siege Notes');
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
    
    // Get siege state
    const siegeStateResult = await pool.query(
      'SELECT id FROM siege_state WHERE campaign_id = $1',
      [campaignId]
    );
    
    if (siegeStateResult.rows.length === 0) {
      logError('Siege state not found');
      return false;
    }
    
    const siegeStateId = siegeStateResult.rows[0].id;
    logSuccess(`Found siege state with ID: ${siegeStateId}\n`);
    
    // Query siege notes
    const notesResult = await pool.query(`
      SELECT 
        id,
        siege_state_id,
        note_text,
        created_at
      FROM siege_notes
      WHERE siege_state_id = $1
      ORDER BY created_at ASC
    `, [siegeStateId]);
    
    const noteCount = notesResult.rows.length;
    
    logInfo(`Total siege notes created: ${noteCount}\n`);
    
    // Display notes
    for (let i = 0; i < notesResult.rows.length; i++) {
      const note = notesResult.rows[i];
      logSuccess(`Note ${i + 1}:`);
      logInfo(`  Text: ${note.note_text}`);
      logInfo(`  Created: ${note.created_at}`);
      console.log('');
    }
    
    // Run validation tests
    console.log('='.repeat(60));
    logInfo('Running Validation Tests');
    console.log('='.repeat(60) + '\n');
    
    let allTestsPassed = true;
    
    // Test 1: Minimum count (at least 3 notes)
    if (noteCount >= 3) {
      logSuccess(`Test 1: Minimum count met (${noteCount} >= 3)`);
    } else {
      logError(`Test 1: Minimum count not met (${noteCount} < 3)`);
      allTestsPassed = false;
    }
    
    // Test 2: All notes linked to siege state
    const allLinked = notesResult.rows.every(r => r.siege_state_id === siegeStateId);
    if (allLinked) {
      logSuccess('Test 2: All notes linked to siege state');
    } else {
      logError('Test 2: Some notes not linked to siege state');
      allTestsPassed = false;
    }
    
    // Test 3: All notes have text
    const allHaveText = notesResult.rows.every(r => r.note_text && r.note_text.length > 0);
    if (allHaveText) {
      logSuccess('Test 3: All notes have text content');
    } else {
      logError('Test 3: Some notes missing text content');
      allTestsPassed = false;
    }
    
    // Test 4: Notes demonstrate different event types
    const noteTexts = notesResult.rows.map(r => r.note_text.toLowerCase());
    const hasWallDamage = noteTexts.some(t => t.includes('wall') || t.includes('breach'));
    const hasSupplyIssue = noteTexts.some(t => t.includes('supply') || t.includes('supplies'));
    const hasCombatEvent = noteTexts.some(t => t.includes('attack') || t.includes('enemy') || t.includes('forces'));
    
    if (hasWallDamage && hasSupplyIssue && hasCombatEvent) {
      logSuccess('Test 4: Notes demonstrate different event types (wall damage, supplies, combat)');
    } else {
      logWarning('Test 4: Notes may not cover all event types');
      logInfo(`  Wall damage events: ${hasWallDamage}`);
      logInfo(`  Supply events: ${hasSupplyIssue}`);
      logInfo(`  Combat events: ${hasCombatEvent}`);
    }
    
    // Test 5: Chronological ordering (timestamps should be in order)
    let isChronological = true;
    for (let i = 1; i < notesResult.rows.length; i++) {
      const prevTime = new Date(notesResult.rows[i - 1].created_at);
      const currTime = new Date(notesResult.rows[i].created_at);
      if (currTime < prevTime) {
        isChronological = false;
        break;
      }
    }
    
    if (isChronological) {
      logSuccess('Test 5: Notes are in chronological order');
    } else {
      logError('Test 5: Notes are not in chronological order');
      allTestsPassed = false;
    }
    
    // Test 6: All notes have timestamps
    const allHaveTimestamps = notesResult.rows.every(r => r.created_at);
    if (allHaveTimestamps) {
      logSuccess('Test 6: All notes have timestamps');
    } else {
      logError('Test 6: Some notes missing timestamps');
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
  testSiegeNotes()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = testSiegeNotes;
