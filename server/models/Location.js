const db = require('../../database/db');

/**
 * Location Model
 * Handles database operations for city map locations
 */

class Location {
  /**
   * Validate location data
   */
  static validate(data) {
    const errors = [];

    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push('Name is required and must be a non-empty string');
    }

    if (data.status !== undefined && !['controlled', 'contested', 'enemy', 'destroyed'].includes(data.status)) {
      errors.push('Status must be one of: controlled, contested, enemy, destroyed');
    }

    if (data.coord_x !== undefined && typeof data.coord_x !== 'number') {
      errors.push('coord_x must be a number');
    }

    if (data.coord_y !== undefined && typeof data.coord_y !== 'number') {
      errors.push('coord_y must be a number');
    }

    if (data.coord_width !== undefined && typeof data.coord_width !== 'number') {
      errors.push('coord_width must be a number');
    }

    if (data.coord_height !== undefined && typeof data.coord_height !== 'number') {
      errors.push('coord_height must be a number');
    }

    return errors;
  }

  /**
   * Create a new location
   */
  static async create(campaignId, data) {
    const errors = this.validate(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const query = `
      INSERT INTO locations (
        campaign_id, name, status, description,
        coord_x, coord_y, coord_width, coord_height
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      campaignId,
      data.name,
      data.status || 'controlled',
      data.description || null,
      data.coord_x || null,
      data.coord_y || null,
      data.coord_width || null,
      data.coord_height || null
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Get location by ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM locations WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get all locations for a campaign
   */
  static async findByCampaign(campaignId) {
    const query = 'SELECT * FROM locations WHERE campaign_id = $1 ORDER BY name ASC';
    const result = await db.query(query, [campaignId]);
    return result.rows;
  }

  /**
   * Update location
   */
  static async update(id, data) {
    const errors = [];
    
    if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim() === '')) {
      errors.push('Name must be a non-empty string');
    }

    if (data.status !== undefined && !['controlled', 'contested', 'enemy', 'destroyed'].includes(data.status)) {
      errors.push('Status must be one of: controlled, contested, enemy, destroyed');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(data[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const query = `UPDATE locations SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Update location status
   */
  static async updateStatus(id, status) {
    if (!['controlled', 'contested', 'enemy', 'destroyed'].includes(status)) {
      throw new Error('Status must be one of: controlled, contested, enemy, destroyed');
    }

    return await this.update(id, { status });
  }

  /**
   * Delete location
   */
  static async delete(id) {
    const query = 'DELETE FROM locations WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get location with plot points
   */
  static async findByIdWithPlotPoints(id) {
    const locationQuery = 'SELECT * FROM locations WHERE id = $1';
    const plotPointsQuery = 'SELECT * FROM plot_points WHERE location_id = $1 ORDER BY created_at DESC';

    const locationResult = await db.query(locationQuery, [id]);
    if (locationResult.rows.length === 0) {
      return null;
    }

    const plotPointsResult = await db.query(plotPointsQuery, [id]);
    
    const location = locationResult.rows[0];
    location.plot_points = plotPointsResult.rows;

    return location;
  }

  /**
   * Get all locations for a campaign with plot points
   */
  static async findByCampaignWithPlotPoints(campaignId) {
    const query = `
      SELECT l.*,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', pp.id,
                   'name', pp.name,
                   'description', pp.description,
                   'status', pp.status,
                   'coord_x', pp.coord_x,
                   'coord_y', pp.coord_y,
                   'created_at', pp.created_at
                 ) ORDER BY pp.created_at DESC
               ) FILTER (WHERE pp.id IS NOT NULL),
               '[]'
             ) as plot_points
      FROM locations l
      LEFT JOIN plot_points pp ON l.id = pp.location_id
      WHERE l.campaign_id = $1
      GROUP BY l.id
      ORDER BY l.name ASC
    `;

    const result = await db.query(query, [campaignId]);
    return result.rows;
  }

  /**
   * Get locations by status
   */
  static async findByStatus(campaignId, status) {
    if (!['controlled', 'contested', 'enemy', 'destroyed'].includes(status)) {
      throw new Error('Status must be one of: controlled, contested, enemy, destroyed');
    }

    const query = 'SELECT * FROM locations WHERE campaign_id = $1 AND status = $2 ORDER BY name ASC';
    const result = await db.query(query, [campaignId, status]);
    return result.rows;
  }
}

module.exports = Location;
