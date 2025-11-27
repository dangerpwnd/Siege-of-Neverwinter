const express = require('express');
const router = express.Router();
const db = require('../../database/db');

// Placeholder routes - to be implemented in future tasks
router.get('/', (req, res) => {
  res.json({ message: 'Combatants endpoint - to be implemented' });
});

/**
 * POST /api/combatants/:id/conditions
 * Add a condition to a combatant
 */
router.post('/:id/conditions', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { condition } = req.body;
    
    if (!condition) {
      return res.status(400).json({ 
        success: false,
        error: 'Condition is required' 
      });
    }
    
    // Validate that combatant exists
    const combatantCheck = await db.query(
      'SELECT id FROM combatants WHERE id = $1',
      [id]
    );
    
    if (combatantCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Combatant not found' 
      });
    }
    
    // Add condition
    const result = await db.query(
      `INSERT INTO combatant_conditions (combatant_id, condition)
       VALUES ($1, $2)
       RETURNING *`,
      [id, condition]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/combatants/:id/conditions/:conditionId
 * Remove a condition from a combatant
 */
router.delete('/:id/conditions/:conditionId', async (req, res, next) => {
  try {
    const { id, conditionId } = req.params;
    
    // Delete condition
    const result = await db.query(
      `DELETE FROM combatant_conditions 
       WHERE id = $1 AND combatant_id = $2
       RETURNING *`,
      [conditionId, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Condition not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/combatants/:id/conditions
 * Get all conditions for a combatant
 */
router.get('/:id/conditions', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT * FROM combatant_conditions 
       WHERE combatant_id = $1
       ORDER BY applied_at`,
      [id]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
