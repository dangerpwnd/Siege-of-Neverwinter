/**
 * Seed Script for Siege of Neverwinter
 * 
 * This script populates the database with:
 * - Sample party of 5 PCs
 * - Tiamat forces monsters
 * - Initial siege state and notes
 * - Sample locations and plot points
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Sample PCs for the party of 5
const samplePCs = [
  {
    name: 'Theron Brightblade',
    type: 'PC',
    character_class: 'Paladin',
    level: 10,
    ac: 18,
    max_hp: 85,
    current_hp: 85,
    save_strength: 5,
    save_dexterity: 1,
    save_constitution: 5,
    save_intelligence: 0,
    save_wisdom: 4,
    save_charisma: 6,
    notes: 'Oath of Devotion paladin, defender of Neverwinter'
  },
  {
    name: 'Lyra Shadowstep',
    type: 'PC',
    character_class: 'Rogue',
    level: 10,
    ac: 16,
    max_hp: 68,
    current_hp: 68,
    save_strength: 1,
    save_dexterity: 8,
    save_constitution: 2,
    save_intelligence: 5,
    save_wisdom: 3,
    save_charisma: 1,
    notes: 'Arcane Trickster, expert in infiltration and sabotage'
  },
  {
    name: 'Grimnar Ironforge',
    type: 'PC',
    character_class: 'Fighter',
    level: 10,
    ac: 19,
    max_hp: 98,
    current_hp: 98,
    save_strength: 7,
    save_dexterity: 3,
    save_constitution: 6,
    save_intelligence: 0,
    save_wisdom: 2,
    save_charisma: 0,
    notes: 'Battle Master fighter, tactical combat specialist'
  },
  {
    name: 'Elara Moonwhisper',
    type: 'PC',
    character_class: 'Wizard',
    level: 10,
    ac: 13,
    max_hp: 52,
    current_hp: 52,
    save_strength: 0,
    save_dexterity: 3,
    save_constitution: 2,
    save_intelligence: 8,
    save_wisdom: 5,
    save_charisma: 1,
    notes: 'Evocation wizard, specializes in battlefield control'
  },
  {
    name: 'Brother Aldric',
    type: 'PC',
    character_class: 'Cleric',
    level: 10,
    ac: 17,
    max_hp: 72,
    current_hp: 72,
    save_strength: 2,
    save_dexterity: 1,
    save_constitution: 3,
    save_intelligence: 1,
    save_wisdom: 8,
    save_charisma: 5,
    notes: 'Life Domain cleric, healer and support specialist'
  }
];

// Tiamat forces monsters
const tiamataForces = [
  {
    name: 'Cult Fanatic',
    ac: 13,
    hp_formula: '6d8+6',
    speed: '30 ft.',
    stat_str: 11,
    stat_dex: 14,
    stat_con: 12,
    stat_int: 10,
    stat_wis: 13,
    stat_cha: 14,
    saves: { wis: 3, cha: 4 },
    skills: { deception: 4, persuasion: 4, religion: 2 },
    resistances: [],
    immunities: [],
    senses: 'passive Perception 11',
    languages: 'Common, Draconic',
    cr: '2',
    attacks: [
      {
        name: 'Multiattack',
        bonus: 0,
        damage: '',
        type: 'special',
        description: 'The fanatic makes two melee attacks.'
      },
      {
        name: 'Dagger',
        bonus: 4,
        damage: '1d4+2',
        type: 'piercing',
        description: 'Melee or Ranged Weapon Attack: +4 to hit, reach 5 ft. or range 20/60 ft.'
      }
    ],
    abilities: [
      {
        name: 'Dark Devotion',
        description: 'The fanatic has advantage on saving throws against being charmed or frightened.'
      },
      {
        name: 'Spellcasting',
        description: 'The fanatic is a 4th-level spellcaster. Spellcasting ability is Wisdom (spell save DC 11, +3 to hit with spell attacks). Prepared spells: cantrips (light, sacred flame, thaumaturgy), 1st level (command, inflict wounds, shield of faith), 2nd level (hold person, spiritual weapon).'
      }
    ],
    lore: 'Fanatical cultists devoted to Tiamat, leading the siege forces.'
  },
  {
    name: 'Red Dragon Wyrmling',
    ac: 17,
    hp_formula: '10d8+30',
    speed: '30 ft., climb 30 ft., fly 60 ft.',
    stat_str: 19,
    stat_dex: 10,
    stat_con: 17,
    stat_int: 12,
    stat_wis: 11,
    stat_cha: 15,
    saves: { dex: 2, con: 5, wis: 2, cha: 4 },
    skills: { perception: 4, stealth: 2 },
    resistances: [],
    immunities: ['fire'],
    senses: 'blindsight 10 ft., darkvision 60 ft., passive Perception 14',
    languages: 'Draconic',
    cr: '4',
    attacks: [
      {
        name: 'Bite',
        bonus: 6,
        damage: '1d10+4',
        type: 'piercing',
        description: 'Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Plus 1d6 fire damage.'
      },
      {
        name: 'Fire Breath',
        bonus: 0,
        damage: '7d6',
        type: 'fire',
        description: 'Recharge 5-6. The dragon exhales fire in a 15-foot cone. Each creature in that area must make a DC 13 Dexterity saving throw, taking 24 (7d6) fire damage on a failed save, or half as much damage on a successful one.'
      }
    ],
    abilities: [],
    lore: 'Young red dragons serving Tiamat, leading aerial assaults on the city walls.'
  },
  {
    name: 'Dragonborn Champion',
    ac: 16,
    hp_formula: '11d8+33',
    speed: '30 ft.',
    stat_str: 18,
    stat_dex: 12,
    stat_con: 16,
    stat_int: 10,
    stat_wis: 12,
    stat_cha: 14,
    saves: { str: 7, con: 6 },
    skills: { athletics: 7, intimidation: 5 },
    resistances: ['fire'],
    immunities: [],
    senses: 'passive Perception 11',
    languages: 'Common, Draconic',
    cr: '5',
    attacks: [
      {
        name: 'Multiattack',
        bonus: 0,
        damage: '',
        type: 'special',
        description: 'The champion makes three melee attacks.'
      },
      {
        name: 'Greatsword',
        bonus: 7,
        damage: '2d6+4',
        type: 'slashing',
        description: 'Melee Weapon Attack: +7 to hit, reach 5 ft., one target.'
      },
      {
        name: 'Fire Breath',
        bonus: 0,
        damage: '3d6',
        type: 'fire',
        description: 'Recharge 5-6. The champion exhales fire in a 15-foot cone. Each creature in that area must make a DC 13 Dexterity saving throw, taking 10 (3d6) fire damage on a failed save, or half as much damage on a successful one.'
      }
    ],
    abilities: [
      {
        name: 'Action Surge',
        description: 'Once per short rest, the champion can take an additional action on their turn.'
      },
      {
        name: 'Second Wind',
        description: 'Once per short rest, the champion can use a bonus action to regain 1d10+5 hit points.'
      }
    ],
    lore: 'Elite dragonborn warriors, champions of Tiamat leading ground forces.'
  },
  {
    name: 'Kobold Inventor',
    ac: 12,
    hp_formula: '3d6',
    speed: '30 ft.',
    stat_str: 7,
    stat_dex: 15,
    stat_con: 10,
    stat_int: 14,
    stat_wis: 9,
    stat_cha: 8,
    saves: {},
    skills: { perception: 1 },
    resistances: [],
    immunities: [],
    senses: 'darkvision 60 ft., passive Perception 11',
    languages: 'Common, Draconic',
    cr: '1/4',
    attacks: [
      {
        name: 'Dagger',
        bonus: 4,
        damage: '1d4+2',
        type: 'piercing',
        description: 'Melee or Ranged Weapon Attack: +4 to hit, reach 5 ft. or range 20/60 ft.'
      },
      {
        name: 'Alchemical Fire',
        bonus: 4,
        damage: '2d6',
        type: 'fire',
        description: 'Ranged Weapon Attack: +4 to hit, range 30 ft., one target. The target takes 2d6 fire damage and catches fire, taking 1d6 fire damage at the start of each of its turns until it uses an action to extinguish the flames.'
      }
    ],
    abilities: [
      {
        name: 'Pack Tactics',
        description: 'The kobold has advantage on attack rolls against a creature if at least one of the kobold\'s allies is within 5 feet of the creature and the ally isn\'t incapacitated.'
      },
      {
        name: 'Sunlight Sensitivity',
        description: 'While in sunlight, the kobold has disadvantage on attack rolls and Wisdom (Perception) checks that rely on sight.'
      }
    ],
    lore: 'Cunning kobold engineers creating siege weapons and traps for Tiamat\'s forces.'
  },
  {
    name: 'Abishai (Red)',
    ac: 19,
    hp_formula: '13d8+52',
    speed: '30 ft., fly 50 ft.',
    stat_str: 19,
    stat_dex: 16,
    stat_con: 19,
    stat_int: 14,
    stat_wis: 15,
    stat_cha: 18,
    saves: { str: 8, con: 8, wis: 6 },
    skills: { intimidation: 8, perception: 6 },
    resistances: ['cold', 'bludgeoning, piercing, and slashing from nonmagical attacks'],
    immunities: ['fire', 'poison'],
    senses: 'darkvision 120 ft., passive Perception 16',
    languages: 'Draconic, Infernal, telepathy 120 ft.',
    cr: '9',
    attacks: [
      {
        name: 'Multiattack',
        bonus: 0,
        damage: '',
        type: 'special',
        description: 'The abishai makes three attacks: one with its morningstar, one with its claw, and one with its bite.'
      },
      {
        name: 'Morningstar',
        bonus: 8,
        damage: '1d8+4',
        type: 'piercing',
        description: 'Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Plus 3d6 fire damage.'
      },
      {
        name: 'Claw',
        bonus: 8,
        damage: '1d6+4',
        type: 'slashing',
        description: 'Melee Weapon Attack: +8 to hit, reach 5 ft., one target.'
      },
      {
        name: 'Bite',
        bonus: 8,
        damage: '1d10+4',
        type: 'piercing',
        description: 'Melee Weapon Attack: +8 to hit, reach 5 ft., one target.'
      }
    ],
    abilities: [
      {
        name: 'Devil\'s Sight',
        description: 'Magical darkness doesn\'t impede the abishai\'s darkvision.'
      },
      {
        name: 'Magic Resistance',
        description: 'The abishai has advantage on saving throws against spells and other magical effects.'
      },
      {
        name: 'Incite Fanaticism',
        description: 'As a bonus action, the abishai can inspire creatures within 60 feet that can see or hear it. Until the start of the abishai\'s next turn, each affected creature gains advantage on attack rolls and saving throws.'
      }
    ],
    lore: 'Powerful devil commanders serving Tiamat, leading the most dangerous assaults.'
  },
  {
    name: 'Dragonclaw',
    ac: 14,
    hp_formula: '5d8+5',
    speed: '30 ft.',
    stat_str: 14,
    stat_dex: 15,
    stat_con: 12,
    stat_int: 10,
    stat_wis: 11,
    stat_cha: 12,
    saves: { wis: 2 },
    skills: { deception: 3, stealth: 4 },
    resistances: [],
    immunities: [],
    senses: 'passive Perception 10',
    languages: 'Common, Draconic',
    cr: '1',
    attacks: [
      {
        name: 'Multiattack',
        bonus: 0,
        damage: '',
        type: 'special',
        description: 'The dragonclaw makes two scimitar attacks.'
      },
      {
        name: 'Scimitar',
        bonus: 4,
        damage: '1d6+2',
        type: 'slashing',
        description: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target.'
      }
    ],
    abilities: [
      {
        name: 'Dragon Fanatic',
        description: 'The dragonclaw has advantage on saving throws against being charmed or frightened. While the dragonclaw can see a dragon or higher-ranking Cult of the Dragon cultist friendly to it, the dragonclaw ignores the effects of being charmed or frightened.'
      },
      {
        name: 'Pack Tactics',
        description: 'The dragonclaw has advantage on attack rolls against a creature if at least one of the dragonclaw\'s allies is within 5 feet of the creature and the ally isn\'t incapacitated.'
      }
    ],
    lore: 'Trained cult warriors forming the backbone of Tiamat\'s ground forces.'
  }
];

// Sample siege notes
const siegeNotes = [
  'Day 1: Tiamat\'s forces have surrounded Neverwinter. Red dragon wyrmlings spotted circling the walls.',
  'Day 2: First assault on the eastern gate repelled. Wall integrity holding at 95%.',
  'Day 3: Cult fanatics attempting to infiltrate through the sewers. Increased patrols ordered.',
  'Day 4: Dragonborn champions leading coordinated attacks. Defender morale remains high.',
  'Day 5: Supply lines from the harbor remain secure. Citizens evacuated to inner districts.'
];

// Sample locations in Neverwinter
const locations = [
  {
    name: 'Castle Never',
    status: 'controlled',
    description: 'The seat of Lord Neverember\'s power and the command center for the defense.',
    coord_x: 400,
    coord_y: 300,
    coord_width: 100,
    coord_height: 100
  },
  {
    name: 'Hall of Justice',
    status: 'controlled',
    description: 'Temple district where clerics tend to the wounded and provide divine support.',
    coord_x: 300,
    coord_y: 400,
    coord_width: 80,
    coord_height: 80
  },
  {
    name: 'Protector\'s Enclave',
    status: 'controlled',
    description: 'Central marketplace and gathering point for defenders.',
    coord_x: 350,
    coord_y: 350,
    coord_width: 120,
    coord_height: 100
  },
  {
    name: 'Eastern Gate',
    status: 'contested',
    description: 'Primary target of Tiamat\'s forces. Heavy fighting ongoing.',
    coord_x: 600,
    coord_y: 350,
    coord_width: 60,
    coord_height: 80
  },
  {
    name: 'Harbor District',
    status: 'controlled',
    description: 'Critical supply line. Must be defended at all costs.',
    coord_x: 200,
    coord_y: 500,
    coord_width: 100,
    coord_height: 80
  },
  {
    name: 'Blacklake District',
    status: 'enemy',
    description: 'Overrun by cult forces. Evacuation complete.',
    coord_x: 250,
    coord_y: 200,
    coord_width: 90,
    coord_height: 90
  }
];

// Sample plot points
const plotPoints = [
  {
    location_name: 'Eastern Gate',
    name: 'Defend the Gate',
    description: 'Repel the dragonborn champion assault on the eastern gate.',
    status: 'active',
    coord_x: 620,
    coord_y: 380
  },
  {
    location_name: 'Hall of Justice',
    name: 'Protect the Healers',
    description: 'Cult infiltrators are targeting the temple. Defend the clerics.',
    status: 'active',
    coord_x: 320,
    coord_y: 420
  },
  {
    location_name: 'Harbor District',
    name: 'Secure Supply Lines',
    description: 'Ensure supply ships can continue to dock safely.',
    status: 'completed',
    coord_x: 230,
    coord_y: 530
  },
  {
    location_name: 'Blacklake District',
    name: 'Rescue Trapped Citizens',
    description: 'Reports of civilians trapped in the overrun district.',
    status: 'active',
    coord_x: 280,
    coord_y: 230
  },
  {
    location_name: 'Castle Never',
    name: 'War Council',
    description: 'Attend the daily strategy meeting with Lord Neverember.',
    status: 'active',
    coord_x: 430,
    coord_y: 330
  }
];

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Starting database seed...');
    
    // Get the default campaign ID
    const campaignResult = await client.query(
      'SELECT id FROM campaigns WHERE name = $1',
      ['Default Campaign']
    );
    
    let campaignId;
    if (campaignResult.rows.length === 0) {
      // Create default campaign if it doesn't exist
      const newCampaign = await client.query(
        'INSERT INTO campaigns (name) VALUES ($1) RETURNING id',
        ['Default Campaign']
      );
      campaignId = newCampaign.rows[0].id;
      console.log('Created default campaign');
    } else {
      campaignId = campaignResult.rows[0].id;
      console.log('Using existing default campaign');
    }
    
    // Insert sample PCs
    console.log('\nInserting sample PCs...');
    for (const pc of samplePCs) {
      await client.query(
        `INSERT INTO combatants (
          campaign_id, name, type, character_class, level, ac, current_hp, max_hp,
          save_strength, save_dexterity, save_constitution, save_intelligence, save_wisdom, save_charisma, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          campaignId, pc.name, pc.type, pc.character_class, pc.level, pc.ac, pc.current_hp, pc.max_hp,
          pc.save_strength, pc.save_dexterity, pc.save_constitution, pc.save_intelligence, pc.save_wisdom, pc.save_charisma, pc.notes
        ]
      );
      console.log(`  ✓ ${pc.name} (${pc.character_class} ${pc.level})`);
    }
    
    // Insert Tiamat forces monsters
    console.log('\nInserting Tiamat forces monsters...');
    for (const monster of tiamataForces) {
      await client.query(
        `INSERT INTO monsters (
          campaign_id, name, ac, hp_formula, speed,
          stat_str, stat_dex, stat_con, stat_int, stat_wis, stat_cha,
          saves, skills, resistances, immunities, senses, languages, cr, attacks, abilities, lore
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
        [
          campaignId, monster.name, monster.ac, monster.hp_formula, monster.speed,
          monster.stat_str, monster.stat_dex, monster.stat_con, monster.stat_int, monster.stat_wis, monster.stat_cha,
          JSON.stringify(monster.saves), JSON.stringify(monster.skills), monster.resistances, monster.immunities,
          monster.senses, monster.languages, monster.cr, JSON.stringify(monster.attacks), JSON.stringify(monster.abilities), monster.lore
        ]
      );
      console.log(`  ✓ ${monster.name} (CR ${monster.cr})`);
    }
    
    // Insert or update siege state
    console.log('\nSetting up siege state...');
    const siegeStateResult = await client.query(
      'SELECT id FROM siege_state WHERE campaign_id = $1',
      [campaignId]
    );
    
    let siegeStateId;
    if (siegeStateResult.rows.length === 0) {
      const newSiegeState = await client.query(
        `INSERT INTO siege_state (campaign_id, wall_integrity, defender_morale, supplies, day_of_siege, custom_metrics)
         VALUES ($1, 90, 85, 75, 5, $2) RETURNING id`,
        [campaignId, JSON.stringify({ 'Dragon Sightings': 12, 'Cult Infiltrators Captured': 8 })]
      );
      siegeStateId = newSiegeState.rows[0].id;
      console.log('  ✓ Created siege state (Day 5, Wall: 90%, Morale: 85%, Supplies: 75%)');
    } else {
      siegeStateId = siegeStateResult.rows[0].id;
      await client.query(
        `UPDATE siege_state SET wall_integrity = 90, defender_morale = 85, supplies = 75, day_of_siege = 5,
         custom_metrics = $1 WHERE id = $2`,
        [JSON.stringify({ 'Dragon Sightings': 12, 'Cult Infiltrators Captured': 8 }), siegeStateId]
      );
      console.log('  ✓ Updated siege state');
    }
    
    // Insert siege notes
    console.log('\nAdding siege notes...');
    for (const note of siegeNotes) {
      await client.query(
        'INSERT INTO siege_notes (siege_state_id, note_text) VALUES ($1, $2)',
        [siegeStateId, note]
      );
      console.log(`  ✓ ${note.substring(0, 50)}...`);
    }
    
    // Insert locations
    console.log('\nAdding locations...');
    const locationIds = {};
    for (const location of locations) {
      const result = await client.query(
        `INSERT INTO locations (campaign_id, name, status, description, coord_x, coord_y, coord_width, coord_height)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [campaignId, location.name, location.status, location.description, location.coord_x, location.coord_y, location.coord_width, location.coord_height]
      );
      locationIds[location.name] = result.rows[0].id;
      console.log(`  ✓ ${location.name} (${location.status})`);
    }
    
    // Insert plot points
    console.log('\nAdding plot points...');
    for (const plotPoint of plotPoints) {
      const locationId = locationIds[plotPoint.location_name];
      if (locationId) {
        await client.query(
          `INSERT INTO plot_points (location_id, name, description, status, coord_x, coord_y)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [locationId, plotPoint.name, plotPoint.description, plotPoint.status, plotPoint.coord_x, plotPoint.coord_y]
        );
        console.log(`  ✓ ${plotPoint.name} at ${plotPoint.location_name}`);
      }
    }
    
    await client.query('COMMIT');
    console.log('\n✅ Database seeded successfully!');
    console.log('\nSummary:');
    console.log(`  - ${samplePCs.length} PCs added`);
    console.log(`  - ${tiamataForces.length} monster types added`);
    console.log(`  - ${siegeNotes.length} siege notes added`);
    console.log(`  - ${locations.length} locations added`);
    console.log(`  - ${plotPoints.length} plot points added`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seed function
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('\nSeed script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nSeed script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
