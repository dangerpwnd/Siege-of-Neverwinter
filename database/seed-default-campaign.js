/**
 * Default Campaign Seeding Module
 * Automatically populates the database with a starter campaign when no campaigns exist
 */

// ANSI color codes for logging
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function logSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.cyan}ℹ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

/**
 * Check if the default campaign already exists
 * @param {Object} client - PostgreSQL client
 * @returns {Promise<boolean>} - True if campaign exists, false otherwise
 */
async function checkCampaignExists(client) {
  try {
    const result = await client.query(
      "SELECT id FROM campaigns WHERE name = $1",
      ["Siege of Neverwinter - Tutorial Campaign"]
    );
    return result.rows.length > 0;
  } catch (error) {
    logError(`Failed to check campaign existence: ${error.message}`);
    throw error;
  }
}

/**
 * Create the default campaign
 * @param {Object} client - PostgreSQL client
 * @returns {Promise<number>} - Campaign ID
 * @throws {Error} - Throws on failure (critical operation)
 */
async function createCampaign(client) {
  try {
    logInfo('Creating default campaign...');
    
    const result = await client.query(
      `INSERT INTO campaigns (name, created_at, updated_at) 
       VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
       RETURNING id`,
      ["Siege of Neverwinter - Tutorial Campaign"]
    );
    
    const campaignId = result.rows[0].id;
    logSuccess(`Campaign created with ID: ${campaignId}`);
    
    return campaignId;
  } catch (error) {
    logError(`Failed to create campaign: ${error.message}`);
    throw error; // Critical operation - throw to trigger rollback
  }
}

/**
 * Seed player character combatants
 * @param {Object} client - PostgreSQL client
 * @param {number} campaignId - Campaign ID
 * @returns {Promise<number>} - Count of successfully created PCs
 */
