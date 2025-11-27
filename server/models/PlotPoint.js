const db = require('../../database/db');

/**
 * PlotPoint Model
 * Handles database operations for plot points on the city map
 */

class PlotPoint {
  /**
   * Validate plot point data
   */
  static validate(data) {
    const errors = [];

    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push('Name is required and must be a non-empty string');
    }

    if (!data.location_id || typeof data.location_id !== 'number') {
      errors.push('location_id is required and must be a number');
    }

    if (data.status !== undefined && !['active', 'completed', 'failed'].includes(data.status)) {
      errors.push('Status must be one of: active, completed, failed');
    }

    if (data.coord_x !== undefined && typeof data.coord_x !== 'number') {
      errors.push('coord_x must be a number');
    }

    if (data.coord_y !== undefined && typeof data.coord_y !== 'number') {
      errors.push('coord_y must be a number');
    }

    return errors;
  }

  /**
   * Create a new plot point
   */
  static async create(data) {
    const errors = this.validate(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const query = `
      INSERT INTO plot_points (
        location_id, name, description, status, coord_x, coord_y
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      data.location_id,
      data.name,
      data.description || null,
      data.status || 'active',
      data.coord_x || null,
      data.coord_y || null
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Get plot point by ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM plot_points WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get all plot points for a location
   */
  static async findByLocation(locationId) {
    const query = 'SELECT * FROM plot_points WHERE location_id = $1 ORDER BY created_at DESC';
    const result = await db.query(query, [locationId]);
    return result.rows;
  }

  /**
   * Get all plot points for a campaign
   */
  static async findByCampaign(campaignId) {
    const query = `
      SELECT pp.*
      FROM plot_points pp
      JOIN locations l ON pp.location_id = l.id
      WHERE l.campaign_id = $1
      ORDER BY pp.created_at DESC
    `;

    const result = await db.query(query, [campaignId]);
    return result.rows;
  }

  /**
   * Update plot point
   */
  static async update(id, data) {
    const errors = [];
    
    if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim() === '')) {
      errors.push('Name must be a non-empty string');
    }

    if (data.status !== undefined && !['active', 'completed', 'failed'].includes(data.status)) {
      errors.push('Status must be one of: active, completed, failed');
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
    const query = `UPDATE plot_points SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Update plot point status
   */
  static async updateStatus(id, status) {
    if (!['active', 'completed', 'failed'].includes(status)) {
      throw new Error('Status must be one of: active, completed, failed');
    }

    return await this.update(id, { status });
  }

  /**
   * Delete plot point
   */
  static async delete(id) {
    const query = 'DELETE FROM plot_points WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get plot points by status
   */
  static async findByStatus(campaignId, status) {
    if (!['active', 'completed', 'failed'].includes(status)) {
      throw new Error('Status must be one of: active, completed, failed');
    }

    const query = `
      SELECT pp.*
      FROM plot_points pp
      JOIN locations l ON pp.location_id = l.id
      WHERE l.campaign_id = $1 AND pp.status = $2
      ORDER BY pp.created_at DESC
    `;

    const result = await db.query(query, [campaignId, status]);
    return result.rows;
  }

  /**
   * Get plot point with location details
   */
  static async findByIdWithLocation(id) {
    const query = `
      SELECT pp.*, 
             json_build_object(
               'id', l.id,
               'name', l.name,
               'status', l.status,
               'description', l.description
             ) as location
      FROM plot_points pp
      JOIN locations l ON pp.location_id = l.id
      WHERE pp.id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }
}

module.exports = PlotPoint;
