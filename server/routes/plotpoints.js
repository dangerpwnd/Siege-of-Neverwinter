const express = require('express');
const router = express.Router();
const PlotPoint = require('../models/PlotPoint');

/**
 * GET /api/plotpoints
 * Get all plot points for a campaign
 */
router.get('/', async (req, res, next) => {
  try {
    const campaignId = req.query.campaign_id || 1;
    const plotPoints = await PlotPoint.findByCampaign(campaignId);
    
    res.json({
      success: true,
      data: plotPoints
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/plotpoints/:id
 * Get a specific plot point with location details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const plotPoint = await PlotPoint.findByIdWithLocation(id);
    
    if (!plotPoint) {
      return res.status(404).json({
        success: false,
        error: 'Plot point not found'
      });
    }
    
    res.json({
      success: true,
      data: plotPoint
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/plotpoints
 * Create a new plot point
 */
router.post('/', async (req, res, next) => {
  try {
    const plotPointData = req.body;
    const plotPoint = await PlotPoint.create(plotPointData);
    
    res.status(201).json({
      success: true,
      data: plotPoint
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/plotpoints/:id
 * Update a plot point
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const plotPoint = await PlotPoint.update(id, updates);
    
    if (!plotPoint) {
      return res.status(404).json({
        success: false,
        error: 'Plot point not found'
      });
    }
    
    res.json({
      success: true,
      data: plotPoint
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/plotpoints/:id
 * Delete a plot point
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const plotPoint = await PlotPoint.delete(id);
    
    if (!plotPoint) {
      return res.status(404).json({
        success: false,
        error: 'Plot point not found'
      });
    }
    
    res.json({
      success: true,
      data: plotPoint
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
