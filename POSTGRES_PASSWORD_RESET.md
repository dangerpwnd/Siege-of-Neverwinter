# PostgreSQL Password Reset Guide

Your PostgreSQL installation requires a password that isn't one of the common defaults. Here's how to reset it:

## Method 1: Reset via pg_hba.conf (Recommended for Windows)

### Step 1: Locate pg_hba.conf
The file is typically located at:
```
C:\Program Files\PostgreSQL\17\data\pg_hba.conf
```

### Step 2: Edit pg_hba.conf
1. Open the file as Administrator (right-click Notepad → Run as Administrator)
2. Find the line that looks like:
   ```
   host    all             all             127.0.0.1/32            scram-sha-256
   ```
3. Change `scram-sha-256` to `trust`:
   ```
   host    all             all             127.0.0.1/32            trust
   ```
4. Save the file

### Step 3: Restart PostgreSQL Service
1. Open Services (Win + R, type `services.msc`)
2. Find "postgresql-x64-17" (or similar)
3. Right-click → Restart

### Step 4: Connect and Reset Password
Open Command Prompt and run:
```cmd
psql -U postgres -d postgres
```

Then in the PostgreSQL prompt:
```sql
ALTER USER postgres PASSWORD 'postgres';
\q
```

### Step 5: Restore pg_hba.conf
1. Change `trust` back to `scram-sha-256` in pg_hba.conf
2. Restart PostgreSQL service again

### Step 6: Update .env File
Your `.env` file should now work with:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/siege_of_neverwinter
```

## Method 2: Use pgAdmin (If Installed)

1. Open pgAdmin
2. If it connects automatically, you can reset the password there
3. Right-click on "postgres" user → Properties → Definition → Set new password

## Method 3: Check Windows Credential Manager

Sometimes PostgreSQL stores credentials in Windows:
1. Open Control Panel → Credential Manager
2. Look for PostgreSQL credentials
3. Note the password shown there

## Method 4: Reinstall PostgreSQL (Last Resort)

If nothing works, you can reinstall PostgreSQL:
1. Uninstall PostgreSQL completely
2. Reinstall and set password to `postgres` during installation
3. Make note of the password this time!

## After Fixing

Once you have the correct password, update your `.env` file:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/siege_of_neverwinter
```

Then run the database setup:
```cmd
npm run db:setup
```

## Need Help?

If you're still stuck, you can:
1. Check what password you used during PostgreSQL installation
2. Look for installation notes or documentation
3. Try connecting with pgAdmin to see if it has saved credentials
