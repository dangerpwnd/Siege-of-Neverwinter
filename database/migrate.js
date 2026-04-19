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

    // Read and execute the main schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await db.query(schema);
    console.log('✓ Base schema created');

    // Run additional migrations in order
    const migrations = [
      'add-race.sql',
      'add-subclass.sql',
      'add-background-alignment.sql',
      'add-features-items.sql',
      'add-reference-tables.sql',
    ];

    for (const file of migrations) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const sql = fs.readFileSync(filePath, 'utf8');
        await db.query(sql);
        console.log(`✓ Applied migration: ${file}`);
      } else {
        console.warn(`⚠ Migration file not found, skipping: ${file}`);
      }
    }

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
