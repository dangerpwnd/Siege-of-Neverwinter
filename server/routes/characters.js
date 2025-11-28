const express = require('express');
const router = express.Router();
const db = require('../../database/db');

// GET all characters for a campaign
router.get('/', async (req, res, next) => {
  try {
    const campaignId = req.query.campaign_id || 1;
    
    const result = await db.query(
      `SELECT c.*, 
              COALESCE(
                json_agg(
                  json_build_object('id', cc.id, 'condition', cc.condition, 'applied_at', cc.applied_at)
                  ORDER BY cc.applied_at
                ) FILTER (WHERE cc.id IS NOT NULL),
                '[]'
              ) as conditions
       FROM combatants c
       LEFT JOIN combatant_conditions cc ON c.id = cc.combatant_id
       WHERE c.campaign_id = $1 AND c.type = 'PC'
       GROUP BY c.id
       ORDER BY c.name`,
      [campaignId]
    );
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET single character by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT c.*, 
              COALESCE(
                json_agg(
                  json_build_object('id', cc.id, 'condition', cc.condition, 'applied_at', cc.applied_at)
                  ORDER BY cc.applied_at
                ) FILTER (WHERE cc.id IS NOT NULL),
                '[]'
              ) as conditions
       FROM combatants c
       LEFT JOIN combatant_conditions cc ON c.id = cc.combatant_id
       WHERE c.id = $1 AND c.type = 'PC'
       GROUP BY c.id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// POST create new character
router.post('/', async (req, res, next) => {
  try {
    const {
      campaign_id = 1,
      name,
      initiative = 0,
      ac,
      current_hp,
      max_hp,
      save_strength = 0,
      save_dexterity = 0,
      save_constitution = 0,
      save_intelligence = 0,
      save_wisdom = 0,
      save_charisma = 0,
      character_class,
      subclass,
      level,
      background,
      alignment,
      notes = '',
      features = [],
      magical_items = []
    } = req.body;
    
    // Validate required fields
    if (!name || ac === undefined || current_hp === undefined || max_hp === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, ac, current_hp, max_hp' 
      });
    }
    
    const result = await db.query(
      `INSERT INTO combatants (
        campaign_id, name, type, initiative, ac, current_hp, max_hp,
        save_strength, save_dexterity, save_constitution,
        save_intelligence, save_wisdom, save_charisma,
        character_class, subclass, level, background, alignment, notes, features, magical_items
      ) VALUES ($1, $2, 'PC', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        campaign_id, name, initiative, ac, current_hp, max_hp,
        save_strength, save_dexterity, save_constitution,
        save_intelligence, save_wisdom, save_charisma,
        character_class, subclass, level, background, alignment, notes, JSON.stringify(features), JSON.stringify(magical_items)
      ]
    );
    
    const character = result.rows[0];
    character.conditions = [];
    
    res.status(201).json(character);
  } catch (error) {
    next(error);
  }
});

// PUT update character
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      initiative,
      ac,
      current_hp,
      max_hp,
      save_strength,
      save_dexterity,
      save_constitution,
      save_intelligence,
      save_wisdom,
      save_charisma,
      character_class,
      subclass,
      level,
      background,
      alignment,
      notes
    } = req.body;
    
    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (initiative !== undefined) {
      updates.push(`initiative = $${paramCount++}`);
      values.push(initiative);
    }
    if (ac !== undefined) {
      updates.push(`ac = $${paramCount++}`);
      values.push(ac);
    }
    if (current_hp !== undefined) {
      updates.push(`current_hp = $${paramCount++}`);
      values.push(Math.max(0, current_hp)); // Prevent negative HP
    }
    if (max_hp !== undefined) {
      updates.push(`max_hp = $${paramCount++}`);
      values.push(max_hp);
    }
    if (save_strength !== undefined) {
      updates.push(`save_strength = $${paramCount++}`);
      values.push(save_strength);
    }
    if (save_dexterity !== undefined) {
      updates.push(`save_dexterity = $${paramCount++}`);
      values.push(save_dexterity);
    }
    if (save_constitution !== undefined) {
      updates.push(`save_constitution = $${paramCount++}`);
      values.push(save_constitution);
    }
    if (save_intelligence !== undefined) {
      updates.push(`save_intelligence = $${paramCount++}`);
      values.push(save_intelligence);
    }
    if (save_wisdom !== undefined) {
      updates.push(`save_wisdom = $${paramCount++}`);
      values.push(save_wisdom);
    }
    if (save_charisma !== undefined) {
      updates.push(`save_charisma = $${paramCount++}`);
      values.push(save_charisma);
    }
    if (character_class !== undefined) {
      updates.push(`character_class = $${paramCount++}`);
      values.push(character_class);
    }
    if (subclass !== undefined) {
      updates.push(`subclass = $${paramCount++}`);
      values.push(subclass);
    }
    if (level !== undefined) {
      updates.push(`level = $${paramCount++}`);
      values.push(level);
    }
    if (background !== undefined) {
      updates.push(`background = $${paramCount++}`);
      values.push(background);
    }
    if (alignment !== undefined) {
      updates.push(`alignment = $${paramCount++}`);
      values.push(alignment);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(notes);
    }
    if (req.body.features !== undefined) {
      updates.push(`features = $${paramCount++}`);
      values.push(JSON.stringify(req.body.features));
    }
    if (req.body.magical_items !== undefined) {
      updates.push(`magical_items = $${paramCount++}`);
      values.push(JSON.stringify(req.body.magical_items));
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    
    const result = await db.query(
      `UPDATE combatants 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount} AND type = 'PC'
       RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    // Get character with conditions
    const charResult = await db.query(
      `SELECT c.*, 
              COALESCE(
                json_agg(
                  json_build_object('id', cc.id, 'condition', cc.condition, 'applied_at', cc.applied_at)
                  ORDER BY cc.applied_at
                ) FILTER (WHERE cc.id IS NOT NULL),
                '[]'
              ) as conditions
       FROM combatants c
       LEFT JOIN combatant_conditions cc ON c.id = cc.combatant_id
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    );
    
    res.json(charResult.rows[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE character
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM combatants WHERE id = $1 AND type = \'PC\' RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    res.json({ message: 'Character deleted successfully', id: result.rows[0].id });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
