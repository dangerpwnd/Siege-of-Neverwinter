/**
 * Database Connection Tester
 * Run this to test your PostgreSQL connection with different passwords
 */

const { Pool } = require('pg');

async function testConnection(password) {
  const connectionString = `postgresql://postgres:${password}@localhost:5432/postgres`;
  const pool = new Pool({ connectionString });
  
  try {
    const result = await pool.query('SELECT version()');
    console.log('✅ Connection successful!');
    console.log('PostgreSQL version:', result.rows[0].version);
    await pool.end();
    return true;
  } catch (error) {
    console.log(`❌ Connection failed with password: "${password}"`);
    console.log('Error:', error.message);
    await pool.end();
    return false;
  }
}

async function main() {
  console.log('Testing PostgreSQL connection...\n');
  
  // Test common passwords
  const passwords = [
    'postgres',
    '',  // empty password
    'admin',
    'root',
    'password',
    '1234'
  ];
  
  for (const pwd of passwords) {
    const success = await testConnection(pwd);
    if (success) {
      console.log('\n✅ Found working password!');
      console.log(`Update your .env file with:`);
      console.log(`DATABASE_URL=postgresql://postgres:${pwd}@localhost:5432/siege_of_neverwinter`);
      process.exit(0);
    }
  }
  
  console.log('\n❌ None of the common passwords worked.');
  console.log('\nTo reset your PostgreSQL password:');
  console.log('1. Open Command Prompt as Administrator');
  console.log('2. Run: psql -U postgres');
  console.log('3. If prompted for password, try the passwords above');
  console.log('4. Once connected, run: ALTER USER postgres PASSWORD \'postgres\';');
  console.log('\nOr check your PostgreSQL installation documentation.');
}

main();
