// Module visibility, positioning, and resizing manager

import api from './api.js';
import state from './state.js';

class ModuleManager {
    constructor() {
        this.modules = new Map();
        this.saveTimeout = null;
        this.hiddenModules = new Set();
    }

    // Initialize module system
    async init() {
        console.log('Initializing module manager...');
        
        // Load preferences from backend
        await this.loadPreferences();
        
        // Set up all modules
        this.setupModules();
        
        // Apply saved preferences
        this.applyPreferences();
        
        // Subscribe to state changes for auto-save
        state.subscribe((newState, oldState) => {
            if (newState.moduleVisibility !== oldState.moduleVisibility ||
                newState.modulePositions !== oldState.modulePositions ||
                newState.moduleSizes !== oldState.moduleSizes) {
                this.debouncedSave();
            }
        });
    }

    // Load preferences from backend
    async loadPreferences() {
        try {
            const campaignId = state.get('currentCampaignId');
            const preferences = await api.getPreferences(campaignId);
            
            if (preferences.moduleVisibility) {
                state.setState({ moduleVisibility: preferences.moduleVisibility });
            }
            
            if (preferences.modulePositions) {
                state.setState({ modulePositions: preferences.modulePositions });
            }
            
            if (preferences.moduleSizes) {
                state.setState({ moduleSizes: preferences.moduleSizes });
            }
            
            console.log('Preferences loaded:', preferences);
        } catch (error) {
            console.error('Failed to load preferences:', error);
        }
    }

