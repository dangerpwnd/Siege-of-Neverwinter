/**
 * Penalty Registry — Static Penalty Data for D&D 5e Conditions
 *
 * A pure data module exporting lookup functions over a frozen penalty dataset.
 * Contains the 14 standard SRD conditions and their mechanical penalties.
 *
 * @typedef {Object} Penalty
 * @property {string} type - One of the PENALTY_TYPES constants
 * @property {string} mechanic - The affected game mechanic
 * @property {string} description - Human-readable description
 */

/**
 * Penalty type constants — the 12 recognized penalty categories.
 */
const PENALTY_TYPES = Object.freeze({
  DISADVANTAGE_ON_ATTACK: 'disadvantage_on_attack',
  ADVANTAGE_AGAINST: 'advantage_against',
  AUTO_FAIL_SAVE: 'auto_fail_save',
  AUTO_FAIL_CHECK: 'auto_fail_check',
  SPEED_ZERO: 'speed_zero',
  INCAPACITATED: 'incapacitated',
  CANNOT_TAKE_ACTIONS: 'cannot_take_actions',
  CANNOT_TAKE_REACTIONS: 'cannot_take_reactions',
  CANNOT_SPEAK: 'cannot_speak',
  ADVANTAGE_ON_ATTACK: 'advantage_on_attack',
  DISADVANTAGE_AGAINST: 'disadvantage_against',
  DESCRIPTIVE_NOTE: 'descriptive_note',
});

/**
 * Internal frozen map: condition name → penalty array.
 * Data matches the D&D 5e System Reference Document exactly.
 */
const CONDITION_PENALTIES = Object.freeze({
  blinded: Object.freeze([
    { type: 'disadvantage_on_attack', mechanic: 'attack_rolls', description: 'Disadvantage on attack rolls' },
    { type: 'advantage_against', mechanic: 'attack_rolls', description: 'Attack rolls against have advantage' },
  ]),
  charmed: Object.freeze([
    { type: 'descriptive_note', mechanic: 'attack', description: 'Cannot attack the charmer' },
    { type: 'advantage_against', mechanic: 'social_checks', description: 'Charmer has advantage on social ability checks' },
  ]),
  deafened: Object.freeze([
    { type: 'auto_fail_check', mechanic: 'hearing_checks', description: 'Auto-fails ability checks requiring hearing' },
  ]),
  frightened: Object.freeze([
    { type: 'disadvantage_on_attack', mechanic: 'attack_rolls', description: 'Disadvantage on attack rolls while source in sight' },
    { type: 'auto_fail_check', mechanic: 'ability_checks', description: 'Disadvantage on ability checks while source in sight' },
  ]),
  grappled: Object.freeze([
    { type: 'speed_zero', mechanic: 'movement', description: 'Speed becomes 0' },
  ]),
  incapacitated: Object.freeze([
    { type: 'cannot_take_actions', mechanic: 'actions', description: 'Cannot take actions' },
    { type: 'cannot_take_reactions', mechanic: 'reactions', description: 'Cannot take reactions' },
  ]),
  invisible: Object.freeze([
    { type: 'advantage_on_attack', mechanic: 'attack_rolls', description: 'Advantage on attack rolls' },
    { type: 'disadvantage_against', mechanic: 'attack_rolls', description: 'Attack rolls against have disadvantage' },
  ]),
  paralyzed: Object.freeze([
    { type: 'incapacitated', mechanic: 'actions', description: 'Incapacitated' },
    { type: 'speed_zero', mechanic: 'movement', description: 'Cannot move' },
    { type: 'cannot_speak', mechanic: 'speech', description: 'Cannot speak' },
    { type: 'auto_fail_save', mechanic: 'strength_saves', description: 'Auto-fails Strength saving throws' },
    { type: 'auto_fail_save', mechanic: 'dexterity_saves', description: 'Auto-fails Dexterity saving throws' },
    { type: 'advantage_against', mechanic: 'attack_rolls', description: 'Attack rolls against have advantage' },
    { type: 'descriptive_note', mechanic: 'critical_hits', description: 'Hits from within 5 feet are critical hits' },
  ]),
  petrified: Object.freeze([
    { type: 'descriptive_note', mechanic: 'weight', description: 'Weight increases by factor of ten' },
    { type: 'incapacitated', mechanic: 'actions', description: 'Incapacitated' },
    { type: 'speed_zero', mechanic: 'movement', description: 'Cannot move' },
    { type: 'cannot_speak', mechanic: 'speech', description: 'Cannot speak' },
    { type: 'descriptive_note', mechanic: 'awareness', description: 'Unaware of surroundings' },
    { type: 'advantage_against', mechanic: 'attack_rolls', description: 'Attack rolls against have advantage' },
    { type: 'auto_fail_save', mechanic: 'strength_saves', description: 'Auto-fails Strength saving throws' },
    { type: 'auto_fail_save', mechanic: 'dexterity_saves', description: 'Auto-fails Dexterity saving throws' },
    { type: 'descriptive_note', mechanic: 'damage_resistance', description: 'Resistance to all damage' },
  ]),
  poisoned: Object.freeze([
    { type: 'disadvantage_on_attack', mechanic: 'attack_rolls', description: 'Disadvantage on attack rolls' },
    { type: 'auto_fail_check', mechanic: 'ability_checks', description: 'Disadvantage on ability checks' },
  ]),
  prone: Object.freeze([
    { type: 'disadvantage_on_attack', mechanic: 'attack_rolls', description: 'Disadvantage on attack rolls' },
    { type: 'advantage_against', mechanic: 'melee_attacks', description: 'Melee attacks against have advantage' },
    { type: 'disadvantage_against', mechanic: 'ranged_attacks', description: 'Ranged attacks from >5ft against have disadvantage' },
  ]),
  restrained: Object.freeze([
    { type: 'speed_zero', mechanic: 'movement', description: 'Speed becomes 0' },
    { type: 'disadvantage_on_attack', mechanic: 'attack_rolls', description: 'Disadvantage on attack rolls' },
    { type: 'advantage_against', mechanic: 'attack_rolls', description: 'Attack rolls against have advantage' },
    { type: 'auto_fail_save', mechanic: 'dexterity_saves', description: 'Disadvantage on Dexterity saving throws' },
  ]),
  stunned: Object.freeze([
    { type: 'incapacitated', mechanic: 'actions', description: 'Incapacitated' },
    { type: 'speed_zero', mechanic: 'movement', description: 'Cannot move' },
    { type: 'auto_fail_save', mechanic: 'strength_saves', description: 'Auto-fails Strength saving throws' },
    { type: 'auto_fail_save', mechanic: 'dexterity_saves', description: 'Auto-fails Dexterity saving throws' },
    { type: 'advantage_against', mechanic: 'attack_rolls', description: 'Attack rolls against have advantage' },
  ]),
  unconscious: Object.freeze([
    { type: 'incapacitated', mechanic: 'actions', description: 'Incapacitated' },
    { type: 'speed_zero', mechanic: 'movement', description: 'Cannot move' },
    { type: 'cannot_speak', mechanic: 'speech', description: 'Cannot speak' },
    { type: 'descriptive_note', mechanic: 'items', description: 'Drops held items' },
    { type: 'descriptive_note', mechanic: 'prone', description: 'Falls prone' },
    { type: 'auto_fail_save', mechanic: 'strength_saves', description: 'Auto-fails Strength saving throws' },
    { type: 'auto_fail_save', mechanic: 'dexterity_saves', description: 'Auto-fails Dexterity saving throws' },
    { type: 'advantage_against', mechanic: 'attack_rolls', description: 'Attack rolls against have advantage' },
    { type: 'descriptive_note', mechanic: 'critical_hits', description: 'Hits from within 5 feet are critical hits' },
  ]),
});

