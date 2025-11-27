# Database Models Implementation Summary

## Overview
This document summarizes the implementation of database schema and backend models for the Siege of Neverwinter application.

## Implemented Components

### 1. Database Schema (`database/schema.sql`)
The schema was already in place and includes:
- **campaigns** - Campaign management
- **combatants** - PCs, NPCs, and Monster instances
- **combatant_conditions** - Status effects on combatants
- **monsters** - Monster templates/database
- **monster_instances** - Links monsters to combatant instances
- **siege_state** - Siege mechanics tracking
- **siege_notes** - Timestamped siege notes
- **locations** - City map locations
- **plot_points** - Events/markers on locations
- **user_preferences** - UI preferences storage

**Indexes created for performance:**
- Campaign lookups
- Initiative ordering (DESC)
- Type filtering
- Foreign key relationships

### 2. Backend Models

#### Combatant Model (`server/models/Combatant.js`)
**Purpose:** Manages PCs, NPCs, and Monster instances in combat

**Key Methods:**
- `validate(data)` - Validates combatant data with comprehensive error checking
- `create(campaignId, data)` - Creates new combatant with validation
- `findById(id)` - Retrieves single combatant
- `findByCampaign(campaignId, type)` - Gets all combatants, optionally filtered by type
- `update(id, data)` - Updates combatant with partial validation
- `delete(id)` - Removes combatant
- `findByIdWithConditions(id)` - Gets combatant with active conditions
- `findByCampaignWithConditions(campaignId, type)` - Gets all combatants with conditions
- `addCondition(combatantId, condition)` - Applies status effect
- `removeCondition(combatantId, condition)` - Removes status effect
- `clearAllConditions(combatantId)` - Removes all conditions

**Validation:**
- Required fields: name, type, ac, current_hp, max_hp
- Type must be: PC, NPC, or Monster
- HP and AC must be non-negative
- Saving throws must be numbers
- PC-specific: class and level validation

#### Monster Model (`server/models/Monster.js`)
**Purpose:** Manages monster templates and creates combat instances

**Key Methods:**
- `validate(data)` - Validates monster stat blocks
- `create(campaignId, data)` - Creates monster template
- `findById(id)` - Retrieves monster template
- `findByCampaign(campaignId, filter)` - Gets all monsters with optional name filter
- `update(id, data)` - Updates monster template
- `delete(id)` - Removes monster template
- `createInstance(monsterId, instanceName, initiative)` - Creates combat-ready instance
  - Calculates HP from formula (e.g., "4d8+4")
  - Creates linked combatant entry
  - Calculates saving throws from stats
- `getInstances(monsterId)` - Gets all instances of a monster
- `getTemplateFromInstance(combatantId)` - Gets template from instance

**Validation:**
- Required fields: name, ac
- Stats must be 1-30
- JSONB fields: saves, skills, attacks, abilities
- Arrays: resistances, immunities

#### SiegeState Model (`server/models/SiegeState.js`)
**Purpose:** Tracks siege mechanics and notes

**Key Methods:**
- `validate(data)` - Validates siege values (0-100 ranges)
- `create(campaignId, data)` - Initializes siege state
- `findByCampaign(campaignId)` - Gets siege state
- `getOrCreate(campaignId)` - Gets or initializes siege state
- `update(campaignId, data)` - Updates siege values
- `updateValue(campaignId, key, value)` - Updates single value
- `addCustomMetric(campaignId, metricName, metricValue)` - Adds custom metric
- `removeCustomMetric(campaignId, metricName)` - Removes custom metric
- `addNote(campaignId, noteText)` - Adds timestamped note
- `getNotes(campaignId)` - Gets all notes
- `findByCampaignWithNotes(campaignId)` - Gets state with notes
- `deleteNote(noteId)` - Removes note
- `reset(campaignId)` - Resets to defaults

