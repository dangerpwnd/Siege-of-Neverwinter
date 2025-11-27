const db = require('../../database/db');

/**
 * Campaign Model
 * Handles database operations for campaigns and session management
 */

class Campaign {
  /**
   * Validate campaign data
   */
  static validate(data) {
    const errors = [];

    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push('Name is required and must be a non-empty string');
    }

    return errors;
  }

  /**
   * Create a new campaign
   */
  static async create(data) {
    const errors = this.validate(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const query = `
      INSERT INTO campaigns (name)
      VALUES ($1)
      RETURNING *
    `;

    const result = await db.query(query, [data.name]);
    const campaign = result.rows[0];

    // Initialize default siege state for the campaign
    await db.query(
      `INSERT INTO siege_state (campaign_id) VALUES ($1)`,
      [campaign.id]
    );

    return campaign;
  }

  /**
   * Get campaign by ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM campaigns WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get all campaigns
   */
  static async findAll() {
    const query = 'SELECT * FROM campaigns ORDER BY updated_at DESC, created_at DESC';
    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Update campaign
   */
  static async update(id, data) {
    const errors = [];
    
    if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim() === '')) {
      errors.push('Name must be a non-empty string');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    // Always update the updated_at timestamp
    const query = `
      UPDATE campaigns 
      SET name = COALESCE($1, name), updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(query, [data.name, id]);
    return result.rows[0] || null;
  }

  /**
   * Delete campaign (cascade will delete all related data)
   */
  static async delete(id) {
    const query = 'DELETE FROM campaigns WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get complete campaign state (all data for export/restore)
   */
  static async getCompleteState(campaignId) {
    const state = {
      campaign: null,
      combatants: [],
      monsters: [],
      monsterInstances: [],
      siegeState: null,
      siegeNotes: [],
      locations: [],
      plotPoints: [],
      preferences: []
    };

    // Get campaign info
    state.campaign = await this.findById(campaignId);
    if (!state.campaign) {
      throw new Error('Campaign not found');
    }

    // Get combatants with conditions
    const combatantsQuery = `
      SELECT c.*, 
             COALESCE(
               json_agg(
                 json_build_object('condition', cc.condition, 'applied_at', cc.applied_at)
                 ORDER BY cc.applied_at
               ) FILTER (WHERE cc.condition IS NOT NULL),
               '[]'
             ) as conditions
      FROM combatants c
      LEFT JOIN combatant_conditions cc ON c.id = cc.combatant_id
      WHERE c.campaign_id = $1
      GROUP BY c.id
      ORDER BY c.initiative DESC, c.name ASC
    `;
    const combatantsResult = await db.query(combatantsQuery, [campaignId]);
    state.combatants = combatantsResult.rows;

    // Get monsters
    const monstersQuery = 'SELECT * FROM monsters WHERE campaign_id = $1 ORDER BY name';
    const monstersResult = await db.query(monstersQuery, [campaignId]);
    state.monsters = monstersResult.rows;

    // Get monster instances
    const instancesQuery = `
      SELECT mi.*, c.id as combatant_id
      FROM monster_instances mi
      JOIN combatants c ON mi.combatant_id = c.id
      WHERE c.campaign_id = $1
    `;
    const instancesResult = await db.query(instancesQuery, [campaignId]);
    state.monsterInstances = instancesResult.rows;

    // Get siege state with notes
    const siegeQuery = `
      SELECT ss.*, 
             COALESCE(
               json_agg(
                 json_build_object('note_text', sn.note_text, 'created_at', sn.created_at)
                 ORDER BY sn.created_at
               ) FILTER (WHERE sn.note_text IS NOT NULL),
               '[]'
             ) as notes
      FROM siege_state ss
      LEFT JOIN siege_notes sn ON ss.id = sn.siege_state_id
      WHERE ss.campaign_id = $1
      GROUP BY ss.id
    `;
    const siegeResult = await db.query(siegeQuery, [campaignId]);
    state.siegeState = siegeResult.rows[0] || null;

    // Get locations with plot points
    const locationsQuery = `
      SELECT l.*,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', pp.id,
                   'name', pp.name,
                   'description', pp.description,
                   'status', pp.status,
                   'coord_x', pp.coord_x,
                   'coord_y', pp.coord_y,
                   'created_at', pp.created_at
                 )
                 ORDER BY pp.created_at
               ) FILTER (WHERE pp.id IS NOT NULL),
               '[]'
             ) as plot_points
      FROM locations l
      LEFT JOIN plot_points pp ON l.id = pp.location_id
      WHERE l.campaign_id = $1
      GROUP BY l.id
      ORDER BY l.name
    `;
    const locationsResult = await db.query(locationsQuery, [campaignId]);
    state.locations = locationsResult.rows;

    // Get preferences
    const prefsQuery = 'SELECT * FROM user_preferences WHERE campaign_id = $1';
    const prefsResult = await db.query(prefsQuery, [campaignId]);
    state.preferences = prefsResult.rows;

    return state;
  }

  /**
   * Restore complete campaign state from export data
   */
  static async restoreState(stateData) {
    return await db.transaction(async (client) => {
      // Create campaign
      const campaignResult = await client.query(
        'INSERT INTO campaigns (name) VALUES ($1) RETURNING *',
        [stateData.campaign.name]
      );
      const newCampaignId = campaignResult.rows[0].id;

      // Restore combatants (track ID mapping for references)
      const combatantIdMap = new Map();
      for (const combatant of stateData.combatants) {
        const combatantResult = await client.query(
          `INSERT INTO combatants (
            campaign_id, name, type, initiative, ac, current_hp, max_hp,
            save_strength, save_dexterity, save_constitution,
            save_intelligence, save_wisdom, save_charisma,
            character_class, level, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          RETURNING id`,
          [
            newCampaignId, combatant.name, combatant.type, combatant.initiative,
            combatant.ac, combatant.current_hp, combatant.max_hp,
            combatant.save_strength, combatant.save_dexterity, combatant.save_constitution,
            combatant.save_intelligence, combatant.save_wisdom, combatant.save_charisma,
            combatant.character_class, combatant.level, combatant.notes
          ]
        );
        const newCombatantId = combatantResult.rows[0].id;
        combatantIdMap.set(combatant.id, newCombatantId);

        // Restore conditions
        if (combatant.conditions && Array.isArray(combatant.conditions)) {
          for (const conditionData of combatant.conditions) {
            await client.query(
              'INSERT INTO combatant_conditions (combatant_id, condition) VALUES ($1, $2)',
              [newCombatantId, conditionData.condition]
            );
          }
        }
      }

      // Restore monsters (track ID mapping)
      const monsterIdMap = new Map();
      for (const monster of stateData.monsters) {
        const monsterResult = await client.query(
          `INSERT INTO monsters (
            campaign_id, name, ac, hp_formula, speed,
            stat_str, stat_dex, stat_con, stat_int, stat_wis, stat_cha,
            saves, skills, resistances, immunities, senses, languages, cr,
            attacks, abilities, lore
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
          RETURNING id`,
          [
            newCampaignId, monster.name, monster.ac, monster.hp_formula, monster.speed,
            monster.stat_str, monster.stat_dex, monster.stat_con,
            monster.stat_int, monster.stat_wis, monster.stat_cha,
            JSON.stringify(monster.saves), JSON.stringify(monster.skills),
            monster.resistances, monster.immunities,
            monster.senses, monster.languages, monster.cr,
            JSON.stringify(monster.attacks), JSON.stringify(monster.abilities), monster.lore
          ]
        );
        monsterIdMap.set(monster.id, monsterResult.rows[0].id);
      }

      // Restore monster instances
      for (const instance of stateData.monsterInstances) {
        const newMonsterId = monsterIdMap.get(instance.monster_id);
        const newCombatantId = combatantIdMap.get(instance.combatant_id);
        
        if (newMonsterId && newCombatantId) {
          await client.query(
            'INSERT INTO monster_instances (monster_id, combatant_id, instance_name) VALUES ($1, $2, $3)',
            [newMonsterId, newCombatantId, instance.instance_name]
          );
        }
      }

      // Restore siege state
      if (stateData.siegeState) {
        const siegeResult = await client.query(
          `INSERT INTO siege_state (
            campaign_id, wall_integrity, defender_morale, supplies,
            day_of_siege, custom_metrics
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id`,
          [
            newCampaignId,
            stateData.siegeState.wall_integrity,
            stateData.siegeState.defender_morale,
            stateData.siegeState.supplies,
            stateData.siegeState.day_of_siege,
            JSON.stringify(stateData.siegeState.custom_metrics)
          ]
        );
        const newSiegeStateId = siegeResult.rows[0].id;

        // Restore siege notes
        if (stateData.siegeState.notes && Array.isArray(stateData.siegeState.notes)) {
          for (const note of stateData.siegeState.notes) {
            await client.query(
              'INSERT INTO siege_notes (siege_state_id, note_text) VALUES ($1, $2)',
              [newSiegeStateId, note.note_text]
            );
          }
        }
      }

      // Restore locations (track ID mapping)
      const locationIdMap = new Map();
      for (const location of stateData.locations) {
        const locationResult = await client.query(
          `INSERT INTO locations (
            campaign_id, name, status, description,
            coord_x, coord_y, coord_width, coord_height
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id`,
          [
            newCampaignId, location.name, location.status, location.description,
            location.coord_x, location.coord_y, location.coord_width, location.coord_height
          ]
        );
        const newLocationId = locationResult.rows[0].id;
        locationIdMap.set(location.id, newLocationId);

        // Restore plot points
        if (location.plot_points && Array.isArray(location.plot_points)) {
          for (const plotPoint of location.plot_points) {
            await client.query(
              `INSERT INTO plot_points (
                location_id, name, description, status, coord_x, coord_y
              ) VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                newLocationId, plotPoint.name, plotPoint.description,
                plotPoint.status, plotPoint.coord_x, plotPoint.coord_y
              ]
            );
          }
        }
      }

      // Restore preferences
      for (const pref of stateData.preferences) {
        await client.query(
          'INSERT INTO user_preferences (campaign_id, preference_key, preference_value) VALUES ($1, $2, $3)',
          [newCampaignId, pref.preference_key, JSON.stringify(pref.preference_value)]
        );
      }

      return campaignResult.rows[0];
    });
  }

  /**
   * Touch campaign to update the updated_at timestamp
   */
  static async touch(campaignId) {
    const query = 'UPDATE campaigns SET updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *';
    const result = await db.query(query, [campaignId]);
    return result.rows[0] || null;
  }
}

module.exports = Campaign;
