# PostgreSQL Reinstallation Guide

## Step 1: Uninstall PostgreSQL

### Option A: Using Windows Settings
1. Press `Win + I` to open Settings
2. Go to **Apps** → **Apps & features**
3. Search for "PostgreSQL"
4. Click on "PostgreSQL 17" → **Uninstall**
5. Follow the uninstaller prompts
6. **Important**: When asked if you want to remove data directory, select **YES** to completely clean the installation

### Option B: Using Control Panel
1. Press `Win + R`, type `appwiz.cpl`, press Enter
2. Find "PostgreSQL 17" in the list
3. Right-click → **Uninstall**
4. Follow the uninstaller prompts

### Step 1.5: Clean Up Remaining Files (Important!)
After uninstalling, manually delete these folders if they still exist:
- `C:\Program Files\PostgreSQL\17`
- `C:\Users\<YourUsername>\AppData\Roaming\postgresql`
- `C:\ProgramData\PostgreSQL` (This is a hidden folder - you may need to show hidden files)

To show hidden files:
1. Open File Explorer
2. Click **View** → **Show** → **Hidden items**

## Step 2: Download PostgreSQL

1. Go to: https://www.postgresql.org/download/windows/
2. Click "Download the installer"
3. Download the latest PostgreSQL 17.x installer for Windows x86-64

## Step 3: Install PostgreSQL

1. **Run the installer** as Administrator (right-click → Run as administrator)

2. **Installation Directory**: Use default
   ```
   C:\Program Files\PostgreSQL\17
   ```

3. **Select Components**: Check all:
   - ✅ PostgreSQL Server
   - ✅ pgAdmin 4
   - ✅ Stack Builder
   - ✅ Command Line Tools

4. **Data Directory**: Use default
   ```
   C:\Program Files\PostgreSQL\17\data
   ```

5. **Password**: Enter `Dq6ptmjEFB`
   - ⚠️ **IMPORTANT**: Write this down!
   - Re-enter to confirm: `Dq6ptmjEFB`

6. **Port**: Use default `5432`

7. **Locale**: Use default (or select your preferred locale)

8. **Summary**: Review and click **Next**

9. **Installation**: Wait for installation to complete (may take 5-10 minutes)

10. **Stack Builder**: Uncheck "Launch Stack Builder at exit" (not needed)

11. Click **Finish**

## Step 4: Verify Installation

Open Command Prompt and run:

```cmd
psql --version
```

You should see:
```
psql (PostgreSQL) 17.x
```

## Step 5: Test Connection

Run this command to test the connection:

```cmd
psql -U postgres -d postgres
```

When prompted for password, enter: `Dq6ptmjEFB`

If successful, you'll see the PostgreSQL prompt:
```
postgres=#
```

Type `\q` to exit.

## Step 6: Set Up the Database

Now that PostgreSQL is installed with the correct password, run:

```cmd
cd C:\Users\edang\Apps\SiegeOfNeverwinter
npm run db:setup
```

This will:
1. Create the `siege_of_neverwinter` database
2. Create all tables
3. Insert default campaign data

## Step 7: Verify Database Setup

Check that the database was created:

```cmd
psql -U postgres -d siege_of_neverwinter -c "\dt"
```

You should see a list of tables:
- campaigns
- combatants
- combatant_conditions
- monsters
- monster_instances
- siege_state
- siege_notes
- locations
- plot_points
- user_preferences

## Troubleshooting

### If installation fails:
- Make sure you ran the installer as Administrator
- Check that no PostgreSQL services are still running (Services → postgresql-x64-17)
- Reboot your computer and try again

### If connection still fails:
- Verify the service is running: `Get-Service postgresql-x64-17`
- Check Windows Firewall isn't blocking port 5432
- Try restarting the PostgreSQL service

### If you forget the password again:
- Use the password reset guide in `POSTGRES_PASSWORD_RESET.md`
- Or reinstall again (but write down the password this time!)

## After Successful Setup

Your `.env` file is already configured with:
```
DATABASE_URL=postgresql://postgres:Dq6ptmjEFB@localhost:5432/siege_of_neverwinter
```

You can now:
1. Start the server: `npm start`
2. Run tests: `npm test`
3. Access the application at: http://localhost:3000

## Notes

- The password `Dq6ptmjEFB` is now saved in your `.env` file
- Keep this password secure
- Don't commit the `.env` file to version control (it's already in .gitignore)
