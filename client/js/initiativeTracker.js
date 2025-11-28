/**
 * Initiative Tracker Component
 * Manages turn order and combatant display
 */

import api from './api.js';
import state from './state.js';
import { debounce } from './debounce.js';

class InitiativeTracker {
    constructor() {
        this.container = document.getElementById('initiative-content');
        this.currentTurnIndex = 0;
        
        // Debounced update function to prevent excessive API calls
        this.debouncedUpdate = debounce(this.updateInitiativeAPI.bind(this), 500);
        
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.loadInitiative();
        
        // Subscribe to state changes
        state.subscribe((newState, oldState) => {
            if (newState.combatants !== oldState.combatants || 
                newState.currentTurnIndex !== oldState.currentTurnIndex) {
                this.render();
            }
        });
    }

    setupEventListeners() {
        // Event delegation for dynamic elements
        this.container.addEventListener('click', (e) => {
            // Remove combatant
            if (e.target.classList.contains('remove-combatant-btn')) {
                e.preventDefault();
                const id = parseInt(e.target.dataset.id);
                this.removeCombatant(id);
            }
            
            // Edit initiative
            if (e.target.classList.contains('edit-initiative-btn')) {
                e.preventDefault();
                const id = parseInt(e.target.dataset.id);
                this.editInitiative(id);
            }
            
            // HP adjustment buttons
            if (e.target.classList.contains('hp-btn-small')) {
                e.preventDefault();
                const id = parseInt(e.target.dataset.id);
                const change = parseInt(e.target.dataset.change);
                this.updateHP(id, change);
            }
            
            // Next turn button
            if (e.target.id === 'next-turn-btn') {
                e.preventDefault();
                this.nextTurn();
            }
            
            // Add combatant button
            if (e.target.id === 'add-combatant-btn') {
                e.preventDefault();
                this.showAddCombatantForm();
            }
            
            // Clear initiative button
            if (e.target.id === 'clear-initiative-btn') {
                e.preventDefault();
                this.clearInitiative();
            }
        });
        
        // HP input change
        this.container.addEventListener('change', (e) => {
            if (e.target.classList.contains('hp-input-small')) {
                const id = parseInt(e.target.dataset.id);
                const newHP = parseInt(e.target.value);
                this.setHP(id, newHP);
            }
        });
    }

    /**
     * Update HP by a relative amount
     */
    async updateHP(id, change) {
        try {
            const combatant = state.getCombatantById(id);
            if (!combatant) return;
            
            const newHP = Math.max(0, Math.min(combatant.current_hp + change, combatant.max_hp));
            await this.setHP(id, newHP);
        } catch (error) {
            console.error('Failed to update HP:', error);
        }
    }

    /**
     * Set HP to a specific value
     */
    async setHP(id, newHP) {
        try {
            const combatant = state.getCombatantById(id);
            if (!combatant) return;
            
            // Clamp HP between 0 and max
            const clampedHP = Math.max(0, Math.min(newHP, combatant.max_hp));
            
            // Update via API
            await api.put(`/initiative/${id}`, { 
                current_hp: clampedHP 
            });
            
            // Update state
            state.updateCombatant(id, { current_hp: clampedHP });
            
            this.render();
        } catch (error) {
            console.error('Failed to set HP:', error);
        }
    }

    async loadInitiative() {
        try {
            const campaignId = state.get('currentCampaignId');
            const response = await api.getInitiative(campaignId);
            
            if (response.success && response.data) {
                // Update state with loaded combatants
                state.setState({ combatants: response.data });
            }
        } catch (error) {
            console.error('Failed to load initiative:', error);
        }
    }

    /**
     * Add a combatant to the initiative tracker
     * Automatically sorts by initiative value
     */
    async addCombatant(combatantData) {
        try {
            const campaignId = state.get('currentCampaignId');
            const dataWithCampaign = { ...combatantData, campaign_id: campaignId };
            
            const response = await api.post('/initiative', dataWithCampaign);
            
            if (response.success && response.data) {
                // Add to state (state manager will handle sorting)
                state.addCombatant(response.data);
                return response.data;
            }
        } catch (error) {
            console.error('Failed to add combatant:', error);
            throw error;
        }
    }

