const express = require('express');
const router = express.Router();
const Monster = require('../models/Monster');

/**
 * GET /api/monsters
 * Get all monsters for a campaign with optional filtering
 */
router.get('/', async (req, res, next) => {
  try {
    const campaignId = req.query.campaign_id || 1; // Default to campaign 1
    const filter = req.query.name ? { name: req.query.name } : null;
    
    const monsters = await Monster.findByCampaign(campaignId, filter);
    
    res.json({
      success: true,
      data: monsters
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/monsters/:id
 * Get a specific monster by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const monster = await Monster.findById(id);
    
    if (!monster) {
      return res.status(404).json({
        success: false,
        error: 'Monster not found'
      });
    }
    
    res.json({
      success: true,
      data: monster
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/monsters
 * Create a new monster template
 */
router.post('/', async (req, res, next) => {
  try {
    const campaignId = req.body.campaign_id || 1; // Default to campaign 1
    const monsterData = req.body;
    
    const monster = await Monster.create(campaignId, monsterData);
    
    res.status(201).json({
      success: true,
      data: monster
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/monsters/:id
 * Update a monster template
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const monster = await Monster.update(id, updates);
    
    if (!monster) {
      return res.status(404).json({
        success: false,
        error: 'Monster not found'
      });
    }
    
    res.json({
      success: true,
      data: monster
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/monsters/:id
 * Delete a monster template
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const monster = await Monster.delete(id);
    
    if (!monster) {
      return res.status(404).json({
        success: false,
        error: 'Monster not found'
      });
    }
    
    res.json({
      success: true,
      data: monster
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/monsters/:id/instances
 * Create a combat-ready instance of a monster
 */
router.post('/:id/instances', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { instance_name, initiative } = req.body;
    
    const instance = await Monster.createInstance(
      id,
      instance_name,
      initiative || 0
    );
    
    res.status(201).json({
      success: true,
      data: instance
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/monsters/:id/instances
 * Get all instances of a monster
 */
router.get('/:id/instances', async (req, res, next) => {
  try {
    const { id } = req.params;
    const instances = await Monster.getInstances(id);
    
    res.json({
      success: true,
      data: instances
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
