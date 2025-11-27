# Siege of Neverwinter - Quick Start Guide

Get up and running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Database

### Option A: Quick Test (Recommended First)

Test if your database is accessible:

```bash
npm run db:test
```

If this fails, follow the troubleshooting steps it provides.

### Option B: Full Initialization

Run the complete database setup with sanity checks:

```bash
npm run db:init
```

This will:
- ✓ Check PostgreSQL connection
- ✓ Create all tables
- ✓ Set up indexes
- ✓ Create default campaign
- ✓ Run sanity checks
- ✓ Test CRUD operations

## Step 3: Run Tests

Verify everything works:

```bash
npm test
```

## Step 4: Start the Server

```bash
npm start
```

Visit: http://localhost:3000

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run db:test` | Quick database connection test |
| `npm run db:init` | Full database initialization with checks |
| `npm run db:migrate` | Run database migration only |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm start` | Start production server |
| `npm run dev` | Start development server |

## Prerequisites

Before running these commands, ensure you have:

1. **PostgreSQL installed and running**
2. **Database created:**
   ```bash
   psql -U postgres -c "CREATE DATABASE siege_of_neverwinter;"
   ```
3. **.env file configured:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

## Troubleshooting

### "DATABASE_URL not found"
- Copy `.env.example` to `.env`
- Update DATABASE_URL with your credentials

### "Connection failed"
- Ensure PostgreSQL is running
- Check your credentials in .env
- Verify the database exists

### "Tables not found"
- Run `npm run db:init`

## Need More Help?

See detailed guides:
- [DATABASE_INIT_README.md](./DATABASE_INIT_README.md) - Complete database setup guide
- [README.md](./README.md) - Full project documentation

## What's Next?

After successful setup:

1. ✅ Database is initialized
2. ✅ Tests are passing
3. ✅ Server is running

You can now:
- Access the web interface at http://localhost:3000
- Run the test suite to verify functionality
- Start developing new features
