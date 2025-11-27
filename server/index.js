const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// API Routes (to be implemented in future tasks)
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/combatants', require('./routes/combatants'));
app.use('/api/characters', require('./routes/characters'));
app.use('/api/npcs', require('./routes/npcs'));
app.use('/api/monsters', require('./routes/monsters'));
app.use('/api/initiative', require('./routes/initiative'));
app.use('/api/siege', require('./routes/siege'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/plotpoints', require('./routes/plotpoints'));
app.use('/api/preferences', require('./routes/preferences'));
app.use('/api/layout', require('./routes/layout'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Siege of Neverwinter API is running' });
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Error handling middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// 404 handler for undefined API routes (must be after all other routes)
app.use('/api/*', notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Siege of Neverwinter server running on port ${PORT}`);
  console.log(`Access the application at http://localhost:${PORT}`);
});

module.exports = app;
