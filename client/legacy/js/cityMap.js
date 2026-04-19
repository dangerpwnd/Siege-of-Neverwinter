/**
 * City Map Component
 * Displays interactive map of Neverwinter with locations and plot points
 * Implements lazy loading for plot points
 */

import api from './api.js';
import state from './state.js';
import { debounce } from './debounce.js';

class CityMap {
    constructor() {
        this.container = document.getElementById('map-content');
        this.locations = [];
        this.selectedLocation = null;
        this.plotPointsCache = new Map(); // Cache plot points per location
        
        // Debounced status update
        this.debouncedStatusUpdate = debounce(this.updateLocationStatusAPI.bind(this), 500);
        
        this.init();
    }

    init() {
        this.render();
        this.loadLocations();
        
        // Subscribe to state changes
        state.subscribe((newState, oldState) => {
            if (newState.locations !== oldState.locations) {
                this.locations = newState.locations || [];
                this.render();
            }
        });
    }

    /**
     * Load locations (without plot points for performance)
     * Plot points are lazy-loaded when a location is selected
     */
    async loadLocations() {
        try {
            const campaignId = state.get('currentCampaignId');
            
            // Use caching with 5 minute TTL for locations
            const response = await api.request(`/locations?campaign_id=${campaignId}`, {
                cacheTTL: 300000 // 5 minutes
            });
            
            if (response.success && response.data) {
                this.locations = response.data;
                state.setState({ locations: response.data });
            }
        } catch (error) {
            console.error('Failed to load locations:', error);
        }
    }

    /**
     * Lazy load plot points for a specific location
     */
    async loadPlotPoints(locationId) {
        // Check cache first
        if (this.plotPointsCache.has(locationId)) {
            return this.plotPointsCache.get(locationId);
        }

        try {
            const response = await api.get(`/plotpoints?location_id=${locationId}`);
            
            if (response.success && response.data) {
                this.plotPointsCache.set(locationId, response.data);
                return response.data;
            }
        } catch (error) {
            console.error('Failed to load plot points:', error);
            return [];
        }
    }

    /**
     * Add a plot point to a location
     */
    async addPlotPoint(locationId, plotPointData) {
        try {
            const data = {
                ...plotPointData,
                location_id: locationId
            };
            
            const response = await api.post('/plotpoints', data);
            
            if (response.success) {
                await this.loadLocations(); // Reload to get updated data
            }
        } catch (error) {
            console.error('Failed to add plot point:', error);
            alert('Failed to add plot point');
        }
    }

    /**
     * Update location status (debounced)
     */
    async updateLocationStatus(locationId, status) {
        // Update local state immediately for responsive UI
        const location = this.locations.find(l => l.id === locationId);
        if (location) {
            location.status = status;
            this.render();
        }
        
        // Debounce the API call
        this.debouncedStatusUpdate(locationId, status);
    }

    /**
     * Internal method for API update (called by debounced function)
     */
    async updateLocationStatusAPI(locationId, status) {
        try {
            const response = await api.put(`/locations/${locationId}`, { status });
            
            if (response.success) {
                await this.loadLocations();
            }
        } catch (error) {
            console.error('Failed to update location status:', error);
            alert('Failed to update location status');
        }
    }

    /**
     * Update plot point status
     */
    async updatePlotPointStatus(plotPointId, status) {
        try {
            const response = await api.put(`/plotpoints/${plotPointId}`, { status });
            
            if (response.success) {
                await this.loadLocations();
            }
        } catch (error) {
            console.error('Failed to update plot point status:', error);
        }
    }

    /**
     * Delete plot point
     */
    async deletePlotPoint(plotPointId) {
        try {
            const response = await api.delete(`/plotpoints/${plotPointId}`);
            
            if (response.success) {
                await this.loadLocations();
            }
        } catch (error) {
            console.error('Failed to delete plot point:', error);
        }
    }

    /**
     * Get status color
     */
    getStatusColor(status) {
        const colors = {
            'controlled': '#28a745',
            'contested': '#ffc107',
            'enemy': '#dc3545',
            'destroyed': '#6c757d',
            'active': '#007bff',
            'completed': '#28a745',
            'failed': '#dc3545'
        };
        return colors[status] || '#6c757d';
    }

