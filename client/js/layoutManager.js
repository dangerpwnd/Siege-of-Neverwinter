// Layout configuration manager for column-based grid system

import api from './api.js';
import state from './state.js';

class LayoutManager {
    constructor() {
        this.moduleGrid = null;
        this.columnCount = 3; // Default column count
        this.saveTimeout = null;
    }

    // Initialize layout manager
    async init() {
        console.log('Initializing layout manager...');
        
        this.moduleGrid = document.querySelector('.module-grid');
        if (!this.moduleGrid) {
            console.error('Module grid not found');
            return;
        }
        
        // Load layout configuration from backend
        await this.loadLayoutConfiguration();
        
        // Create layout configuration UI
        this.createLayoutConfigUI();
        
        // Apply the loaded configuration
        this.applyColumnCount(this.columnCount);
        
        // Subscribe to state changes for auto-save
        state.subscribe((newState, oldState) => {
            if (newState.layoutConfiguration !== oldState.layoutConfiguration) {
                this.debouncedSave();
            }
        });
    }

    // Load layout configuration from backend
    async loadLayoutConfiguration() {
        try {
            const campaignId = state.get('currentCampaignId');
            const config = await api.getLayoutConfiguration(campaignId);
            
            this.columnCount = config.columnCount || 3;
            
            // Store in state
            state.setState({ 
                layoutConfiguration: {
                    columnCount: this.columnCount,
                    modulePositions: config.modulePositions || []
                }
            });
            
            console.log('Layout configuration loaded:', config);
        } catch (error) {
            console.error('Failed to load layout configuration:', error);
            // Use default configuration
            this.columnCount = 3;
        }
    }

    // Save layout configuration to backend (debounced)
    debouncedSave() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        
        this.saveTimeout = setTimeout(() => {
            this.saveLayoutConfiguration();
        }, 1000); // Save 1 second after last change
    }

    // Save layout configuration to backend
    async saveLayoutConfiguration() {
        try {
            const campaignId = state.get('currentCampaignId');
            const layoutConfiguration = state.get('layoutConfiguration') || {
                columnCount: this.columnCount,
                modulePositions: []
            };
            
            await api.updateLayoutConfiguration({
                campaign_id: campaignId,
                layoutConfiguration
            });
            
            console.log('Layout configuration saved');
            
            // Dispatch event for other components
            window.dispatchEvent(new CustomEvent('layoutConfigurationSaved', {
                detail: { layoutConfiguration }
            }));
        } catch (error) {
            console.error('Failed to save layout configuration:', error);
        }
    }

    // Create layout configuration UI in the header
    createLayoutConfigUI() {
        const headerControls = document.querySelector('.header-controls');
        if (!headerControls) {
            console.error('Header controls not found');
            return;
        }
        
        // Create layout config container
        const layoutConfigContainer = document.createElement('div');
        layoutConfigContainer.className = 'layout-config-container';
        layoutConfigContainer.setAttribute('role', 'group');
        layoutConfigContainer.setAttribute('aria-label', 'Layout configuration');
        
        // Create label
        const label = document.createElement('label');
        label.htmlFor = 'column-count-selector';
        label.textContent = 'Columns:';
        label.className = 'layout-config-label';
        
        // Create column count selector
        const selector = document.createElement('select');
        selector.id = 'column-count-selector';
        selector.className = 'column-count-selector';
        selector.setAttribute('aria-label', 'Select number of columns for layout');
        
        // Add options
        [2, 3, 4].forEach(count => {
            const option = document.createElement('option');
            option.value = count;
            option.textContent = `${count} Columns`;
            if (count === this.columnCount) {
                option.selected = true;
            }
            selector.appendChild(option);
        });
        
        // Add event listener
        selector.addEventListener('change', (e) => {
            const newColumnCount = parseInt(e.target.value);
            this.setColumnCount(newColumnCount);
        });
        
        layoutConfigContainer.appendChild(label);
        layoutConfigContainer.appendChild(selector);
        
        // Insert before the settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            headerControls.insertBefore(layoutConfigContainer, settingsBtn);
        } else {
            headerControls.appendChild(layoutConfigContainer);
        }
    }

    // Set column count and apply to grid
    setColumnCount(count) {
        if (![2, 3, 4].includes(count)) {
            console.error('Invalid column count:', count);
            return;
        }
        
        this.columnCount = count;
        this.applyColumnCount(count);
        
        // Update state
        const currentConfig = state.get('layoutConfiguration') || {};
        state.setState({
            layoutConfiguration: {
                ...currentConfig,
                columnCount: count
            }
        });
        
        // Announce to screen readers
        if (window.siegeAccessibility) {
            window.siegeAccessibility.announceStatus(`Layout changed to ${count} columns`);
        }
        
        // Show visual feedback
        this.showColumnCountFeedback(count);
    }

    // Apply column count to CSS Grid
    applyColumnCount(count) {
        if (!this.moduleGrid) return;
        
        // Update CSS Grid template columns
        this.moduleGrid.style.gridTemplateColumns = `repeat(${count}, 1fr)`;
        
        // Add a data attribute for CSS targeting
        this.moduleGrid.setAttribute('data-column-count', count);
        
        console.log(`Applied ${count} column layout`);
    }

    // Show visual feedback for column count change
    showColumnCountFeedback(count) {
        // Create feedback element
        const feedback = document.createElement('div');
        feedback.className = 'layout-feedback';
        feedback.setAttribute('role', 'status');
        feedback.setAttribute('aria-live', 'polite');
        feedback.textContent = `Layout: ${count} Columns`;
        
        // Add to body
        document.body.appendChild(feedback);
        
        // Trigger animation
        setTimeout(() => {
            feedback.classList.add('show');
        }, 10);
        
        // Remove after animation
        setTimeout(() => {
            feedback.classList.remove('show');
            setTimeout(() => {
                feedback.remove();
            }, 300);
        }, 2000);
    }

    // Get current column count
    getColumnCount() {
        return this.columnCount;
    }

    // Reset to default layout
    resetLayout() {
        this.setColumnCount(3);
        
        // Clear module positions
        const currentConfig = state.get('layoutConfiguration') || {};
        state.setState({
            layoutConfiguration: {
                ...currentConfig,
                modulePositions: []
            }
        });
    }
}

export default new LayoutManager();
