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
            if (e.target.classList.contains('remove-combatant-btn')) {
                const id = parseInt(e.target.dataset.id);
                this.removeCombatant(id);
            }
            
            if (e.target.classList.contains('edit-initiative-btn')) {
                const id = parseInt(e.target.dataset.id);
                this.editInitiative(id);
            }
        });
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
            
            // Add event listener for add button
            const addBtn = document.getElementById('add-combatant-btn');
            if (addBtn) {
                addBtn.addEventListener('click', () => this.showAddCombatantForm());
            }
            
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
                            <div class="stat-group">
                                <span class="stat-label">HP:</span>
                                <span class="stat-value ${combatant.current_hp === 0 ? 'hp-zero' : ''}">${combatant.current_hp}/${combatant.max_hp}</span>
                            </div>
                            ${this.getConditionIndicators(combatant.conditions)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        this.container.innerHTML = html;

        // Add event listeners for controls
        const nextTurnBtn = document.getElementById('next-turn-btn');
        if (nextTurnBtn) {
            nextTurnBtn.addEventListener('click', () => this.nextTurn());
        }

        const addBtn = document.getElementById('add-combatant-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddCombatantForm());
        }

        const clearBtn = document.getElementById('clear-initiative-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearInitiative());
        }
    }

    /**
     * Show form to add a new combatant
     */
    showAddCombatantForm() {
        // Simple prompt-based form for now
        // In a full implementation, this would be a modal dialog
        const name = prompt('Combatant name:');
        if (!name) return;

        const type = prompt('Type (PC/NPC/Monster):', 'Monster');
        if (!type || !['PC', 'NPC', 'Monster'].includes(type)) {
            alert('Invalid type. Must be PC, NPC, or Monster');
            return;
        }

        const initiative = prompt('Initiative:', '10');
        const ac = prompt('AC:', '15');
        const maxHp = prompt('Max HP:', '50');

        const combatantData = {
            name: name.trim(),
            type: type,
            initiative: parseInt(initiative) || 0,
            ac: parseInt(ac) || 10,
            current_hp: parseInt(maxHp) || 1,
            max_hp: parseInt(maxHp) || 1,
            save_strength: 0,
            save_dexterity: 0,
            save_constitution: 0,
            save_intelligence: 0,
            save_wisdom: 0,
            save_charisma: 0
        };

        this.addCombatant(combatantData);
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
