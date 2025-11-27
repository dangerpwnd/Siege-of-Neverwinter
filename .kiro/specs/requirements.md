# Requirements Document

## Introduction

The Siege of Neverwinter application is a web-based D&D 5th edition campaign management tool designed to support a Dungeon Master running a siege scenario for a party of 5 adventurers. The system provides modular components for tracking initiative, managing character and NPC details, monitoring siege mechanics, integrating AI-powered DM assistance, and visualizing the city state during the siege. The application focuses on the specific narrative of Neverwinter under siege by the forces of Tiamat.

## Glossary

- **System**: The Siege of Neverwinter web application
- **DM**: Dungeon Master, the user running the game
- **PC**: Player Character, one of the 5 adventurers in the party
- **NPC**: Non-Player Character, allies or neutral characters controlled by the DM
- **Monster**: Enemy creatures, specifically forces of Tiamat in this scenario
- **Initiative Tracker**: A component that manages turn order in combat
- **Condition**: A status effect applied to characters (e.g., poisoned, stunned, prone)
- **Siege Mechanics**: Rules and tracking for large-scale battle elements
- **City State**: The current condition of Neverwinter during the siege
- **Plot Point**: A location or event marker on the city map
- **AI DM Assistant**: ChatGPT integration providing narrative and mechanical guidance

## Requirements

### Requirement 1

**User Story:** As a DM, I want to track initiative order for all combatants, so that I can manage turn-based combat efficiently during the siege.

#### Acceptance Criteria

1. WHEN the DM adds a combatant to the initiative tracker, THE System SHALL store the combatant's name, initiative value, and combatant type (PC, NPC, or Monster)
2. WHEN combatants are added to the tracker, THE System SHALL display them in descending order by initiative value
3. WHEN the DM advances the turn, THE System SHALL highlight the current active combatant
4. WHEN the DM removes a combatant from initiative, THE System SHALL update the tracker and maintain correct turn order
5. WHEN initiative values are modified, THE System SHALL automatically re-sort the tracker

### Requirement 2

**User Story:** As a DM, I want to view and manage detailed character information for PCs, so that I can quickly reference their capabilities and status during gameplay.

#### Acceptance Criteria

1. WHEN the DM views a PC's details, THE System SHALL display Armor Class, current Hit Points, maximum Hit Points, and saving throw modifiers
2. WHEN the DM updates a PC's current Hit Points, THE System SHALL persist the change and reflect it immediately in all relevant displays
3. WHEN a PC's Hit Points reach zero, THE System SHALL provide a visual indicator of the downed state
4. WHEN the DM views PC details, THE System SHALL display all active conditions affecting that character
5. WHEN the DM creates a PC, THE System SHALL store and display character name, class, level, and other identifying information for that PC

### Requirement 3

**User Story:** As a DM, I want to add and remove conditions from any combatant, so that I can accurately track status effects during combat.

#### Acceptance Criteria

1. WHEN the DM selects a combatant, THE System SHALL display a condition management interface
2. WHEN the DM adds a condition to a combatant, THE System SHALL append the condition to that combatant's active condition list with visual styling that contrasts with the current interface style
3. WHEN the DM removes a condition from a combatant, THE System SHALL delete the condition from the active list
4. WHEN a combatant has active conditions, THE System SHALL display condition indicators in the initiative tracker
5. WHEN the DM accesses the condition list, THE System SHALL provide standard D&D 5e conditions including blinded, charmed, deafened, frightened, grappled, incapacitated, invisible, paralyzed, petrified, poisoned, prone, restrained, stunned, and unconscious

### Requirement 4

**User Story:** As a DM, I want to manage NPC details separately from PCs, so that I can track allied and neutral characters involved in the siege.

#### Acceptance Criteria

1. WHEN the DM creates an NPC, THE System SHALL store the NPC's name, Armor Class, Hit Points, and saving throw modifiers
2. WHEN the DM views NPC details, THE System SHALL display the same information available for PCs
3. WHEN the DM adds conditions to an NPC, THE System SHALL apply the same condition management functionality as for PCs
4. THE System SHALL visually distinguish NPCs from PCs and Monsters in the initiative tracker
5. WHEN the DM deletes an NPC, THE System SHALL remove the NPC from all displays and the initiative tracker

### Requirement 5

**User Story:** As a DM, I want to access a monster database containing forces of Tiamat, so that I can quickly add enemies to encounters during the siege.

#### Acceptance Criteria