async function seedPlayerCharacters(client, campaignId) {
  logInfo('Seeding player characters...');
  
  const playerCharacters = [
    {
      name: "Elara Moonwhisper",
      character_class: "Cleric",
      level: 5,
      ac: 18,
      max_hp: 38,
      save_strength: 0,
      save_dexterity: 2,
      save_constitution: 1,
      save_intelligence: 0,
      save_wisdom: 5,
      save_charisma: 3,
      notes: "Life Domain cleric, healer and support"
    },
    {
      name: "Thorgrim Ironforge",
      character_class: "Fighter",
      level: 5,
      ac: 18,
      max_hp: 47,
      save_strength: 6,
      save_dexterity: 2,
      save_constitution: 5,
      save_intelligence: 0,
      save_wisdom: 1,
      save_charisma: 0,
      notes: "Battle Master fighter, tactical combatant"
    },
    {
      name: "Zephyr Starweaver",
      character_class: "Wizard",
      level: 5,
      ac: 13,
      max_hp: 28,
      save_intelligence: 6,
      save_wisdom: 4,
      save_strength: 0,
      save_dexterity: 2,
      save_constitution: 1,
      save_charisma: 0,
      notes: "Evocation wizard, specializes in area damage spells"
    },
    {
      name: "Lyra Shadowstep",
      character_class: "Rogue",
      level: 5,
      ac: 15,
      max_hp: 35,
      save_strength: 1,
      save_dexterity: 6,
      save_constitution: 2,
      save_intelligence: 3,
      save_wisdom: 1,
      save_charisma: 0,
      notes: "Arcane Trickster rogue, scout and infiltrator"
    }
  ];
  
  let successCount = 0;
  
  for (const pc of playerCharacters) {
    try {
      await client.query(
        `INSERT INTO combatants (
          campaign_id, name, type, character_class, level, initiative,
          ac, current_hp, max_hp, save_strength, save_dexterity,
          save_constitution, save_intelligence, save_wisdom, save_charisma, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          campaignId,
          pc.name,
          'PC',
          pc.character_class,
          pc.level,
          0, // initiative
          pc.ac,
          pc.max_hp, // current_hp starts at max
          pc.max_hp,
          pc.save_strength,
          pc.save_dexterity,
          pc.save_constitution,
          pc.save_intelligence,
          pc.save_wisdom,
          pc.save_charisma,
          pc.notes
        ]
      );
      
      successCount++;
      logSuccess(`Created PC: ${pc.name} (${pc.character_class})`);
      
    } catch (error) {
      logWarning(`Failed to create PC ${pc.name}: ${error.message}`);
      // Continue with remaining characters
    }
  }
  
  logSuccess(`Player characters seeded: ${successCount} created`);
  return successCount;
}
/**
 * Seed NPC combatants
 * @param {Object} client - PostgreSQL client
 * @param {number} campaignId - Campaign ID
 * @returns {Promise<number>} - Count of successfully created NPCs
 */
async function seedNPCs(client, campaignId) {
  logInfo('Seeding NPCs...');

  const npcs = [
    {
      name: "Lord Neverember",
      character_class: "Noble",
      ac: 15,
      max_hp: 27,
      save_strength: 1,
      save_dexterity: 1,
      save_constitution: 1,
      save_intelligence: 2,
      save_wisdom: 2,
      save_charisma: 3,
      notes: "Lord Protector of Neverwinter, quest giver and city leader"
    },
    {
      name: "Sergeant Mara Stonefist",
      character_class: "Guard Captain",
      ac: 17,
      max_hp: 45,
      save_strength: 4,
      save_dexterity: 2,
      save_constitution: 3,
      save_intelligence: 0,
      save_wisdom: 2,
      save_charisma: 1,
      notes: "Commander of the city guard, coordinates defense efforts"
    },
    {
      name: "Elden the Wise",
      character_class: "Sage",
      ac: 12,
      max_hp: 22,
      save_strength: -1,
      save_dexterity: 1,
      save_constitution: 0,
      save_intelligence: 5,
      save_wisdom: 4,
      save_charisma: 2,
      notes: "Ancient scholar with knowledge of siege tactics and history"
    }
  ];

  let successCount = 0;

  for (const npc of npcs) {
    try {
      await client.query(
        `INSERT INTO combatants (
          campaign_id, name, type, character_class, level, initiative,
          ac, current_hp, max_hp, save_strength, save_dexterity,
          save_constitution, save_intelligence, save_wisdom, save_charisma, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          campaignId,
          npc.name,
          'NPC',
          npc.character_class,
          null, // NPCs don't have levels
          0, // initiative
          npc.ac,
          npc.max_hp, // current_hp starts at max
          npc.max_hp,
          npc.save_strength,
          npc.save_dexterity,
          npc.save_constitution,
          npc.save_intelligence,
          npc.save_wisdom,
          npc.save_charisma,
          npc.notes
        ]
      );

      successCount++;
      logSuccess(`Created NPC: ${npc.name} (${npc.character_class})`);

    } catch (error) {
      logWarning(`Failed to create NPC ${npc.name}: ${error.message}`);
      // Continue with remaining NPCs
    }
  }

  logSuccess(`NPCs seeded: ${successCount} created`);
  return successCount;
}

/**
 * Seed monster templates
 * @param {Object} client - PostgreSQL client
 * @param {number} campaignId - Campaign ID
 * @returns {Promise<number[]>} - Array of created monster IDs
 */
