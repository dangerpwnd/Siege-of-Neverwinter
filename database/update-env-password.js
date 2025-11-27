/**
 * Interactive script to update .env with correct PostgreSQL password
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function testConnection(password) {
  const connectionString = `postgresql://postgres:${password}@localhost:5432/postgres`;
  const pool = new Pool({ connectionString });
  
  try {
    await pool.query('SELECT 1');
    await pool.end();
    return true;
  } catch (error) {
    await pool.end();
    return false;
  }
}

async function updateEnvFile(password) {
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update DATABASE_URL
  const newUrl = `postgresql://postgres:${password}@localhost:5432/siege_of_neverwinter`;
  envContent = envContent.replace(
    /DATABASE_URL=.*/,
    `DATABASE_URL=${newUrl}`
  );
  
  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ .env file updated successfully!');
  console.log(`DATABASE_URL=${newUrl}`);
}

async function main() {
  console.log('=== PostgreSQL Password Configuration ===\n');
  console.log('This script will help you configure the correct PostgreSQL password.\n');
  
  const password = await question('Enter your PostgreSQL password for user "postgres": ');
  
  console.log('\nTesting connection...');
  const success = await testConnection(password);
  
  if (success) {
    console.log('✅ Connection successful!\n');
    const confirm = await question('Update .env file with this password? (yes/no): ');
    
    if (confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y') {
      await updateEnvFile(password);
      console.log('\nYou can now run: npm run db:setup');
    } else {
      console.log('\n.env file not updated.');
    }
  } else {
    console.log('❌ Connection failed with this password.\n');
    console.log('Please check your password and try again.');
    console.log('\nIf you need to reset your password, see POSTGRES_PASSWORD_RESET.md');
  }
  
  rl.close();
}

main().catch(console.error);
