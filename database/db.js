const { Pool } = require('pg');
require('dotenv').config();

// Create connection pool with optimized settings
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  min: 2, // Minimum number of clients to keep in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Increased timeout for connection attempts
  maxUses: 7500, // Close and replace a connection after it has been used 7500 times
  allowExitOnIdle: false, // Keep the pool alive even when all clients are idle
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Query helper function
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Transaction helper
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  query,
  transaction,
  pool,
};
