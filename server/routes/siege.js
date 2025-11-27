const express = require('express');
const router = express.Router();
const SiegeState = require('../models/SiegeState');

/**
 * GET /api/siege
 * Get siege state for a campaign with notes
 */
router.get('/', async (req, res, next) => {
  try {
    const campaignId = req.query.campaign_id || 1;
    const siegeState = await SiegeState.findByCampaignWithNotes(campaignId);
    
    res.json({
      success: true,
      data: siegeState
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/siege
 * Update siege state values
 */
router.put('/', async (req, res, next) => {
  try {
    const campaignId = req.body.campaign_id || 1;
    const updates = req.body;
    
    // Remove campaign_id from updates object
    delete updates.campaign_id;
    
    const siegeState = await SiegeState.update(campaignId, updates);
    
    res.json({
      success: true,
      data: siegeState
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/siege/notes
 * Add a note to siege state
 */
router.post('/notes', async (req, res, next) => {
  try {
    const campaignId = req.body.campaign_id || 1;
    const { note_text } = req.body;
    
    const note = await SiegeState.addNote(campaignId, note_text);
    
    res.status(201).json({
      success: true,
      data: note
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/siege/notes/:id
 * Delete a siege note
 */
router.delete('/notes/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const note = await SiegeState.deleteNote(id);
    
    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }
    
    res.json({
      success: true,
      data: note
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/siege/reset
 * Reset siege state to defaults
 */
router.post('/reset', async (req, res, next) => {
  try {
    const campaignId = req.body.campaign_id || 1;
    const siegeState = await SiegeState.reset(campaignId);
    
    res.json({
      success: true,
      data: siegeState
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/siege/custom-metrics
 * Add or update a custom metric
 */
router.post('/custom-metrics', async (req, res, next) => {
  try {
    const campaignId = req.body.campaign_id || 1;
    const { metric_name, metric_value } = req.body;
    
    if (!metric_name) {
      return res.status(400).json({
        success: false,
        error: 'Metric name is required'
      });
    }
    
    const siegeState = await SiegeState.addCustomMetric(campaignId, metric_name, metric_value);
    
    res.json({
      success: true,
      data: siegeState
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/siege/custom-metrics/:name
 * Remove a custom metric
 */
router.delete('/custom-metrics/:name', async (req, res, next) => {
  try {
    const campaignId = req.query.campaign_id || 1;
    const { name } = req.params;
    
    const siegeState = await SiegeState.removeCustomMetric(campaignId, name);
    
    res.json({
      success: true,
      data: siegeState
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
