# Implementation Plan: Default Campaign Seeding

## Overview

This plan implements automatic default campaign seeding for the Siege of Neverwinter application. When the database contains no campaigns, the system creates a starter campaign with sample data including PCs, NPCs, monsters, locations, plot points, and siege state. The implementation uses JavaScript with PostgreSQL, integrating into the existing `database/init.js` initialization flow.

## Tasks

- [x] 1. Create seeding module structure and transaction handling
  - [x] 1.1 Create `database/seed-default-campaign.js` with logging utilities and module exports
    - Define logSuccess, logError, logInfo, logWarning functions with ANSI color codes
    - Export seedDefaultCampaign as the main entry point
    - _Requirements: 13.5, 14.4_
  - [x] 1.2 Implement `seedDefaultCampaign(pool)` main function with transaction lifecycle
    - Acquire client from pool, BEGIN transaction, COMMIT on success, ROLLBACK on failure
    - Release client in finally block
    - Return boolean indicating success/failure
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 14.4_
  - [x] 1.3 Implement `checkCampaignExists(client)` for idempotency check
    - Query campaigns table for "Siege of Neverwinter - Tutorial Campaign"
    - Return true if found, skip seeding; log info message when skipping
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 1.1, 1.2, 1.3_

- [x] 2. Implement campaign creation
  - [x] 2.1 Implement `createCampaign(client)` function
    - INSERT into campaigns with name, created_at, updated_at
    - Return campaign ID from RETURNING clause
    - Throw on failure (critical operation triggers rollback)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 11.5_

- [x] 3. Implement player character seeding
  - [x] 3.1 Implement `seedPlayerCharacters(client, campaignId)` function
    - Create at least 3 PCs with varied classes (Cleric, Fighter, Wizard, Rogue)
    - Set type to "PC", assign D&D 5e stats (name, class, level, AC, HP, saves)
    - Log individual failures as warnings but continue with remaining characters
    - Return count of successfully created PCs
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Implement NPC seeding
  - [x] 4.1 Implement `seedNPCs(client, campaignId)` function
    - Create at least 2 NPCs with role descriptions in notes field
    - Set type to "NPC", assign stats (name, role/class, AC, HP, saves)
    - Log individual failures as warnings but continue
    - Return count of successfully created NPCs
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. Implement monster template seeding
  - [x] 5.1 Implement `seedMonsterTemplates(client, campaignId)` function
    - Create at least 4 monster templates with complete stat blocks
    - Include varying CR levels (e.g., CR 1/2, CR 1, CR 2, CR 5)
    - Populate AC, HP formula, ability scores, attacks, abilities, lore
    - Log individual failures as warnings but continue
    - Return array of created monster IDs
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6. Implement monster instance seeding
  - [x] 6.1 Implement `seedMonsterInstances(client, campaignId, monsterIds)` function
    - Create at least 2 monster instances from templates
    - Create combatant entry with type "Monster" and calculated HP from formula
    - Link instance to template in monster_instances table
    - Assign unique instance names (e.g., "Orc Warrior 1")
    - Log individual failures as warnings but continue
    - Return count of successfully created instances
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7. Implement location seeding
  - [x] 7.1 Implement `seedLocations(client, campaignId)` function
    - Create at least 4 locations with different statuses (controlled, contested, enemy)
    - Assign name, status, description, and map coordinates (coord_x, coord_y, coord_width, coord_height)
    - Log individual failures as warnings but continue
    - Return array of created location IDs
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8. Implement plot point seeding
  - [x] 8.1 Implement `seedPlotPoints(client, locationIds)` function
    - Create at least 3 plot points linked to locations
    - Include different statuses (active, completed)
    - Assign name, description, status, and coordinates
    - Log individual failures as warnings but continue
    - Return count of successfully created plot points
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 9. Implement siege state seeding
  - [x] 9.1 Implement `seedSiegeState(client, campaignId)` function
    - Create siege state with wall_integrity, defender_morale, supplies at reasonable values
    - Set day_of_siege > 1 (e.g., 5)
    - Include at least 2 custom metrics in custom_metrics JSON (e.g., civilian_casualties, enemy_forces_remaining)
    - Return siege state ID
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 10. Implement siege notes seeding
  - [x] 10.1 Implement `seedSiegeNotes(client, siegeStateId)` function
    - Create at least 3 siege notes with chronological timestamps
    - Associate all notes with siege state ID
    - Include notes demonstrating different event types (combat, supply, morale)
    - Log individual failures as warnings but continue
    - Return count of successfully created notes
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 11. Integrate seeding with database initialization
  - [x] 11.1 Modify `database/init.js` to import and call seedDefaultCampaign
    - Import seedDefaultCampaign from './seed-default-campaign'
    - Call after applyOptimizations() and before performSanityChecks()
    - Log warning if seeding fails but continue initialization
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 12. Checkpoint - Verify core implementation
  - Ensure all seeding functions are implemented and integrated
  - Verify logging covers start, per-step counts, success summary, and errors with context
  - Confirm appropriate log levels (logInfo, logWarning, logError, logSuccess) are used throughout
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 13. Write integration tests for seeding
  - [ ] 13.1 Test seeding on empty database creates all entities
    - Clear campaigns, run seedDefaultCampaign, verify campaign + all entity types created with minimum counts
    - Verify data relationships (foreign keys valid)
    - _Requirements: 1.2, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1, 10.1_
  - [ ] 13.2 Test idempotency - running seeding twice does not create duplicates
    - Run seeding, run again, verify single campaign exists, verify skip message logged
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  - [ ] 13.3 Test transaction rollback on critical failure
    - Simulate campaign creation failure, verify no partial data remains in database
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  - [ ] 13.4 Test non-critical failure handling
    - Simulate individual entity creation failure, verify seeding continues and transaction commits
    - _Requirements: 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 10.5_

- [ ] 14. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The implementation uses JavaScript with the `pg` PostgreSQL client library
- All seeding functions follow the same error handling pattern: critical failures throw (triggering rollback), non-critical failures log warnings and continue
- The test file `database/seed-default-campaign.test.js` already contains some integration tests that can be extended
