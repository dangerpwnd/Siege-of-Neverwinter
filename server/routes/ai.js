/**
 * AI Routes - Express router for AI provider interactions.
 * Proxies AI requests through the backend to avoid exposing API keys client-side.
 */
const express = require('express');
const router = express.Router();
const ChatGPTProvider = require('../services/ChatGPTProvider');
const ClaudeProvider = require('../services/ClaudeProvider');
const db = require('../../database/db');

// Provider instances
const providers = {
  chatgpt: new ChatGPTProvider(),
  claude: new ClaudeProvider()
};

/**
 * Build the system prompt with campaign context.
 * Both providers receive the same system prompt content.
 */
function buildSystemPrompt(campaignContext) {
  let contextInfo = '';

  if (campaignContext) {
    if (campaignContext.siegeState) {
      const s = campaignContext.siegeState;
      contextInfo += `\nCurrent Siege Status:`;
      contextInfo += `\n- Day ${s.dayOfSiege || s.day_of_siege || 1} of the siege`;
      contextInfo += `\n- Wall Integrity: ${s.wallIntegrity ?? s.wall_integrity ?? 100}%`;
      contextInfo += `\n- Defender Morale: ${s.defenderMorale ?? s.defender_morale ?? 100}%`;
      contextInfo += `\n- Supplies: ${s.supplies ?? 100}%`;
    }

    if (campaignContext.combatants && campaignContext.combatants.length > 0) {
      const active = campaignContext.combatants.filter(c => c.current_hp > 0 || c.currentHP > 0);
      contextInfo += `\n\nActive Combatants: ${active.length}`;
      contextInfo += `\n- PCs: ${active.filter(c => c.type === 'PC').length}`;
      contextInfo += `\n- NPCs: ${active.filter(c => c.type === 'NPC').length}`;
      contextInfo += `\n- Monsters: ${active.filter(c => c.type === 'Monster').length}`;
    }
  }

  return `You are an experienced Dungeon Master running a D&D 5th edition campaign. \
The party of 5 adventurers is currently defending Neverwinter during a siege \
by the forces of Tiamat. Your role is to provide:

1. Narrative descriptions that enhance the siege atmosphere
2. Mechanical rulings consistent with D&D 5e rules
3. Tactical suggestions for both players and enemies
4. Descriptions of siege events and their consequences

Maintain a tone that is dramatic but not overwhelming, helpful but not \
hand-holding. The siege is desperate but not hopeless. Focus on making \
the players feel like heroes defending their city.
${contextInfo}

Provide concise, actionable responses that help the DM run an engaging game.`;
}

/**
 * POST /api/ai/message
 * Send a message to the active AI provider.
 * Body: { provider, apiKey, messages, campaignContext }
 */
router.post('/message', async (req, res) => {
  try {
    const { provider, apiKey, messages, campaignContext } = req.body;

    if (!provider || !providers[provider]) {
      return res.status(400).json({
        error: 'Invalid provider. Must be "chatgpt" or "claude".'
      });
    }

    if (!apiKey) {
      return res.status(400).json({
        error: 'API key is required.'
      });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Messages array is required and must not be empty.'
      });
    }

    const systemPrompt = buildSystemPrompt(campaignContext);
    const providerInstance = providers[provider];

    const response = await providerInstance.sendMessage(messages, systemPrompt, apiKey);

    res.json({ response, provider });
  } catch (error) {
    console.error(`AI message error (${req.body?.provider}):`, error.message);
    res.status(500).json({
      error: error.message,
      provider: req.body?.provider
    });
  }
});

/**
 * POST /api/ai/validate-key
 * Validate an API key for a specific provider.
 * Body: { provider, apiKey }
 */
router.post('/validate-key', async (req, res) => {
  try {
    const { provider, apiKey } = req.body;

    if (!provider || !providers[provider]) {
      return res.status(400).json({
        error: 'Invalid provider. Must be "chatgpt" or "claude".'
      });
    }

    if (!apiKey) {
      return res.status(400).json({
        error: 'API key is required.'
      });
    }

    const providerInstance = providers[provider];
    const result = await providerInstance.validateApiKey(apiKey);

    res.json(result);
  } catch (error) {
    console.error(`API key validation error (${req.body?.provider}):`, error.message);
    res.status(500).json({
      valid: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai/provider
 * Retrieve the current AI provider preference for a campaign.
 * Query: ?campaign_id=1
 */
router.get('/provider', async (req, res) => {
  try {
    const campaignId = req.query.campaign_id || 1;

    const result = await db.query(
      'SELECT preference_value FROM user_preferences WHERE campaign_id = $1 AND preference_key = $2',
      [campaignId, 'aiProvider']
    );

    if (result.rows.length === 0) {
      return res.json({ provider: 'chatgpt' }); // default
    }

    const provider = JSON.parse(result.rows[0].preference_value);
    res.json({ provider });
  } catch (error) {
    console.error('Error fetching AI provider preference:', error);
    res.status(500).json({ error: 'Failed to fetch AI provider preference' });
  }
});

/**
 * PUT /api/ai/provider
 * Set the AI provider preference for a campaign.
 * Body: { provider: 'chatgpt' | 'claude', campaign_id: number }
 * Returns: { success: true, provider, clearHistory: true } when provider changes
 */
router.put('/provider', async (req, res) => {
  try {
    const { provider, campaign_id = 1 } = req.body;

    if (!provider || !['chatgpt', 'claude'].includes(provider)) {
      return res.status(400).json({
        error: 'Invalid provider. Must be "chatgpt" or "claude".'
      });
    }

    // Check current provider to determine if it changed
    const current = await db.query(
      'SELECT preference_value FROM user_preferences WHERE campaign_id = $1 AND preference_key = $2',
      [campaign_id, 'aiProvider']
    );

    const currentProvider = current.rows.length > 0
      ? JSON.parse(current.rows[0].preference_value)
      : 'chatgpt';

    const providerChanged = currentProvider !== provider;

    // Persist the provider preference
    await db.query(
      `INSERT INTO user_preferences (campaign_id, preference_key, preference_value, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (campaign_id, preference_key)
       DO UPDATE SET preference_value = $3, updated_at = CURRENT_TIMESTAMP`,
      [campaign_id, 'aiProvider', JSON.stringify(provider)]
    );

    res.json({
      success: true,
      provider,
      clearHistory: providerChanged
    });
  } catch (error) {
    console.error('Error updating AI provider preference:', error);
    res.status(500).json({ error: 'Failed to update AI provider preference' });
  }
});

module.exports = router;
module.exports.buildSystemPrompt = buildSystemPrompt;
