# Dungeon Master's Guide - Siege of Neverwinter

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Using the Initiative Tracker](#using-the-initiative-tracker)
4. [Managing Characters and NPCs](#managing-characters-and-npcs)
5. [Working with Monsters](#working-with-monsters)
6. [Tracking Siege Mechanics](#tracking-siege-mechanics)
7. [Using the AI Assistant](#using-the-ai-assistant)
8. [Navigating the City Map](#navigating-the-city-map)
9. [Module Management](#module-management)
10. [Tips and Best Practices](#tips-and-best-practices)

## Introduction

Welcome to the Siege of Neverwinter Campaign Manager! This tool is designed to help you run an epic siege scenario where your party of adventurers defends Neverwinter against the forces of Tiamat.

### What This Tool Does

- **Initiative Tracking**: Automatically sorts and manages turn order in combat
- **Character Management**: Track PC and NPC stats, HP, and conditions
- **Monster Database**: Quick access to Tiamat-aligned creatures with full stat blocks
- **Siege Mechanics**: Monitor wall integrity, morale, supplies, and siege events
- **AI Assistant**: Get narrative suggestions and rules guidance from ChatGPT
- **Interactive Map**: Visualize the city state and track plot points
- **Persistent Storage**: All data is saved automatically to PostgreSQL

### Campaign Context

Your party of 5 adventurers is defending Neverwinter during a siege by Tiamat's forces. The siege includes:
- Red dragon wyrmlings and their riders
- Cult of the Dragon fanatics and dragonclaws
- Dragonborn champions leading ground assaults
- Kobold inventors with siege weapons
- Powerful abishai commanders

## Getting Started

### First Time Setup

1. **Start the Application**
   ```bash
   npm start
   ```
   Access at: http://localhost:3000

2. **Load Sample Data** (Optional but Recommended)
   ```bash
   npm run db:seed
   ```
   This populates the database with:
   - 5 sample PCs (Theron, Lyra, Grimnar, Elara, Brother Aldric)
   - 6 Tiamat forces monster types
   - Initial siege state (Day 5 of the siege)
   - 6 key locations in Neverwinter
   - 5 active plot points

3. **Configure AI Assistant** (Optional)
   - Click the settings icon in the AI Assistant module
   - Enter your OpenAI API key
   - The key is stored locally in your browser

### Understanding the Interface

The application uses a modular layout. Each module can be:
- **Shown/Hidden**: Click the eye icon to toggle visibility
- **Resized**: Drag the corners to resize
- **Repositioned**: Drag the title bar to move

Available modules:
- Initiative Tracker
- Character Panel
- NPC Panel
- Monster Database
- Siege Mechanics
- AI Assistant
- City Map

## Using the Initiative Tracker

### Adding Combatants

1. Click the "Add Combatant" button
2. Enter:
   - Name
   - Initiative value (number)
   - Type (PC, NPC, or Monster)
3. The tracker automatically sorts by initiative (highest first)

### Managing Combat

- **Next Turn**: Click "Next Turn" to advance to the next combatant
  - The active combatant is highlighted
  - Turn order wraps around automatically

- **Update Initiative**: Click on an initiative value to edit it
  - The tracker re-sorts automatically

- **Remove Combatant**: Click the X button next to a combatant
  - Turn order is preserved for remaining combatants

### Visual Indicators

- **PC**: Blue background
- **NPC**: Green background
- **Monster**: Red background
- **Active Turn**: Gold border
- **Conditions**: Small icons appear next to names

## Managing Characters and NPCs

### Viewing Character Details

1. Click on a character name in the initiative tracker
2. The Character Panel displays:
   - Armor Class (AC)
   - Current HP / Max HP
   - All six saving throw modifiers
   - Active conditions
   - Class and level
   - Notes

### Updating Hit Points

1. Select a character
2. Click on the HP value
3. Enter the new current HP
4. Changes sync across all displays immediately

### Managing Conditions

1. Select a combatant (PC, NPC, or Monster)
2. Click "Add Condition"
3. Choose from D&D 5e conditions:
   - Blinded, Charmed, Deafened, Frightened
   - Grappled, Incapacitated, Invisible, Paralyzed
   - Petrified, Poisoned, Prone, Restrained
   - Stunned, Unconscious

4. To remove: Click the X next to the condition

**Note**: Conditions appear as indicators in the initiative tracker for quick reference.

### Creating New Characters

1. Click "New Character" in the Character Panel
2. Fill in all required fields:
   - Name, Class, Level
   - AC, Max HP
   - Saving throw modifiers
3. Click "Save"

### NPCs vs PCs

NPCs work identically to PCs but are visually distinguished:
- Use NPCs for allies, neutral characters, and important enemies
- Use Monsters for standard enemies from the monster database

## Working with Monsters

### Browsing the Monster Database

1. Open the Monster Database module
2. Use the search bar to filter by name
3. Click on a monster to view its full stat block:
   - AC, HP formula, Speed
   - Ability scores
   - Saves, skills, resistances, immunities
   - Attacks with damage and descriptions
   - Special abilities
   - Lore and tactics

### Adding Monsters to Combat

1. Find the monster in the database
2. Click "Create Instance"
3. The system:
   - Rolls HP based on the formula
   - Creates an independent copy
   - Adds it to the initiative tracker
4. Enter initiative value when prompted

### Multiple Instances

You can create multiple instances of the same monster:
- Each instance has independent HP tracking
- Name them distinctly (e.g., "Dragonclaw 1", "Dragonclaw 2")
- Damage to one instance doesn't affect others

### Sample Monsters Included

After running `npm run db:seed`, you'll have:

1. **Cult Fanatic** (CR 2) - Spellcasting leaders
2. **Red Dragon Wyrmling** (CR 4) - Aerial threats
3. **Dragonborn Champion** (CR 5) - Elite warriors
4. **Kobold Inventor** (CR 1/4) - Siege engineers
5. **Abishai (Red)** (CR 9) - Devil commanders
6. **Dragonclaw** (CR 1) - Cult soldiers

## Tracking Siege Mechanics

### Siege Status Overview

The Siege Mechanics module displays:
- **Wall Integrity**: 0-100% (structural damage to defenses)
- **Defender Morale**: 0-100% (fighting spirit of defenders)
- **Supplies**: 0-100% (food, ammunition, medical supplies)
- **Day of Siege**: Current day number

### Updating Siege Values

1. Click on any value to edit
2. Enter new value (0-100 for percentages)
3. Changes are saved automatically

### Adding Siege Notes

1. Click "Add Note" in the Siege Mechanics module
2. Enter your note (e.g., "Dragon attack on eastern gate repelled")
3. Notes are timestamped automatically
4. Use notes to track:
   - Major events
   - Tactical decisions
   - NPC interactions
   - Plot developments

### Custom Metrics

You can add custom siege metrics:
1. Click "Add Custom Metric"
2. Enter name (e.g., "Dragon Sightings", "Cult Infiltrators")
3. Enter value (number or text)
4. Useful for tracking scenario-specific elements

### Sample Siege State

After seeding, the siege starts at:
- Day 5 of the siege
- Wall Integrity: 90%
- Defender Morale: 85%
- Supplies: 75%
- 5 historical notes from previous days

## Using the AI Assistant

### Setting Up

1. Obtain an OpenAI API key from https://platform.openai.com/api-keys
2. Click the settings icon in the AI Assistant module
3. Paste your API key
4. Click "Save"

### Asking Questions

The AI is configured as an experienced DM running the Siege of Neverwinter. You can ask:

**Narrative Questions**:
- "Describe the scene as the red dragon attacks the eastern gate"
- "What do the defenders see from the walls at dawn?"
- "How do the citizens react to the siege?"

**Mechanical Questions**:
- "How does the grappled condition affect spellcasting?"
- "What's the DC for a dragon's breath weapon?"
- "Can a prone character make opportunity attacks?"

**Tactical Suggestions**:
- "What tactics would dragonborn champions use?"
- "How should I run a siege weapon attack?"
- "What are good encounter ideas for day 6?"

### Context Awareness

The AI receives context about:
- Current siege status
- Active combatants
- Location information

This helps it provide relevant, scenario-specific advice.

### Best Practices

- Be specific in your questions
- Ask follow-up questions for clarification
- Use it for inspiration, not as a replacement for your creativity
- The conversation history is maintained within your session

## Navigating the City Map

### Map Overview

The interactive map shows key locations in Neverwinter:
- **Castle Never**: Command center
- **Hall of Justice**: Temple district
- **Protector's Enclave**: Central marketplace
- **Eastern Gate**: Primary battle site
- **Harbor District**: Supply lines
- **Blacklake District**: Enemy-controlled area

### Location Status Colors

- **Green**: Controlled (safe, under defender control)
- **Yellow**: Contested (active fighting)
- **Red**: Enemy (overrun by Tiamat's forces)
- **Gray**: Destroyed (no longer functional)

### Viewing Location Details

1. Click on any location on the map
2. View:
   - Location name and description
   - Current status
   - Associated plot points
3. Click plot points to see details

### Adding Plot Points

1. Click "Add Plot Point" in the map module
2. Select a location
3. Enter:
   - Name (e.g., "Rescue Mission")
   - Description
   - Status (Active, Completed, Failed)
4. Plot points appear as markers on the map

### Updating Location Status

1. Click on a location
2. Click "Change Status"
3. Select new status
4. Use this to track how the siege progresses

### Sample Plot Points

After seeding, you'll have 5 plot points:
1. **Defend the Gate** (Eastern Gate) - Active
2. **Protect the Healers** (Hall of Justice) - Active
3. **Secure Supply Lines** (Harbor District) - Completed
4. **Rescue Trapped Citizens** (Blacklake District) - Active
5. **War Council** (Castle Never) - Active

## Module Management

### Showing/Hiding Modules

- Click the eye icon in any module's title bar
- Hidden modules can be shown from the main menu
- Your preferences are saved automatically

### Resizing Modules

- Hover over the corner of a module
- Drag to resize
- Useful for focusing on specific information

### Repositioning Modules

- Click and drag the title bar
- Arrange modules to suit your workflow
- Positions are saved automatically

### Recommended Layouts

**Combat Focus**:
- Initiative Tracker (large, center)
- Character Panel (right)
- Monster Database (left)
- Hide: Map, Siege Mechanics

**Siege Management**:
- Siege Mechanics (large, center)
- City Map (right)
- AI Assistant (bottom)
- Hide: Initiative Tracker

**Exploration**:
- City Map (large, center)
- Character Panel (right)
- AI Assistant (bottom)
- Hide: Initiative Tracker, Monster Database

## Tips and Best Practices

### Combat Management

1. **Pre-roll Initiative**: Add all combatants before starting combat
2. **Track Conditions**: Use the condition system instead of notes
3. **Monster Instances**: Create all instances at once with sequential names
4. **HP Updates**: Update HP immediately after damage/healing

### Siege Progression

1. **Daily Updates**: Update siege values at the start of each in-game day
2. **Note Everything**: Use siege notes to track important events
3. **Location Changes**: Update location status as the siege progresses
4. **Custom Metrics**: Track scenario-specific elements

### Session Management

1. **Auto-Save**: Data saves automatically, but use manual save before closing
2. **Backup**: Export campaign data periodically (future feature)
3. **New Campaign**: Use "Reset Campaign" to start fresh

### Performance Tips

1. **Close Unused Modules**: Hide modules you're not using
2. **Limit Instances**: Don't create more monster instances than needed
3. **Clear Old Data**: Remove defeated monsters from initiative tracker

### Narrative Integration

1. **Use AI for Inspiration**: Ask the AI for scene descriptions
2. **Plot Points as Quests**: Treat plot points as side quests
3. **Siege Notes as Journal**: Review notes to recap previous sessions
4. **Location Status as Story**: Let location changes drive narrative

### Common Workflows

**Starting a Combat Encounter**:
1. Create monster instances from database
2. Add all combatants to initiative tracker
3. Roll initiative for each
4. Click "Next Turn" to start

**Tracking Siege Progress**:
1. Update siege values based on events
2. Add note describing what happened
3. Update location status if areas change hands
4. Add/update plot points for new objectives

**Managing a Session**:
1. Review siege notes from last session
2. Check active plot points
3. Update character HP to full (if rested)
4. Prepare monster instances for planned encounters

## Troubleshooting

### Data Not Saving
- Check database connection in console
- Verify DATABASE_URL in .env file
- Try manual save button

### AI Assistant Not Responding
- Verify API key is entered correctly
- Check internet connection
- Check OpenAI API status

### Module Not Displaying
- Check if module is hidden (eye icon)
- Try refreshing the page
- Check browser console for errors

### Performance Issues
- Close unused modules
- Clear browser cache
- Reduce number of active combatants

## Keyboard Shortcuts

- **Ctrl/Cmd + S**: Manual save
- **Space**: Next turn (when initiative tracker focused)
- **Escape**: Close modal dialogs
- **Tab**: Navigate between fields in forms

## Support and Resources

### D&D 5e Resources
- Player's Handbook for rules
- Monster Manual for additional creatures
- Dungeon Master's Guide for siege rules

### Technical Support
- Check console for error messages
- Review TROUBLESHOOTING.md
- Check database connection with `npm run db:test`

## Appendix: Sample Party

The seeded database includes these 5 PCs:

1. **Theron Brightblade** - Paladin 10
   - AC 18, HP 85
   - Oath of Devotion, defender of Neverwinter

2. **Lyra Shadowstep** - Rogue 10
   - AC 16, HP 68
   - Arcane Trickster, infiltration specialist

3. **Grimnar Ironforge** - Fighter 10
   - AC 19, HP 98
   - Battle Master, tactical combat expert

4. **Elara Moonwhisper** - Wizard 10
   - AC 13, HP 52
   - Evocation specialist, battlefield control

5. **Brother Aldric** - Cleric 10
   - AC 17, HP 72
   - Life Domain, healer and support

---

**Good luck defending Neverwinter, Dungeon Master!**
