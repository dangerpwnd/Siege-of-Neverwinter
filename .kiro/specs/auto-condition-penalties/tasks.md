# Implementation Plan: Auto Condition Penalties

## Overview

Implement automatic penalty display for D&D 5e conditions in the Siege of Neverwinter app. Four new client-side JS modules are created (penaltyRegistry, penaltyEngine, penaltyDisplay, penaltyIndicators) and two existing modules are modified (conditionManager, initiativeTracker). Each task builds incrementally, starting with the static data layer, then computation, then rendering, then integration.

## Tasks

- [-] 1. Create the Penalty Registry module
  - [x] 1.1 Create `client/js/penaltyRegistry.js` with penalty type constants, the frozen `CONDITION_PENALTIES` map for all 14 D&D 5e conditions, the `IMPLIED_CONDITIONS` map, and the public API functions: `getPenalties(conditionName)`, `getAllConditions()`, `getPenaltyTypes()`, `getImpliedConditions(conditionName)`
    - Export `PENALTY_TYPES` as a frozen object with the 12 penalty type constants
    - `getPenalties` returns an empty array and logs a warning for unknown/null/undefined condition names
    - `getImpliedConditions` returns the implied condition names array (e.g., stunned → ['incapacitated']) or an empty array
    - Penalty data for all 14 conditions must exactly match the SRD definitions from the design document
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.1–6.14_

  - [-] 1.2 Write property tests for the Penalty Registry
    - **Property 1: Registry completeness** — For any condition name in the 14 standard conditions, `getPenalties(condition)` returns a non-empty array
    - **Validates: Requirement 1.1**
    - **Property 2: Penalty structure validity** — For any penalty in any condition's list, it has a valid `type`, non-empty `mechanic`, and non-empty `description`
    - **Validates: Requirements 1.2, 1.3**
    - **Property 3: Penalty data round-trip** — For any condition, JSON serialize/deserialize produces a deep-equal penalty list
    - **Validates: Requirement 1.4**
    - Create test file at `tests/penaltyRegistry.test.js`
    - Use `fast-check` with minimum 100 iterations per property

  - [~] 1.3 Write unit tests for Penalty Registry SRD accuracy
    - One test per condition (14 tests) verifying exact penalty lists match the SRD definitions in the design
    - Test error handling: unknown condition returns empty array, null/undefined returns empty array
    - Add to `tests/penaltyRegistry.test.js`
    - _Requirements: 6.1–6.14_

- [ ] 2. Create the Penalty Engine module
  - [~] 2.1 Create `client/js/penaltyEngine.js` with the `PENALTY_CATEGORIES` frozen object and public API functions: `computeCompoundPenalties(conditionNames)`, `groupByCategory(compoundPenalties)`, `getImpliedConditionNotes(conditionNames)`
    - Import `getPenalties`, `getImpliedConditions`, and `PENALTY_TYPES` from `penaltyRegistry.js`
    - `computeCompoundPenalties` merges penalties from all input conditions, deduplicating by `(type, mechanic)` pair and tracking source conditions in a `sources` array
    - `groupByCategory` assigns each compound penalty to exactly one of the 5 categories using the category mapping from the design
    - `getImpliedConditionNotes` returns notes for implied conditions (e.g., stunned includes incapacitated) without adding phantom sources
    - Returns empty penalties object for empty input array
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 5.1, 5.3_

  - [~] 2.2 Write property tests for the Penalty Engine
    - **Property 5: Compound penalty correctness** — For any non-empty subset of conditions, exactly one entry per unique `(type, mechanic)` pair with correct `sources`
    - **Validates: Requirements 3.1, 3.2**
    - **Property 6: Category assignment completeness** — For any non-empty subset, every compound penalty is assigned to exactly one category with none omitted
    - **Validates: Requirement 3.5**
    - **Property 9: Implied conditions are notes only** — For any condition set, no phantom source conditions appear in `sources` arrays
    - **Validates: Requirement 5.3**
    - Create test file at `tests/penaltyEngine.test.js`
    - Use `fast-check` with minimum 100 iterations per property

  - [~] 2.3 Write unit tests for the Penalty Engine
    - Test compound computation with single condition, multiple conditions, overlapping penalties
    - Test empty input returns empty result
    - Test category grouping produces all 5 categories
    - Test implied condition notes for stunned, paralyzed, petrified, unconscious
    - Add to `tests/penaltyEngine.test.js`
    - _Requirements: 3.1, 3.2, 3.5, 5.1_

