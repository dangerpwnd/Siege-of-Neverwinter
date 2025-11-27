const db = require('../../database/db');
const {
  validateString,
  validateCombatantType,
  validateAC,
  validateHP,
  validateInitiative,
  validateStatModifier,
  validateLevel
} = require('../utils/validation');

/**
 * Combatant Model
 * Handles database operations for PCs, NPCs, and Monster instances
 */

class Combatant {
  /**
   * Validate combatant data
   */
  static validate(data) {
    const errors = [];

    // Validate name
    const nameResult = validateString(data.name, {
      required: true,
      minLength: 1,
      maxLength: 255,
      fieldName: 'Name'
    });
    if (!nameResult.valid) {
      errors.push(nameResult.error);
    }

    // Validate type
    if (!data.type) {
      errors.push('Type is required');
    } else {
      const typeResult = validateCombatantType(data.type);
      if (!typeResult.valid) {
        errors.push(typeResult.error);
      }
    }

    // Validate AC
    const acResult = validateAC(data.ac);
    if (!acResult.valid) {
      errors.push(acResult.error);
    }

    // Validate current HP
    const currentHpResult = validateHP(data.current_hp, false);
    if (!currentHpResult.valid) {
      errors.push(currentHpResult.error);
    }

    // Validate max HP
    const maxHpResult = validateHP(data.max_hp, true);
    if (!maxHpResult.valid) {
      errors.push(maxHpResult.error);
    }

    // Validate initiative if provided
    if (data.initiative !== undefined) {
      const initiativeResult = validateInitiative(data.initiative);
      if (!initiativeResult.valid) {
        errors.push(initiativeResult.error);
      }
    }

    // Validate saving throws if provided
    const saves = [
      { key: 'save_strength', name: 'Strength save' },
      { key: 'save_dexterity', name: 'Dexterity save' },
      { key: 'save_constitution', name: 'Constitution save' },
      { key: 'save_intelligence', name: 'Intelligence save' },
      { key: 'save_wisdom', name: 'Wisdom save' },
      { key: 'save_charisma', name: 'Charisma save' }
    ];
    
    saves.forEach(({ key, name }) => {
      if (data[key] !== undefined) {
        const saveResult = validateStatModifier(data[key], name);
        if (!saveResult.valid) {
          errors.push(saveResult.error);
        }
      }
    });

    // PC-specific validation
    if (data.type === 'PC') {
      if (data.character_class !== undefined) {
        const classResult = validateString(data.character_class, {
          maxLength: 100,
          fieldName: 'Character class'
        });
        if (!classResult.valid) {
          errors.push(classResult.error);
        }
      }
      
      if (data.level !== undefined) {
        const levelResult = validateLevel(data.level);
        if (!levelResult.valid) {
          errors.push(levelResult.error);
        }
      }
    }

    // Validate notes if provided
    if (data.notes !== undefined) {
      const notesResult = validateString(data.notes, {
        maxLength: 5000,
        fieldName: 'Notes'
      });
      if (!notesResult.valid) {
        errors.push(notesResult.error);
      }
    }

    return errors;
  }

