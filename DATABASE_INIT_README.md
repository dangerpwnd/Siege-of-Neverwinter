# Database Initialization Guide

This guide explains how to set up the PostgreSQL database for the Siege of Neverwinter application.

## Prerequisites

1. **PostgreSQL installed and running**
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - Mac: `brew install postgresql` or download from postgresql.org
   - Linux: `sudo apt-get install postgresql` (Ubuntu/Debian)

2. **Node.js and npm installed**

## Quick Start

### 1. Create the Database

First, create a PostgreSQL database for the application:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE siege_of_neverwinter;

# Exit psql
\q
```

### 2. Configure Environment Variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and update the `DATABASE_URL` with your PostgreSQL credentials:

```
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/siege_of_neverwinter
PORT=3000
OPENAI_API_KEY=your_openai_api_key_here
```

**Example:**
```
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/siege_of_neverwinter
```

### 3. Run Database Initialization

Run the comprehensive initialization script:

```bash
npm run db:init
```

This script will:
- ✓ Check database connection
- ✓ Create all tables with proper schema
- ✓ Set up indexes for performance
- ✓ Create default campaign
- ✓ Perform sanity checks (CRUD operations, foreign keys, etc.)
- ✓ Display database information

## Alternative Commands

If you need to run specific parts of the setup:

### Just run the migration (create tables)
```bash
npm run db:migrate
```

### Legacy setup command
```bash
npm run db:setup
```

## Troubleshooting

### Connection Failed

**Error:** `Failed to connect to database`

**Solutions:**
1. Ensure PostgreSQL is running:
   ```bash
   # Windows (in Services)
   # Look for "postgresql-x64-XX" service
   
   # Mac
   brew services start postgresql
   
   # Linux
   sudo systemctl start postgresql
   ```

2. Check your DATABASE_URL in `.env`
3. Verify your PostgreSQL credentials
4. Ensure the database exists

### Authentication Failed

**Error:** `password authentication failed`

**Solutions:**
1. Check your username and password in DATABASE_URL
2. Reset PostgreSQL password if needed:
   ```bash
   psql -U postgres
   ALTER USER postgres PASSWORD 'newpassword';
   ```

### Database Does Not Exist

**Error:** `database "siege_of_neverwinter" does not exist`

**Solution:**
Create the database first:
```bash
psql -U postgres -c "CREATE DATABASE siege_of_neverwinter;"
```

### Port Already in Use

**Error:** `port 5432 is already in use`

**Solution:**
Either:
1. Stop the other PostgreSQL instance
2. Use a different port in your DATABASE_URL

## Database Schema

The initialization creates the following tables:

- **campaigns** - Campaign sessions
- **combatants** - PCs, NPCs, and Monster instances
- **combatant_conditions** - Status effects on combatants
- **monsters** - Monster templates/database
- **monster_instances** - Links monsters to combatants
- **siege_state** - Siege mechanics tracking
- **siege_notes** - Timestamped siege notes
- **locations** - City map locations
- **plot_points** - Story markers on the map
- **user_preferences** - UI preferences and settings

## Verification

After successful initialization, you should see:

```
✓ Connected to PostgreSQL
✓ Database schema created successfully
✓ All 10 tables exist
✓ Default campaign exists
✓ Indexes created
✓ CRUD operations working
✓ Foreign key constraints working
```

## Running Tests

Once the database is initialized, you can run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Resetting the Database

To completely reset the database:

```bash
# Drop and recreate the database
psql -U postgres -c "DROP DATABASE siege_of_neverwinter;"
psql -U postgres -c "CREATE DATABASE siege_of_neverwinter;"

# Run initialization again
npm run db:init
```

## Support

If you encounter issues not covered here:

1. Check the PostgreSQL logs
2. Verify all prerequisites are installed
3. Ensure your .env file is properly configured
4. Try running the initialization script with verbose output

## Next Steps

After successful database initialization:

1. Start the development server: `npm run dev`
2. Run the test suite: `npm test`
3. Access the application at: `http://localhost:3000`
