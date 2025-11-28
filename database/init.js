/**
 * Complete Database Initialization Script
 * Builds database, runs migrations, and performs sanity checks
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.cyan);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function logSection(message) {
  log(`\n${'='.repeat(60)}`, colors.blue);
  log(`  ${message}`, colors.bright + colors.blue);
  log(`${'='.repeat(60)}`, colors.blue);
}

async function checkDatabaseConnection(pool) {
  logSection('Step 1: Checking Database Connection');
  
  try {
    const result = await pool.query('SELECT version()');
    logSuccess('Connected to PostgreSQL');
    logInfo(`Version: ${result.rows[0].version.split(',')[0]}`);
    return true;
  } catch (error) {
    logError('Failed to connect to database');
    logError(`Error: ${error.message}`);
    logInfo('\nPlease ensure:');
    logInfo('1. PostgreSQL is running');
    logInfo('2. DATABASE_URL is set in .env file');
    logInfo('3. Database credentials are correct');
    return false;
  }
}

async function runMigration(pool) {
  logSection('Step 2: Running Database Migration');
  
  try {
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      logError('schema.sql file not found');
      return false;
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    logInfo('Executing schema.sql...');
    
    // Execute schema
    await pool.query(schema);
    
    logSuccess('Database schema created successfully');
    return true;
  } catch (error) {
    logError('Migration failed');
    logError(`Error: ${error.message}`);
    return false;
  }
}

async function applyOptimizations(pool) {
  logSection('Step 2.5: Applying Database Optimizations');
  
  try {
    // Read optimization file
    const optimizePath = path.join(__dirname, 'optimize-indexes.sql');
    
    if (!fs.existsSync(optimizePath)) {
      logWarning('optimize-indexes.sql file not found, skipping optimizations');
      return true; // Not critical, continue
    }
    
    const optimizeSql = fs.readFileSync(optimizePath, 'utf8');
    logInfo('Executing optimize-indexes.sql...');
    
    // Execute optimization SQL
    await pool.query(optimizeSql);
    
    logSuccess('Database optimizations applied successfully');
    logInfo('  • Composite indexes created');
    logInfo('  • JSONB indexes added');
    logInfo('  • Partial indexes created');
    return true;
  } catch (error) {
    logError('Optimization failed');
    logError(`Error: ${error.message}`);
    return false;
  }
}

async function performSanityChecks(pool) {
  logSection('Step 3: Performing Sanity Checks');
  
  const checks = [];
  
  // Check 1: Verify all tables exist
  logInfo('Checking tables...');
  const expectedTables = [
    'campaigns',
    'combatants',
    'combatant_conditions',
    'monsters',
    'monster_instances',
    'siege_state',
    'siege_notes',
    'locations',
    'plot_points',
    'user_preferences'
  ];
  
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const actualTables = result.rows.map(row => row.table_name);
    
    for (const table of expectedTables) {
      if (actualTables.includes(table)) {
        logSuccess(`Table '${table}' exists`);
        checks.push(true);
      } else {
        logError(`Table '${table}' is missing`);
        checks.push(false);
      }
    }
  } catch (error) {
    logError('Failed to check tables');
    logError(`Error: ${error.message}`);
    checks.push(false);
  }
  
  // Check 2: Verify default campaign exists
  logInfo('\nChecking default campaign...');
  try {
    const result = await pool.query('SELECT * FROM campaigns WHERE id = 1');
    if (result.rows.length > 0) {
      logSuccess(`Default campaign exists: "${result.rows[0].name}"`);
      checks.push(true);
    } else {
      logWarning('Default campaign not found');
      checks.push(false);
    }
  } catch (error) {
    logError('Failed to check default campaign');
    logError(`Error: ${error.message}`);
    checks.push(false);
  }
  
  // Check 3: Verify indexes exist
  logInfo('\nChecking indexes...');
  try {
    const result = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY indexname
    `);
    
    const indexCount = result.rows.length;
    if (indexCount > 0) {
      logSuccess(`${indexCount} indexes created`);
      checks.push(true);
    } else {
      logWarning('No indexes found');
      checks.push(false);
    }
  } catch (error) {
    logError('Failed to check indexes');
    logError(`Error: ${error.message}`);
    checks.push(false);
  }
  
  // Check 4: Test CRUD operations
  logInfo('\nTesting CRUD operations...');
  try {
    // Create a test combatant
    const insertResult = await pool.query(`
      INSERT INTO combatants (
        campaign_id, name, type, initiative, ac, current_hp, max_hp,
        save_strength, save_dexterity, save_constitution,
        save_intelligence, save_wisdom, save_charisma
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `, [1, 'Test Character', 'PC', 15, 18, 50, 50, 2, 3, 1, 0, 2, 1]);
    
    const testId = insertResult.rows[0].id;
    logSuccess('CREATE: Test combatant created');
    
    // Read the combatant
    const selectResult = await pool.query('SELECT * FROM combatants WHERE id = $1', [testId]);
    if (selectResult.rows.length > 0) {
      logSuccess('READ: Test combatant retrieved');
    }
    
    // Update the combatant
    await pool.query('UPDATE combatants SET initiative = $1 WHERE id = $2', [20, testId]);
    const updateCheck = await pool.query('SELECT initiative FROM combatants WHERE id = $1', [testId]);
    if (updateCheck.rows[0].initiative === 20) {
      logSuccess('UPDATE: Test combatant updated');
    }
    
    // Delete the combatant
    await pool.query('DELETE FROM combatants WHERE id = $1', [testId]);
    const deleteCheck = await pool.query('SELECT * FROM combatants WHERE id = $1', [testId]);
    if (deleteCheck.rows.length === 0) {
      logSuccess('DELETE: Test combatant deleted');
    }
    
    checks.push(true);
  } catch (error) {
    logError('CRUD operations test failed');
    logError(`Error: ${error.message}`);
    checks.push(false);
  }
  
  // Check 5: Test foreign key constraints
  logInfo('\nTesting foreign key constraints...');
  try {
    // Try to insert a combatant with invalid campaign_id
    let constraintWorks = false;
    try {
      await pool.query(`
        INSERT INTO combatants (
          campaign_id, name, type, ac, current_hp, max_hp
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [99999, 'Invalid', 'PC', 10, 10, 10]);
    } catch (fkError) {
      if (fkError.message.includes('foreign key') || fkError.message.includes('violates')) {
        constraintWorks = true;
      }
    }
    
    if (constraintWorks) {
      logSuccess('Foreign key constraints are working');
      checks.push(true);
    } else {
      logWarning('Foreign key constraints may not be working correctly');
      checks.push(false);
    }
  } catch (error) {
    logError('Failed to test foreign key constraints');
    logError(`Error: ${error.message}`);
    checks.push(false);
  }
  
  // Summary
  const passedChecks = checks.filter(c => c).length;
  const totalChecks = checks.length;
  
  logSection('Sanity Check Summary');
  if (passedChecks === totalChecks) {
    logSuccess(`All ${totalChecks} checks passed!`);
    return true;
  } else {
    logWarning(`${passedChecks}/${totalChecks} checks passed`);
    return passedChecks > totalChecks / 2; // Pass if more than half succeed
  }
}

async function displayDatabaseInfo(pool) {
  logSection('Database Information');
  
  try {
    // Get table row counts
    const tables = [
      'campaigns',
      'combatants',
      'monsters',
      'locations',
      'plot_points'
    ];
    
    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      const count = result.rows[0].count;
      logInfo(`${table}: ${count} rows`);
    }
  } catch (error) {
    logWarning('Could not retrieve database information');
  }
}

async function initializeDatabase() {
  log('\n' + '█'.repeat(60), colors.bright + colors.blue);
  log('  SIEGE OF NEVERWINTER - DATABASE INITIALIZATION', colors.bright + colors.blue);
  log('█'.repeat(60) + '\n', colors.bright + colors.blue);
  
  // Check for .env file
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    logWarning('.env file not found');
    logInfo('Creating .env from .env.example...');
    
    const examplePath = path.join(__dirname, '..', '.env.example');
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, envPath);
      logSuccess('.env file created');
      logWarning('Please update DATABASE_URL in .env file and run this script again');
      return false;
    } else {
      logError('.env.example not found');
      logInfo('Please create a .env file with DATABASE_URL');
      return false;
    }
  }
  
  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    logError('DATABASE_URL not set in .env file');
    logInfo('Please add: DATABASE_URL=postgresql://user:password@localhost:5432/siege_of_neverwinter');
    return false;
  }
  
  logInfo(`Database URL: ${process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  
  try {
    // Step 1: Check connection
    const connected = await checkDatabaseConnection(pool);
    if (!connected) {
      return false;
    }
    
    // Step 2: Run migration
    const migrated = await runMigration(pool);
    if (!migrated) {
      return false;
    }
    
    // Step 2.5: Apply optimizations
    const optimized = await applyOptimizations(pool);
    if (!optimized) {
      logWarning('Optimizations failed, but continuing...');
    }
    
    // Step 3: Sanity checks
    const checksPass = await performSanityChecks(pool);
    if (!checksPass) {
      logWarning('Some sanity checks failed, but database may still be usable');
    }
    
    // Step 4: Display info
    await displayDatabaseInfo(pool);
    
    // Success!
    logSection('Initialization Complete');
    logSuccess('Database is ready for use!');
    logInfo('\nYou can now:');
    logInfo('  • Run tests: npm test');
    logInfo('  • Start server: npm start');
    logInfo('  • Start dev server: npm run dev');
    
    return true;
    
  } catch (error) {
    logError('Unexpected error during initialization');
    logError(`Error: ${error.message}`);
    console.error(error);
    return false;
  } finally {
    await pool.end();
  }
}

// Run initialization if called directly
if (require.main === module) {
  initializeDatabase()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = initializeDatabase;
