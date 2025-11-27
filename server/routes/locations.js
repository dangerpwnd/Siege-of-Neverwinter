const express = require('express');
const router = express.Router();
const Location = require('../models/Location');

/**
 * GET /api/locations
 * Get all locations for a campaign with plot points
 */
router.get('/', async (req, res, next) => {
  try {
    const campaignId = req.query.campaign_id || 1;
    const locations = await Location.findByCampaignWithPlotPoints(campaignId);
    
    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/locations/:id
 * Get a specific location with plot points
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const location = await Location.findByIdWithPlotPoints(id);
    
    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Location not found'
      });
    }
    
    res.json({
      success: true,
      data: location
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/locations
 * Create a new location
 */
router.post('/', async (req, res, next) => {
  try {
    const campaignId = req.body.campaign_id || 1;
    const locationData = req.body;
    
    const location = await Location.create(campaignId, locationData);
    
    res.status(201).json({
      success: true,
      data: location
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/locations/:id
 * Update a location
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const location = await Location.update(id, updates);
    
    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Location not found'
      });
    }
    
    res.json({
      success: true,
      data: location
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/locations/:id
 * Delete a location
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const location = await Location.delete(id);
    
    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Location not found'
      });
    }
    
    res.json({
      success: true,
      data: location
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
