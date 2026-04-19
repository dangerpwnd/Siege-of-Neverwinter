/**
 * Clear the tutorial campaign from the database
 */

const { Pool } = require('pg');
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  cyan: '\x1b[36m'
};

function logSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.cyan}ℹ ${message}${colors.reset}`);
}

async function clearCampaign() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    logInfo('Clearing tutorial campaign...');
    
    const result = await pool.query(
      "DELETE FROM campaigns WHERE name = 'Siege of Neverwinter - Tutorial Campaign'"
    );
    
    logSuccess(`Deleted ${result.rowCount} campaign(s)`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

clearCampaign();
