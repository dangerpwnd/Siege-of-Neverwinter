# API Documentation

Complete REST API reference for the Siege of Neverwinter application.

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Campaigns API](#campaigns-api)
5. [Combatants API](#combatants-api)
6. [Characters API](#characters-api)
7. [NPCs API](#npcs-api)
8. [Monsters API](#monsters-api)
9. [Initiative API](#initiative-api)
10. [Siege API](#siege-api)
11. [Locations API](#locations-api)
12. [Plot Points API](#plot-points-api)
13. [Preferences API](#preferences-api)

## Overview

### Base URL
```
http://localhost:3000/api
```

### Content Type
All requests and responses use JSON:
```
Content-Type: application/json
```

### Response Format

**Success Response**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

### HTTP Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible on localhost.

**Future Enhancement**: JWT-based authentication for multi-user support.

## Error Handling

### Error Response Structure

```json
{
  "success": false,
  "error": {
    "message": "Detailed error message",
    "code": "ERROR_CODE",
    "field": "fieldName"  // Optional, for validation errors
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Invalid input data
- `NOT_FOUND` - Resource not found
- `DATABASE_ERROR` - Database operation failed
- `INTERNAL_ERROR` - Unexpected server error

## Campaigns API

### Get All Campaigns

```http
GET /api/campaigns
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Default Campaign",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Get Campaign by ID

```http
GET /api/campaigns/:id
```

**Parameters**:
- `id` (path) - Campaign ID

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Default Campaign",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

### Create Campaign

```http
POST /api/campaigns
```

**Request Body**:
```json
{
  "name": "New Campaign"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "New Campaign",
    "created_at": "2024-01-15T11:00:00Z",
    "updated_at": "2024-01-15T11:00:00Z"
  }
}
```

### Delete Campaign

```http
DELETE /api/campaigns/:id
```

**Parameters**:
- `id` (path) - Campaign ID

**Response**:
```json
{
  "success": true,
  "message": "Campaign deleted successfully"
}
```

## Combatants API

### Get All Combatants

```http
GET /api/combatants?campaign_id=1
```

**Query Parameters**:
- `campaign_id` (required) - Campaign ID
- `type` (optional) - Filter by type: `PC`, `NPC`, or `Monster`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "campaign_id": 1,
      "name": "Theron Brightblade",
      "type": "PC",
      "initiative": 15,
      "ac": 18,
      "current_hp": 85,
      "max_hp": 85,
      "save_strength": 5,
      "save_dexterity": 1,
      "save_constitution": 5,
      "save_intelligence": 0,
      "save_wisdom": 4,
      "save_charisma": 6,
      "character_class": "Paladin",
      "level": 10,
      "notes": "Oath of Devotion paladin",
      "conditions": ["blessed"],
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Get Combatant by ID

```http
GET /api/combatants/:id
```

**Parameters**:
- `id` (path) - Combatant ID

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Theron Brightblade",
    "type": "PC",
    "initiative": 15,
    "ac": 18,
    "current_hp": 85,
    "max_hp": 85,
    "save_strength": 5,
    "save_dexterity": 1,
    "save_constitution": 5,
    "save_intelligence": 0,
    "save_wisdom": 4,
    "save_charisma": 6,
    "character_class": "Paladin",
    "level": 10,
    "notes": "Oath of Devotion paladin",
    "conditions": ["blessed"]
  }
}
```

### Create Combatant

```http
POST /api/combatants
```

**Request Body**:
```json
{
  "campaign_id": 1,
  "name": "New Character",
  "type": "PC",
  "initiative": 12,
  "ac": 16,
  "current_hp": 50,
  "max_hp": 50,
  "save_strength": 2,
  "save_dexterity": 4,
  "save_constitution": 3,
  "save_intelligence": 1,
  "save_wisdom": 2,
  "save_charisma": 0,
  "character_class": "Rogue",
  "level": 8,
  "notes": "Sneaky character"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 6,
    "campaign_id": 1,
    "name": "New Character",
    "type": "PC",
    ...
  }
}
```

### Update Combatant

```http
PUT /api/combatants/:id
```

**Parameters**:
- `id` (path) - Combatant ID

**Request Body** (partial update supported):
```json
{
  "current_hp": 45,
  "initiative": 14
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "current_hp": 45,
    "initiative": 14,
    ...
  }
}
```

### Delete Combatant

```http
DELETE /api/combatants/:id
```

**Parameters**:
- `id` (path) - Combatant ID

**Response**:
```json
{
  "success": true,
  "message": "Combatant deleted successfully"
}
```

### Add Condition to Combatant

```http
POST /api/combatants/:id/conditions
```

**Parameters**:
- `id` (path) - Combatant ID

**Request Body**:
```json
{
  "condition": "poisoned"
}
```

**Valid Conditions**:
- blinded, charmed, deafened, frightened
- grappled, incapacitated, invisible, paralyzed
- petrified, poisoned, prone, restrained
- stunned, unconscious

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "combatant_id": 1,
    "condition": "poisoned",
    "applied_at": "2024-01-15T12:00:00Z"
  }
}
```

### Remove Condition from Combatant

```http
DELETE /api/combatants/:id/conditions/:conditionId
```

**Parameters**:
- `id` (path) - Combatant ID
- `conditionId` (path) - Condition ID

**Response**:
```json
{
  "success": true,
  "message": "Condition removed successfully"
}
```

## Characters API

The Characters API is a specialized view of the Combatants API for PCs.

### Get All Characters

```http
GET /api/characters?campaign_id=1
```

**Query Parameters**:
- `campaign_id` (required) - Campaign ID

**Response**: Same as Combatants API, filtered to `type: 'PC'`

### Create Character

```http
POST /api/characters
```

**Request Body**: Same as Combatants API, `type` is automatically set to `'PC'`

## NPCs API

The NPCs API is a specialized view of the Combatants API for NPCs.

### Get All NPCs

```http
GET /api/npcs?campaign_id=1
```

**Query Parameters**:
- `campaign_id` (required) - Campaign ID

**Response**: Same as Combatants API, filtered to `type: 'NPC'`

### Create NPC

```http
POST /api/npcs
```

**Request Body**: Same as Combatants API, `type` is automatically set to `'NPC'`

## Monsters API

### Get All Monsters

```http
GET /api/monsters?campaign_id=1
```

**Query Parameters**:
- `campaign_id` (required) - Campaign ID
- `cr` (optional) - Filter by Challenge Rating

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "campaign_id": 1,
      "name": "Red Dragon Wyrmling",
      "ac": 17,
      "hp_formula": "10d8+30",
      "speed": "30 ft., climb 30 ft., fly 60 ft.",
      "stat_str": 19,
      "stat_dex": 10,
      "stat_con": 17,
      "stat_int": 12,
      "stat_wis": 11,
      "stat_cha": 15,
      "saves": {
        "dex": 2,
        "con": 5,
        "wis": 2,
        "cha": 4
      },
      "skills": {
        "perception": 4,
        "stealth": 2
      },
      "resistances": [],
      "immunities": ["fire"],
      "senses": "blindsight 10 ft., darkvision 60 ft.",
      "languages": "Draconic",
      "cr": "4",
      "attacks": [
        {
          "name": "Bite",
          "bonus": 6,
          "damage": "1d10+4",
          "type": "piercing",
          "description": "Melee Weapon Attack: +6 to hit, reach 5 ft."
        },
        {
          "name": "Fire Breath",
          "bonus": 0,
          "damage": "7d6",
          "type": "fire",
          "description": "Recharge 5-6. 15-foot cone, DC 13 Dex save."
        }
      ],
      "abilities": [],
      "lore": "Young red dragons serving Tiamat",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Get Monster by ID

```http
GET /api/monsters/:id
```

**Parameters**:
- `id` (path) - Monster ID

**Response**: Single monster object

### Create Monster

```http
POST /api/monsters
```

**Request Body**:
```json
{
  "campaign_id": 1,
  "name": "Custom Monster",
  "ac": 15,
  "hp_formula": "8d8+16",
  "speed": "30 ft.",
  "stat_str": 16,
  "stat_dex": 14,
  "stat_con": 14,
  "stat_int": 10,
  "stat_wis": 12,
  "stat_cha": 10,
  "saves": {},
  "skills": {},
  "resistances": [],
  "immunities": [],
  "senses": "darkvision 60 ft.",
  "languages": "Common",
  "cr": "3",
  "attacks": [
    {
      "name": "Longsword",
      "bonus": 5,
      "damage": "1d8+3",
      "type": "slashing",
      "description": "Melee Weapon Attack"
    }
  ],
  "abilities": [],
  "lore": "A custom creature"
}
```

**Response** (201 Created): Created monster object

### Update Monster

```http
PUT /api/monsters/:id
```

**Parameters**:
- `id` (path) - Monster ID

**Request Body**: Partial update supported

**Response**: Updated monster object

### Delete Monster

```http
DELETE /api/monsters/:id
```

**Parameters**:
- `id` (path) - Monster ID

**Response**:
```json
{
  "success": true,
  "message": "Monster deleted successfully"
}
```

### Create Monster Instance

```http
POST /api/monsters/:id/instances
```

**Parameters**:
- `id` (path) - Monster template ID

**Request Body**:
```json
{
  "instance_name": "Red Dragon Wyrmling 1",
  "initiative": 14
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "monster_instance_id": 1,
    "combatant_id": 10,
    "combatant": {
      "id": 10,
      "name": "Red Dragon Wyrmling 1",
      "type": "Monster",
      "initiative": 14,
      "ac": 17,
      "current_hp": 75,
      "max_hp": 75,
      ...
    }
  }
}
```

**Note**: HP is rolled automatically based on the monster's hp_formula.

## Initiative API

The Initiative API provides a specialized view for combat tracking.

### Get Initiative Order

```http
GET /api/initiative?campaign_id=1
```

**Query Parameters**:
- `campaign_id` (required) - Campaign ID

**Response**:
```json
{
  "success": true,
  "data": {
    "combatants": [
      {
        "id": 1,
        "name": "Theron Brightblade",
        "type": "PC",
        "initiative": 18,
        "ac": 18,
        "current_hp": 85,
        "max_hp": 85,
        "conditions": ["blessed"]
      },
      {
        "id": 5,
        "name": "Dragonclaw 1",
        "type": "Monster",
        "initiative": 15,
        "ac": 14,
        "current_hp": 33,
        "max_hp": 33,
        "conditions": []
      }
    ],
    "current_turn": 0
  }
}
```

**Note**: Combatants are automatically sorted by initiative (descending).

### Advance Turn

```http
POST /api/initiative/next-turn
```

**Request Body**:
```json
{
  "campaign_id": 1
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "current_turn": 1,
    "active_combatant": {
      "id": 5,
      "name": "Dragonclaw 1",
      "initiative": 15
    }
  }
}
```

## Siege API

### Get Siege State

```http
GET /api/siege?campaign_id=1
```

**Query Parameters**:
- `campaign_id` (required) - Campaign ID

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "campaign_id": 1,
    "wall_integrity": 90,
    "defender_morale": 85,
    "supplies": 75,
    "day_of_siege": 5,
    "custom_metrics": {
      "Dragon Sightings": 12,
      "Cult Infiltrators Captured": 8
    },
    "notes": [
      {
        "id": 1,
        "note_text": "Day 1: Tiamat's forces have surrounded Neverwinter.",
        "created_at": "2024-01-10T10:00:00Z"
      },
      {
        "id": 2,
        "note_text": "Day 2: First assault on the eastern gate repelled.",
        "created_at": "2024-01-11T10:00:00Z"
      }
    ],
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

### Update Siege State

```http
PUT /api/siege
```

**Request Body**:
```json
{
  "campaign_id": 1,
  "wall_integrity": 85,
  "defender_morale": 80,
  "supplies": 70,
  "day_of_siege": 6
}
```

**Validation**:
- All percentage values must be 0-100
- `day_of_siege` must be positive integer

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "wall_integrity": 85,
    "defender_morale": 80,
    "supplies": 70,
    "day_of_siege": 6,
    ...
  }
}
```

### Add Siege Note

```http
POST /api/siege/notes
```

**Request Body**:
```json
{
  "campaign_id": 1,
  "note_text": "Day 6: Dragon attack on western wall. Defenders holding strong."
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 6,
    "siege_state_id": 1,
    "note_text": "Day 6: Dragon attack on western wall. Defenders holding strong.",
    "created_at": "2024-01-16T10:00:00Z"
  }
}
```

### Update Custom Metrics

```http
PUT /api/siege/custom-metrics
```

**Request Body**:
```json
{
  "campaign_id": 1,
  "custom_metrics": {
    "Dragon Sightings": 15,
    "Cult Infiltrators Captured": 10,
    "Civilian Evacuations": 500
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "custom_metrics": {
      "Dragon Sightings": 15,
      "Cult Infiltrators Captured": 10,
      "Civilian Evacuations": 500
    }
  }
}
```

## Locations API

### Get All Locations

```http
GET /api/locations?campaign_id=1
```

**Query Parameters**:
- `campaign_id` (required) - Campaign ID
- `status` (optional) - Filter by status: `controlled`, `contested`, `enemy`, `destroyed`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "campaign_id": 1,
      "name": "Castle Never",
      "status": "controlled",
      "description": "The seat of Lord Neverember's power",
      "coord_x": 400,
      "coord_y": 300,
      "coord_width": 100,
      "coord_height": 100,
      "plot_points": [
        {
          "id": 5,
          "name": "War Council",
          "description": "Attend the daily strategy meeting",
          "status": "active",
          "coord_x": 430,
          "coord_y": 330
        }
      ],
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Get Location by ID

```http
GET /api/locations/:id
```

**Parameters**:
- `id` (path) - Location ID

**Response**: Single location object with plot points

### Update Location

```http
PUT /api/locations/:id
```

**Parameters**:
- `id` (path) - Location ID

**Request Body**:
```json
{
  "status": "contested",
  "description": "Heavy fighting ongoing"
}
```

**Response**: Updated location object

## Plot Points API

### Get All Plot Points

```http
GET /api/plotpoints?campaign_id=1
```

**Query Parameters**:
- `campaign_id` (required) - Campaign ID
- `location_id` (optional) - Filter by location
- `status` (optional) - Filter by status: `active`, `completed`, `failed`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "location_id": 4,
      "name": "Defend the Gate",
      "description": "Repel the dragonborn champion assault",
      "status": "active",
      "coord_x": 620,
      "coord_y": 380,
      "location": {
        "id": 4,
        "name": "Eastern Gate"
      },
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Create Plot Point

```http
POST /api/plotpoints
```

**Request Body**:
```json
{
  "location_id": 4,
  "name": "New Quest",
  "description": "Quest description",
  "status": "active",
  "coord_x": 650,
  "coord_y": 400
}
```

**Response** (201 Created): Created plot point object

### Update Plot Point

```http
PUT /api/plotpoints/:id
```

**Parameters**:
- `id` (path) - Plot point ID

**Request Body**:
```json
{
  "status": "completed"
}
```

**Response**: Updated plot point object

### Delete Plot Point

```http
DELETE /api/plotpoints/:id
```

**Parameters**:
- `id` (path) - Plot point ID

**Response**:
```json
{
  "success": true,
  "message": "Plot point deleted successfully"
}
```

## Preferences API

### Get Preferences

```http
GET /api/preferences?campaign_id=1
```

**Query Parameters**:
- `campaign_id` (required) - Campaign ID

**Response**:
```json
{
  "success": true,
  "data": {
    "module_visibility": {
      "initiative_tracker": true,
      "character_panel": true,
      "npc_panel": false,
      "monster_database": true,
      "siege_mechanics": true,
      "ai_assistant": false,
      "city_map": true
    },
    "module_positions": {
      "initiative_tracker": { "x": 10, "y": 10, "width": 400, "height": 600 }
    }
  }
}
```

### Update Preferences

```http
PUT /api/preferences
```

**Request Body**:
```json
{
  "campaign_id": 1,
  "preference_key": "module_visibility",
  "preference_value": {
    "initiative_tracker": true,
    "character_panel": true,
    "npc_panel": true,
    "monster_database": true,
    "siege_mechanics": true,
    "ai_assistant": true,
    "city_map": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "campaign_id": 1,
    "preference_key": "module_visibility",
    "preference_value": { ... },
    "updated_at": "2024-01-15T12:00:00Z"
  }
}
```

## Rate Limiting

Currently, no rate limiting is implemented. For production use, consider implementing rate limiting to prevent abuse.

## Pagination

For endpoints that return lists, pagination is not currently implemented. All results are returned in a single response. For large datasets, consider implementing pagination:

```http
GET /api/monsters?campaign_id=1&page=1&limit=20
```

## Versioning

The API is currently unversioned. Future versions may use URL versioning:

```
/api/v1/combatants
/api/v2/combatants
```

## WebSocket Support

Real-time updates are not currently supported. Future enhancement may include WebSocket support for:
- Real-time initiative updates
- Live HP changes
- Collaborative DM features

## Testing the API

### Using curl

```bash
# Get all combatants
curl http://localhost:3000/api/combatants?campaign_id=1

# Create a combatant
curl -X POST http://localhost:3000/api/combatants \
  -H "Content-Type: application/json" \
  -d '{"campaign_id":1,"name":"Test","type":"PC","ac":15,"current_hp":50,"max_hp":50}'

# Update HP
curl -X PUT http://localhost:3000/api/combatants/1 \
  -H "Content-Type: application/json" \
  -d '{"current_hp":45}'
```

### Using Postman

1. Import the API endpoints
2. Set base URL to `http://localhost:3000/api`
3. Create requests for each endpoint
4. Test with sample data

### Using JavaScript fetch

```javascript
// Get combatants
const response = await fetch('http://localhost:3000/api/combatants?campaign_id=1');
const data = await response.json();

// Create combatant
const response = await fetch('http://localhost:3000/api/combatants', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    campaign_id: 1,
    name: 'New Character',
    type: 'PC',
    ac: 16,
    current_hp: 50,
    max_hp: 50
  })
});
```

---

**API Version**: 1.0.0  
**Last Updated**: January 2024
