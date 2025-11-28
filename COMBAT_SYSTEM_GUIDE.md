# Combat System Guide

## Overview

The combat system has been improved to provide an easy, streamlined way to add characters and monsters to the initiative tracker without getting stuck in loops.

## Adding Combatants to Combat

### From Character Panel

**Steps:**
1. Navigate to the Character Panel
2. Select a character from the list
3. View the character's details
4. Click the "Add to Combat" button at the bottom
5. Enter the initiative value when prompted
6. Character is added to the initiative tracker

**Features:**
- Prevents duplicate additions (checks if already in combat)
- Uses character's existing stats (AC, HP, saves)
- Success/error messages for feedback
- Single prompt for initiative only

### From Monster Database

**Steps:**
1. Navigate to the Monster Database
2. Select a monster from the list
3. View the monster's stat block
4. Click "Add to Combat" button
5. Enter instance name (defaults to monster name)
6. Enter initiative value
7. Monster instance is created and added to combat

**Features:**
- Creates independent monster instances
- Each instance has separate HP tracking
- Multiple instances of same monster supported
- Success/error messages for feedback

### Direct Addition (Initiative Tracker)

**For Quick NPCs/Enemies:**
1. Click "Add Combatant" in the initiative tracker
2. Follow the prompts:
   - Name
   - Type (PC/NPC/Monster)
   - Initiative
   - AC
   - HP
3. Combatant is added directly

**Use Cases:**
- Quick NPCs without full character sheets
- Temporary enemies
- Environmental hazards with initiative
- Summoned creatures

## Initiative Tracker Features

### Display
- Sorted by initiative (highest to lowest)
- Current turn highlighted
- Type badges (PC/NPC/Monster)
- AC and HP display
- Condition indicators

### Controls
- **Next Turn**: Advance to next combatant
- **Add Combatant**: Quick add form
- **Clear All**: Remove all combatants (with confirmation)

### Per-Combatant Actions
- **Edit Initiative**: Click initiative value to change
- **Remove**: Click × button to remove from combat

### Condition Tracking
- Abbreviated condition badges
- Hover for full condition name
- Visual indicators for status effects

## Preventing Loops

### Previous Issue
The old system would get stuck in loops when:
- Prompts were cancelled
- Invalid data was entered
- Multiple prompts chained together

### Solution
1. **Check for null**: All prompts check if user cancelled
2. **Early returns**: Exit immediately on cancellation
3. **Validation**: Validate data before processing
4. **Error handling**: Try-catch blocks prevent crashes
5. **Feedback**: Success/error messages inform user

### Best Practices
- Always check `if (value === null) return;` after prompts
- Use try-catch for async operations
- Provide clear error messages
- Allow users to cancel at any step

## Data Flow

### Character to Combat
```
Character Panel → "Add to Combat" button
  ↓
Prompt for initiative
  ↓
POST /api/initiative
  ↓
Update state.combatants
  ↓
Initiative Tracker re-renders
```

### Monster to Combat
```
Monster Database → "Add to Combat" button
  ↓
Prompt for instance name
  ↓
Prompt for initiative
  ↓
POST /api/monsters/:id/instances
  ↓
Creates combatant entry
  ↓
Update state.combatants
  ↓
Initiative Tracker re-renders
```

### Direct Addition
```
Initiative Tracker → "Add Combatant" button
  ↓
Series of prompts (with cancellation checks)
  ↓
POST /api/initiative
  ↓
Update state.combatants
  ↓
Re-render
```

## API Endpoints

### POST /api/initiative
Add a combatant to initiative tracker
```json
{
  "campaign_id": 1,
  "combatant_id": 123,  // Optional: links to existing character
  "name": "Goblin",
  "type": "Monster",
  "initiative": 15,
  "ac": 13,
  "current_hp": 7,
  "max_hp": 7
}
```

### POST /api/monsters/:id/instances
Create monster instance and add to combat
```json
{
  "instance_name": "Goblin 1",
  "initiative": 12
}
```

### DELETE /api/initiative/:id
Remove combatant from initiative tracker

### PUT /api/initiative/:id
Update combatant (e.g., change initiative)
```json
{
  "initiative": 18
}
```

## User Experience Improvements

### Visual Feedback
- ✅ Success messages (green)
- ❌ Error messages (red)
- Animated slide-in effects
- Auto-dismiss after 3 seconds

### Duplicate Prevention
- Checks if character already in combat
- Shows error message instead of adding duplicate
- Prevents confusion and data issues

### Cancellation Support
- All prompts can be cancelled
- No partial data created
- Clean exit from process

### Clear Instructions
- Helpful prompt messages
- Default values provided
- Format examples shown

## Troubleshooting

### Character Won't Add to Combat
- Check if already in combat (error message shown)
- Verify character has required stats (AC, HP)
- Check browser console for errors

### Monster Instance Not Created
- Verify monster exists in database
- Check initiative value is numeric
- Ensure instance name is provided

### Initiative Tracker Not Updating
- Check state management (F12 console)
- Verify API responses are successful
- Try refreshing the page

### Prompts Keep Appearing
- Click "Cancel" to exit
- Don't leave prompts empty
- Check for JavaScript errors in console

## Future Enhancements

Potential improvements:
- Modal dialogs instead of prompts
- Drag-and-drop to add combatants
- Bulk add multiple combatants
- Import from saved encounters
- Roll initiative automatically
- Group initiative for monsters