async function seedMonsterTemplates(client, campaignId) {
  logInfo('Seeding monster templates...');

  const monsters = [
    {
      name: "Orc Warrior",
      ac: 13,
      hp_formula: "2d8+6",
      speed: "30 ft.",
      stat_str: 16,
      stat_dex: 12,
      stat_con: 16,
      stat_int: 7,
      stat_wis: 11,
      stat_cha: 10,
      saves: { strength: 5, constitution: 5 },
      skills: { intimidation: 2 },
      resistances: [],
      immunities: [],
      senses: "darkvision 60 ft.",
      languages: "Common, Orc",
      cr: "1/2",
      attacks: [
        {
          name: "Greataxe",
          bonus: 5,
          damage: "1d12+3",
          type: "slashing"
        },
        {
          name: "Javelin",
          bonus: 5,
          damage: "1d6+3",
          type: "piercing",
          range: "30/120 ft."
        }
      ],
      abilities: [
        {
          name: "Aggressive",
          description: "As a bonus action, the orc can move up to its speed toward a hostile creature it can see"
        }
      ],
      lore: "Orc warriors from the Many-Arrows tribe besieging Neverwinter. Fierce and relentless in battle."
    },
    {
      name: "Goblin Scout",
      ac: 15,
      hp_formula: "2d6",
      speed: "30 ft.",
      stat_str: 8,
      stat_dex: 14,
      stat_con: 10,
      stat_int: 10,
      stat_wis: 8,
      stat_cha: 8,
      saves: {},
      skills: { stealth: 6 },
      resistances: [],
      immunities: [],
      senses: "darkvision 60 ft.",
      languages: "Common, Goblin",
      cr: "1/4",
      attacks: [
        {
          name: "Scimitar",
          bonus: 4,
          damage: "1d6+2",
          type: "slashing"
        },
        {
          name: "Shortbow",
          bonus: 4,
          damage: "1d6+2",
          type: "piercing",
          range: "80/320 ft."
        }
      ],
      abilities: [
        {
          name: "Nimble Escape",
          description: "The goblin can take the Disengage or Hide action as a bonus action on each of its turns"
        }
      ],
      lore: "Goblin scouts serving as advance reconnaissance for the siege forces. Quick and sneaky."
    },
    {
      name: "Ogre Brute",
      ac: 11,
      hp_formula: "7d10+21",
      speed: "40 ft.",
      stat_str: 19,
      stat_dex: 8,
      stat_con: 16,
      stat_int: 5,
      stat_wis: 7,
      stat_cha: 7,
      saves: {},
      skills: {},
      resistances: [],
      immunities: [],
      senses: "darkvision 60 ft.",
      languages: "Common, Giant",
      cr: "2",
      attacks: [
        {
          name: "Greatclub",
          bonus: 6,
          damage: "2d8+4",
          type: "bludgeoning"
        },
        {
          name: "Javelin",
          bonus: 6,
          damage: "2d6+4",
          type: "piercing",
          range: "30/120 ft."
        }
      ],
      abilities: [],
      lore: "Massive ogres hired by the siege army to break down walls and gates. Incredibly strong but not very bright."
    },
    {
      name: "Cult Fanatic",
      ac: 13,
      hp_formula: "6d8+6",
      speed: "30 ft.",
      stat_str: 11,
      stat_dex: 14,
      stat_con: 12,
      stat_int: 10,
      stat_wis: 13,
      stat_cha: 14,
      saves: {},
      skills: { deception: 4, persuasion: 4, religion: 2 },
      resistances: [],
      immunities: [],
      senses: "passive Perception 11",
      languages: "Common",
      cr: "2",
      attacks: [
        {
          name: "Dagger",
          bonus: 4,
          damage: "1d4+2",
          type: "piercing"
        }
      ],
      abilities: [
        {
          name: "Dark Devotion",
          description: "The fanatic has advantage on saving throws against being charmed or frightened"
        },
        {
          name: "Spellcasting",
          description: "The fanatic is a 4th-level spellcaster. Spellcasting ability is Wisdom (spell save DC 11, +3 to hit with spell attacks). Prepared spells: cantrips (light, sacred flame, thaumaturgy), 1st level (command, inflict wounds, shield of faith), 2nd level (hold person, spiritual weapon)"
        }
      ],
      lore: "Fanatical cultists who have infiltrated the siege forces, seeking to spread chaos and dark magic within Neverwinter."
    },
    {
      name: "Hobgoblin Captain",
      ac: 17,
      hp_formula: "6d8+12",
      speed: "30 ft.",
      stat_str: 15,
      stat_dex: 14,
      stat_con: 14,
      stat_int: 12,
      stat_wis: 10,
      stat_cha: 13,
      saves: {},
      skills: {},
      resistances: [],
      immunities: [],
      senses: "darkvision 60 ft.",
      languages: "Common, Goblin",
      cr: "3",
      attacks: [
        {
          name: "Greatsword",
          bonus: 4,
          damage: "2d6+2",
          type: "slashing"
        },
        {
          name: "Javelin",
          bonus: 4,
          damage: "1d6+2",
          type: "piercing",
          range: "30/120 ft."
        }
      ],
      abilities: [
        {
          name: "Martial Advantage",
          description: "Once per turn, the hobgoblin can deal an extra 2d6 damage to a creature it hits with a weapon attack if that creature is within 5 feet of an ally that isn't incapacitated"
        },
        {
          name: "Leadership",
          description: "For 1 minute, the hobgoblin can utter a special command or warning whenever a nonhostile creature that it can see within 30 feet makes an attack roll or saving throw. The creature can add a d4 to its roll provided it can hear and understand the hobgoblin. A creature can benefit from only one Leadership die at a time. This effect ends if the hobgoblin is incapacitated"
        }
      ],
      lore: "Disciplined hobgoblin officers commanding the siege forces. Tactical and ruthless military leaders."
    }
  ];

  const createdMonsterIds = [];

  for (const monster of monsters) {
    try {
      const result = await client.query(
        `INSERT INTO monsters (
          campaign_id, name, ac, hp_formula, speed,
          stat_str, stat_dex, stat_con, stat_int, stat_wis, stat_cha,
          saves, skills, resistances, immunities, senses, languages, cr,
          attacks, abilities, lore
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        RETURNING id`,
        [
          campaignId,
          monster.name,
          monster.ac,
          monster.hp_formula,
          monster.speed,
          monster.stat_str,
          monster.stat_dex,
          monster.stat_con,
          monster.stat_int,
          monster.stat_wis,
          monster.stat_cha,
          JSON.stringify(monster.saves),
          JSON.stringify(monster.skills),
          monster.resistances,
          monster.immunities,
          monster.senses,
          monster.languages,
          monster.cr,
          JSON.stringify(monster.attacks),
          JSON.stringify(monster.abilities),
          monster.lore
        ]
      );

      const monsterId = result.rows[0].id;
      createdMonsterIds.push(monsterId);
      logSuccess(`Created monster template: ${monster.name} (CR ${monster.cr})`);

    } catch (error) {
      logWarning(`Failed to create monster template ${monster.name}: ${error.message}`);
      // Continue with remaining monsters
    }
  }

  logSuccess(`Monster templates seeded: ${createdMonsterIds.length} created`);
  return createdMonsterIds;
}