/**
 * Implied condition relationships.
 * Maps parent conditions to the conditions they include as part of their effect.
 */
const IMPLIED_CONDITIONS = Object.freeze({
  stunned: ['incapacitated'],
  paralyzed: ['incapacitated'],
  petrified: ['incapacitated'],
  unconscious: ['incapacitated'],
});

/**
 * Returns the penalty array for a given condition name.
 * Returns an empty array and logs a warning for unknown, null, or undefined names.
 *
 * @param {string} conditionName - The lowercase condition name
 * @returns {Penalty[]}
 */
function getPenalties(conditionName) {
  if (conditionName == null) {
    console.warn('penaltyRegistry: getPenalties called with null/undefined condition name');
    return [];
  }
  const penalties = CONDITION_PENALTIES[conditionName];
  if (!penalties) {
    console.warn(`penaltyRegistry: unknown condition "${conditionName}"`);
    return [];
  }
  return penalties;
}

/**
 * Returns an array of all 14 condition names in the registry.
 *
 * @returns {string[]}
 */
function getAllConditions() {
  return Object.keys(CONDITION_PENALTIES);
}

/**
 * Returns the PENALTY_TYPES frozen object.
 *
 * @returns {object}
 */
function getPenaltyTypes() {
  return PENALTY_TYPES;
}

/**
 * Returns the implied condition names for a given parent condition,
 * or an empty array if none exist.
 *
 * @param {string} conditionName - The parent condition name
 * @returns {string[]}
 */
function getImpliedConditions(conditionName) {
  return IMPLIED_CONDITIONS[conditionName] || [];
}

export {
  PENALTY_TYPES,
  CONDITION_PENALTIES,
  IMPLIED_CONDITIONS,
  getPenalties,
  getAllConditions,
  getPenaltyTypes,
  getImpliedConditions,
};