  /**
   * Create a new combatant
   */
  static async create(campaignId, data) {
    const errors = this.validate(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const { sanitizeString } = require('../utils/validation');

    const query = `
      INSERT INTO combatants (
        campaign_id, name, type, initiative, ac, current_hp, max_hp,
        save_strength, save_dexterity, save_constitution,
        save_intelligence, save_wisdom, save_charisma,
        character_class, level, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;

    const values = [
      campaignId,
      sanitizeString(data.name),
      data.type,
      data.initiative || 0,
      data.ac,
      Math.max(0, data.current_hp), // Ensure non-negative
      data.max_hp,
      data.save_strength || 0,
      data.save_dexterity || 0,
      data.save_constitution || 0,
      data.save_intelligence || 0,
      data.save_wisdom || 0,
      data.save_charisma || 0,
      data.character_class ? sanitizeString(data.character_class) : null,
      data.level || null,
      data.notes ? sanitizeString(data.notes) : null
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Get combatant by ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM combatants WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get all combatants for a campaign
   */
  static async findByCampaign(campaignId, type = null) {
    let query = 'SELECT * FROM combatants WHERE campaign_id = $1';
    const values = [campaignId];

    if (type) {
      query += ' AND type = $2';
      values.push(type);
    }

    query += ' ORDER BY initiative DESC, name ASC';

    const result = await db.query(query, values);
    return result.rows;
  }

  /**
   * Update combatant
   */
  static async update(id, data) {
    // Partial validation - only validate fields that are being updated
    const errors = [];
    
    if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim() === '')) {
      errors.push('Name must be a non-empty string');
    }

    if (data.type !== undefined && !['PC', 'NPC', 'Monster'].includes(data.type)) {
      errors.push('Type must be one of: PC, NPC, Monster');
    }

    if (data.ac !== undefined && (typeof data.ac !== 'number' || data.ac < 0)) {
      errors.push('AC must be a non-negative number');
    }

    if (data.current_hp !== undefined && (typeof data.current_hp !== 'number' || data.current_hp < 0)) {
      errors.push('Current HP must be a non-negative number');
    }

    if (data.max_hp !== undefined && (typeof data.max_hp !== 'number' || data.max_hp <= 0)) {
      errors.push('Max HP must be a positive number');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(data[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const query = `UPDATE combatants SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete combatant
   */
  static async delete(id) {
    const query = 'DELETE FROM combatants WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get combatant with conditions
   */
  static async findByIdWithConditions(id) {
    const combatantQuery = 'SELECT * FROM combatants WHERE id = $1';
    const conditionsQuery = 'SELECT * FROM combatant_conditions WHERE combatant_id = $1 ORDER BY applied_at';

    const combatantResult = await db.query(combatantQuery, [id]);
    if (combatantResult.rows.length === 0) {
      return null;
    }

    const conditionsResult = await db.query(conditionsQuery, [id]);
    
    const combatant = combatantResult.rows[0];
    // Extract just the condition strings from the condition objects
    combatant.conditions = conditionsResult.rows.map(row => row.condition);

    return combatant;
  }

  /**
   * Get all combatants for a campaign with conditions
   */
  static async findByCampaignWithConditions(campaignId, type = null) {
    let query = `
      SELECT c.*, 
             COALESCE(
               json_agg(
                 cc.condition ORDER BY cc.applied_at
               ) FILTER (WHERE cc.condition IS NOT NULL),
               '[]'
             ) as conditions
      FROM combatants c
      LEFT JOIN combatant_conditions cc ON c.id = cc.combatant_id
      WHERE c.campaign_id = $1
    `;
    
    const values = [campaignId];

    if (type) {
      query += ' AND c.type = $2';
      values.push(type);
    }

    query += ' GROUP BY c.id ORDER BY c.initiative DESC, c.name ASC';

    const result = await db.query(query, values);
    return result.rows;
  }

  /**
   * Add condition to combatant
   */
  static async addCondition(combatantId, condition) {
    if (!condition || typeof condition !== 'string') {
      throw new Error('Condition must be a non-empty string');
    }

    const query = `
      INSERT INTO combatant_conditions (combatant_id, condition)
      VALUES ($1, $2)
      RETURNING *
    `;

    const result = await db.query(query, [combatantId, condition]);
    return result.rows[0];
  }

  /**
   * Remove condition from combatant
   */
  static async removeCondition(combatantId, condition) {
    const query = `
      DELETE FROM combatant_conditions
      WHERE combatant_id = $1 AND condition = $2
      RETURNING *
    `;

    const result = await db.query(query, [combatantId, condition]);
    return result.rows[0] || null;
  }

  /**
   * Clear all conditions from combatant
   */
  static async clearAllConditions(combatantId) {
    const query = 'DELETE FROM combatant_conditions WHERE combatant_id = $1';
    const result = await db.query(query, [combatantId]);
    return result.rowCount;
  }
}

module.exports = Combatant;