    /**
     * Remove a combatant from the initiative tracker
     */
    async removeCombatant(id) {
        try {
            const response = await api.delete(`/initiative/${id}`);
            
            if (response.success) {
                // Remove from state
                state.removeCombatant(id);
            }
        } catch (error) {
            console.error('Failed to remove combatant:', error);
        }
    }

    /**
     * Advance to the next turn
     * Highlights the current active combatant
     */
    nextTurn() {
        state.nextTurn();
    }

    /**
     * Update a combatant's initiative value
     * Triggers automatic re-sorting
     * Uses debouncing to prevent excessive API calls
     */
    async updateInitiative(id, newInitiative) {
        // Update state immediately for responsive UI
        state.updateCombatant(id, { initiative: newInitiative });
        
        // Debounce the API call
        this.debouncedUpdate(id, newInitiative);
    }

    /**
     * Internal method for API update (called by debounced function)
     */
    async updateInitiativeAPI(id, newInitiative) {
        try {
            const response = await api.put(`/initiative/${id}`, { initiative: newInitiative });
            
            if (!response.success) {
                console.error('Failed to update initiative on server');
                // Could revert state here if needed
            }
        } catch (error) {
            console.error('Failed to update initiative:', error);
            // Could revert state here if needed
        }
    }

    /**
     * Edit initiative with inline input
     */
    editInitiative(id) {
        const combatant = state.getCombatantById(id);
        if (!combatant) return;

        const newInitiative = prompt(`Enter new initiative for ${combatant.name}:`, combatant.initiative);
        
        if (newInitiative !== null) {
            const initiative = parseInt(newInitiative);
            if (!isNaN(initiative)) {
                this.updateInitiative(id, initiative);
            } else {
                alert('Please enter a valid number');
            }
        }
    }

    /**
     * Get visual indicator class for combatant type
     */
    getTypeClass(type) {
        switch (type) {
            case 'PC':
                return 'type-pc';
            case 'NPC':
                return 'type-npc';
            case 'Monster':
                return 'type-monster';
            default:
                return '';
        }
    }

    /**
     * Get type badge HTML
     */
    getTypeBadge(type) {
        return `<span class="type-badge ${this.getTypeClass(type)}">${type}</span>`;
    }

    /**
     * Get condition indicators HTML
     */
    getConditionIndicators(conditions) {
        if (!conditions || conditions.length === 0) {
            return '';
        }

        return `
            <div class="condition-indicators">
                ${conditions.map(condition => {
                    const conditionName = typeof condition === 'string' ? condition : condition.condition;
                    return `<span class="condition-badge" title="${conditionName}">${this.getConditionAbbr(conditionName)}</span>`;
                }).join('')}
            </div>
        `;
    }

    /**
     * Get abbreviated condition name
     */
    getConditionAbbr(condition) {
        const abbrs = {
            'blinded': 'BLD',
            'charmed': 'CHM',
            'deafened': 'DEF',
            'frightened': 'FRT',
            'grappled': 'GRP',
            'incapacitated': 'INC',
            'invisible': 'INV',
            'paralyzed': 'PAR',
            'petrified': 'PTR',
            'poisoned': 'PSN',
            'prone': 'PRN',
            'restrained': 'RST',
            'stunned': 'STN',
            'unconscious': 'UNC'
        };
        return abbrs[condition.toLowerCase()] || condition.substring(0, 3).toUpperCase();
    }

