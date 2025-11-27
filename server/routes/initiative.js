const express = require('express');
const router = express.Router();
const Combatant = require('../models/Combatant');

/**
 * GET /api/initiative
 * Get all combatants in initiative order for a campaign
 */
router.get('/', async (req, res, next) => {
  try {
    const campaignId = req.query.campaign_id || 1;
    const combatants = await Combatant.findByCampaignWithConditions(campaignId);
    
    res.json({
      success: true,
      data: combatants
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/initiative
 * Add a new combatant to initiative tracker
 */
router.post('/', async (req, res, next) => {
  try {
    const campaignId = req.body.campaign_id || 1;
    const combatantData = req.body;
    
    const combatant = await Combatant.create(campaignId, combatantData);
    
    res.status(201).json({
      success: true,
      data: combatant
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/initiative/:id
 * Update a combatant's initiative or other properties
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const combatant = await Combatant.update(id, updates);
    
    if (!combatant) {
      return res.status(404).json({
        success: false,
        error: 'Combatant not found'
      });
    }
    
    res.json({
      success: true,
      data: combatant
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/initiative/:id
 * Remove a combatant from initiative tracker
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const deleted = await Combatant.delete(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Combatant not found'
      });
    }
    
    res.json({
      success: true,
      data: deleted
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