/**
 * Calculate HP from a dice formula
 * @param {string} formula - HP formula like "2d8+6"
 * @returns {number} - Calculated HP (using average roll)
 */
function calculateHP(formula) {
  if (!formula) return 10; // default
  
  // Parse formulas like "4d8+4" or "2d6"
  const match = formula.match(/(\d+)d(\d+)(?:\+(\d+))?/);
  if (match) {
    const numDice = parseInt(match[1]);
    const diceSize = parseInt(match[2]);
    const bonus = match[3] ? parseInt(match[3]) : 0;
    // Use average roll
    return Math.floor(numDice * (diceSize + 1) / 2) + bonus;
  }
  
  return 10; // fallback
}

/**
 * Calculate ability modifier from ability score
 * @param {number} score - Ability score
 * @returns {number} - Ability modifier
 */
function calcModifier(score) {
  return Math.floor((score - 10) / 2);
}

/**
 * Seed monster instances from templates
 * @param {Object} client - PostgreSQL client
 * @param {number} campaignId - Campaign ID
 * @param {number[]} monsterIds - Array of monster template IDs
 * @returns {Promise<number>} - Count of successfully created instances
 */
async function seedMonsterInstances(client, campaignId, monsterIds) {
  logInfo('Seeding monster instances...');
  
  if (!monsterIds || monsterIds.length === 0) {
    logWarning('No monster templates available for instance creation');
    return 0;
  }
  
  // Define which monsters to instantiate and how many of each
  const instancesToCreate = [
    { monsterIndex: 0, count: 2 }, // 2 Orc Warriors
    { monsterIndex: 1, count: 3 }, // 3 Goblin Scouts
    { monsterIndex: 2, count: 1 }, // 1 Ogre Brute
  ];
  
  let successCount = 0;
  
  for (const instanceDef of instancesToCreate) {
    const monsterId = monsterIds[instanceDef.monsterIndex];
    
    if (!monsterId) {
      logWarning(`Monster template at index ${instanceDef.monsterIndex} not found, skipping instances`);
      continue;
    }
    
    try {
      // Fetch monster template data
      const monsterResult = await client.query(
        'SELECT * FROM monsters WHERE id = $1',
        [monsterId]
      );
      
      if (monsterResult.rows.length === 0) {
        logWarning(`Monster template ${monsterId} not found in database`);
        continue;
      }
      
      const monster = monsterResult.rows[0];
      
      // Create multiple instances of this monster
      for (let i = 1; i <= instanceDef.count; i++) {
        try {
          // Calculate HP from formula
          const hp = calculateHP(monster.hp_formula);
          
          // Calculate saving throws from stats (use monster.saves if available, otherwise calculate from stats)
          const saves = monster.saves || {};
          const saveStrength = saves.strength !== undefined ? saves.strength : calcModifier(monster.stat_str);
          const saveDexterity = saves.dexterity !== undefined ? saves.dexterity : calcModifier(monster.stat_dex);
          const saveConstitution = saves.constitution !== undefined ? saves.constitution : calcModifier(monster.stat_con);
          const saveIntelligence = saves.intelligence !== undefined ? saves.intelligence : calcModifier(monster.stat_int);
          const saveWisdom = saves.wisdom !== undefined ? saves.wisdom : calcModifier(monster.stat_wis);
          const saveCharisma = saves.charisma !== undefined ? saves.charisma : calcModifier(monster.stat_cha);
          
          // Create unique instance name
          const instanceName = `${monster.name} ${i}`;
          
          // Create combatant entry
          const combatantResult = await client.query(
            `INSERT INTO combatants (
              campaign_id, name, type, character_class, level, initiative,
              ac, current_hp, max_hp, save_strength, save_dexterity,
              save_constitution, save_intelligence, save_wisdom, save_charisma, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING id`,
            [
              campaignId,
              instanceName,
              'Monster',
              null, // character_class not applicable for monsters
              null, // level not applicable for monsters
              0, // initiative
              monster.ac,
              hp, // current_hp
              hp, // max_hp
              saveStrength,
              saveDexterity,
              saveConstitution,
              saveIntelligence,
              saveWisdom,
              saveCharisma,
              `CR ${monster.cr} - ${monster.name}` // notes
            ]
          );
          
          const combatantId = combatantResult.rows[0].id;
          
          // Link instance to monster template
          await client.query(
            `INSERT INTO monster_instances (monster_id, combatant_id, instance_name)
             VALUES ($1, $2, $3)`,
            [monsterId, combatantId, instanceName]
          );
          
          successCount++;
          logSuccess(`Created monster instance: ${instanceName} (HP: ${hp}, AC: ${monster.ac})`);
          
        } catch (error) {
          logWarning(`Failed to create instance ${i} of ${monster.name} (monster_id: ${monsterId}, campaign_id: ${campaignId}): ${error.message}`);
          // Continue with remaining instances
        }
      }
      
    } catch (error) {
      logWarning(`Failed to process monster template (monster_id: ${monsterId}, campaign_id: ${campaignId}): ${error.message}`);
      // Continue with remaining monster types
    }
  }
  
  logSuccess(`Monster instances seeded: ${successCount} created`);
  return successCount;
}

