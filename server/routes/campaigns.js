const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');

/**
 * Retry helper for database operations
 * Implements exponential backoff for transient errors
 */
async function retryOperation(operation, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable (connection errors, timeouts)
      const isRetryable = 
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        error.message.includes('Connection terminated') ||
        error.message.includes('connection timeout');
      
      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * GET /api/campaigns
 * Get all campaigns
 */
router.get('/', async (req, res, next) => {
  try {
    const campaigns = await retryOperation(() => Campaign.findAll());
    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    next({
      status: 503,
      message: 'Database connection error. Please try again.',
      details: error.message
    });
  }
});

/**
 * GET /api/campaigns/:id
 * Get campaign by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const campaign = await retryOperation(() => Campaign.findById(req.params.id));
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    res.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    next({
      status: 503,
      message: 'Database connection error. Please try again.',
      details: error.message
    });
  }
});

/**
 * GET /api/campaigns/:id/state
 * Get complete campaign state (for export/restore)
 */
router.get('/:id/state', async (req, res, next) => {
  try {
    const state = await retryOperation(() => Campaign.getCompleteState(req.params.id));
    res.json(state);
  } catch (error) {
    console.error('Error fetching campaign state:', error);
    
    if (error.message === 'Campaign not found') {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    next({
      status: 503,
      message: 'Database connection error. Please try again.',
      details: error.message
    });
  }
});

/**
 * POST /api/campaigns
 * Create a new campaign
 */
router.post('/', async (req, res, next) => {
  try {
    const campaign = await retryOperation(() => Campaign.create(req.body));
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    
    if (error.message.includes('Validation failed')) {
      return res.status(400).json({ error: error.message });
    }
    
    next({
      status: 503,
      message: 'Database connection error. Please try again.',
      details: error.message
    });
  }
});

/**
 * POST /api/campaigns/import
 * Import campaign from exported state
 */
router.post('/import', async (req, res, next) => {
  try {
    const campaign = await retryOperation(() => Campaign.restoreState(req.body));
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error importing campaign:', error);
    
    if (error.message.includes('Validation failed')) {
      return res.status(400).json({ error: error.message });
    }
    
    next({
      status: 503,
      message: 'Database connection error. Please try again.',
      details: error.message
    });
  }
});

/**
 * PUT /api/campaigns/:id
 * Update campaign
 */
router.put('/:id', async (req, res, next) => {
  try {
    const campaign = await retryOperation(() => Campaign.update(req.params.id, req.body));
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    res.json(campaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    
    if (error.message.includes('Validation failed')) {
      return res.status(400).json({ error: error.message });
    }
    
    next({
      status: 503,
      message: 'Database connection error. Please try again.',
      details: error.message
    });
  }
});

/**
 * PUT /api/campaigns/:id/touch
 * Touch campaign to update timestamp (for auto-save)
 */
router.put('/:id/touch', async (req, res, next) => {
  try {
    const campaign = await retryOperation(() => Campaign.touch(req.params.id));
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    res.json(campaign);
  } catch (error) {
    console.error('Error touching campaign:', error);
    next({
      status: 503,
      message: 'Database connection error. Please try again.',
      details: error.message
    });
  }
});

/**
 * DELETE /api/campaigns/:id
 * Delete campaign
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const campaign = await retryOperation(() => Campaign.delete(req.params.id));
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    res.json({ message: 'Campaign deleted successfully', campaign });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    next({
      status: 503,
      message: 'Database connection error. Please try again.',
      details: error.message
    });
  }
});

module.exports = router;
