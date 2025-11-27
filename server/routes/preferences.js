const express = require('express');
const router = express.Router();
const db = require('../../database/db');

// GET /api/preferences - Get all preferences for a campaign
router.get('/', async (req, res) => {
  try {
    const campaignId = req.query.campaign_id || 1;
    
    const result = await db.query(
      'SELECT preference_key, preference_value FROM user_preferences WHERE campaign_id = $1',
      [campaignId]
    );
    
    // Convert array of preferences to object
    const preferences = {};
    result.rows.forEach(row => {
      preferences[row.preference_key] = row.preference_value;
    });
    
    res.json(preferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// PUT /api/preferences - Update preferences for a campaign
router.put('/', async (req, res) => {
  try {
    const { campaign_id = 1, preferences } = req.body;
    
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ error: 'Preferences object is required' });
    }
    
    // Use a transaction to update all preferences atomically
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update or insert each preference
      for (const [key, value] of Object.entries(preferences)) {
        await client.query(
          `INSERT INTO user_preferences (campaign_id, preference_key, preference_value, updated_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
           ON CONFLICT (campaign_id, preference_key)
           DO UPDATE SET preference_value = $3, updated_at = CURRENT_TIMESTAMP`,
          [campaign_id, key, JSON.stringify(value)]
        );
      }
      
      await client.query('COMMIT');
      
      res.json({ success: true, message: 'Preferences updated successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

module.exports = router;