/**
 * Seed campaign locations
 * @param {Object} client - PostgreSQL client
 * @param {number} campaignId - Campaign ID
 * @returns {Promise<number[]>} - Array of created location IDs
 */
async function seedLocations(client, campaignId) {
  logInfo('Seeding locations...');

  const locations = [
    {
      name: "Hall of Justice",
      status: "controlled",
      description: "Temple district stronghold, currently held by defenders. Houses clerics and provides healing to wounded soldiers.",
      coord_x: 150,
      coord_y: 200,
      coord_width: 80,
      coord_height: 60
    },
    {
      name: "Market Square",
      status: "contested",
      description: "Central marketplace now a battleground. Control shifts daily between defenders and attackers.",
      coord_x: 300,
      coord_y: 180,
      coord_width: 120,
      coord_height: 100
    },
    {
      name: "Eastern Gate",
      status: "enemy",
      description: "Main gate breached on day 3. Now controlled by orc forces who use it as a staging area for attacks.",
      coord_x: 500,
      coord_y: 250,
      coord_width: 70,
      coord_height: 90
    },
    {
      name: "Blacklake District",
      status: "controlled",
      description: "Residential area fortified by city guard. Civilians sheltering in basements and cellars.",
      coord_x: 100,
      coord_y: 350,
      coord_width: 150,
      coord_height: 120
    },
    {
      name: "Castle Never",
      status: "controlled",
      description: "Lord Neverember's fortress and command center. Heavily defended and serves as the last line of defense.",
      coord_x: 250,
      coord_y: 50,
      coord_width: 100,
      coord_height: 80
    },
    {
      name: "Docks District",
      status: "contested",
      description: "Harbor area under constant assault. Critical for receiving supplies from Waterdeep by sea.",
      coord_x: 450,
      coord_y: 400,
      coord_width: 140,
      coord_height: 90
    }
  ];

  const createdLocationIds = [];

  for (const location of locations) {
    try {
      const result = await client.query(
        `INSERT INTO locations (
          campaign_id, name, status, description,
          coord_x, coord_y, coord_width, coord_height
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id`,
        [
          campaignId,
          location.name,
          location.status,
          location.description,
          location.coord_x,
          location.coord_y,
          location.coord_width,
          location.coord_height
        ]
      );

      const locationId = result.rows[0].id;
      createdLocationIds.push(locationId);
      logSuccess(`Created location: ${location.name} (${location.status})`);

    } catch (error) {
      logWarning(`Failed to create location ${location.name}: ${error.message}`);
      // Continue with remaining locations
    }
  }

  logSuccess(`Locations seeded: ${createdLocationIds.length} created`);
  return createdLocationIds;
}

