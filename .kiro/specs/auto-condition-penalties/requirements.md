# Requirements Document

## Introduction

The Auto Condition Penalties feature extends the existing Condition Manager in the Siege of Neverwinter application. Currently, the DM can add and remove D&D 5e conditions to combatants, but the mechanical effects of those conditions are not displayed or applied. This feature adds automatic penalty notation and application so the DM has immediate visibility into how each condition affects a combatant's attack rolls, ability checks, saving throws, movement, and other mechanical aspects during combat.

## Glossary

- **System**: The Siege of Neverwinter web application
- **DM**: Dungeon Master, the user running the game
- **Condition**: A D&D 5e status effect (blinded, charmed, deafened, frightened, grappled, incapacitated, invisible, paralyzed, petrified, poisoned, prone, restrained, stunned, unconscious)
- **Penalty**: A mechanical effect imposed by a condition, such as disadvantage on attack rolls or automatic failure on certain saving throws
- **Penalty_Registry**: A data structure mapping each D&D 5e condition to its defined mechanical penalties
- **Penalty_Display**: A UI component that shows the active penalties for a combatant
- **Combatant**: A PC, NPC, or Monster participating in combat via the initiative tracker
- **Disadvantage**: A D&D 5e mechanic where the attacker rolls two d20s and takes the lower result
- **Advantage**: A D&D 5e mechanic where the attacker rolls two d20s and takes the higher result
- **Compound_Penalty_Set**: The merged collection of all penalties from all active conditions on a single combatant

## Requirements

### Requirement 1: Condition Penalty Data Registry

**User Story:** As a DM, I want the system to know the mechanical penalties for each D&D 5e condition, so that penalties can be displayed and applied automatically.

#### Acceptance Criteria

1. THE Penalty_Registry SHALL define mechanical penalties for each of the 14 standard D&D 5e conditions: blinded, charmed, deafened, frightened, grappled, incapacitated, invisible, paralyzed, petrified, poisoned, prone, restrained, stunned, and unconscious
2. WHEN the DM queries a condition's penalties, THE Penalty_Registry SHALL return a structured list of penalty objects containing the penalty type, the affected mechanic, and a human-readable description
3. THE Penalty_Registry SHALL categorize each penalty into one of the following types: disadvantage_on_attack, advantage_against, auto_fail_save, auto_fail_check, speed_zero, incapacitated, cannot_take_actions, cannot_take_reactions, cannot_speak, advantage_on_attack, disadvantage_against, and descriptive_note
4. FOR ALL conditions in the Penalty_Registry, parsing the penalty list and formatting it back into a structured list SHALL produce an equivalent data structure (round-trip property)

### Requirement 2: Automatic Penalty Display on Condition Application

**User Story:** As a DM, I want to see the mechanical penalties immediately when a condition is applied to a combatant, so that I do not have to look up the rules manually.

#### Acceptance Criteria

1. WHEN the DM applies a condition to a combatant, THE Penalty_Display SHALL render the associated penalties beneath the condition name in the active conditions list within 100 milliseconds of the condition being added
2. WHEN the DM views a combatant's active conditions, THE Penalty_Display SHALL show each penalty with an icon or label indicating the penalty type and a short text description of the mechanical effect
3. WHEN the DM removes a condition from a combatant, THE Penalty_Display SHALL remove the associated penalties from the display
4. WHILE a combatant has no active conditions, THE Penalty_Display SHALL show a message indicating no active penalties

### Requirement 3: Compound Penalty Summary

**User Story:** As a DM, I want to see a consolidated summary of all penalties affecting a combatant from all active conditions, so that I can quickly assess the total impact during combat.

#### Acceptance Criteria

1. WHILE a combatant has one or more active conditions, THE System SHALL compute and display a Compound_Penalty_Set that merges penalties from all active conditions
2. WHEN multiple conditions impose the same penalty type on the same mechanic, THE Compound_Penalty_Set SHALL list that penalty once and note the contributing conditions
3. WHEN a condition is added or removed, THE System SHALL recompute the Compound_Penalty_Set for that combatant within 100 milliseconds
4. THE System SHALL display the Compound_Penalty_Set in a dedicated summary section above the individual condition details
5. WHEN the DM views the Compound_Penalty_Set, THE System SHALL group penalties by category: attack modifiers, defense modifiers, saving throw effects, movement effects, and action restrictions

