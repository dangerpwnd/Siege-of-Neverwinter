const express = require('express');
const router = express.Router();
const db = require('../../database/db');

// GET /api/layout - Get layout configuration for a campaign
router.get('/', async (req, res) => {
  try {
    const campaignId = req.query.campaign_id || 1;
    
    const result = await db.query(
      'SELECT preference_value FROM user_preferences WHERE campaign_id = $1 AND preference_key = $2',
      [campaignId, 'layoutConfiguration']
    );
    
    if (result.rows.length === 0) {
      // Return default layout configuration
      return res.json({
        columnCount: 3,
        modulePositions: []
      });
    }
    
    res.json(result.rows[0].preference_value);
  } catch (error) {
    console.error('Error fetching layout configuration:', error);
    res.status(500).json({ error: 'Failed to fetch layout configuration' });
  }
});

// PUT /api/layout - Update layout configuration for a campaign
router.put('/', async (req, res) => {
  try {
    const { campaign_id = 1, layoutConfiguration } = req.body;
    
    if (!layoutConfiguration || typeof layoutConfiguration !== 'object') {
      return res.status(400).json({ error: 'Layout configuration object is required' });
    }
    
    // Validate layout configuration
    if (layoutConfiguration.columnCount && 
        ![2, 3, 4].includes(layoutConfiguration.columnCount)) {
      return res.status(400).json({ error: 'Column count must be 2, 3, or 4' });
    }
    
    // Update or insert layout configuration
    await db.query(
      `INSERT INTO user_preferences (campaign_id, preference_key, preference_value, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (campaign_id, preference_key)
       DO UPDATE SET preference_value = $3, updated_at = CURRENT_TIMESTAMP`,
      [campaign_id, 'layoutConfiguration', JSON.stringify(layoutConfiguration)]
    );
    
    res.json({ success: true, message: 'Layout configuration updated successfully' });
  } catch (error) {
    console.error('Error updating layout configuration:', error);
    res.status(500).json({ error: 'Failed to update layout configuration' });
  }
});

module.exports = router;
