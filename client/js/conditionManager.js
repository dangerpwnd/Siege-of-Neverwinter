/**
 * Condition Manager Component
 * Manages D&D 5e conditions for combatants
 */

import api from './api.js';
import state from './state.js';

// D&D 5e standard conditions
const DND_CONDITIONS = [
    'blinded',
    'charmed',
    'deafened',
    'frightened',
    'grappled',
    'incapacitated',
    'invisible',
    'paralyzed',
    'petrified',
    'poisoned',
    'prone',
    'restrained',
    'stunned',
    'unconscious'
];

class ConditionManager {
    constructor() {
        this.container = document.getElementById('condition-content');
        this.selectedCombatantId = null;
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        
        // Subscribe to state changes
        state.subscribe((newState, oldState) => {
            if (newState.selectedCombatantId !== oldState.selectedCombatantId ||
                newState.combatants !== oldState.combatants) {
                this.selectedCombatantId = newState.selectedCombatantId;
                this.render();
            }
        });
    }

    setupEventListeners() {
        // Event delegation for dynamic content
        this.container.addEventListener('click', (e) => {
            // Apply condition button
            if (e.target.closest('.apply-condition-btn')) {
                const btn = e.target.closest('.apply-condition-btn');
                const condition = btn.dataset.condition;
                this.applyCondition(this.selectedCombatantId, condition);
            }
            
            // Clear condition button
            if (e.target.closest('.clear-condition-btn')) {
                const btn = e.target.closest('.clear-condition-btn');
                const conditionId = parseInt(btn.dataset.conditionId);
                this.clearCondition(this.selectedCombatantId, conditionId);
            }
            
            // Select combatant from list
            if (e.target.closest('.combatant-select-item')) {
                const item = e.target.closest('.combatant-select-item');
                const combatantId = parseInt(item.dataset.combatantId);
                this.selectCombatant(combatantId);
            }
        });
    }

    selectCombatant(combatantId) {
        this.selectedCombatantId = combatantId;
        state.selectCombatant(combatantId);
        this.render();
    }

    /**
     * Apply a condition to a combatant
     */
    async applyCondition(combatantId, condition) {
        if (!combatantId) {
            this.showError('Please select a combatant first');
            return;
        }

        try {
            const response = await api.addCondition(combatantId, condition);
            
            if (response.success) {
                // Update the combatant in state
                const combatant = state.getCombatantById(combatantId);
                if (combatant) {
                    const conditions = combatant.conditions || [];
                    const updatedConditions = [...conditions, response.data];
                    state.updateCombatant(combatantId, { conditions: updatedConditions });
                }
                
                this.render();
            }
        } catch (error) {
            console.error('Failed to apply condition:', error);
            this.showError('Failed to apply condition');
        }
    }

    /**
     * Clear a condition from a combatant
     */
    async clearCondition(combatantId, conditionId) {
        if (!combatantId) {
            return;
        }

        try {
            const response = await api.removeCondition(combatantId, conditionId);
            
            if (response.success) {
                // Update the combatant in state
                const combatant = state.getCombatantById(combatantId);
                if (combatant) {
                    const conditions = (combatant.conditions || []).filter(c => c.id !== conditionId);
                    state.updateCombatant(combatantId, { conditions });
                }
                
                this.render();
            }
        } catch (error) {
            console.error('Failed to clear condition:', error);
            this.showError('Failed to clear condition');
        }
    }

    /**
     * Get available conditions (those not already applied)
     */
    getAvailableConditions(combatant) {
        if (!combatant) return DND_CONDITIONS;
        
        const activeConditions = (combatant.conditions || []).map(c => 
            typeof c === 'string' ? c : c.condition
        );
        
        return DND_CONDITIONS.filter(condition => 
            !activeConditions.includes(condition)
        );
    }

    /**
     * Get active conditions for a combatant
     */
    getActiveConditions(combatant) {
        if (!combatant) return [];
        return combatant.conditions || [];
    }

    /**
     * Render the condition manager interface
     */
    render() {
        const combatants = state.get('combatants');
        const selectedCombatant = this.selectedCombatantId 
            ? state.getCombatantById(this.selectedCombatantId)
            : null;

        if (!combatants || combatants.length === 0) {
            this.container.innerHTML = `
                <div class="condition-empty">
                    <p>No combatants available. Add combatants to the initiative tracker first.</p>
                </div>
            `;
            return;
        }

        const availableConditions = this.getAvailableConditions(selectedCombatant);
        const activeConditions = this.getActiveConditions(selectedCombatant);

        this.container.innerHTML = `
            <div class="condition-manager">
                <div class="combatant-selector">
                    <h3>Select Combatant</h3>
                    <ul class="combatant-select-list">
                        ${combatants.map(combatant => `
                            <li class="combatant-select-item ${selectedCombatant?.id === combatant.id ? 'selected' : ''}"
                                data-combatant-id="${combatant.id}">
                                <span class="combatant-name">${this.escapeHtml(combatant.name)}</span>
                                <span class="combatant-type type-badge ${this.getTypeClass(combatant.type)}">${combatant.type}</span>
                                ${combatant.conditions && combatant.conditions.length > 0 ? 
                                    `<span class="condition-count">${combatant.conditions.length}</span>` 
                                    : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>

                ${selectedCombatant ? `
                    <div class="condition-interface">
                        <div class="selected-combatant-header">
                            <h3>${this.escapeHtml(selectedCombatant.name)}</h3>
                            <span class="type-badge ${this.getTypeClass(selectedCombatant.type)}">${selectedCombatant.type}</span>
                        </div>

                        <div class="active-conditions-section">
                            <h4>Active Conditions</h4>
                            ${activeConditions.length > 0 ? `
                                <ul class="active-conditions-list">
                                    ${activeConditions.map(condition => {
                                        const conditionName = typeof condition === 'string' ? condition : condition.condition;
                                        const conditionId = typeof condition === 'object' ? condition.id : null;
                                        return `
                                            <li class="active-condition-item">
                                                <span class="condition-name">${this.escapeHtml(conditionName)}</span>
                                                ${conditionId ? `
                                                    <button class="clear-condition-btn btn btn-small btn-danger" 
                                                            data-condition-id="${conditionId}"
                                                            title="Remove condition">
                                                        ×
                                                    </button>
                                                ` : ''}
                                            </li>
                                        `;
                                    }).join('')}
                                </ul>
                            ` : '<p class="no-conditions">No active conditions</p>'}
                        </div>

                        <div class="available-conditions-section">
                            <h4>Apply Condition</h4>
                            ${availableConditions.length > 0 ? `
                                <div class="condition-grid">
                                    ${availableConditions.map(condition => `
                                        <button class="apply-condition-btn btn btn-secondary" 
                                                data-condition="${condition}"
                                                title="Apply ${condition}">
                                            ${this.capitalizeFirst(condition)}
                                        </button>
                                    `).join('')}
                                </div>
                            ` : '<p class="all-conditions-applied">All standard conditions are already applied</p>'}
                        </div>
                    </div>
                ` : `
                    <div class="no-selection">
                        <p>Select a combatant to manage conditions</p>
                    </div>
                `}
            </div>
        `;
    }

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

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        this.container.insertBefore(errorDiv, this.container.firstChild);
        
        setTimeout(() => errorDiv.remove(), 3000);
    }
}

export default new ConditionManager();
