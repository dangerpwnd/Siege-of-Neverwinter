/**
 * Monster Database Component
 * Manages monster templates and instances for combat
 */

import api from './api.js';
import state from './state.js';
import initiativeTracker from './initiativeTracker.js';

class MonsterDatabase {
    constructor() {
        this.container = document.getElementById('monster-content');
        this.monsters = [];
        this.selectedMonster = null;
        this.searchFilter = '';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.render();
        this.loadMonsters();
        
        // Subscribe to state changes
        state.subscribe((newState, oldState) => {
            if (newState.monsters !== oldState.monsters) {
                this.monsters = newState.monsters || [];
                this.render();
            }
        });
    }

    /**
     * Load all monsters from the database
     */
    async loadMonsters() {
        try {
            const campaignId = state.get('currentCampaignId');
            const response = await api.get(`/monsters?campaign_id=${campaignId}`);
            
            if (response.success && response.data) {
                this.monsters = response.data;
                state.setState({ monsters: response.data });
            }
        } catch (error) {
            console.error('Failed to load monsters:', error);
        }
    }

    /**
     * Add a new monster template to the database
     */
    async addMonster(monsterData) {
        try {
            const campaignId = state.get('currentCampaignId');
            const dataWithCampaign = { ...monsterData, campaign_id: campaignId };
            
            const response = await api.post('/monsters', dataWithCampaign);
            
            if (response.success && response.data) {
                await this.loadMonsters(); // Reload list
                return response.data;
            }
        } catch (error) {
            console.error('Failed to add monster:', error);
            throw error;
        }
    }

    /**
     * Create a combat-ready instance of a monster
     * This creates an independent combatant with separate HP tracking
     */
    async createInstance(monsterId, instanceName, initiative = 0) {
        try {
            const response = await api.post(`/monsters/${monsterId}/instances`, {
                instance_name: instanceName,
                initiative: initiative
            });
            
            if (response.success && response.data) {
                // Add the instance to initiative tracker
                const combatant = response.data.combatant;
                state.addCombatant(combatant);
                
                return response.data;
            }
        } catch (error) {
            console.error('Failed to create monster instance:', error);
            throw error;
        }
    }

    /**
     * Search/filter monsters by name
     */
    async searchMonsters(searchTerm) {
        this.searchFilter = searchTerm;
        
        try {
            const campaignId = state.get('currentCampaignId');
            let url = `/monsters?campaign_id=${campaignId}`;
            
            if (searchTerm && searchTerm.trim()) {
                url += `&name=${encodeURIComponent(searchTerm)}`;
            }
            
            const response = await api.get(url);
            
            if (response.success && response.data) {
                this.monsters = response.data;
                this.render();
            }
        } catch (error) {
            console.error('Failed to search monsters:', error);
        }
    }

    /**
     * Select a monster to view details
     */
    selectMonster(monsterId) {
        const monster = this.monsters.find(m => m.id === monsterId);
        if (monster) {
            this.selectedMonster = monster;
            this.render();
        }
    }

    /**
     * Clear monster selection
     */
    clearSelection() {
        this.selectedMonster = null;
        this.render();
    }

    /**
     * Format stat modifier
     */
    formatModifier(stat) {
        const modifier = Math.floor((stat - 10) / 2);
        return modifier >= 0 ? `+${modifier}` : `${modifier}`;
    }

