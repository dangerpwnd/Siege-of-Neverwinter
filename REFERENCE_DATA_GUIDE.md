# Reference Data System

## Overview

Character creation options (races, classes, subclasses, backgrounds) are now stored in PostgreSQL database tables instead of being hardcoded in the frontend. This provides significant benefits for maintainability and extensibility.

## Benefits

### 1. **Centralized Data Management**
- Single source of truth for all D&D 5e options
- Easy to update without touching code
- Consistent across all parts of the application

### 2. **Easy Maintenance**
- Add new races/classes with simple SQL INSERT
- No need to update multiple files
- No code deployment required for data changes

### 3. **Custom Content Support**
- DMs can add homebrew races/classes
- Campaign-specific options possible
- Easy to enable/disable options

### 4. **Better Performance**
- Data loaded once and cached
- Reduces frontend bundle size
- Faster page loads

### 5. **Scalability**
- Can add descriptions, source books, etc.
- Support for filtering and searching
- Easy to extend with new fields

## Database Schema

### Tables Created

#### `races`
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(100) - Race/subrace name
- race_family: VARCHAR(50) - Grouping (e.g., "Elf", "Dwarf")
- description: TEXT - Optional description
- created_at: TIMESTAMP
```

#### `classes`
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(100) - Class name
- description: TEXT - Optional description
- created_at: TIMESTAMP
```

#### `subclasses`
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(100) - Subclass name
- class_id: INTEGER - Foreign key to classes
- description: TEXT - Optional description
- created_at: TIMESTAMP
```

#### `backgrounds`
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(100) - Background name
- description: TEXT - Optional description
- created_at: TIMESTAMP
```

## API Endpoints

### GET /api/reference/races
Returns all races grouped by family
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "High Elf",
      "race_family": "Elf"
    }
  ]
}
```

### GET /api/reference/classes
Returns all classes
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Fighter"
    }
  ]
}
```

### GET /api/reference/subclasses?class_name=Fighter
Returns subclasses, optionally filtered by class
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Battle Master",
      "class_id": 1,
      "class_name": "Fighter"
    }
  ]
}
```

### GET /api/reference/backgrounds
Returns all backgrounds
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Acolyte"
    }
  ]
}
```

## Frontend Implementation

### Loading Reference Data
```javascript
async loadReferenceData() {
    const [races, classes, subclasses, backgrounds] = await Promise.all([
        api.get('/reference/races'),
        api.get('/reference/classes'),
        api.get('/reference/subclasses'),
        api.get('/reference/backgrounds')
    ]);
    
    this.referenceData = {
        races: races.data,
        classes: classes.data,
        subclasses: subclasses.data,
        backgrounds: backgrounds.data
    };
}
```

### Dynamic Dropdown Generation
Dropdowns are now generated from database data instead of hardcoded HTML.

## Adding Custom Content

### Add a New Race
```sql
INSERT INTO races (name, race_family) 
VALUES ('Custom Elf', 'Elf');
```

### Add a New Class
```sql
INSERT INTO classes (name) 
VALUES ('Blood Hunter');
```

### Add a New Subclass
```sql
INSERT INTO subclasses (name, class_id) 
VALUES ('Order of the Lycan', (SELECT id FROM classes WHERE name = 'Blood Hunter'));
```

### Add a New Background
```sql
INSERT INTO backgrounds (name) 
VALUES ('Pirate');
```

## Migration Files

- `database/add-reference-tables.sql` - Creates tables and populates with D&D 5e data
- Run once during setup or when updating

## Future Enhancements

### Possible Additions:
1. **Descriptions**: Add full descriptions for each option
2. **Source Books**: Track which book each option comes from
3. **Enabled/Disabled**: Toggle options on/off per campaign
4. **Custom Fields**: Add campaign-specific data
5. **Versioning**: Track changes over time
6. **Search/Filter**: Advanced filtering in UI
7. **Favorites**: Mark commonly used options
8. **Import/Export**: Share custom content between campaigns

### Example Extended Schema:
```sql
ALTER TABLE races ADD COLUMN source_book VARCHAR(100);
ALTER TABLE races ADD COLUMN enabled BOOLEAN DEFAULT true;
ALTER TABLE races ADD COLUMN campaign_id INTEGER REFERENCES campaigns(id);
```

## Maintenance

### Updating Data
```sql
-- Update a race name
UPDATE races SET name = 'Drow' WHERE name = 'Dark Elf (Drow)';

-- Add description
UPDATE classes SET description = 'A fierce warrior...' WHERE name = 'Barbarian';

-- Delete a custom option
DELETE FROM backgrounds WHERE name = 'Custom Background';
```

### Backup
```bash
# Export reference data
pg_dump -t races -t classes -t subclasses -t backgrounds > reference_data.sql

# Import reference data
psql < reference_data.sql
```

## Comparison: Before vs After

### Before (Hardcoded)
```javascript
// In characterPanel.js - 100+ lines of hardcoded options
<select id="char-race">
    <option value="High Elf">High Elf</option>
    <option value="Wood Elf">Wood Elf</option>
    // ... 40+ more options
</select>
```

**Problems:**
- Duplicated in create and edit forms
- Hard to maintain
- Requires code changes for updates
- Large frontend bundle

### After (Database-Driven)
```javascript
// In characterPanel.js - Dynamic generation
const races = await api.get('/reference/races');
// Generate dropdown from data
```

**Benefits:**
- Single source of truth
- Easy updates via SQL
- Smaller frontend code
- Supports custom content

## Best Practices

1. **Always use the API**: Don't hardcode options
2. **Cache reference data**: Load once, reuse
3. **Handle loading states**: Show loading indicator
4. **Graceful degradation**: Handle API failures
5. **Validate on server**: Don't trust client data
6. **Use transactions**: When adding related data
7. **Document custom content**: Track homebrew additions

## Troubleshooting

### Dropdowns are empty
- Check API endpoints are working
- Verify database has data
- Check browser console for errors

### Subclasses not showing
- Ensure class is selected first
- Check class_name matches exactly
- Verify foreign key relationships

### Custom content not appearing
- Check INSERT was successful
- Verify no UNIQUE constraint violations
- Refresh reference data cache