    /**
     * Render the initiative tracker
     */
    render() {
        const combatants = state.get('combatants');
        const currentTurnIndex = state.get('currentTurnIndex');

        if (!combatants || combatants.length === 0) {
            this.container.innerHTML = `
                <div class="initiative-empty">
                    <p>No combatants in initiative</p>
                    <button id="add-combatant-btn" class="btn btn-primary">Add Combatant</button>
                </div>
            `;
            
            return;
        }

        const html = `
            <div class="initiative-controls">
                <button id="next-turn-btn" class="btn btn-primary">Next Turn</button>
                <button id="add-combatant-btn" class="btn btn-secondary">Add Combatant</button>
                <button id="clear-initiative-btn" class="btn btn-danger">Clear All</button>
            </div>
            <div class="initiative-list">
                ${combatants.map((combatant, index) => `
                    <div class="initiative-item ${index === currentTurnIndex ? 'active' : ''} ${this.getTypeClass(combatant.type)}" 
                         data-id="${combatant.id}">
                        <div class="initiative-header">
                            <div class="initiative-value" title="Click to edit">
                                <button class="edit-initiative-btn" data-id="${combatant.id}">
                                    ${combatant.initiative}
                                </button>
                            </div>
                            <div class="combatant-info">
                                <div class="combatant-name">${combatant.name}</div>
                                ${this.getTypeBadge(combatant.type)}
                            </div>
                            <button class="remove-combatant-btn" data-id="${combatant.id}" title="Remove">×</button>
                        </div>
                        <div class="initiative-details">
                            <div class="stat-group">
                                <span class="stat-label">AC:</span>
                                <span class="stat-value">${combatant.ac}</span>
                            </div>
                            <div class="stat-group hp-group">
                                <span class="stat-label">HP:</span>
                                <div class="hp-controls-compact">
                                    <button class="hp-btn-small" data-id="${combatant.id}" data-change="-10" title="Damage 10">-10</button>
                                    <button class="hp-btn-small" data-id="${combatant.id}" data-change="-5" title="Damage 5">-5</button>
                                    <button class="hp-btn-small" data-id="${combatant.id}" data-change="-1" title="Damage 1">-1</button>
                                    <input 
                                        type="number" 
                                        class="hp-input-small" 
                                        value="${combatant.current_hp}" 
                                        min="0" 
                                        max="${combatant.max_hp}"
                                        data-id="${combatant.id}"
                                        title="Current HP"
                                    />
                                    <span class="hp-max">/${combatant.max_hp}</span>
                                    <button class="hp-btn-small heal" data-id="${combatant.id}" data-change="1" title="Heal 1">+1</button>
                                    <button class="hp-btn-small heal" data-id="${combatant.id}" data-change="5" title="Heal 5">+5</button>
                                    <button class="hp-btn-small heal" data-id="${combatant.id}" data-change="10" title="Heal 10">+10</button>
                                </div>
                            </div>
                            ${this.getConditionIndicators(combatant.conditions)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        this.container.innerHTML = html;
    }

    /**
     * Show form to add a new combatant
     */
    async showAddCombatantForm() {
        // Get available characters, NPCs, and monsters
        const characters = state.get('characters') || [];
        const combatants = state.get('combatants') || [];
        const monsters = state.get('monsters') || [];
        
        // Filter out those already in combat
        const combatantIds = new Set(combatants.map(c => c.id));
        const availableCharacters = characters.filter(c => !combatantIds.has(c.id));
        
        // Show selection dialog
        this.showCombatantSelectionDialog(availableCharacters, monsters);
    }

    /**
     * Show dialog to select combatant to add
     */
    showCombatantSelectionDialog(characters, monsters) {
        const dialogHTML = `
            <div class="modal-overlay" id="add-combatant-modal">
                <div class="modal-dialog">
                    <div class="modal-header">
                        <h3>Add to Combat</h3>
                        <button class="modal-close" data-action="close-modal">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="combatant-selection">
                            ${characters.length > 0 ? `
                                <div class="selection-section">
                                    <h4>Characters</h4>
                                    <div class="selection-list">
                                        ${characters.map(char => `
                                            <div class="selection-item" data-type="character" data-id="${char.id}">
                                                <div class="item-info">
                                                    <span class="item-name">${this.escapeHtml(char.name)}</span>
                                                    <span class="item-details">
                                                        ${char.character_class ? `${char.character_class} ${char.level || ''}` : 'PC'}
                                                        - AC ${char.ac}, HP ${char.max_hp}
                                                    </span>
                                                </div>
                                                <button class="btn btn-small btn-primary" data-action="select-combatant" data-type="character" data-id="${char.id}">
                                                    Add
                                                </button>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : '<p class="no-options">No characters available. Create characters in the Character panel.</p>'}
                            
                            ${monsters.length > 0 ? `
                                <div class="selection-section">
                                    <h4>Monsters</h4>
                                    <div class="selection-list">
                                        ${monsters.map(monster => `
                                            <div class="selection-item" data-type="monster" data-id="${monster.id}">
                                                <div class="item-info">
                                                    <span class="item-name">${this.escapeHtml(monster.name)}</span>
                                                    <span class="item-details">
                                                        CR ${monster.cr || '0'} - AC ${monster.ac}, HP ${monster.hp_formula || 'N/A'}
                                                    </span>
                                                </div>
                                                <button class="btn btn-small btn-primary" data-action="select-combatant" data-type="monster" data-id="${monster.id}">
                                                    Add
                                                </button>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : '<p class="no-options">No monsters available. Add monsters in the Monster Database.</p>'}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-action="close-modal">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add to DOM
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = dialogHTML;
        document.body.appendChild(modalContainer.firstElementChild);
        
        // Add event listeners
        this.setupModalListeners();
    }

    /**
     * Setup modal event listeners
     */
    setupModalListeners() {
        const modal = document.getElementById('add-combatant-modal');
        if (!modal) return;
        
        // Close modal when clicking overlay
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'add-combatant-modal') {
                e.preventDefault();
                e.stopPropagation();
                modal.remove();
            }
        });
        
        // Prevent closing when clicking inside dialog
        const dialog = modal.querySelector('.modal-dialog');
        if (dialog) {
            dialog.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        
        // Close button
        const closeButtons = modal.querySelectorAll('[data-action="close-modal"]');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                modal.remove();
            });
        });
        
        // Select combatant buttons
        const selectButtons = modal.querySelectorAll('[data-action="select-combatant"]');
        selectButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const type = btn.dataset.type;
                const id = parseInt(btn.dataset.id);
                this.addSelectedCombatant(type, id);
                modal.remove();
            });
        });
    }

    /**
     * Add selected combatant to initiative
     */
    async addSelectedCombatant(type, id) {
        try {
            if (type === 'character') {
                const character = state.getCharacterById(id);
                if (!character) {
                    alert('Character not found');
                    return;
                }
                
                const initiative = prompt(`Enter initiative for ${character.name}:`, '10');
                if (initiative === null) return;
                
                await api.post('/initiative', {
                    campaign_id: state.get('currentCampaignId'),
                    combatant_id: id,
                    initiative: parseInt(initiative) || 0
                });
                
                state.addCombatant({ ...character, initiative: parseInt(initiative) || 0 });
                
            } else if (type === 'monster') {
                const monsters = state.get('monsters') || [];
                const monster = monsters.find(m => m.id === id);
                if (!monster) {
                    alert('Monster not found');
                    return;
                }
                
                const instanceName = prompt(`Instance name:`, monster.name);
                if (instanceName === null) return;
                
                const initiative = prompt('Initiative:', '10');
                if (initiative === null) return;
                
                const response = await api.post(`/monsters/${id}/instances`, {
                    instance_name: instanceName.trim(),
                    initiative: parseInt(initiative) || 0
                });
                
                if (response.success && response.data) {
                    const combatant = response.data.combatant;
                    state.addCombatant(combatant);
                }
            }
        } catch (error) {
            console.error('Failed to add combatant:', error);
            alert('Failed to add combatant. Please try again.');
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Clear all combatants from initiative
     */
    async clearInitiative() {
        if (!confirm('Are you sure you want to clear all combatants from initiative?')) {
            return;
        }

        const combatants = state.get('combatants');
        
        try {
            // Delete all combatants
            for (const combatant of combatants) {
                await api.delete(`/initiative/${combatant.id}`);
            }
            
            // Clear state
            state.setState({ combatants: [], currentTurnIndex: 0 });
        } catch (error) {
            console.error('Failed to clear initiative:', error);
        }
    }
}

// Export singleton instance
export default new InitiativeTracker();
