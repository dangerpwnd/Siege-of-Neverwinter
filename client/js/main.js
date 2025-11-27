// Main application entry point

import api from './api.js';
import state from './state.js';
import moduleManager from './moduleManager.js';
import layoutManager from './layoutManager.js';
import initiativeTracker from './initiativeTracker.js';
import characterPanel from './characterPanel.js';
import npcPanel from './npcPanel.js';
import conditionManager from './conditionManager.js';
import monsterDatabase from './monsterDatabase.js';
import siegeMechanics from './siegeMechanics.js';
import aiAssistant from './aiAssistant.js';
import cityMap from './cityMap.js';
import { accessibilityManager } from './accessibility.js';
import './campaignManager.js'; // Campaign manager is loaded as a global

class SiegeOfNeverwinterApp {
    constructor() {
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        console.log('Initializing Siege of Neverwinter application...');

        try {
            // Check API health
            await this.checkAPIHealth();

            // Initialize campaign manager (loads last active campaign)
            const campaignId = await window.campaignManager.initialize();
            state.setState({ currentCampaignId: campaignId });

            // Initialize layout manager (must be before module manager)
            await layoutManager.init();

            // Initialize module system
            await moduleManager.init();

            // Set up event listeners
            this.setupEventListeners();

            // Subscribe to state changes
            this.subscribeToState();

            // Load initial data
            await this.loadInitialData();

            this.initialized = true;
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to initialize application. Please check your connection.');
        }
    }

    async checkAPIHealth() {
        try {
            const health = await api.healthCheck();
            console.log('API Health:', health);
        } catch (error) {
            console.error('API health check failed:', error);
            throw new Error('Cannot connect to server');
        }
    }



