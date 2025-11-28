# Monster Management Guide

## Overview

The Monster Database module has been enhanced to provide a better user experience for managing monsters, similar to the character creation process.

## Features

### Adding Monsters

**Improved Form-Based Creation:**
- Click "Add Monster" button to open a comprehensive form
- Fill in required fields:
  - **Name**: Monster name
  - **AC**: Armor Class
  - **HP Formula**: Hit point formula (e.g., "4d8+4")
  - **CR**: Challenge Rating
- Optional fields:
  - **Speed**: Movement speed (e.g., "30 ft.")
  - **Ability Scores**: STR, DEX, CON, INT, WIS, CHA (default: 10)
  - **Senses**: Special senses (e.g., "Darkvision 60 ft.")
  - **Languages**: Known languages
  - **Lore/Description**: Background information

**Form Features:**
- Clean, organized layout similar to character creation
- Default values for common fields
- Input validation for required fields
- Cancel button to return to monster list

### Viewing Monsters

**Monster List:**
- Browse all monsters in the database
- Search/filter by name
- Quick view of AC, HP, and CR
- Click any monster to view full stat block

**Monster Stat Block:**
- Complete monster information display
- Ability scores with modifiers
- Special abilities and attacks
- Resistances and immunities
- Senses and languages
- Lore/description

### Deleting Monsters

**Delete Functionality:**
- Delete button available in monster stat block view
- Confirmation dialog to prevent accidental deletion
- Removes monster template and all combat instances
- Returns to monster list after deletion

**Safety Features:**
- Confirmation required before deletion
- Warning that instances will also be removed
- Error handling for failed deletions

### Adding Monsters to Combat

**Create Instance:**
1. View monster stat block
2. Click "Add to Combat" button
3. Enter instance name (defaults to monster name)
4. Enter initiative value
5. Monster is added to initiative tracker

**Instance Features:**
- Independent HP tracking per instance
- Multiple instances of same monster supported
- Each instance appears as a combatant in initiative tracker

## UI Improvements

### Form Layout
- Organized sections for different monster attributes
- Grid layout for ability scores (6 columns)
- Consistent styling with character panel
- Clear labels and placeholders

### Button Styling
- Primary button: "Create Monster" (blue)
- Secondary button: "Cancel" (gray)
- Danger button: "Delete" (red)
- Back button: "← Back to List" (gray)

### Visual Feedback
- Hover effects on monster list items
- Transform animation on hover
- Color-coded buttons for different actions
- Clear visual hierarchy

## API Endpoints

### GET /api/monsters
Get all monsters for a campaign with optional name filtering

### GET /api/monsters/:id
Get a specific monster by ID

### POST /api/monsters
Create a new monster template

### PUT /api/monsters/:id
Update a monster template

### DELETE /api/monsters/:id
Delete a monster template (also removes all instances)

### POST /api/monsters/:id/instances
Create a combat-ready instance of a monster

### GET /api/monsters/:id/instances
Get all instances of a monster

## Best Practices

1. **Naming Conventions**: Use clear, descriptive names for monsters
2. **HP Formulas**: Use standard D&D dice notation (e.g., "4d8+4")
3. **CR Values**: Use standard CR values (0, 1/8, 1/4, 1/2, 1-30)
4. **Instances**: Create unique instance names when adding multiple copies to combat
5. **Deletion**: Always confirm before deleting to avoid data loss

## Future Enhancements

Potential improvements for future versions:
- Edit monster functionality
- Import monsters from SRD/API
- Custom attacks and abilities editor
- Monster tags and categories
- Bulk import/export
- Monster templates library
