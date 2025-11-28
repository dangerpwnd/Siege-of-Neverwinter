const express = require('express');
const router = express.Router();
const db = require('../../database/db');

/**
 * GET /api/reference/races
 * Get all available races grouped by family
 */
router.get('/races', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT id, name, race_family
      FROM races
      ORDER BY race_family, name
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reference/classes
 * Get all available classes
 */
router.get('/classes', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT id, name
      FROM classes
      ORDER BY name
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reference/subclasses
 * Get all subclasses, optionally filtered by class
 */
router.get('/subclasses', async (req, res, next) => {
  try {
    const { class_name } = req.query;
    
    let query = `
      SELECT s.id, s.name, s.class_id, c.name as class_name
      FROM subclasses s
      JOIN classes c ON s.class_id = c.id
    `;
    
    const params = [];
    
    if (class_name) {
      query += ' WHERE c.name = $1';
      params.push(class_name);
    }
    
    query += ' ORDER BY c.name, s.name';
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reference/backgrounds
 * Get all available backgrounds
 */
router.get('/backgrounds', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT id, name
      FROM backgrounds
      ORDER BY name
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