**Validation:**
- wall_integrity, defender_morale, supplies: 0-100
- day_of_siege: positive number
- custom_metrics: object

#### Location Model (`server/models/Location.js`)
**Purpose:** Manages city map locations

**Key Methods:**
- `validate(data)` - Validates location data
- `create(campaignId, data)` - Creates location
- `findById(id)` - Gets location
- `findByCampaign(campaignId)` - Gets all locations
- `update(id, data)` - Updates location
- `updateStatus(id, status)` - Updates location status
- `delete(id)` - Removes location
- `findByIdWithPlotPoints(id)` - Gets location with plot points
- `findByCampaignWithPlotPoints(campaignId)` - Gets all locations with plot points
- `findByStatus(campaignId, status)` - Filters by status

**Validation:**
- Required: name
- Status: controlled, contested, enemy, destroyed
- Coordinates: numbers

#### PlotPoint Model (`server/models/PlotPoint.js`)
**Purpose:** Manages plot points on locations

**Key Methods:**
- `validate(data)` - Validates plot point data
- `create(data)` - Creates plot point
- `findById(id)` - Gets plot point
- `findByLocation(locationId)` - Gets all plot points for location
- `findByCampaign(campaignId)` - Gets all plot points
- `update(id, data)` - Updates plot point
- `updateStatus(id, status)` - Updates status
- `delete(id)` - Removes plot point
- `findByStatus(campaignId, status)` - Filters by status
- `findByIdWithLocation(id)` - Gets plot point with location details

**Validation:**
- Required: name, location_id
- Status: active, completed, failed
- Coordinates: numbers

### 3. Database Migration (`database/migrate.js`)
Script to run schema.sql and initialize database:
```bash
npm run db:migrate
```

### 4. Model Index (`server/models/index.js`)
Exports all models for easy importing:
```javascript
const { Combatant, Monster, SiegeState, Location, PlotPoint } = require('./models');
```

## Testing

### Validation Tests (`__tests__/models.validation.test.js`)
Unit tests for validation logic (no database required):
- ✅ 16 tests passing
- Tests all model validation functions
- Verifies error handling for invalid data
- Confirms acceptance of valid data

### Property-Based Tests (`__tests__/models.property.test.js`)
Property tests using fast-check (requires database):
- **Property 1**: Combatant data completeness (Requirements 1.1)
- **Property 9**: Character data storage completeness (Requirements 2.5)
- **Property 14**: NPC data storage completeness (Requirements 4.1)
- Each property runs 100 iterations
- Tests automatically skip if database unavailable

**To run property tests:**
1. Install PostgreSQL
2. Create database: `siege_of_neverwinter`
3. Configure `.env` with DATABASE_URL
4. Run: `npm run db:migrate`
5. Run: `npm test`

## Requirements Coverage

✅ **Requirement 1.1** - Combatant storage with name, initiative, type
✅ **Requirement 2.5** - Character data storage (name, class, level)
✅ **Requirement 4.1** - NPC data storage (name, AC, HP, saves)
✅ **Requirement 5.2** - Monster stat block display
✅ **Requirement 6.3** - Siege mechanics tracking
✅ **Requirement 8.3** - Plot point storage with coordinates

## Key Features

1. **Comprehensive Validation** - All models include robust validation with detailed error messages
2. **Type Safety** - Strict type checking for all fields
3. **Cascade Deletes** - Database schema handles cleanup automatically
4. **Performance Indexes** - Optimized queries for common operations
5. **JSONB Support** - Flexible storage for complex data (saves, skills, custom metrics)
6. **Independent Instances** - Monster instances have separate HP tracking
7. **Condition Management** - Full support for D&D 5e conditions
8. **Spatial Data** - Coordinate support for map locations and plot points

## Next Steps

The models are ready for integration with:
- REST API routes (already exist in `server/routes/`)
- Frontend components
- Additional property-based tests for other requirements
- Integration tests for complete workflows
