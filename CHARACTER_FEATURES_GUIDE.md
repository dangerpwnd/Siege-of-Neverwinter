# Character Features and Enhancements

## Overview

The character panel now includes enhanced character information:
- **Race**: Character race and subrace from D&D 5e (organized by race family)
- **Class**: Character class from D&D 5e (Barbarian, Wizard, etc.)
- **Subclass**: Character subclass/archetype (dynamically populated based on class)
- **Background**: Character background (Entertainer, Acolyte, etc.)
- **Alignment**: Character alignment (Lawful Good, Chaotic Neutral, etc.)
- **Class & Racial Features**: Track special abilities, racial traits, and class features
- **Magical Items**: Track magical equipment and whether it requires attunement

## Database Changes

Added new columns to the `combatants` table:
- `race`: VARCHAR(100) - Character race/subrace
- `character_class`: VARCHAR(100) - Character class (now uses dropdown)
- `subclass`: VARCHAR(100) - Character subclass/archetype
- `background`: VARCHAR(100) - Character background
- `alignment`: VARCHAR(50) - Character alignment
- `features`: JSONB - Array of feature objects with `name` and `description`
- `magical_items`: JSONB - Array of item objects with `name`, `description`, and `attunement` flag

Migration files:
- `database/add-features-items.sql`
- `database/add-background-alignment.sql`
- `database/add-subclass.sql`
- `database/add-race.sql`

## Usage

### Creating/Editing Characters

When creating or editing a character, you can now specify:

**Race:**
Dropdown selection organized by race families with subraces:
- **Dragonborn**: Dragonborn
- **Dwarf**: Hill Dwarf, Mountain Dwarf, Duergar
- **Elf**: High Elf, Wood Elf, Dark Elf (Drow), Eladrin, Sea Elf, Shadar-kai
- **Gnome**: Forest Gnome, Rock Gnome, Deep Gnome
- **Half-Elf**: Half-Elf
- **Half-Orc**: Half-Orc
- **Halfling**: Lightfoot Halfling, Stout Halfling, Ghostwise Halfling
- **Human**: Human, Variant Human
- **Tiefling**: Tiefling
- **Aasimar**: Protector Aasimar, Scourge Aasimar, Fallen Aasimar
- **Firbolg**: Firbolg
- **Genasi**: Air Genasi, Earth Genasi, Fire Genasi, Water Genasi
- **Goliath**: Goliath
- **Kenku**: Kenku
- **Lizardfolk**: Lizardfolk
- **Tabaxi**: Tabaxi
- **Triton**: Triton

**Class:**
Dropdown selection with all 13 D&D 5e classes:
- Artificer, Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard

**Subclass:**
Dynamic dropdown that populates based on selected class. Includes all official subclasses from:
- Player's Handbook
- Xanathar's Guide to Everything
- Tasha's Cauldron of Everything
- Other official sources

Examples:
- Barbarian: Path of the Berserker, Path of the Totem Warrior, Path of the Zealot, etc.
- Wizard: School of Evocation, Bladesinging, Order of Scribes, etc.
- Fighter: Champion, Battle Master, Eldritch Knight, Echo Knight, etc.

**Background:**
Dropdown selection with 13 core D&D 5e backgrounds:
- Acolyte, Charlatan, Criminal, Entertainer, Folk Hero, Guild Artisan, Hermit, Noble, Outlander, Sage, Sailor, Soldier, Urchin

**Alignment:**
Dropdown selection with standard D&D alignments:
- Lawful Good, Neutral Good, Chaotic Good
- Lawful Neutral, True Neutral, Chaotic Neutral
- Lawful Evil, Neutral Evil, Chaotic Evil

**Features and Items:**
Add features and items using a simple text format:

**Features Format:**
```
Feature Name | Description
```

Example:
```
Rage | Enter a rage as a bonus action
Darkvision | See in dim light within 60 feet
Reckless Attack | Gain advantage on attacks but enemies have advantage against you
```

**Magical Items Format:**
```
Item Name | Description | Attunement (yes/no)
```

Example:
```
Flame Tongue | +2d6 fire damage | yes
Ring of Protection | +1 AC and saves
Cloak of Elvenkind | Advantage on Stealth checks | yes
```

### Display

Character information is displayed in the character detail view:
- **Header**: Shows character name with race, class/level (subclass), background, and alignment as badges
  - Example: "High Elf Fighter 5 (Battle Master)"
  - Race badge: Purple
  - Class badge: Blue
  - Background badge: Gray with border
  - Alignment badge: Light gray, italic
- **Features**: Show the name in bold with the description below
- **Items**: Show the name in bold with an "ATTUNEMENT" badge if required
- Empty sections show a placeholder message

## API Changes

### POST /api/characters
Added optional fields:
- `race`: String - Character race/subrace
- `character_class`: String - Character class
- `subclass`: String - Character subclass
- `background`: String - Character background
- `alignment`: String - Character alignment
- `features`: Array of `{ name: string, description: string }`
- `magical_items`: Array of `{ name: string, description: string, attunement: boolean }`

### PUT /api/characters/:id
Added optional fields:
- `race`: String - Character race/subrace
- `character_class`: String - Character class
- `subclass`: String - Character subclass
- `background`: String - Character background
- `alignment`: String - Character alignment
- `features`: Array of `{ name: string, description: string }`
- `magical_items`: Array of `{ name: string, description: string, attunement: boolean }`

## Styling

New CSS classes added to `client/styles/main.css`:
- `.character-info`: Container for character badges
- `.character-race`: Race badge styling (purple background)
- `.character-class`, `.character-background`, `.character-alignment`: Badge styling
- `.features-display`, `.items-display`: Container styling
- `.feature-list`, `.item-list`: List styling
- `.feature-item`, `.item-entry`: Individual item styling
- `.attunement-badge`: Badge for items requiring attunement
- `.no-features`, `.no-items`: Empty state styling
- `.form-group select`: Dropdown styling for race, class, background, and alignment selection