1. WHEN the DM accesses the monster section, THE System SHALL display a list of available Tiamat-aligned creatures
2. WHEN the DM views a monster entry, THE System SHALL display Armor Class, Hit Points, attack information, and special abilities
3. WHEN the DM adds a monster to an encounter, THE System SHALL create an instance with full stat block information
4. THE System SHALL allow multiple instances of the same monster type with independent Hit Point tracking
5. WHEN the DM populates the monster database, THE System SHALL persist monster data for future sessions

### Requirement 6

**User Story:** As a DM, I want to track siege-specific mechanics and notes, so that I can manage large-scale battle elements that affect the overall scenario.

#### Acceptance Criteria

1. WHEN the DM accesses siege mechanics, THE System SHALL display current siege status information
2. WHEN the DM adds a siege note, THE System SHALL store and display the note with timestamp
3. WHEN the DM accesses siege mechanics, THE System SHALL provide fields for tracking siege-specific resources such as wall integrity, defender morale, and supply levels
4. WHEN siege mechanics values are updated, THE System SHALL persist changes across sessions
5. THE System SHALL allow the DM to add custom siege mechanics relevant to the Neverwinter scenario

### Requirement 7

**User Story:** As a DM, I want to interact with an AI assistant powered by ChatGPT, so that I can receive narrative suggestions and mechanical guidance in the tone of a DM running this campaign.

#### Acceptance Criteria

1. WHEN the DM sends a message to the AI assistant, THE System SHALL transmit the message to the ChatGPT API with campaign-specific context
2. WHEN the ChatGPT API responds, THE System SHALL display the response in a conversational interface
3. THE System SHALL include a system prompt that establishes the AI's role as a DM for the Siege of Neverwinter campaign
4. THE System SHALL maintain conversation history within a session for contextual responses
5. WHEN the DM requests mechanical rulings or narrative suggestions, THE System SHALL format prompts to elicit DM-appropriate responses

### Requirement 8

**User Story:** As a DM, I want to view an interactive map of Neverwinter with marked locations and plot points, so that I can track the city's condition and manage location-based events during the siege.

#### Acceptance Criteria

1. WHEN the DM accesses the city map, THE System SHALL display a visual representation of Neverwinter
2. WHEN the DM clicks on a location, THE System SHALL display associated plot points and current status information
3. WHEN the DM adds a plot point to a location, THE System SHALL store the plot point with location coordinates and description
4. THE System SHALL allow the DM to update location status to reflect siege damage or changes in control
5. WHEN the DM views the map, THE System SHALL visually indicate areas under different conditions such as contested, controlled, or destroyed

### Requirement 9

**User Story:** As a DM, I want the application to have a modular architecture, so that I can show or hide different components based on what I need during gameplay.

#### Acceptance Criteria

1. WHEN the DM toggles a module's visibility, THE System SHALL show or hide that module without affecting other modules
2. THE System SHALL persist module visibility preferences across sessions
3. WHEN the DM accesses the application, THE System SHALL provide independent modules for initiative tracker, character details, NPC details, monster database, siege mechanics, AI assistant, and city map
4. WHEN modules are displayed, THE System SHALL arrange them in a responsive layout
5. THE System SHALL allow the DM to resize or reposition modules within the interface

### Requirement 10

**User Story:** As a DM, I want all game data to persist between sessions, so that I can continue the campaign without losing progress.

#### Acceptance Criteria

1. WHEN the DM closes the application, THE System SHALL save all character data, NPC data, monster instances, initiative state, and siege mechanics
2. WHEN the DM reopens the application, THE System SHALL restore the previous session state
3. WHEN data is saved, THE System SHALL store data in a backend database
4. WHEN data is modified, THE System SHALL persist changes to the database either automatically or through a manual save function
5. THE System SHALL provide an option to reset or start a new campaign session

### Requirement 11

**User Story:** As a DM, I want to configure the window layout with multiple column options and customize module placement, so that I can organize the interface to match my workflow and screen size.

#### Acceptance Criteria

1. WHEN the DM selects a layout configuration, THE System SHALL arrange modules in the chosen number of columns (2, 3, or 4 columns)
2. WHEN the DM drags a module to a new position, THE System SHALL update the module placement within the column layout
3. WHEN the DM expands a module, THE System SHALL increase the module width to span its entire column
4. WHEN the DM shrinks an expanded module, THE System SHALL restore the module to its default column width
5. THE System SHALL persist the selected layout configuration and module placements across sessions