    // Save preferences to backend (debounced)
    debouncedSave() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        
        this.saveTimeout = setTimeout(() => {
            this.savePreferences();
        }, 1000); // Save 1 second after last change
    }

    // Save preferences to backend
    async savePreferences() {
        try {
            const campaignId = state.get('currentCampaignId');
            const preferences = {
                moduleVisibility: state.get('moduleVisibility'),
                modulePositions: state.get('modulePositions'),
                moduleSizes: state.get('moduleSizes'),
            };
            
            await api.updatePreferences({
                campaign_id: campaignId,
                preferences
            });
            
            console.log('Preferences saved');
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }

    // Set up all modules
    setupModules() {
        const moduleElements = document.querySelectorAll('.module');
        
        moduleElements.forEach(moduleEl => {
            const moduleId = moduleEl.dataset.module;
            const toggleBtn = moduleEl.querySelector('.module-toggle');
            const content = moduleEl.querySelector('.module-content');
            const header = moduleEl.querySelector('.module-header');
            
            this.modules.set(moduleId, {
                element: moduleEl,
                toggleBtn,
                content,
                header,
                id: moduleId,
                isExpanded: false,
                isHidden: false
            });
            
            // Set up toggle functionality
            if (toggleBtn && content) {
                toggleBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleModule(moduleId);
                });
            }
            
            // Add module control buttons (expand/shrink, close)
            this.addModuleControls(moduleEl, moduleId);
        });
        
        // Create module picker for adding hidden modules back
        this.createModulePicker();
    }
    
    // Add control buttons to module header
    addModuleControls(moduleEl, moduleId) {
        const header = moduleEl.querySelector('.module-header');
        if (!header) return;
        
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'module-controls';
        
        // Expand/Shrink button
        const expandBtn = document.createElement('button');
        expandBtn.className = 'module-control-btn expand-btn';
        expandBtn.innerHTML = '⛶';
        expandBtn.title = 'Expand to full column width';
        expandBtn.setAttribute('aria-label', 'Expand module to full column width');
        expandBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleExpand(moduleId);
        });
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'module-control-btn close-btn';
        closeBtn.innerHTML = '×';
        closeBtn.title = 'Hide module';
        closeBtn.setAttribute('aria-label', 'Hide module');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hideModule(moduleId);
        });
        
        controlsContainer.appendChild(expandBtn);
        controlsContainer.appendChild(closeBtn);
        
        // Insert before toggle button
        const toggleBtn = header.querySelector('.module-toggle');
        if (toggleBtn) {
            header.insertBefore(controlsContainer, toggleBtn);
        } else {
            header.appendChild(controlsContainer);
        }
    }
    

    // Toggle module expansion
    toggleExpand(moduleId) {
        const module = this.modules.get(moduleId);
        if (!module) return;
        
        module.isExpanded = !module.isExpanded;
        
        if (module.isExpanded) {
            // Expand to full column width
            module.element.classList.add('module-expanded');
            const expandBtn = module.element.querySelector('.expand-btn');
            if (expandBtn) {
                expandBtn.innerHTML = '⛶';
                expandBtn.title = 'Shrink to normal width';
                expandBtn.setAttribute('aria-label', 'Shrink module to normal width');
            }
            
            // Announce to screen readers
            if (window.siegeAccessibility) {
                window.siegeAccessibility.announceStatus(`${moduleId} module expanded`);
            }
        } else {
            // Shrink to normal width
            module.element.classList.remove('module-expanded');
            const expandBtn = module.element.querySelector('.expand-btn');
            if (expandBtn) {
                expandBtn.innerHTML = '⛶';
                expandBtn.title = 'Expand to full column width';
                expandBtn.setAttribute('aria-label', 'Expand module to full column width');
            }
            
            // Announce to screen readers
            if (window.siegeAccessibility) {
                window.siegeAccessibility.announceStatus(`${moduleId} module shrunk`);
            }
        }
        
        // Save state
        const modulePositions = state.get('modulePositions') || {};
        if (!modulePositions[moduleId]) {
            modulePositions[moduleId] = {};
        }
        modulePositions[moduleId].isExpanded = module.isExpanded;
        state.setState({ modulePositions });
    }
    
    // Hide a module
    hideModule(moduleId) {
        const module = this.modules.get(moduleId);
        if (!module) return;
        
        module.element.classList.add('module-hidden');
        module.isHidden = true;
        this.hiddenModules.add(moduleId);
        
        // Update module picker
        this.updateModulePicker();
        
        // Save visibility state
        state.setModuleVisibility(moduleId, false);
        
        // Announce to screen readers
        if (window.siegeAccessibility) {
            window.siegeAccessibility.announceStatus(`${moduleId} module hidden`);
        }
    }
    
    // Show a hidden module
    showModule(moduleId) {
        const module = this.modules.get(moduleId);
        if (!module) return;
        
        module.element.classList.remove('module-hidden');
        module.isHidden = false;
        this.hiddenModules.delete(moduleId);
        
        // Update module picker
        this.updateModulePicker();
        
        // Save visibility state
        state.setModuleVisibility(moduleId, true);
        
        // Announce to screen readers
        if (window.siegeAccessibility) {
            window.siegeAccessibility.announceStatus(`${moduleId} module shown`);
        }
    }
    
    // Create module picker UI
    createModulePicker() {
        const headerControls = document.querySelector('.header-controls');
        if (!headerControls) return;
        
        const pickerContainer = document.createElement('div');
        pickerContainer.className = 'module-picker-container';
        
        const pickerBtn = document.createElement('button');
        pickerBtn.id = 'module-picker-btn';
        pickerBtn.className = 'btn btn-secondary';
        pickerBtn.innerHTML = '<span aria-hidden="true">+ Add Module</span>';
        pickerBtn.setAttribute('aria-label', 'Add hidden modules back to dashboard');
        pickerBtn.title = 'Add hidden modules';
        
        const pickerDropdown = document.createElement('div');
        pickerDropdown.id = 'module-picker-dropdown';
        pickerDropdown.className = 'module-picker-dropdown';
        pickerDropdown.setAttribute('role', 'menu');
        pickerDropdown.setAttribute('aria-label', 'Hidden modules');
        
        pickerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            pickerDropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!pickerContainer.contains(e.target)) {
                pickerDropdown.classList.remove('show');
            }
        });
        
        pickerContainer.appendChild(pickerBtn);
        pickerContainer.appendChild(pickerDropdown);
        
        // Insert before settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            headerControls.insertBefore(pickerContainer, settingsBtn);
        } else {
            headerControls.appendChild(pickerContainer);
        }
        
        this.updateModulePicker();
    }
    
    // Update module picker dropdown with hidden modules
    updateModulePicker() {
        const dropdown = document.getElementById('module-picker-dropdown');
        const pickerBtn = document.getElementById('module-picker-btn');
        if (!dropdown || !pickerBtn) return;
        
        dropdown.innerHTML = '';
        
        if (this.hiddenModules.size === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'module-picker-empty';
            emptyMsg.textContent = 'No hidden modules';
            dropdown.appendChild(emptyMsg);
            pickerBtn.disabled = true;
        } else {
            pickerBtn.disabled = false;
            
            this.hiddenModules.forEach(moduleId => {
                const module = this.modules.get(moduleId);
                if (!module) return;
                
                const item = document.createElement('button');
                item.className = 'module-picker-item';
                item.setAttribute('role', 'menuitem');
                
                // Get module title
                const title = module.header?.querySelector('h2')?.textContent || moduleId;
                item.textContent = title;
                
                item.addEventListener('click', () => {
                    this.showModule(moduleId);
                    dropdown.classList.remove('show');
                });
                
                dropdown.appendChild(item);
            });
        }
    }

    // Apply saved preferences to modules
    applyPreferences() {
        const modulePositions = state.get('modulePositions') || {};
        
        this.modules.forEach((module, moduleId) => {
            // Apply visibility
            const isVisible = state.isModuleVisible(moduleId);
            if (!isVisible) {
                module.content.classList.add('collapsed');
                module.toggleBtn.textContent = '+';
                this.hideModule(moduleId);
            } else {
                module.content.classList.remove('collapsed');
                module.toggleBtn.textContent = '−';
            }
            
            // Apply position (column-based)
            const position = modulePositions[moduleId];
            if (position) {
                if (position.column !== undefined) {
                    module.element.style.gridColumn = `${position.column + 1}`;
                }
                
                if (position.isExpanded) {
                    module.isExpanded = true;
                    module.element.classList.add('module-expanded');
                    const expandBtn = module.element.querySelector('.expand-btn');
                    if (expandBtn) {
                        expandBtn.innerHTML = '⛶';
                        expandBtn.title = 'Shrink to normal width';
                    }
                }
            }
        });
        
        this.updateModulePicker();
    }

    // Toggle module visibility
    toggleModule(moduleId) {
        const module = this.modules.get(moduleId);
        if (!module) return;
        
        const isCollapsed = module.content.classList.contains('collapsed');
        
        if (isCollapsed) {
            module.content.classList.remove('collapsed');
            module.toggleBtn.textContent = '−';
            module.toggleBtn.setAttribute('aria-expanded', 'true');
            state.setModuleVisibility(moduleId, true);
            
            // Announce to screen readers
            if (window.siegeAccessibility) {
                window.siegeAccessibility.announceStatus(`${moduleId} module expanded`);
            }
        } else {
            module.content.classList.add('collapsed');
            module.toggleBtn.textContent = '+';
            module.toggleBtn.setAttribute('aria-expanded', 'false');
            state.setModuleVisibility(moduleId, false);
            
            // Announce to screen readers
            if (window.siegeAccessibility) {
                window.siegeAccessibility.announceStatus(`${moduleId} module collapsed`);
            }
        }
    }



    // Get module visibility state
    getModuleVisibility(moduleId) {
        return state.isModuleVisible(moduleId);
    }

    // Get all module visibility states
    getAllModuleVisibility() {
        const visibility = {};
        this.modules.forEach((module, moduleId) => {
            visibility[moduleId] = state.isModuleVisible(moduleId);
        });
        return visibility;
    }

    // Reset module to default position and size
    resetModule(moduleId) {
        const module = this.modules.get(moduleId);
        if (!module) return;
        
        module.element.style.gridColumn = '';
        module.element.classList.remove('module-expanded', 'module-hidden');
        module.isExpanded = false;
        module.isHidden = false;
        
        // Remove from hidden modules
        this.hiddenModules.delete(moduleId);
        
        // Update state
        const modulePositions = state.get('modulePositions') || {};
        delete modulePositions[moduleId];
        state.setState({ modulePositions });
        
        state.setModuleVisibility(moduleId, true);
        
        this.updateModulePicker();
    }

    // Reset all modules
    resetAllModules() {
        this.modules.forEach((module, moduleId) => {
            this.resetModule(moduleId);
        });
    }
}

export default new ModuleManager();