### Requirement 4: Penalty Indicators in Initiative Tracker

**User Story:** As a DM, I want to see penalty indicators in the initiative tracker, so that I can quickly identify which combatants are mechanically impaired without opening their details.

#### Acceptance Criteria

1. WHILE a combatant has active conditions with penalties, THE System SHALL display compact penalty icons next to the combatant's name in the initiative tracker
2. WHEN the DM hovers over a penalty icon in the initiative tracker, THE System SHALL display a tooltip containing the penalty description and the source condition
3. WHEN all conditions are removed from a combatant, THE System SHALL remove all penalty icons from that combatant's initiative tracker entry

### Requirement 5: Condition Interaction Handling

**User Story:** As a DM, I want the system to handle conditions that imply other conditions, so that cascading effects are noted correctly.

#### Acceptance Criteria

1. WHEN the DM applies a condition that includes another condition as part of its effect (such as stunned including incapacitated, or unconscious including incapacitated), THE System SHALL display a note indicating the implied condition and its penalties
2. WHEN the DM removes a parent condition that implies a child condition, THE System SHALL remove the implied condition note from the Penalty_Display
3. THE System SHALL NOT automatically add the implied condition to the combatant's active condition list; the System SHALL only display a note about the implied penalties
4. WHEN the DM has independently applied both a parent condition and its implied child condition, THE System SHALL allow independent removal of each condition

### Requirement 6: Penalty Data Accuracy

**User Story:** As a DM, I want the penalty data to match the D&D 5e System Reference Document, so that I can trust the information during gameplay.

#### Acceptance Criteria

1. THE Penalty_Registry SHALL define the following penalties for the blinded condition: disadvantage on attack rolls, and attack rolls against the blinded creature have advantage
2. THE Penalty_Registry SHALL define the following penalties for the poisoned condition: disadvantage on attack rolls and disadvantage on ability checks
3. THE Penalty_Registry SHALL define the following penalties for the stunned condition: incapacitated, cannot move, automatic failure on Strength saving throws, automatic failure on Dexterity saving throws, and attack rolls against the stunned creature have advantage
4. THE Penalty_Registry SHALL define the following penalties for the prone condition: disadvantage on attack rolls, melee attack rolls against the prone creature have advantage, and ranged attack rolls against the prone creature from more than 5 feet away have disadvantage
5. THE Penalty_Registry SHALL define the following penalties for the paralyzed condition: incapacitated, cannot move, cannot speak, automatic failure on Strength saving throws, automatic failure on Dexterity saving throws, attack rolls against the paralyzed creature have advantage, and any attack that hits from within 5 feet is a critical hit
6. THE Penalty_Registry SHALL define the following penalties for the unconscious condition: incapacitated, cannot move, cannot speak, drops held items, falls prone, automatic failure on Strength saving throws, automatic failure on Dexterity saving throws, attack rolls against the unconscious creature have advantage, and any attack that hits from within 5 feet is a critical hit
7. THE Penalty_Registry SHALL define the following penalties for the restrained condition: speed becomes zero, disadvantage on attack rolls, attack rolls against the restrained creature have advantage, and disadvantage on Dexterity saving throws
8. THE Penalty_Registry SHALL define the following penalties for the frightened condition: disadvantage on ability checks and disadvantage on attack rolls while the source of fear is within line of sight
9. THE Penalty_Registry SHALL define the following penalties for the grappled condition: speed becomes zero
10. THE Penalty_Registry SHALL define the following penalties for the incapacitated condition: cannot take actions and cannot take reactions
11. THE Penalty_Registry SHALL define the following penalties for the charmed condition: cannot attack the charmer, and the charmer has advantage on social ability checks against the charmed creature
12. THE Penalty_Registry SHALL define the following penalties for the deafened condition: automatic failure on ability checks that require hearing
13. THE Penalty_Registry SHALL define the following penalties for the invisible condition: advantage on attack rolls, and attack rolls against the invisible creature have disadvantage
14. THE Penalty_Registry SHALL define the following penalties for the petrified condition: weight increases by a factor of ten, incapacitated, cannot move, cannot speak, unaware of surroundings, attack rolls against the petrified creature have advantage, automatic failure on Strength saving throws, automatic failure on Dexterity saving throws, and resistance to all damage