    /**
     * Render monster stat block
     */
    renderStatBlock(monster) {
        return `
            <div class="monster-stat-block">
                <div class="monster-header">
                    <h3>${monster.name}</h3>
                    <div class="monster-header-actions">
                        <button class="btn btn-secondary back-btn" data-action="back">← Back to List</button>
                        <button class="btn btn-danger" data-action="delete-monster" data-id="${monster.id}">Delete</button>
                    </div>
                </div>
                
                <div class="monster-basics">
                    <div class="stat-row">
                        <span class="stat-label">AC:</span>
                        <span class="stat-value">${monster.ac}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">HP:</span>
                        <span class="stat-value">${monster.hp_formula || 'N/A'}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Speed:</span>
                        <span class="stat-value">${monster.speed || 'N/A'}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">CR:</span>
                        <span class="stat-value">${monster.cr || '0'}</span>
                    </div>
                </div>

                <div class="monster-stats">
                    <h4>Ability Scores</h4>
                    <div class="ability-scores">
                        <div class="ability">
                            <div class="ability-name">STR</div>
                            <div class="ability-value">${monster.stat_str || 10} (${this.formatModifier(monster.stat_str || 10)})</div>
                        </div>
                        <div class="ability">
                            <div class="ability-name">DEX</div>
                            <div class="ability-value">${monster.stat_dex || 10} (${this.formatModifier(monster.stat_dex || 10)})</div>
                        </div>
                        <div class="ability">
                            <div class="ability-name">CON</div>
                            <div class="ability-value">${monster.stat_con || 10} (${this.formatModifier(monster.stat_con || 10)})</div>
                        </div>
                        <div class="ability">
                            <div class="ability-name">INT</div>
                            <div class="ability-value">${monster.stat_int || 10} (${this.formatModifier(monster.stat_int || 10)})</div>
                        </div>
                        <div class="ability">
                            <div class="ability-name">WIS</div>
                            <div class="ability-value">${monster.stat_wis || 10} (${this.formatModifier(monster.stat_wis || 10)})</div>
                        </div>
                        <div class="ability">
                            <div class="ability-name">CHA</div>
                            <div class="ability-value">${monster.stat_cha || 10} (${this.formatModifier(monster.stat_cha || 10)})</div>
                        </div>
                    </div>
                </div>

                ${monster.senses ? `
                    <div class="monster-section">
                        <span class="section-label">Senses:</span>
                        <span>${monster.senses}</span>
                    </div>
                ` : ''}

                ${monster.languages ? `
                    <div class="monster-section">
                        <span class="section-label">Languages:</span>
                        <span>${monster.languages}</span>
                    </div>
                ` : ''}

                ${monster.resistances && monster.resistances.length > 0 ? `
                    <div class="monster-section">
                        <span class="section-label">Resistances:</span>
                        <span>${monster.resistances.join(', ')}</span>
                    </div>
                ` : ''}

                ${monster.immunities && monster.immunities.length > 0 ? `
                    <div class="monster-section">
                        <span class="section-label">Immunities:</span>
                        <span>${monster.immunities.join(', ')}</span>
                    </div>
                ` : ''}

                ${this.renderAbilities(monster)}
                ${this.renderAttacks(monster)}

                ${monster.lore ? `
                    <div class="monster-section">
                        <h4>Lore</h4>
                        <p>${monster.lore}</p>
                    </div>
                ` : ''}

                <div class="monster-actions">
                    <button class="btn btn-primary" data-action="create-instance" data-id="${monster.id}">
                        Add to Combat
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render monster abilities
     */
    renderAbilities(monster) {
        if (!monster.abilities || monster.abilities.length === 0) {
            return '';
        }

        const abilities = typeof monster.abilities === 'string' 
            ? JSON.parse(monster.abilities) 
            : monster.abilities;

        return `
            <div class="monster-section">
                <h4>Special Abilities</h4>
                ${abilities.map(ability => `
                    <div class="ability-entry">
                        <strong>${ability.name}.</strong> ${ability.description}
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render monster attacks
     */
    renderAttacks(monster) {
        if (!monster.attacks || monster.attacks.length === 0) {
            return '';
        }

        const attacks = typeof monster.attacks === 'string' 
            ? JSON.parse(monster.attacks) 
            : monster.attacks;

        return `
            <div class="monster-section">
                <h4>Actions</h4>
                ${attacks.map(attack => `
                    <div class="attack-entry">
                        <strong>${attack.name}.</strong> 
                        ${attack.bonus ? `+${attack.bonus} to hit, ` : ''}
                        ${attack.damage ? `${attack.damage} ${attack.type || ''} damage. ` : ''}
                        ${attack.description || ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render monster list
     */
    renderMonsterList() {
        if (this.monsters.length === 0) {
            return `
                <div class="monster-empty">
                    <p>No monsters in database</p>
                    <button class="btn btn-primary" data-action="add-monster">Add Monster</button>
                </div>
            `;
        }

        return `
            <div class="monster-list">
                ${this.monsters.map(monster => `
                    <div class="monster-list-item" data-id="${monster.id}">
                        <div class="monster-list-header">
                            <span class="monster-name">${monster.name}</span>
                            <span class="monster-cr">CR ${monster.cr || '0'}</span>
                        </div>
                        <div class="monster-list-details">
                            <span>AC ${monster.ac}</span>
                            <span>HP ${monster.hp_formula || 'N/A'}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Setup event listeners (called once during init)
     */
    setupEventListeners() {
        // Use event delegation on container - only set up once
        this.container.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            
            if (action === 'add-monster') {
                e.preventDefault();
                this.showAddMonsterForm();
            } else if (action === 'save-monster') {
                e.preventDefault();
                this.saveMonster();
            } else if (action === 'cancel-form') {
                e.preventDefault();
                this.clearSelection();
                this.render();
            } else if (action === 'create-instance') {
                e.preventDefault();
                const monsterId = parseInt(e.target.dataset.id);
                this.showCreateInstanceForm(monsterId);
            } else if (action === 'delete-monster') {
                e.preventDefault();
                const monsterId = parseInt(e.target.dataset.id);
                this.deleteMonster(monsterId);
            } else if (action === 'back') {
                e.preventDefault();
                this.clearSelection();
            } else if (e.target.closest('.monster-list-item')) {
                const item = e.target.closest('.monster-list-item');
                const monsterId = parseInt(item.dataset.id);
                this.selectMonster(monsterId);
            }
        });

        // Handle search input with event delegation
        this.container.addEventListener('input', (e) => {
            if (e.target.id === 'monster-search') {
                this.searchMonsters(e.target.value);
            }
        });
    }

    /**
     * Render the monster database
     */
    render() {
        if (this.selectedMonster) {
            this.container.innerHTML = this.renderStatBlock(this.selectedMonster);
        } else {
            this.container.innerHTML = `
                <div class="monster-database">
                    <div class="monster-controls">
                        <input 
                            type="text" 
                            id="monster-search" 
                            class="search-input" 
                            placeholder="Search monsters..."
                            value="${this.searchFilter}"
                        />
                        <button class="btn btn-primary" data-action="add-monster">Add Monster</button>
                    </div>
                    ${this.renderMonsterList()}
                </div>
            `;
        }
    }

    /**
     * Show form to add a new monster
     */
    showAddMonsterForm() {
        this.container.innerHTML = `
            <div class="monster-form">
                <h3>Add New Monster</h3>
                <form id="monster-create-form">
                    <div class="form-group">
                        <label for="monster-name">Name *</label>
                        <input type="text" id="monster-name" required />
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="monster-ac">AC *</label>
                            <input type="number" id="monster-ac" required min="1" value="15" />
                        </div>
                        <div class="form-group">
                            <label for="monster-hp">HP Formula *</label>
                            <input type="text" id="monster-hp" required placeholder="4d8+4" value="4d8+4" />
                        </div>
                        <div class="form-group">
                            <label for="monster-speed">Speed</label>
                            <input type="text" id="monster-speed" placeholder="30 ft." value="30 ft." />
                        </div>
                        <div class="form-group">
                            <label for="monster-cr">CR *</label>
                            <input type="text" id="monster-cr" required value="1" />
                        </div>
                    </div>
                    
                    <h4>Ability Scores</h4>
                    <div class="form-row ability-row">
                        <div class="form-group">
                            <label for="monster-str">STR</label>
                            <input type="number" id="monster-str" value="10" min="1" max="30" />
                        </div>
                        <div class="form-group">
                            <label for="monster-dex">DEX</label>
                            <input type="number" id="monster-dex" value="10" min="1" max="30" />
                        </div>
                        <div class="form-group">
                            <label for="monster-con">CON</label>
                            <input type="number" id="monster-con" value="10" min="1" max="30" />
                        </div>
                        <div class="form-group">
                            <label for="monster-int">INT</label>
                            <input type="number" id="monster-int" value="10" min="1" max="30" />
                        </div>
                        <div class="form-group">
                            <label for="monster-wis">WIS</label>
                            <input type="number" id="monster-wis" value="10" min="1" max="30" />
                        </div>
                        <div class="form-group">
                            <label for="monster-cha">CHA</label>
                            <input type="number" id="monster-cha" value="10" min="1" max="30" />
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="monster-senses">Senses</label>
                        <input type="text" id="monster-senses" placeholder="Darkvision 60 ft., passive Perception 12" />
                    </div>
                    
                    <div class="form-group">
                        <label for="monster-languages">Languages</label>
                        <input type="text" id="monster-languages" placeholder="Common, Draconic" />
                    </div>
                    
                    <div class="form-group">
                        <label for="monster-lore">Lore/Description</label>
                        <textarea id="monster-lore" rows="3" placeholder="Background information about this monster..."></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" data-action="save-monster" class="btn btn-primary">Create Monster</button>
                        <button type="button" data-action="cancel-form" class="btn btn-secondary">Cancel</button>
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * Save monster from form
     */
    async saveMonster() {
        try {
            const monsterData = {
                name: document.getElementById('monster-name').value.trim(),
                ac: parseInt(document.getElementById('monster-ac').value),
                hp_formula: document.getElementById('monster-hp').value.trim(),
                speed: document.getElementById('monster-speed').value.trim(),
                cr: document.getElementById('monster-cr').value.trim(),
                stat_str: parseInt(document.getElementById('monster-str').value) || 10,
                stat_dex: parseInt(document.getElementById('monster-dex').value) || 10,
                stat_con: parseInt(document.getElementById('monster-con').value) || 10,
                stat_int: parseInt(document.getElementById('monster-int').value) || 10,
                stat_wis: parseInt(document.getElementById('monster-wis').value) || 10,
                stat_cha: parseInt(document.getElementById('monster-cha').value) || 10,
                senses: document.getElementById('monster-senses').value.trim(),
                languages: document.getElementById('monster-languages').value.trim(),
                lore: document.getElementById('monster-lore').value.trim(),
                attacks: [],
                abilities: []
            };

            if (!monsterData.name || !monsterData.ac || !monsterData.hp_formula || !monsterData.cr) {
                alert('Please fill in all required fields');
                return;
            }

            await this.addMonster(monsterData);
            this.render();
        } catch (error) {
            console.error('Failed to save monster:', error);
            alert('Failed to save monster');
        }
    }

    /**
     * Delete a monster
     */
    async deleteMonster(monsterId) {
        if (!confirm('Are you sure you want to delete this monster? This will also remove all instances in combat.')) {
            return;
        }

        try {
            const response = await api.delete(`/monsters/${monsterId}`);
            
            if (response.success) {
                await this.loadMonsters();
                this.clearSelection();
            }
        } catch (error) {
            console.error('Failed to delete monster:', error);
            alert('Failed to delete monster');
        }
    }

    /**
     * Show form to create a monster instance
     */
    async showCreateInstanceForm(monsterId) {
        const monster = this.monsters.find(m => m.id === monsterId);
        if (!monster) return;

        const instanceName = prompt(`Instance name:`, monster.name);
        if (instanceName === null) return; // User cancelled

        const initiative = prompt('Initiative:', '10');
        if (initiative === null) return; // User cancelled

        try {
            await this.createInstance(
                monsterId,
                instanceName.trim(),
                parseInt(initiative) || 0
            );

            // Show success message
            this.showSuccess(`${instanceName} added to combat!`);
            
            // Go back to list
            this.clearSelection();
        } catch (error) {
            console.error('Failed to add monster to combat:', error);
            this.showError('Failed to add monster to combat');
        }
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        this.container.insertBefore(successDiv, this.container.firstChild);
        
        setTimeout(() => successDiv.remove(), 3000);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        this.container.insertBefore(errorDiv, this.container.firstChild);
        
        setTimeout(() => errorDiv.remove(), 3000);
    }
}

// Export singleton instance
export default new MonsterDatabase();
