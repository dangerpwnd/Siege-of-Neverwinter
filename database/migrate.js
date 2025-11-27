/**
 * Database Migration Script
 * Runs the schema.sql file to create/update database tables
 */

const fs = require('fs');
const path = require('path');
const db = require('./db');

async function runMigration() {
  try {
    console.log('Starting database migration...');

    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute the schema
    await db.query(schema);

    console.log('✓ Database migration completed successfully');
    console.log('✓ All tables created with indexes');
    console.log('✓ Default campaign initialized');

    process.exit(0);
  } catch (error) {
    console.error('✗ Database migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