/**
 * Seed plot points linked to locations
 * @param {Object} client - PostgreSQL client
 * @param {number[]} locationIds - Array of location IDs
 * @returns {Promise<number>} - Count of successfully created plot points
 */
async function seedPlotPoints(client, locationIds) {
  logInfo('Seeding plot points...');

  if (!locationIds || locationIds.length === 0) {
    logWarning('No locations available for plot point creation');
    return 0;
  }

  // Define plot points with their associated location indices and statuses
  const plotPoints = [
    {
      locationIndex: 0, // Hall of Justice
      name: "Rescue the Clerics",
      description: "Several clerics are trapped in the Hall of Justice basement after a collapse. They are providing healing to wounded soldiers but running low on supplies.",
      status: "active",
      coord_x: 170,
      coord_y: 220
    },
    {
      locationIndex: 1, // Market Square
      name: "Secure the Supply Cache",
      description: "A hidden cache of weapons and food is located beneath the Market Square. Retrieve it before enemy forces discover its location.",
      status: "active",
      coord_x: 350,
      coord_y: 220
    },
    {
      locationIndex: 2, // Eastern Gate
      name: "Sabotage the Siege Engines",
      description: "Orc forces have set up siege engines near the Eastern Gate. Infiltrate their camp and destroy the engines to prevent further wall damage.",
      status: "active",
      coord_x: 520,
      coord_y: 280
    },
    {
      locationIndex: 3, // Blacklake District
      name: "Evacuate the Civilians",
      description: "Hundreds of civilians are trapped in the Blacklake District. Organize an evacuation to Castle Never before the district falls.",
      status: "completed",
      coord_x: 150,
      coord_y: 400
    },
    {
      locationIndex: 4, // Castle Never
      name: "Defend the Command Center",
      description: "Castle Never is under direct assault. Reinforce the defenses and protect Lord Neverember at all costs.",
      status: "active",
      coord_x: 280,
      coord_y: 80
    },
    {
      locationIndex: 5, // Docks District
      name: "Receive Supply Shipment",
      description: "A supply ship from Waterdeep is attempting to dock. Clear the docks of enemy forces and secure the shipment.",
      status: "completed",
      coord_x: 500,
      coord_y: 440
    }
  ];

  let successCount = 0;

  for (const plotPoint of plotPoints) {
    const locationId = locationIds[plotPoint.locationIndex];

    if (!locationId) {
      logWarning(`Location at index ${plotPoint.locationIndex} not found, skipping plot point: ${plotPoint.name}`);
      continue;
    }

    try {
      await client.query(
        `INSERT INTO plot_points (
          location_id, name, description, status, coord_x, coord_y
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          locationId,
          plotPoint.name,
          plotPoint.description,
          plotPoint.status,
          plotPoint.coord_x,
          plotPoint.coord_y
        ]
      );

      successCount++;
      logSuccess(`Created plot point: ${plotPoint.name} (${plotPoint.status})`);

    } catch (error) {
      logWarning(`Failed to create plot point ${plotPoint.name}: ${error.message}`);
      // Continue with remaining plot points
    }
  }

  logSuccess(`Plot points seeded: ${successCount} created`);
  return successCount;
}

/**
 * Seed siege state
 * @param {Object} client - PostgreSQL client
 * @param {number} campaignId - Campaign ID
 * @returns {Promise<number|null>} - Siege state ID or null on failure
 */
async function seedSiegeState(client, campaignId) {
  logInfo('Seeding siege state...');

  try {
    const result = await client.query(
      `INSERT INTO siege_state (
        campaign_id, wall_integrity, defender_morale, supplies,
        day_of_siege, custom_metrics, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING id`,
      [
        campaignId,
        85, // wall_integrity - showing some damage from siege
        70, // defender_morale - holding but under pressure
        60, // supplies - running low, critical situation
        5, // day_of_siege - siege has been ongoing for 5 days
        JSON.stringify({
          civilian_casualties: 120,
          enemy_forces_remaining: 450,
          reinforcements_expected: 3, // days until reinforcements arrive
          wall_breaches: 2 // number of breaches in the walls
        })
      ]
    );

    const siegeStateId = result.rows[0].id;
    logSuccess(`Siege state created with ID: ${siegeStateId} (Day ${5}, Wall: 85%, Morale: 70%, Supplies: 60%)`);

    return siegeStateId;

  } catch (error) {
    logWarning(`Failed to create siege state for campaign_id ${campaignId}: ${error.message}`);
    return null;
  }
}

/**
 * Seed siege notes
 * @param {Object} client - PostgreSQL client
 * @param {number} siegeStateId - Siege state ID
 * @returns {Promise<number>} - Count of successfully created notes
 */
async function seedSiegeNotes(client, siegeStateId) {
  logInfo('Seeding siege notes...');

  if (!siegeStateId) {
    logWarning('No siege state ID provided, skipping siege notes');
    return 0;
  }

  // Define siege notes demonstrating different event types
  // Notes are ordered chronologically (oldest to newest)
  const siegeNotes = [
    {
      note_text: "Day 3: Eastern Gate breached by ogre battering rams. Enemy forces pouring through. Defenders falling back to secondary positions.",
      // Older note - will be created first
    },
    {
      note_text: "Day 4: Supply convoy from Waterdeep intercepted by goblin scouts. Supplies now critical. Rationing implemented.",
      // Middle note
    },
    {
      note_text: "Day 5: Enemy catapults damaged the eastern wall section. Wall integrity decreased to 85%. Engineers working on emergency repairs.",
      // Recent note
    },
    {
      note_text: "Day 5: Cult fanatics spotted performing dark rituals near Market Square. Morale impact on defenders. Clerics dispatched to counter.",
      // Most recent note
    }
  ];

  let successCount = 0;

  for (const note of siegeNotes) {
    try {
      await client.query(
        `INSERT INTO siege_notes (siege_state_id, note_text, created_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)`,
        [siegeStateId, note.note_text]
      );

      successCount++;
      logSuccess(`Created siege note: ${note.note_text.substring(0, 50)}...`);

    } catch (error) {
      logWarning(`Failed to create siege note (siege_state_id: ${siegeStateId}, note: "${note.note_text.substring(0, 40)}..."): ${error.message}`);
      // Continue with remaining notes
    }
  }

  logSuccess(`Siege notes seeded: ${successCount} created`);
  return successCount;
}

/**
 * Main seeding function
 * @param {Object} pool - PostgreSQL connection pool
 * @returns {Promise<boolean>} - True if seeding completed successfully or was skipped, false on critical failure
 */
async function seedDefaultCampaign(pool) {
  logInfo('Starting default campaign seeding process...');
  
  const client = await pool.connect();
  
  try {
    // Begin transaction
    await client.query('BEGIN');
    logInfo('Transaction started');
    
    // Check if default campaign already exists (idempotency)
    const campaignExists = await checkCampaignExists(client);
    
    if (campaignExists) {
      await client.query('ROLLBACK');
      logInfo('Default campaign already exists, skipping seeding');
      return true;
    }
    
    logInfo('No default campaign found, proceeding with seeding...');
    
    // Create campaign (critical operation)
    const campaignId = await createCampaign(client);
    
    // Seed player characters
    const pcCount = await seedPlayerCharacters(client, campaignId);
    logInfo(`Created ${pcCount} player character${pcCount !== 1 ? 's' : ''}`);
    
    // Seed NPCs
    const npcCount = await seedNPCs(client, campaignId);
    logInfo(`Created ${npcCount} NPC${npcCount !== 1 ? 's' : ''}`);
    
    // Seed monster templates
    const monsterIds = await seedMonsterTemplates(client, campaignId);
    logInfo(`Created ${monsterIds.length} monster template${monsterIds.length !== 1 ? 's' : ''}`);
    
    // Seed monster instances
    const monsterInstanceCount = await seedMonsterInstances(client, campaignId, monsterIds);
    logInfo(`Created ${monsterInstanceCount} monster instance${monsterInstanceCount !== 1 ? 's' : ''}`);
    
    // Seed locations
    const locationIds = await seedLocations(client, campaignId);
    logInfo(`Created ${locationIds.length} location${locationIds.length !== 1 ? 's' : ''}`);
    
    // Seed plot points
    const plotPointCount = await seedPlotPoints(client, locationIds);
    logInfo(`Created ${plotPointCount} plot point${plotPointCount !== 1 ? 's' : ''}`);
    
    // Seed siege state
    const siegeStateId = await seedSiegeState(client, campaignId);
    logInfo(`Created ${siegeStateId ? 1 : 0} siege state`);
    
    // Seed siege notes
    const siegeNoteCount = await seedSiegeNotes(client, siegeStateId);
    logInfo(`Created ${siegeNoteCount} siege note${siegeNoteCount !== 1 ? 's' : ''}`);
    
    // Log success summary before committing
    logSuccess(`Default campaign seeding complete: ${pcCount} PCs, ${npcCount} NPCs, ${monsterIds.length} monster templates, ${monsterInstanceCount} monster instances, ${locationIds.length} locations, ${plotPointCount} plot points, ${siegeNoteCount} siege notes created`);
    
    // Commit transaction
    await client.query('COMMIT');
    
    return true;
    
  } catch (error) {
    // Rollback on any error
    try {
      await client.query('ROLLBACK');
      logWarning('Transaction rolled back due to error');
    } catch (rollbackError) {
      logError(`Failed to rollback transaction: ${rollbackError.message}`);
    }
    
    logError(`Default campaign seeding failed during transaction: ${error.message}`);
    logError(`Error stack: ${error.stack}`);
    
    return false;
    
  } finally {
    // Release client back to pool
    client.release();
  }
}

module.exports = {
  seedDefaultCampaign
};
