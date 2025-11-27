# Database Setup and Migration Guide

This guide covers PostgreSQL database setup, schema management, migrations, and troubleshooting for the Siege of Neverwinter application.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Database Schema](#database-schema)
4. [Running Migrations](#running-migrations)
5. [Seeding Sample Data](#seeding-sample-data)
6. [Backup and Restore](#backup-and-restore)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Topics](#advanced-topics)

## Prerequisites

### Installing PostgreSQL

#### Windows
1. Download from https://www.postgresql.org/download/windows/
2. Run the installer
3. Remember the password you set for the `postgres` user
4. Default port: 5432

#### macOS
```bash
# Using Homebrew
brew install postgresql@14
brew services start postgresql@14

# Or download from https://postgresapp.com/
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Verifying Installation

```bash
# Check if PostgreSQL is running
pg_isready

# Expected output: /var/run/postgresql:5432 - accepting connections

# Check version
psql --version

# Expected output: psql (PostgreSQL) 12.x or higher
```

## Initial Setup

### Step 1: Create Database User (Optional)

It's recommended to create a dedicated user for the application:

```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Or on Windows/macOS:
psql -U postgres
```

```sql
-- Create user
CREATE USER siege_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
ALTER USER siege_user CREATEDB;

-- Exit
\q
```

### Step 2: Create Database

#### Option A: Using Command Line
```bash
# As postgres user
sudo -u postgres createdb siege_of_neverwinter

# Or as your custom user
createdb -U siege_user siege_of_neverwinter
```

#### Option B: Using psql
```bash
psql -U postgres
```

```sql
CREATE DATABASE siege_of_neverwinter;

-- Grant privileges to your user
GRANT ALL PRIVILEGES ON DATABASE siege_of_neverwinter TO siege_user;

\q
```

### Step 3: Configure Environment Variables

Create or edit `.env` file in the project root:

```bash
# Copy example file
cp .env.example .env

# Edit with your credentials
nano .env  # or use your preferred editor
```

Update the DATABASE_URL:
```
DATABASE_URL=postgresql://siege_user:your_secure_password@localhost:5432/siege_of_neverwinter
PORT=3000
OPENAI_API_KEY=your_openai_api_key_here
```

**Connection String Format**:
```
postgresql://[user]:[password]@[host]:[port]/[database]
```

### Step 4: Test Database Connection

```bash
npm run db:test
```

Expected output:
```
Testing database connection...
✓ Connected to PostgreSQL successfully!
Database: siege_of_neverwinter
```

### Step 5: Initialize Schema

```bash
npm run db:setup
```

This command:
- Connects to the database
- Runs the schema.sql file
- Creates all tables
- Sets up indexes
- Inserts default campaign

Expected output:
```
Setting up database schema...
✓ Schema created successfully!
✓ Default campaign created
```

## Database Schema

### Tables Overview

The application uses 11 tables:

1. **campaigns** - Campaign/session management
2. **combatants** - PCs, NPCs, and monster instances
3. **combatant_conditions** - Status effects on combatants
4. **monsters** - Monster templates/database
5. **monster_instances** - Links monsters to combatants
6. **siege_state** - Siege mechanics tracking
7. **siege_notes** - Timestamped siege events
8. **locations** - City map locations
9. **plot_points** - Quest markers on map
10. **user_preferences** - UI settings
11. **campaigns** - Campaign management

### Entity Relationships

```
campaigns
    ├── combatants
    │   ├── combatant_conditions
    │   └── monster_instances
    ├── monsters
    │   └── monster_instances
    ├── siege_state
    │   └── siege_notes
    ├── locations
    │   └── plot_points
    └── user_preferences
```

### Key Tables Detail

#### combatants
Stores all combatants (PCs, NPCs, and monster instances):
```sql
- id (primary key)
- campaign_id (foreign key)
- name, type (PC/NPC/Monster)
- initiative, ac, current_hp, max_hp
- save_strength through save_charisma
- character_class, level, notes
```

#### monsters
Template database for monsters:
```sql
- id (primary key)
- campaign_id (foreign key)
- name, ac, hp_formula, speed
- stat_str through stat_cha
- saves, skills (JSONB)
- resistances, immunities (arrays)
- attacks, abilities (JSONB)
- lore
```

#### siege_state
Tracks siege mechanics:
```sql
- id (primary key)
- campaign_id (foreign key)
- wall_integrity, defender_morale, supplies (0-100)
- day_of_siege
- custom_metrics (JSONB)
```

### Indexes

Performance indexes are created on:
- `combatants.campaign_id`
- `combatants.initiative` (DESC for sorting)
- `combatants.type`
- `monsters.campaign_id`
- `locations.campaign_id`
- All foreign key relationships

## Running Migrations

### Understanding Migrations

Migrations are versioned database changes that can be applied incrementally.

### Current Migration System

The application uses a simple migration system:

```bash
# Run all pending migrations
npm run db:migrate
```

### Creating a New Migration

1. Create a new file in `database/migrations/`:
   ```
   YYYYMMDD_description.sql
   ```
   Example: `20240115_add_monster_tags.sql`

2. Write your SQL:
   ```sql
   -- Add tags column to monsters table
   ALTER TABLE monsters ADD COLUMN tags TEXT[];
   
   -- Create index
   CREATE INDEX idx_monsters_tags ON monsters USING GIN(tags);
   ```

3. Run the migration:
   ```bash
   npm run db:migrate
   ```

### Migration Best Practices

**DO**:
- ✅ Use transactions for complex migrations
- ✅ Test migrations on a copy of production data
- ✅ Include rollback instructions in comments
- ✅ Make migrations idempotent when possible
- ✅ Back up before running migrations

**DON'T**:
- ❌ Modify existing migration files
- ❌ Delete data without backups
- ❌ Run migrations directly in production without testing

### Example Migration with Rollback

```sql
-- Migration: Add experience points to combatants
-- Rollback: ALTER TABLE combatants DROP COLUMN experience_points;

BEGIN;

ALTER TABLE combatants ADD COLUMN experience_points INTEGER DEFAULT 0;
CREATE INDEX idx_combatants_xp ON combatants(experience_points);

COMMIT;
```

## Seeding Sample Data

### Running the Seed Script

```bash
npm run db:seed
```

This populates the database with:
- 5 sample PCs (party of adventurers)
- 6 Tiamat forces monster types
- Initial siege state (Day 5)
- 5 siege notes
- 6 locations in Neverwinter
- 5 plot points

### Seed Script Output

```
Starting database seed...
Using existing default campaign

Inserting sample PCs...
  ✓ Theron Brightblade (Paladin 10)
  ✓ Lyra Shadowstep (Rogue 10)
  ✓ Grimnar Ironforge (Fighter 10)
  ✓ Elara Moonwhisper (Wizard 10)
  ✓ Brother Aldric (Cleric 10)

Inserting Tiamat forces monsters...
  ✓ Cult Fanatic (CR 2)
  ✓ Red Dragon Wyrmling (CR 4)
  ✓ Dragonborn Champion (CR 5)
  ✓ Kobold Inventor (CR 1/4)
  ✓ Abishai (Red) (CR 9)
  ✓ Dragonclaw (CR 1)

Setting up siege state...
  ✓ Created siege state (Day 5, Wall: 90%, Morale: 85%, Supplies: 75%)

Adding siege notes...
  ✓ Day 1: Tiamat's forces have surrounded Neverwinter...
  [...]

Adding locations...
  ✓ Castle Never (controlled)
  ✓ Hall of Justice (controlled)
  ✓ Protector's Enclave (controlled)
  ✓ Eastern Gate (contested)
  ✓ Harbor District (controlled)
  ✓ Blacklake District (enemy)

Adding plot points...
  ✓ Defend the Gate at Eastern Gate
  ✓ Protect the Healers at Hall of Justice
  [...]

✅ Database seeded successfully!
```

### Re-seeding

To re-seed (warning: this adds duplicate data):
```bash
npm run db:seed
```

To start fresh:
```bash
# Drop and recreate database
dropdb siege_of_neverwinter
createdb siege_of_neverwinter

# Reinitialize
npm run db:setup
npm run db:seed
```

## Backup and Restore

### Creating Backups

#### Full Database Backup
```bash
# Backup entire database
pg_dump -U siege_user siege_of_neverwinter > backup_$(date +%Y%m%d).sql

# With compression
pg_dump -U siege_user siege_of_neverwinter | gzip > backup_$(date +%Y%m%d).sql.gz
```

#### Backup Specific Tables
```bash
# Backup only campaign data
pg_dump -U siege_user -t campaigns -t combatants -t monsters siege_of_neverwinter > campaign_backup.sql
```

#### Backup Data Only (No Schema)
```bash
pg_dump -U siege_user --data-only siege_of_neverwinter > data_backup.sql
```

### Restoring Backups

#### Restore Full Database
```bash
# Drop existing database (careful!)
dropdb siege_of_neverwinter

# Create new database
createdb siege_of_neverwinter

# Restore
psql -U siege_user siege_of_neverwinter < backup_20240115.sql

# Or from compressed backup
gunzip -c backup_20240115.sql.gz | psql -U siege_user siege_of_neverwinter
```

#### Restore Specific Tables
```bash
psql -U siege_user siege_of_neverwinter < campaign_backup.sql
```

### Automated Backups

Create a backup script (`backup.sh`):
```bash
#!/bin/bash
BACKUP_DIR="$HOME/siege_backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/siege_backup_$DATE.sql.gz"

mkdir -p $BACKUP_DIR
pg_dump -U siege_user siege_of_neverwinter | gzip > $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "siege_backup_*.sql.gz" -mtime +7 -delete

echo "Backup created: $BACKUP_FILE"
```

Make it executable and run:
```bash
chmod +x backup.sh
./backup.sh
```

Schedule with cron (daily at 2 AM):
```bash
crontab -e
# Add line:
0 2 * * * /path/to/backup.sh
```

## Troubleshooting

### Connection Issues

#### Error: "FATAL: password authentication failed"

**Solutions**:
1. Verify password in `.env` file
2. Check PostgreSQL user exists:
   ```sql
   psql -U postgres
   \du  -- list users
   ```
3. Reset password:
   ```sql
   ALTER USER siege_user WITH PASSWORD 'new_password';
   ```

#### Error: "FATAL: database does not exist"

**Solutions**:
```bash
# Create the database
createdb -U siege_user siege_of_neverwinter

# Or in psql
psql -U postgres
CREATE DATABASE siege_of_neverwinter;
GRANT ALL PRIVILEGES ON DATABASE siege_of_neverwinter TO siege_user;
```

#### Error: "could not connect to server"

**Solutions**:
1. Check if PostgreSQL is running:
   ```bash
   # Linux
   sudo systemctl status postgresql
   
   # macOS
   brew services list
   
   # Windows
   # Check Services app for "postgresql" service
   ```

2. Start PostgreSQL:
   ```bash
   # Linux
   sudo systemctl start postgresql
   
   # macOS
   brew services start postgresql@14
   ```

3. Check port:
   ```bash
   # Verify PostgreSQL is listening on port 5432
   netstat -an | grep 5432
   ```

### Schema Issues

#### Error: "relation does not exist"

**Cause**: Table hasn't been created

**Solution**:
```bash
npm run db:setup
```

#### Error: "column does not exist"

**Cause**: Schema is outdated

**Solutions**:
1. Run migrations:
   ```bash
   npm run db:migrate
   ```

2. Or recreate schema:
   ```bash
   # Backup first!
   pg_dump -U siege_user siege_of_neverwinter > backup.sql
   
   # Recreate
   dropdb siege_of_neverwinter
   createdb siege_of_neverwinter
   npm run db:setup
   ```

### Performance Issues

#### Slow Queries

**Diagnosis**:
```sql
-- Enable query logging
ALTER DATABASE siege_of_neverwinter SET log_statement = 'all';
ALTER DATABASE siege_of_neverwinter SET log_duration = on;

-- Check slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

**Solutions**:
1. Add indexes:
   ```sql
   CREATE INDEX idx_custom ON table_name(column_name);
   ```

2. Analyze tables:
   ```sql
   ANALYZE combatants;
   ANALYZE monsters;
   ```

3. Vacuum database:
   ```bash
   vacuumdb -U siege_user siege_of_neverwinter
   ```

#### Connection Pool Exhausted

**Symptoms**: "sorry, too many clients already"

**Solutions**:
1. Increase max connections in `postgresql.conf`:
   ```
   max_connections = 100
   ```

2. Adjust application pool size in `database/db.js`:
   ```javascript
   const pool = new Pool({
     max: 20,  // Reduce if needed
     idleTimeoutMillis: 30000
   });
   ```

### Data Issues

#### Corrupted Data

**Recovery**:
```bash
# Restore from backup
psql -U siege_user siege_of_neverwinter < backup.sql
```

#### Duplicate Data

**Remove duplicates**:
```sql
-- Example: Remove duplicate combatants
DELETE FROM combatants a USING combatants b
WHERE a.id < b.id
AND a.name = b.name
AND a.campaign_id = b.campaign_id;
```

## Advanced Topics

### Connection Pooling

The application uses `pg` connection pooling. Configuration in `database/db.js`:

```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000  // Timeout after 2s
});
```

### Database Maintenance

#### Regular Maintenance Tasks

```bash
# Analyze tables (update statistics)
vacuumdb -U siege_user --analyze siege_of_neverwinter

# Full vacuum (reclaim space)
vacuumdb -U siege_user --full siege_of_neverwinter

# Reindex
reindexdb -U siege_user siege_of_neverwinter
```

#### Monitoring Database Size

```sql
-- Database size
SELECT pg_size_pretty(pg_database_size('siege_of_neverwinter'));

-- Table sizes
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Multiple Campaigns

To support multiple campaigns:

```sql
-- Create new campaign
INSERT INTO campaigns (name) VALUES ('Second Campaign') RETURNING id;

-- Switch campaign in application
-- Update campaign_id in queries
```

### Database Replication (Advanced)

For production deployments, consider setting up replication:

1. **Primary-Replica Setup**: For read scaling
2. **Backup Server**: For disaster recovery
3. **Cloud Hosting**: Consider managed PostgreSQL (AWS RDS, Google Cloud SQL, etc.)

## Useful Commands Reference

```bash
# Database operations
createdb siege_of_neverwinter
dropdb siege_of_neverwinter
psql siege_of_neverwinter

# Backup/Restore
pg_dump siege_of_neverwinter > backup.sql
psql siege_of_neverwinter < backup.sql

# Maintenance
vacuumdb siege_of_neverwinter
reindexdb siege_of_neverwinter

# Application scripts
npm run db:test      # Test connection
npm run db:setup     # Initialize schema
npm run db:migrate   # Run migrations
npm run db:seed      # Load sample data
```

## Support Resources

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- pg (node-postgres) Documentation: https://node-postgres.com/
- PostgreSQL Tutorial: https://www.postgresqltutorial.com/

---

**Remember**: Always backup before making schema changes or running migrations!
