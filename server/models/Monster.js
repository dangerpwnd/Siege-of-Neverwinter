const db = require('../../database/db');
const Combatant = require('./Combatant');

/**
 * Monster Model
 * Handles database operations for monster templates and instances
 */

class Monster {
  /**
   * Validate monster data
   */
  static validate(data) {
    const errors = [];

    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push('Name is required and must be a non-empty string');
    }

    if (data.ac === undefined || data.ac === null || typeof data.ac !== 'number' || data.ac < 0) {
      errors.push('AC is required and must be a non-negative number');
    }

    if (data.hp_formula && typeof data.hp_formula !== 'string') {
      errors.push('HP formula must be a string');
    }

    // Validate stats if provided
    const stats = ['stat_str', 'stat_dex', 'stat_con', 'stat_int', 'stat_wis', 'stat_cha'];
    stats.forEach(stat => {
      if (data[stat] !== undefined && (typeof data[stat] !== 'number' || data[stat] < 1 || data[stat] > 30)) {
        errors.push(`${stat} must be a number between 1 and 30`);
      }
    });

    // Validate JSONB fields
    if (data.saves !== undefined && typeof data.saves !== 'object') {
      errors.push('Saves must be an object');
    }

    if (data.skills !== undefined && typeof data.skills !== 'object') {
      errors.push('Skills must be an object');
    }

    if (data.attacks !== undefined && !Array.isArray(data.attacks)) {
      errors.push('Attacks must be an array');
    }

    if (data.abilities !== undefined && !Array.isArray(data.abilities)) {
      errors.push('Abilities must be an array');
    }

    if (data.resistances !== undefined && !Array.isArray(data.resistances)) {
      errors.push('Resistances must be an array');
    }

    if (data.immunities !== undefined && !Array.isArray(data.immunities)) {
      errors.push('Immunities must be an array');
    }

    return errors;
  }

  /**
   * Create a new monster template
   */
  static async create(campaignId, data) {
    const errors = this.validate(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const query = `
      INSERT INTO monsters (
        campaign_id, name, ac, hp_formula, speed,
        stat_str, stat_dex, stat_con, stat_int, stat_wis, stat_cha,
        saves, skills, resistances, immunities, senses, languages, cr,
        attacks, abilities, lore
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `;

    const values = [
      campaignId,
      data.name,
      data.ac,
      data.hp_formula || null,
      data.speed || null,
      data.stat_str || 10,
      data.stat_dex || 10,
      data.stat_con || 10,
      data.stat_int || 10,
      data.stat_wis || 10,
      data.stat_cha || 10,
      JSON.stringify(data.saves || {}),
      JSON.stringify(data.skills || {}),
      data.resistances || [],
      data.immunities || [],
      data.senses || null,
      data.languages || null,
      data.cr || '0',
      JSON.stringify(data.attacks || []),
      JSON.stringify(data.abilities || []),
      data.lore || null
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Get monster by ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM monsters WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get all monsters for a campaign
   */
  static async findByCampaign(campaignId, filter = null) {
    let query = 'SELECT * FROM monsters WHERE campaign_id = $1';
    const values = [campaignId];

    if (filter && filter.name) {
      query += ' AND name ILIKE $2';
      values.push(`%${filter.name}%`);
    }

    query += ' ORDER BY name ASC';

    const result = await db.query(query, values);
    return result.rows;
  }

  /**
   * Update monster template
   */
  static async update(id, data) {
    const errors = [];
    
    if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim() === '')) {
      errors.push('Name must be a non-empty string');
    }

    if (data.ac !== undefined && (typeof data.ac !== 'number' || data.ac < 0)) {
      errors.push('AC must be a non-negative number');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        // Handle JSONB fields
        if (['saves', 'skills', 'attacks', 'abilities'].includes(key)) {
          fields.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(data[key]));
        } else {
          fields.push(`${key} = $${paramCount}`);
          values.push(data[key]);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const query = `UPDATE monsters SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete monster template
   */
  static async delete(id) {
    const query = 'DELETE FROM monsters WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Create a monster instance for combat
   * This creates a combatant entry and links it to the monster template
   */
  static async createInstance(monsterId, instanceName, initiative = 0) {
    // Get the monster template
    const monster = await this.findById(monsterId);
    if (!monster) {
      throw new Error('Monster template not found');
    }

    // Calculate HP from formula (simple implementation)
    let hp = 10; // default
    if (monster.hp_formula) {
      // Parse simple formulas like "4d8+4"
      const match = monster.hp_formula.match(/(\d+)d(\d+)(?:\+(\d+))?/);
      if (match) {
        const numDice = parseInt(match[1]);
        const diceSize = parseInt(match[2]);
        const bonus = match[3] ? parseInt(match[3]) : 0;
        // Use average roll
        hp = Math.floor(numDice * (diceSize + 1) / 2) + bonus;
      }
    }

    // Calculate saving throws from stats
    const calcModifier = (stat) => Math.floor((stat - 10) / 2);

    // Create combatant entry
    const combatantData = {
      name: instanceName || monster.name,
      type: 'Monster',
      initiative: initiative,
      ac: monster.ac,
      current_hp: hp,
      max_hp: hp,
      save_strength: monster.saves?.strength || calcModifier(monster.stat_str),
      save_dexterity: monster.saves?.dexterity || calcModifier(monster.stat_dex),
      save_constitution: monster.saves?.constitution || calcModifier(monster.stat_con),
      save_intelligence: monster.saves?.intelligence || calcModifier(monster.stat_int),
      save_wisdom: monster.saves?.wisdom || calcModifier(monster.stat_wis),
      save_charisma: monster.saves?.charisma || calcModifier(monster.stat_cha),
      notes: `Monster instance of ${monster.name}`
    };

    const combatant = await Combatant.create(monster.campaign_id, combatantData);

    // Create monster instance link
    const linkQuery = `
      INSERT INTO monster_instances (monster_id, combatant_id, instance_name)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const linkResult = await db.query(linkQuery, [monsterId, combatant.id, instanceName || monster.name]);

    // Return combined data
    return {
      instance: linkResult.rows[0],
      combatant: combatant,
      template: monster
    };
  }

  /**
   * Get all instances of a monster
   */
  static async getInstances(monsterId) {
    const query = `
      SELECT mi.*, c.*
      FROM monster_instances mi
      JOIN combatants c ON mi.combatant_id = c.id
      WHERE mi.monster_id = $1
      ORDER BY mi.created_at DESC
    `;

    const result = await db.query(query, [monsterId]);
    return result.rows;
  }

  /**
   * Get monster template from instance
   */
  static async getTemplateFromInstance(combatantId) {
    const query = `
      SELECT m.*
      FROM monsters m
      JOIN monster_instances mi ON m.id = mi.monster_id
      WHERE mi.combatant_id = $1
    `;

    const result = await db.query(query, [combatantId]);
    return result.rows[0] || null;
  }
}

module.exports = Monster;