    /**
     * Get status icon
     */
    getStatusIcon(status) {
        const icons = {
            'controlled': '✓',
            'contested': '⚔',
            'enemy': '✕',
            'destroyed': '💥',
            'active': '●',
            'completed': '✓',
            'failed': '✕'
        };
        return icons[status] || '●';
    }

    /**
     * Select a location
     */
    selectLocation(locationId) {
        const location = this.locations.find(l => l.id === locationId);
        if (location) {
            this.selectedLocation = location;
            this.render();
        }
    }

    /**
     * Clear location selection
     */
    clearSelection() {
        this.selectedLocation = null;
        this.render();
    }

    /**
     * Render location details
     */
    renderLocationDetails(location) {
        const plotPoints = Array.isArray(location.plot_points) 
            ? location.plot_points 
            : [];

        return `
            <div class="location-details">
                <div class="location-header">
                    <h3>${location.name}</h3>
                    <button class="btn btn-secondary back-btn" data-action="back">← Back to Map</button>
                </div>

                <div class="location-info">
                    <div class="info-row">
                        <span class="info-label">Status:</span>
                        <span class="status-badge" style="background-color: ${this.getStatusColor(location.status)}">
                            ${this.getStatusIcon(location.status)} ${location.status}
                        </span>
                    </div>
                    ${location.description ? `
                        <div class="info-row">
                            <span class="info-label">Description:</span>
                            <span>${location.description}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="location-actions">
                    <label>Change Status:</label>
                    <select data-action="change-status" data-id="${location.id}">
                        <option value="controlled" ${location.status === 'controlled' ? 'selected' : ''}>Controlled</option>
                        <option value="contested" ${location.status === 'contested' ? 'selected' : ''}>Contested</option>
                        <option value="enemy" ${location.status === 'enemy' ? 'selected' : ''}>Enemy</option>
                        <option value="destroyed" ${location.status === 'destroyed' ? 'selected' : ''}>Destroyed</option>
                    </select>
                </div>

                <div class="plot-points-section">
                    <div class="section-header">
                        <h4>Plot Points</h4>
                        <button class="btn btn-primary btn-sm" data-action="add-plot-point" data-location-id="${location.id}">
                            Add Plot Point
                        </button>
                    </div>

                    ${plotPoints.length === 0 ? `
                        <p class="no-plot-points">No plot points at this location</p>
                    ` : `
                        <div class="plot-points-list">
                            ${plotPoints.map(pp => `
                                <div class="plot-point-item">
                                    <div class="plot-point-header">
                                        <span class="plot-point-name">${pp.name}</span>
                                        <span class="status-badge" style="background-color: ${this.getStatusColor(pp.status)}">
                                            ${this.getStatusIcon(pp.status)} ${pp.status}
                                        </span>
                                    </div>
                                    ${pp.description ? `
                                        <div class="plot-point-description">${pp.description}</div>
                                    ` : ''}
                                    <div class="plot-point-actions">
                                        <select data-action="change-plot-status" data-id="${pp.id}" class="status-select">
                                            <option value="active" ${pp.status === 'active' ? 'selected' : ''}>Active</option>
                                            <option value="completed" ${pp.status === 'completed' ? 'selected' : ''}>Completed</option>
                                            <option value="failed" ${pp.status === 'failed' ? 'selected' : ''}>Failed</option>
                                        </select>
                                        <button class="btn-icon" data-action="delete-plot-point" data-id="${pp.id}" title="Delete">×</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    /**
     * Render map view
     */
    renderMapView() {
        if (this.locations.length === 0) {
            return `
                <div class="map-empty">
                    <p>No locations defined for this campaign</p>
                </div>
            `;
        }

        // Group locations by status
        const byStatus = {
            controlled: this.locations.filter(l => l.status === 'controlled'),
            contested: this.locations.filter(l => l.status === 'contested'),
            enemy: this.locations.filter(l => l.status === 'enemy'),
            destroyed: this.locations.filter(l => l.status === 'destroyed')
        };

        return `
            <div class="city-map-view">
                <h3>Neverwinter - Siege Map</h3>
                
                <div class="map-legend">
                    <div class="legend-item">
                        <span class="legend-color" style="background-color: ${this.getStatusColor('controlled')}"></span>
                        <span>Controlled</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color" style="background-color: ${this.getStatusColor('contested')}"></span>
                        <span>Contested</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color" style="background-color: ${this.getStatusColor('enemy')}"></span>
                        <span>Enemy</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color" style="background-color: ${this.getStatusColor('destroyed')}"></span>
                        <span>Destroyed</span>
                    </div>
                </div>

                <div class="locations-grid">
                    ${Object.entries(byStatus).map(([status, locs]) => `
                        ${locs.length > 0 ? `
                            <div class="status-group">
                                <h4>${status.charAt(0).toUpperCase() + status.slice(1)}</h4>
                                <div class="location-cards">
                                    ${locs.map(loc => {
                                        const plotPoints = Array.isArray(loc.plot_points) ? loc.plot_points : [];
                                        const activePlots = plotPoints.filter(pp => pp.status === 'active').length;
                                        
                                        return `
                                            <div class="location-card" data-id="${loc.id}" style="border-left: 4px solid ${this.getStatusColor(loc.status)}">
                                                <div class="location-card-header">
                                                    <span class="location-card-name">${loc.name}</span>
                                                    ${activePlots > 0 ? `<span class="plot-count">${activePlots} active</span>` : ''}
                                                </div>
                                                ${loc.description ? `
                                                    <div class="location-card-description">${loc.description}</div>
                                                ` : ''}
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        ` : ''}
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render the city map component
     */
    render() {
        if (this.selectedLocation) {
            this.container.innerHTML = this.renderLocationDetails(this.selectedLocation);
        } else {
            this.container.innerHTML = this.renderMapView();
        }

        // Add event listeners
        this.setupEventListeners();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Location card clicks
        const locationCards = this.container.querySelectorAll('.location-card');
        locationCards.forEach(card => {
            card.addEventListener('click', () => {
                const locationId = parseInt(card.dataset.id);
                this.selectLocation(locationId);
            });
        });

        // Back button
        const backBtn = this.container.querySelector('[data-action="back"]');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.clearSelection());
        }

        // Change location status
        const statusSelect = this.container.querySelector('[data-action="change-status"]');
        if (statusSelect) {
            statusSelect.addEventListener('change', (e) => {
                const locationId = parseInt(e.target.dataset.id);
                const newStatus = e.target.value;
                this.updateLocationStatus(locationId, newStatus);
            });
        }

        // Change plot point status
        const plotStatusSelects = this.container.querySelectorAll('[data-action="change-plot-status"]');
        plotStatusSelects.forEach(select => {
            select.addEventListener('change', (e) => {
                const plotPointId = parseInt(e.target.dataset.id);
                const newStatus = e.target.value;
                this.updatePlotPointStatus(plotPointId, newStatus);
            });
        });

        // Add plot point
        const addPlotBtn = this.container.querySelector('[data-action="add-plot-point"]');
        if (addPlotBtn) {
            addPlotBtn.addEventListener('click', () => {
                const locationId = parseInt(addPlotBtn.dataset.locationId);
                this.showAddPlotPointDialog(locationId);
            });
        }

        // Delete plot point
        const deleteBtns = this.container.querySelectorAll('[data-action="delete-plot-point"]');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const plotPointId = parseInt(btn.dataset.id);
                if (confirm('Delete this plot point?')) {
                    this.deletePlotPoint(plotPointId);
                }
            });
        });
    }

    /**
     * Show dialog to add plot point
     */
    showAddPlotPointDialog(locationId) {
        const name = prompt('Plot point name:');
        if (!name || !name.trim()) return;

        const description = prompt('Description (optional):');

        const plotPointData = {
            name: name.trim(),
            description: description?.trim() || null,
            status: 'active'
        };

        this.addPlotPoint(locationId, plotPointData);
    }
}

// Export singleton instance
export default new CityMap();
