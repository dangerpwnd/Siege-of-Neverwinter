/**
 * Siege Mechanics Component
 * Manages siege-specific resources, metrics, and notes
 */

import api from './api.js';
import state from './state.js';

class SiegeMechanics {
    constructor() {
        this.container = document.getElementById('siege-content');
        this.siegeState = null;
        this.init();
    }

    init() {
        this.render();
        this.loadSiegeState();
        
        // Subscribe to state changes
        state.subscribe((newState, oldState) => {
            if (newState.siegeState !== oldState.siegeState) {
                this.siegeState = newState.siegeState;
                this.render();
            }
        });
    }

    /**
     * Load siege state from the server
     */
    async loadSiegeState() {
        try {
            const campaignId = state.get('currentCampaignId');
            const response = await api.get(`/siege?campaign_id=${campaignId}`);
            
            if (response.success && response.data) {
                this.siegeState = response.data;
                state.setState({ siegeState: response.data });
            }
        } catch (error) {
            console.error('Failed to load siege state:', error);
        }
    }

    /**
     * Update a siege value
     */
    async updateSiegeValue(key, value) {
        try {
            const campaignId = state.get('currentCampaignId');
            const updates = {
                campaign_id: campaignId,
                [key]: value
            };
            
            const response = await api.put('/siege', updates);
            
            if (response.success && response.data) {
                await this.loadSiegeState(); // Reload to get updated state
            }
        } catch (error) {
            console.error('Failed to update siege value:', error);
            alert('Failed to update siege value');
        }
    }

    /**
     * Add a note with timestamp
     */
    async addNote(noteText) {
        try {
            const campaignId = state.get('currentCampaignId');
            const response = await api.post('/siege/notes', {
                campaign_id: campaignId,
                note_text: noteText
            });
            
            if (response.success) {
                await this.loadSiegeState(); // Reload to get updated notes
            }
        } catch (error) {
            console.error('Failed to add note:', error);
            alert('Failed to add note');
        }
    }

    /**
     * Delete a note
     */
    async deleteNote(noteId) {
        try {
            console.log('Deleting note with ID:', noteId);
            const response = await api.delete(`/siege/notes/${noteId}`);
            console.log('Delete response:', response);
            
            if (response.success) {
                console.log('Note deleted successfully, reloading state');
                await this.loadSiegeState(); // Reload to get updated notes
            } else {
                console.error('Delete failed:', response);
                alert('Failed to delete note');
            }
        } catch (error) {
            console.error('Failed to delete note:', error);
            alert(`Error deleting note: ${error.message}`);
        }
    }

    /**
     * Add or update custom metric
     */
    async addCustomMetric(metricName, metricValue) {
        try {
            const campaignId = state.get('currentCampaignId');
            const response = await api.post('/siege/custom-metrics', {
                campaign_id: campaignId,
                metric_name: metricName,
                metric_value: metricValue
            });
            
            if (response.success) {
                await this.loadSiegeState();
            }
        } catch (error) {
            console.error('Failed to add custom metric:', error);
            alert('Failed to add custom metric');
        }
    }

    /**
     * Remove custom metric
     */
    async removeCustomMetric(metricName) {
        try {
            const campaignId = state.get('currentCampaignId');
            const response = await api.delete(`/siege/custom-metrics/${metricName}?campaign_id=${campaignId}`);
            
            if (response.success) {
                await this.loadSiegeState();
            }
        } catch (error) {
            console.error('Failed to remove custom metric:', error);
        }
    }

