const db = require('../../database/db');

/**
 * SiegeState Model
 * Handles database operations for siege mechanics and notes
 */

class SiegeState {
  /**
   * Validate siege state data
   */
  static validate(data) {
    const errors = [];

    if (data.wall_integrity !== undefined) {
      if (typeof data.wall_integrity !== 'number' || data.wall_integrity < 0 || data.wall_integrity > 100) {
        errors.push('Wall integrity must be a number between 0 and 100');
      }
    }

    if (data.defender_morale !== undefined) {
      if (typeof data.defender_morale !== 'number' || data.defender_morale < 0 || data.defender_morale > 100) {
        errors.push('Defender morale must be a number between 0 and 100');
      }
    }

    if (data.supplies !== undefined) {
      if (typeof data.supplies !== 'number' || data.supplies < 0 || data.supplies > 100) {
        errors.push('Supplies must be a number between 0 and 100');
      }
    }

    if (data.day_of_siege !== undefined) {
      if (typeof data.day_of_siege !== 'number' || data.day_of_siege < 1) {
        errors.push('Day of siege must be a positive number');
      }
    }

    if (data.custom_metrics !== undefined && typeof data.custom_metrics !== 'object') {
      errors.push('Custom metrics must be an object');
    }

    return errors;
  }

  /**
   * Create or initialize siege state for a campaign
   */
  static async create(campaignId, data = {}) {
    const errors = this.validate(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const query = `
      INSERT INTO siege_state (
        campaign_id, wall_integrity, defender_morale, supplies, day_of_siege, custom_metrics
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      campaignId,
      data.wall_integrity !== undefined ? data.wall_integrity : 100,
      data.defender_morale !== undefined ? data.defender_morale : 100,
      data.supplies !== undefined ? data.supplies : 100,
      data.day_of_siege || 1,
      JSON.stringify(data.custom_metrics || {})
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Get siege state by campaign ID
   */
  static async findByCampaign(campaignId) {
    const query = 'SELECT * FROM siege_state WHERE campaign_id = $1';
    const result = await db.query(query, [campaignId]);
    return result.rows[0] || null;
  }

  /**
   * Get or create siege state for a campaign
   */
  static async getOrCreate(campaignId) {
    let siegeState = await this.findByCampaign(campaignId);
    
    if (!siegeState) {
      siegeState = await this.create(campaignId);
    }

    return siegeState;
  }

  /**
   * Update siege state
   */
  static async update(campaignId, data) {
    const errors = this.validate(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        if (key === 'custom_metrics') {
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

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(campaignId);

    const query = `
      UPDATE siege_state 
      SET ${fields.join(', ')} 
      WHERE campaign_id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Update a single siege value
   */
  static async updateValue(campaignId, key, value) {
    const data = { [key]: value };
    return await this.update(campaignId, data);
  }

  /**
   * Add custom metric
   */
  static async addCustomMetric(campaignId, metricName, metricValue) {
    const siegeState = await this.getOrCreate(campaignId);
    const customMetrics = siegeState.custom_metrics || {};
    customMetrics[metricName] = metricValue;

    return await this.update(campaignId, { custom_metrics: customMetrics });
  }

  /**
   * Remove custom metric
   */
  static async removeCustomMetric(campaignId, metricName) {
    const siegeState = await this.getOrCreate(campaignId);
    const customMetrics = siegeState.custom_metrics || {};
    delete customMetrics[metricName];

    return await this.update(campaignId, { custom_metrics: customMetrics });
  }

  /**
   * Add a note to siege state
   */
  static async addNote(campaignId, noteText) {
    if (!noteText || typeof noteText !== 'string' || noteText.trim() === '') {
      throw new Error('Note text is required and must be a non-empty string');
    }

    // Ensure siege state exists
    const siegeState = await this.getOrCreate(campaignId);

    const query = `
      INSERT INTO siege_notes (siege_state_id, note_text)
      VALUES ($1, $2)
      RETURNING *
    `;

    const result = await db.query(query, [siegeState.id, noteText]);
    return result.rows[0];
  }

  /**
   * Get all notes for a campaign
   */
  static async getNotes(campaignId) {
    const query = `
      SELECT sn.*
      FROM siege_notes sn
      JOIN siege_state ss ON sn.siege_state_id = ss.id
      WHERE ss.campaign_id = $1
      ORDER BY sn.created_at DESC
    `;

    const result = await db.query(query, [campaignId]);
    return result.rows;
  }

  /**
   * Get siege state with notes
   */
  static async findByCampaignWithNotes(campaignId) {
    const siegeState = await this.getOrCreate(campaignId);
    const notes = await this.getNotes(campaignId);

    return {
      ...siegeState,
      notes: notes
    };
  }

  /**
   * Delete a note
   */
  static async deleteNote(noteId) {
    const query = 'DELETE FROM siege_notes WHERE id = $1 RETURNING *';
    const result = await db.query(query, [noteId]);
    return result.rows[0] || null;
  }

  /**
   * Reset siege state to defaults
   */
  static async reset(campaignId) {
    const query = `
      UPDATE siege_state
      SET wall_integrity = 100,
          defender_morale = 100,
          supplies = 100,
          day_of_siege = 1,
          custom_metrics = '{}',
          updated_at = CURRENT_TIMESTAMP
      WHERE campaign_id = $1
      RETURNING *
    `;

    const result = await db.query(query, [campaignId]);
    
    // Also delete all notes
    await db.query('DELETE FROM siege_notes WHERE siege_state_id = $1', [result.rows[0]?.id]);

    return result.rows[0] || null;
  }
}

module.exports = SiegeState;
