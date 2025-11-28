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
            
            // Action buttons (add condition, add note)
            if (e.target.closest('.action-btn')) {
                e.preventDefault();
                const btn = e.target.closest('.action-btn');
                const id = parseInt(btn.dataset.id);
                const action = btn.dataset.action;
                
                if (action === 'add-condition') {
                    this.showAddConditionDialog(id);
                } else if (action === 'add-note') {
                    this.showAddNoteDialog(id);
                }
            }
            
            // Remove condition badge click
            if (e.target.closest('.condition-badge')) {
                e.preventDefault();
                const badge = e.target.closest('.condition-badge');
                const combatantId = parseInt(badge.dataset.combatantId);
                const conditionId = badge.dataset.conditionId;
                const conditionName = badge.dataset.conditionName;
                this.removeCondition(combatantId, conditionId, conditionName);
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
            // Don't clear existing combatants on error
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
     * For PCs/NPCs: Just removes from tracker (keeps in database)
     * For Monsters: Deletes the instance entirely
     */
    async removeCombatant(id) {
        try {
            const combatant = state.getCombatantById(id);
            if (!combatant) return;
            
            // For PCs and NPCs, just remove from initiative tracker (don't delete from DB)
            // For Monsters, delete the instance
            if (combatant.type === 'Monster') {
                const response = await api.delete(`/initiative/${id}`);
                if (response.success) {
                    state.removeCombatant(id);
                }
            } else {
                // PC or NPC - just remove from initiative tracker state
                // They remain in the database for re-adding later
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
    getConditionIndicators(conditions, combatantId) {
        if (!conditions || conditions.length === 0) {
            return '';
        }

        return `
            <div class="condition-indicators">
                ${conditions.map((condition, index) => {
                    const conditionName = typeof condition === 'string' ? condition : condition.condition;
                    const conditionId = typeof condition === 'object' && condition.id ? condition.id : index;
                    return `<button class="condition-badge" 
                                    data-combatant-id="${combatantId}" 
                                    data-condition-id="${conditionId}"
                                    data-condition-name="${this.escapeHtml(conditionName)}"
                                    title="Click to remove: ${conditionName}">
                                ${this.getConditionAbbr(conditionName)}
                                <span class="condition-remove">×</span>
                            </button>`;
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
                            ${this.getConditionIndicators(combatant.conditions, combatant.id)}
                        </div>
                        <div class="initiative-actions">
                            <button class="action-btn" data-id="${combatant.id}" data-action="add-condition" title="Add Condition">
                                <span>+ Condition</span>
                            </button>
                            <button class="action-btn" data-id="${combatant.id}" data-action="add-note" title="Add Note">
                                <span>+ Note</span>
                            </button>
                        </div>
                        ${combatant.notes ? `
                            <div class="combatant-notes">
                                <strong>Notes:</strong> ${this.escapeHtml(combatant.notes)}
                            </div>
                        ` : ''}
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
                
                console.log('Adding character to initiative:', character.name, 'ID:', id, 'initiative:', initiative);
                
                // Update the character's initiative (characters already exist in combatants table)
                const response = await api.put(`/characters/${id}`, {
                    initiative: parseInt(initiative) || 0
                });
                
                console.log('API response:', response);
                
                // Add updated character to initiative tracker state
                if (response) {
                    const updatedCharacter = { ...character, initiative: parseInt(initiative) || 0 };
                    state.addCombatant(updatedCharacter);
                    // Also update in characters list
                    state.updateCharacter(id, { initiative: parseInt(initiative) || 0 });
                } else {
                    console.error('No response from API when adding character');
                    alert('Failed to add character - no response from server');
                }
                
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
            console.error('Error details:', error.message, error.stack);
            console.error('Current characters in state:', state.get('characters'));
            console.error('Current combatants in state:', state.get('combatants'));
            alert(`Failed to add combatant: ${error.message}`);
            // Don't modify state on error - existing combatants remain
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

    /**
     * Show dialog to add condition
     */
    showAddConditionDialog(combatantId) {
        const combatant = state.getCombatantById(combatantId);
        if (!combatant) return;
        
        const conditions = [
            'Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled',
            'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified',
            'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious',
            'Exhaustion', 'Concentration'
        ];
        
        const dialogHTML = `
            <div class="modal-overlay" id="condition-modal">
                <div class="modal-dialog modal-small">
                    <div class="modal-header">
                        <h3>Add Condition to ${this.escapeHtml(combatant.name)}</h3>
                        <button class="modal-close" data-action="close-condition-modal">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="condition-selection">
                            ${conditions.map(cond => `
                                <button class="condition-option" data-condition="${cond}">
                                    ${cond}
                                </button>
                            `).join('')}
                        </div>
                        <div class="custom-condition">
                            <label for="custom-condition-input">Or enter custom:</label>
                            <input type="text" id="custom-condition-input" placeholder="Custom condition" />
                            <button class="btn btn-primary" id="add-custom-condition">Add Custom</button>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-action="close-condition-modal">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = dialogHTML;
        document.body.appendChild(modalContainer.firstElementChild);
        
        this.setupConditionModalListeners(combatantId);
    }

    setupConditionModalListeners(combatantId) {
        const modal = document.getElementById('condition-modal');
        if (!modal) return;
        
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'condition-modal' || e.target.dataset.action === 'close-condition-modal') {
                e.preventDefault();
                modal.remove();
            }
        });
        
        const dialog = modal.querySelector('.modal-dialog');
        if (dialog) {
            dialog.addEventListener('click', (e) => e.stopPropagation());
        }
        
        const conditionButtons = modal.querySelectorAll('.condition-option');
        conditionButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const condition = btn.dataset.condition;
                await this.addCondition(combatantId, condition);
                modal.remove();
            });
        });
        
        const customBtn = document.getElementById('add-custom-condition');
        if (customBtn) {
            customBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                const input = document.getElementById('custom-condition-input');
                const condition = input.value.trim();
                if (condition) {
                    await this.addCondition(combatantId, condition);
                    modal.remove();
                }
            });
        }
    }

    async addCondition(combatantId, condition) {
        try {
            const response = await api.post(`/combatants/${combatantId}/conditions`, { condition });
            
            // Reload combatant to get condition with ID
            const combatantResponse = await api.get(`/combatants/${combatantId}/conditions`);
            
            if (combatantResponse.success && combatantResponse.data) {
                state.updateCombatant(combatantId, { conditions: combatantResponse.data });
            }
            
            this.render();
        } catch (error) {
            console.error('Failed to add condition:', error);
            alert('Failed to add condition');
        }
    }

    async removeCondition(combatantId, conditionId, conditionName) {
        if (!confirm(`Remove condition "${conditionName}"?`)) {
            return;
        }
        
        try {
            // Delete from database
            await api.delete(`/combatants/${combatantId}/conditions/${conditionId}`);
            
            // Reload conditions to ensure sync
            const combatantResponse = await api.get(`/combatants/${combatantId}/conditions`);
            
            if (combatantResponse.success && combatantResponse.data) {
                state.updateCombatant(combatantId, { conditions: combatantResponse.data });
            }
            
            this.render();
        } catch (error) {
            console.error('Failed to remove condition:', error);
            alert('Failed to remove condition. Error: ' + error.message);
        }
    }

    showAddNoteDialog(combatantId) {
        const combatant = state.getCombatantById(combatantId);
        if (!combatant) return;
        
        const currentNotes = combatant.notes || '';
        
        const dialogHTML = `
            <div class="modal-overlay" id="note-modal">
                <div class="modal-dialog">
                    <div class="modal-header">
                        <h3>Notes for ${this.escapeHtml(combatant.name)}</h3>
                        <button class="modal-close" data-action="close-note-modal">×</button>
                    </div>
                    <div class="modal-body">
                        <textarea id="note-textarea" rows="6" placeholder="Add notes about this combatant...">${this.escapeHtml(currentNotes)}</textarea>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" id="save-note-btn">Save Note</button>
                        <button class="btn btn-secondary" data-action="close-note-modal">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = dialogHTML;
        document.body.appendChild(modalContainer.firstElementChild);
        
        this.setupNoteModalListeners(combatantId);
    }

    setupNoteModalListeners(combatantId) {
        const modal = document.getElementById('note-modal');
        if (!modal) return;
        
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'note-modal' || e.target.dataset.action === 'close-note-modal') {
                e.preventDefault();
                modal.remove();
            }
        });
        
        const dialog = modal.querySelector('.modal-dialog');
        if (dialog) {
            dialog.addEventListener('click', (e) => e.stopPropagation());
        }
        
        const saveBtn = document.getElementById('save-note-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                const textarea = document.getElementById('note-textarea');
                const notes = textarea.value.trim();
                await this.saveNote(combatantId, notes);
                modal.remove();
            });
        }
    }

    async saveNote(combatantId, notes) {
        try {
            await api.put(`/initiative/${combatantId}`, { notes });
            state.updateCombatant(combatantId, { notes });
            this.render();
        } catch (error) {
            console.error('Failed to save note:', error);
            alert('Failed to save note');
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export singleton instance
export default new InitiativeTracker();