    /**
     * Format timestamp for display
     */
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString();
    }

    /**
     * Render siege status display
     */
    renderSiegeStatus() {
        if (!this.siegeState) {
            return '<div class="loading">Loading siege state...</div>';
        }

        const customMetrics = typeof this.siegeState.custom_metrics === 'string'
            ? JSON.parse(this.siegeState.custom_metrics)
            : this.siegeState.custom_metrics || {};

        return `
            <div class="siege-status">
                <h3>Siege Status - Day ${this.siegeState.day_of_siege}</h3>
                
                <div class="siege-metrics">
                    <div class="metric-item">
                        <label>Wall Integrity</label>
                        <div class="metric-control">
                            <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value="${this.siegeState.wall_integrity}"
                                data-metric="wall_integrity"
                                class="metric-slider"
                            />
                            <span class="metric-value">${this.siegeState.wall_integrity}%</span>
                        </div>
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: ${this.siegeState.wall_integrity}%"></div>
                        </div>
                    </div>

                    <div class="metric-item">
                        <label>Defender Morale</label>
                        <div class="metric-control">
                            <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value="${this.siegeState.defender_morale}"
                                data-metric="defender_morale"
                                class="metric-slider"
                            />
                            <span class="metric-value">${this.siegeState.defender_morale}%</span>
                        </div>
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: ${this.siegeState.defender_morale}%"></div>
                        </div>
                    </div>

                    <div class="metric-item">
                        <label>Supplies</label>
                        <div class="metric-control">
                            <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value="${this.siegeState.supplies}"
                                data-metric="supplies"
                                class="metric-slider"
                            />
                            <span class="metric-value">${this.siegeState.supplies}%</span>
                        </div>
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: ${this.siegeState.supplies}%"></div>
                        </div>
                    </div>

                    <div class="metric-item">
                        <label>Day of Siege</label>
                        <div class="metric-control">
                            <input 
                                type="number" 
                                min="1" 
                                value="${this.siegeState.day_of_siege}"
                                data-metric="day_of_siege"
                                class="metric-input"
                            />
                        </div>
                    </div>
                </div>

                ${Object.keys(customMetrics).length > 0 ? `
                    <div class="custom-metrics">
                        <h4>Custom Metrics</h4>
                        ${Object.entries(customMetrics).map(([name, value]) => `
                            <div class="custom-metric-item">
                                <span class="metric-name">${name}:</span>
                                <span class="metric-value">${value}</span>
                                <button class="btn-icon" data-action="remove-metric" data-name="${name}" title="Remove">×</button>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <div class="siege-actions">
                    <button class="btn btn-secondary" data-action="add-custom-metric">Add Custom Metric</button>
                </div>
            </div>
        `;
    }

    /**
     * Render siege notes
     */
    renderSiegeNotes() {
        if (!this.siegeState || !this.siegeState.notes) {
            return '';
        }

        return `
            <div class="siege-notes">
                <h3>Siege Notes</h3>
                
                <div class="note-input">
                    <textarea 
                        id="new-note-text" 
                        placeholder="Add a note about the siege..."
                        rows="3"
                    ></textarea>
                    <button class="btn btn-primary" data-action="add-note">Add Note</button>
                </div>

                <div class="notes-list">
                    ${this.siegeState.notes.length === 0 ? `
                        <p class="no-notes">No notes yet</p>
                    ` : this.siegeState.notes.map(note => `
                        <div class="note-item">
                            <div class="note-header">
                                <span class="note-timestamp">${this.formatTimestamp(note.created_at)}</span>
                                <button class="btn-icon" data-action="delete-note" data-id="${note.id}" title="Delete">×</button>
                            </div>
                            <div class="note-text">${note.note_text}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render the siege mechanics component
     */
    render() {
        this.container.innerHTML = `
            <div class="high-contrast-module siege-mechanics">
                ${this.renderSiegeStatus()}
                ${this.renderSiegeNotes()}
            </div>
        `;

        // Add event listeners
        this.setupEventListeners();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Metric sliders
        const sliders = this.container.querySelectorAll('.metric-slider');
        sliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                const metric = e.target.dataset.metric;
                const value = parseInt(e.target.value);
                
                // Update display immediately
                const valueSpan = e.target.parentElement.querySelector('.metric-value');
                if (valueSpan) {
                    valueSpan.textContent = `${value}%`;
                }
                
                const fillBar = e.target.parentElement.nextElementSibling?.querySelector('.metric-fill');
                if (fillBar) {
                    fillBar.style.width = `${value}%`;
                }
            });

            slider.addEventListener('change', (e) => {
                const metric = e.target.dataset.metric;
                const value = parseInt(e.target.value);
                this.updateSiegeValue(metric, value);
            });
        });

        // Day of siege input
        const dayInput = this.container.querySelector('input[data-metric="day_of_siege"]');
        if (dayInput) {
            dayInput.addEventListener('change', (e) => {
                const value = parseInt(e.target.value);
                if (value >= 1) {
                    this.updateSiegeValue('day_of_siege', value);
                }
            });
        }

        // Button actions
        this.container.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            
            if (action === 'add-note') {
                const textarea = document.getElementById('new-note-text');
                if (textarea && textarea.value.trim()) {
                    this.addNote(textarea.value.trim());
                    textarea.value = '';
                }
            } else if (action === 'delete-note') {
                const noteId = e.target.dataset.id;
                console.log('Delete note button clicked, ID:', noteId);
                if (confirm('Delete this note?')) {
                    console.log('User confirmed deletion');
                    this.deleteNote(noteId);
                } else {
                    console.log('User cancelled deletion');
                }
            } else if (action === 'add-custom-metric') {
                this.showAddCustomMetricDialog();
            } else if (action === 'remove-metric') {
                const metricName = e.target.dataset.name;
                if (confirm(`Remove custom metric "${metricName}"?`)) {
                    this.removeCustomMetric(metricName);
                }
            }
        });
    }

    /**
     * Show dialog to add custom metric
     */
    showAddCustomMetricDialog() {
        const metricName = prompt('Enter metric name:');
        if (!metricName || !metricName.trim()) return;

        const metricValue = prompt('Enter metric value:');
        if (metricValue === null) return;

        this.addCustomMetric(metricName.trim(), metricValue);
    }
}

// Export singleton instance
export default new SiegeMechanics();