    setupEventListeners() {
        // Save button
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveCampaign());
        }

        // Settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openSettings());
        }

        // Campaign selector
        const campaignSelector = document.getElementById('campaign-selector');
        if (campaignSelector) {
            campaignSelector.addEventListener('change', async (e) => {
                const campaignId = parseInt(e.target.value);
                if (campaignId) {
                    try {
                        await window.campaignManager.loadCampaign(campaignId);
                    } catch (error) {
                        this.showError('Failed to load campaign');
                    }
                }
            });
        }

        // New campaign button
        const newCampaignBtn = document.getElementById('new-campaign-btn');
        if (newCampaignBtn) {
            newCampaignBtn.addEventListener('click', async () => {
                try {
                    await window.campaignManager.resetCampaign();
                    await this.updateCampaignSelector();
                } catch (error) {
                    this.showError('Failed to create new campaign');
                }
            });
        }

        // Export campaign button
        const exportBtn = document.getElementById('export-campaign-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', async () => {
                try {
                    await window.campaignManager.exportCampaign();
                    this.showSuccess('Campaign exported successfully');
                } catch (error) {
                    this.showError('Failed to export campaign');
                }
            });
        }

        // Import campaign button
        const importBtn = document.getElementById('import-campaign-btn');
        const importFileInput = document.getElementById('import-file-input');
        if (importBtn && importFileInput) {
            importBtn.addEventListener('click', () => {
                importFileInput.click();
            });

            importFileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        await window.campaignManager.importCampaign(file);
                        await this.updateCampaignSelector();
                        this.showSuccess('Campaign imported successfully');
                    } catch (error) {
                        this.showError('Failed to import campaign');
                    }
                    // Reset file input
                    importFileInput.value = '';
                }
            });
        }

        // Campaign change events
        window.addEventListener('campaignChanged', async (e) => {
            console.log('Campaign changed:', e.detail);
            state.setState({ currentCampaignId: e.detail.campaignId });
            await this.updateCampaignSelector();
            await this.loadInitialData();
        });

        // Campaign saved events
        window.addEventListener('campaignSaved', (e) => {
            console.log('Campaign saved:', e.detail);
            this.showSuccess('Campaign saved successfully');
        });

        // Mark modifications for auto-save
        window.addEventListener('dataModified', () => {
            window.campaignManager.markModified();
        });
    }

    subscribeToState() {
        // Subscribe to state changes for reactive updates
        state.subscribe((newState, oldState) => {
            console.log('State updated:', newState);
            // Future tasks will implement specific update handlers
        });
    }

    async loadInitialData() {
        console.log('Loading initial data...');
        
        try {
            const campaignId = state.get('currentCampaignId');
            
            // Load characters
            const characters = await api.getCharacters(campaignId);
            state.setState({ characters });
            
            // Load NPCs
            const npcs = await api.getNPCs(campaignId);
            state.setState({ npcs });
            
            // Update campaign selector
            await this.updateCampaignSelector();
            
            console.log('Initial data loaded');
        } catch (error) {
            console.error('Failed to load initial data:', error);
        }
    }

    async updateCampaignSelector() {
        try {
            const campaigns = await window.campaignManager.getAllCampaigns();
            const currentCampaignId = window.campaignManager.getCurrentCampaignId();
            
            const selector = document.getElementById('campaign-selector');
            if (selector) {
                selector.innerHTML = campaigns.map(campaign => 
                    `<option value="${campaign.id}" ${campaign.id === currentCampaignId ? 'selected' : ''}>
                        ${campaign.name}
                    </option>`
                ).join('');
            }
        } catch (error) {
            console.error('Failed to update campaign selector:', error);
        }
    }

    async saveCampaign() {
        console.log('Saving campaign...');
        
        try {
            // Show loading state
            const saveBtn = document.getElementById('save-btn');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Saving...';
            saveBtn.disabled = true;

            // Use campaign manager to save
            await window.campaignManager.save();

            // Show success
            saveBtn.textContent = 'Saved!';
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
            }, 1500);

            console.log('Campaign saved successfully');
        } catch (error) {
            console.error('Failed to save campaign:', error);
            this.showError('Failed to save campaign');
            
            // Reset button state
            const saveBtn = document.getElementById('save-btn');
            if (saveBtn) {
                saveBtn.textContent = 'Save';
                saveBtn.disabled = false;
            }
        }
    }

    openSettings() {
        console.log('Opening settings...');
        // Settings UI will be implemented in future tasks
        alert('Settings panel coming soon!');
    }

    showError(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error notification';
        errorDiv.setAttribute('role', 'alert');
        errorDiv.setAttribute('aria-live', 'assertive');
        errorDiv.textContent = message;
        
        const main = document.querySelector('.app-main');
        main.insertBefore(errorDiv, main.firstChild);

        // Announce to screen readers
        accessibilityManager.announce(message, 'assertive');

        // Auto-remove after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    showSuccess(message) {
        // Create success notification
        const successDiv = document.createElement('div');
        successDiv.className = 'success notification';
        successDiv.setAttribute('role', 'status');
        successDiv.setAttribute('aria-live', 'polite');
        successDiv.textContent = message;
        
        const main = document.querySelector('.app-main');
        main.insertBefore(successDiv, main.firstChild);

        // Announce to screen readers
        accessibilityManager.announceStatus(message);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    showLoading(container, message = 'Loading...') {
        accessibilityManager.showLoadingIndicator(container, message);
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new SiegeOfNeverwinterApp();
    app.init();
    
    // Make app available globally for debugging
    window.siegeApp = app;
    window.siegeState = state;
    window.siegeAPI = api;
    window.siegeModuleManager = moduleManager;
    window.siegeLayoutManager = layoutManager;
    window.siegeInitiative = initiativeTracker;
    window.siegeCharacterPanel = characterPanel;
    window.siegeNPCPanel = npcPanel;
    window.siegeConditionManager = conditionManager;
    window.siegeMonsterDatabase = monsterDatabase;
    window.siegeMechanics = siegeMechanics;
    window.siegeAIAssistant = aiAssistant;
    window.siegeCityMap = cityMap;
    window.siegeAccessibility = accessibilityManager;
    // campaignManager is already available as window.campaignManager
});