- [~] 3. Checkpoint — Verify data and computation layers
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Create the Penalty Display module
  - [~] 4.1 Create `client/js/penaltyDisplay.js` with public API functions: `renderPenaltiesForCondition(conditionName)`, `renderCompoundSummary(conditionNames)`, `renderImpliedNotes(conditionNames)`, `renderNoPenaltiesMessage()`
    - Import from `penaltyRegistry.js` and `penaltyEngine.js`
    - `renderPenaltiesForCondition` returns an HTML string with icon/label per penalty type and the description text for each penalty
    - `renderCompoundSummary` returns an HTML string with penalties grouped by category (attack modifiers, defense modifiers, saving throw effects, movement effects, action restrictions)
    - `renderImpliedNotes` returns HTML noting implied conditions and their penalties
    - `renderNoPenaltiesMessage` returns HTML with a "No active penalties" message
    - All rendered HTML must be accessible (appropriate ARIA attributes, semantic elements)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.4, 3.5, 5.1, 5.2_

  - [~] 4.2 Write property tests for Penalty Display
    - **Property 4: Rendered penalty completeness** — For any condition, `renderPenaltiesForCondition` output contains every penalty description from the registry
    - **Validates: Requirement 2.2**
    - **Property 7: Tooltip content completeness** — For any condition, `renderPenaltyTooltip` output contains the condition name and all penalty descriptions
    - **Validates: Requirement 4.2**
    - Create test file at `tests/penaltyDisplay.test.js`
    - Use `fast-check` with minimum 100 iterations per property

  - [~] 4.3 Write unit tests for Penalty Display
    - Test rendering for specific conditions (blinded, stunned) produces expected HTML structure
    - Test compound summary groups penalties correctly
    - Test no-conditions state shows "No active penalties" message
    - Test implied notes render for stunned→incapacitated
    - Add to `tests/penaltyDisplay.test.js`
    - _Requirements: 2.2, 2.4, 3.4, 5.1_

- [ ] 5. Create the Penalty Indicators module
  - [~] 5.1 Create `client/js/penaltyIndicators.js` with public API functions: `renderPenaltyIcons(conditionNames)`, `renderPenaltyTooltip(conditionName)`
    - Import from `penaltyRegistry.js`
    - `renderPenaltyIcons` returns compact HTML icons representing active penalty categories for a combatant; returns empty string when no conditions are active
    - `renderPenaltyTooltip` returns HTML tooltip content with the condition name and all penalty descriptions
    - Icons should use meaningful labels/aria-labels for accessibility
    - _Requirements: 4.1, 4.2, 4.3_

  - [~] 5.2 Write unit tests for Penalty Indicators
    - Test icons appear for combatants with conditions and disappear when conditions are removed
    - Test tooltip contains condition name and all penalty descriptions
    - Test empty conditions array returns empty string
    - Create test file at `tests/penaltyIndicators.test.js`
    - _Requirements: 4.1, 4.2, 4.3_

- [~] 6. Checkpoint — Verify all new modules and tests
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Integrate penalty display into Condition Manager
  - [~] 7.1 Modify `client/js/conditionManager.js` to import `penaltyDisplay` and wire penalty rendering into the existing `render()` function
    - Import `renderPenaltiesForCondition`, `renderCompoundSummary`, `renderImpliedNotes`, `renderNoPenaltiesMessage` from `penaltyDisplay.js`
    - In `render()`, call `renderCompoundSummary(activeConditionNames)` and insert the result above the individual condition list
    - In `render()`, call `renderPenaltiesForCondition(conditionName)` beneath each active condition name
    - In `render()`, call `renderImpliedNotes(activeConditionNames)` to show implied condition notes
    - When no conditions are active, call `renderNoPenaltiesMessage()` and display the result
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.3, 3.4, 5.1, 5.2_

- [ ] 8. Integrate penalty indicators into Initiative Tracker
  - [~] 8.1 Modify `client/js/initiativeTracker.js` to import `penaltyIndicators` and wire penalty icons into the existing `render()` function
    - Import `renderPenaltyIcons` and `renderPenaltyTooltip` from `penaltyIndicators.js`
    - In `render()`, call `renderPenaltyIcons(combatantConditions)` next to each combatant's name
    - In tooltip/hover handling, call `renderPenaltyTooltip(conditionName)` for tooltip content
    - When all conditions are removed, icons should no longer appear (handled by `renderPenaltyIcons` returning empty string)
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 9. Write condition interaction tests
  - [~] 9.1 Write property test for implied condition notes
    - **Property 8: Implied condition notes produced** — For any condition with implied conditions (stunned, paralyzed, petrified, unconscious), `getImpliedConditionNotes` returns at least one note
    - **Validates: Requirement 5.1**
    - Create test file at `tests/conditionInteractions.test.js`
    - Use `fast-check` with minimum 100 iterations

  - [~] 9.2 Write unit tests for condition interaction scenarios
    - Test implied condition note appears when stunned is applied, disappears when removed
    - Test independent removal: applying both stunned and incapacitated, removing stunned leaves incapacitated intact
    - Test implied conditions are NOT added to active condition list (notes only)
    - Add to `tests/conditionInteractions.test.js`
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [~] 10. Final checkpoint — Full integration verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate the 9 correctness properties from the design using `fast-check`
- Unit tests validate specific SRD data accuracy and edge cases
- All new modules are pure client-side JavaScript with no backend changes required
