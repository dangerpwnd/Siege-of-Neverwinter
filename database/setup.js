// Database setup script
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
    console.log('Setting up Siege of Neverwinter database...');
    
    // First, connect to the default 'postgres' database to create our database
    const databaseUrl = process.env.DATABASE_URL;
    const defaultUrl = databaseUrl.replace(/\/[^/]+$/, '/postgres');
    
    const defaultPool = new Pool({
        connectionString: defaultUrl,
    });

    try {
        // Check if database exists
        console.log('Checking if database exists...');
        const dbCheckResult = await defaultPool.query(
            "SELECT 1 FROM pg_database WHERE datname = 'siege_of_neverwinter'"
        );

        if (dbCheckResult.rows.length === 0) {
            // Create database
            console.log('Creating database siege_of_neverwinter...');
            await defaultPool.query('CREATE DATABASE siege_of_neverwinter');
            console.log('Database created successfully!');
        } else {
            console.log('Database already exists.');
        }
        
    } catch (error) {
        console.error('Failed to create database:', error);
        throw error;
    } finally {
        await defaultPool.end();
    }

    // Now connect to the siege_of_neverwinter database to create tables
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        // Read schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema
        console.log('Creating tables...');
        await pool.query(schema);
        
        console.log('Database setup completed successfully!');
        console.log('Default campaign created with ID: 1');
        
    } catch (error) {
        console.error('Database setup failed:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run setup if called directly
if (require.main === module) {
    setupDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = setupDatabase;
