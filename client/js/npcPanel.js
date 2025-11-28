// NPC Panel Component

import api from './api.js';
import state from './state.js';

class NPCPanel {
    constructor() {
        this.container = document.getElementById('npc-content');
        this.selectedNPCId = null;
        this.init();
    }

    async init() {
        await this.loadNPCs();
        this.render();
        this.setupEventListeners();
        
        // Subscribe to state changes
        state.subscribe((newState, oldState) => {
            // Re-render if NPCs changed or selection changed
            if (newState.npcs !== oldState.npcs || 
                newState.selectedCombatantId !== oldState.selectedCombatantId ||
                newState.combatants !== oldState.combatants) {
                this.render();
            }
        });
    }

    setupEventListeners() {
        // Event delegation for dynamic content
        this.container.addEventListener('click', (e) => {
            // NPC selection
            if (e.target.closest('.character-list-item')) {
                const item = e.target.closest('.character-list-item');
                const npcId = parseInt(item.dataset.npcId);
                console.log('NPC list item clicked, ID:', npcId);
                this.selectNPC(npcId);
            }
            
            // HP update buttons
            if (e.target.closest('.hp-btn')) {
                const btn = e.target.closest('.hp-btn');
                const npcId = parseInt(btn.dataset.npcId);
                const change = parseInt(btn.dataset.change);
                this.updateHP(npcId, change);
            }
            
            // Create NPC button
            if (e.target.closest('#create-npc-btn')) {
                this.showCreateForm();
            }
            
            // Save NPC button
            if (e.target.closest('#save-npc-btn')) {
                this.saveNPC();
            }
            
            // Cancel button
            if (e.target.closest('#cancel-npc-btn')) {
                this.hideCreateForm();
            }
            
            // Edit NPC button
            if (e.target.closest('#edit-npc-btn')) {
                this.showEditForm();
            }
            
            // Delete NPC button
            if (e.target.closest('#delete-npc-btn')) {
                const btn = e.target.closest('#delete-npc-btn');
                const npcId = parseInt(btn.dataset.npcId);
                this.deleteNPC(npcId);
            }
            
            // Add to combat button
            if (e.target.closest('.add-to-combat-btn')) {
                const btn = e.target.closest('.add-to-combat-btn');
                const npcId = parseInt(btn.dataset.npcId);
                this.addToCombat(npcId);
            }
        });

        // HP input change
        this.container.addEventListener('change', (e) => {
            if (e.target.id === 'npc-hp-input') {
                const npcId = parseInt(e.target.dataset.npcId);
                const newHP = parseInt(e.target.value);
                this.setHP(npcId, newHP);
            }
        });
    }

    async loadNPCs() {
        try {
            const campaignId = state.get('currentCampaignId');
            console.log('Loading NPCs for campaign:', campaignId);
            const npcs = await api.getNPCs(campaignId);
            console.log('Loaded NPCs:', npcs);
            state.setState({ npcs });
            console.log('NPCs set in state, count:', npcs.length);
        } catch (error) {
            console.error('Failed to load NPCs:', error);
            this.showError('Failed to load NPCs');
        }
    }

    selectNPC(npcId) {
        console.log('Selecting NPC:', npcId);
        this.selectedNPCId = npcId;
        state.selectCombatant(npcId);
        console.log('Selected NPC ID set to:', this.selectedNPCId);
        this.render();
    }

    async updateHP(npcId, change) {
        try {
            const npc = this.getNPCById(npcId);
            
            if (!npc) return;
            
            const newHP = Math.max(0, npc.current_hp + change);
            await this.setHP(npcId, newHP);
        } catch (error) {
            console.error('Failed to update HP:', error);
            this.showError('Failed to update HP');
        }
    }

    async setHP(npcId, newHP) {
        try {
            const npc = this.getNPCById(npcId);
            
            if (!npc) return;
            
            // Clamp HP between 0 and max
            const clampedHP = Math.max(0, Math.min(newHP, npc.max_hp));
            
            // Update via API
            const updated = await api.updateNPC(npcId, { 
                current_hp: clampedHP 
            });
            
            // Update state - both in npcs and combatants
            state.updateNPC(npcId, { current_hp: clampedHP });
            state.updateCombatant(npcId, { current_hp: clampedHP });
            
            this.render();
        } catch (error) {
            console.error('Failed to set HP:', error);
            this.showError('Failed to update HP');
        }
    }

    displayNPC(npc) {
        if (!npc) {
            return '<div class="no-selection">Select an NPC to view details</div>';
        }

        const conditions = npc.conditions || [];
        const isDown = npc.current_hp === 0;
        
        return `
            <div class="character-detail ${isDown ? 'character-down' : ''}">
                <div class="character-header">
                    <h3>${this.escapeHtml(npc.name)}</h3>
                    <div class="character-info">
                        <span class="character-type-badge npc-badge">NPC</span>
                        ${npc.character_class && npc.level ? 
                            `<span class="character-class">${this.escapeHtml(npc.character_class)} ${npc.level}</span>` 
                            : ''}
                    </div>
                    <button id="edit-npc-btn" class="btn btn-small">Edit</button>
                </div>
                
                ${isDown ? '<div class="down-indicator">⚠️ DOWN</div>' : ''}
                
                <div class="character-stats">
                    <div class="stat-block">
                        <label>AC</label>
                        <div class="stat-value">${npc.ac}</div>
                    </div>
                    
                    <div class="stat-block hp-block">
                        <label>Hit Points</label>
                        <div class="hp-controls">
                            <button class="hp-btn" data-npc-id="${npc.id}" data-change="-10">-10</button>
                            <button class="hp-btn" data-npc-id="${npc.id}" data-change="-5">-5</button>
                            <button class="hp-btn" data-npc-id="${npc.id}" data-change="-1">-1</button>
                            <input 
                                type="number" 
                                id="npc-hp-input"
                                class="hp-input" 
                                value="${npc.current_hp}" 
                                min="0" 
                                max="${npc.max_hp}"
                                data-npc-id="${npc.id}"
                            />
                            <span class="hp-max">/ ${npc.max_hp}</span>
                            <button class="hp-btn" data-npc-id="${npc.id}" data-change="1">+1</button>
                            <button class="hp-btn" data-npc-id="${npc.id}" data-change="5">+5</button>
                            <button class="hp-btn" data-npc-id="${npc.id}" data-change="10">+10</button>
                        </div>
                    </div>
                </div>
                
                <div class="saving-throws">
                    <h4>Saving Throws</h4>
                    <div class="saves-grid">
                        <div class="save-item">
                            <span class="save-label">STR</span>
                            <span class="save-value">${this.formatModifier(npc.save_strength)}</span>
                        </div>
                        <div class="save-item">
                            <span class="save-label">DEX</span>
                            <span class="save-value">${this.formatModifier(npc.save_dexterity)}</span>
                        </div>
                        <div class="save-item">
                            <span class="save-label">CON</span>
                            <span class="save-value">${this.formatModifier(npc.save_constitution)}</span>
                        </div>
                        <div class="save-item">
                            <span class="save-label">INT</span>
                            <span class="save-value">${this.formatModifier(npc.save_intelligence)}</span>
                        </div>
                        <div class="save-item">
                            <span class="save-label">WIS</span>
                            <span class="save-value">${this.formatModifier(npc.save_wisdom)}</span>
                        </div>
                        <div class="save-item">
                            <span class="save-label">CHA</span>
                            <span class="save-value">${this.formatModifier(npc.save_charisma)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="conditions-display">
                    <h4>Active Conditions</h4>
                    ${conditions.length > 0 ? `
                        <ul class="condition-list">
                            ${conditions.map(c => `
                                <li class="condition-item">${this.escapeHtml(c.condition)}</li>
                            `).join('')}
                        </ul>
                    ` : '<p class="no-conditions">No active conditions</p>'}
                </div>
                
                ${npc.notes ? `
                    <div class="character-notes">
                        <h4>Notes</h4>
                        <p>${this.escapeHtml(npc.notes)}</p>
                    </div>
                ` : ''}
                
                <div class="character-combat-actions">
                    <button class="btn btn-primary add-to-combat-btn" data-npc-id="${npc.id}">
                        Add to Combat
                    </button>
                </div>
            </div>
        `;
    }

    showCreateForm() {
        this.container.innerHTML = `
            <div class="npc-form">
                <h3>Create New NPC</h3>
                <form id="npc-create-form">
                    <div class="form-group">
                        <label for="npc-name">Name *</label>
                        <input type="text" id="npc-name" required />
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="npc-class">Class/Role</label>
                            <input type="text" id="npc-class" />
                        </div>
                        <div class="form-group">
                            <label for="npc-level">Level</label>
                            <input type="number" id="npc-level" min="1" max="20" value="1" />
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="npc-ac">AC *</label>
                            <input type="number" id="npc-ac" required min="1" value="10" />
                        </div>
                        <div class="form-group">
                            <label for="npc-max-hp">Max HP *</label>
                            <input type="number" id="npc-max-hp" required min="1" value="10" />
                        </div>
                        <div class="form-group">
                            <label for="npc-initiative">Initiative</label>
                            <input type="number" id="npc-initiative" value="0" />
                        </div>
                    </div>
                    
                    <h4>Saving Throws</h4>
                    <div class="form-row saves-row">
                        <div class="form-group">
                            <label for="npc-save-str">STR</label>
                            <input type="number" id="npc-save-str" value="0" />
                        </div>
                        <div class="form-group">
                            <label for="npc-save-dex">DEX</label>
                            <input type="number" id="npc-save-dex" value="0" />
                        </div>
                        <div class="form-group">
                            <label for="npc-save-con">CON</label>
                            <input type="number" id="npc-save-con" value="0" />
                        </div>
                        <div class="form-group">
                            <label for="npc-save-int">INT</label>
                            <input type="number" id="npc-save-int" value="0" />
                        </div>
                        <div class="form-group">
                            <label for="npc-save-wis">WIS</label>
                            <input type="number" id="npc-save-wis" value="0" />
                        </div>
                        <div class="form-group">
                            <label for="npc-save-cha">CHA</label>
                            <input type="number" id="npc-save-cha" value="0" />
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="npc-notes">Notes</label>
                        <textarea id="npc-notes" rows="3"></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" id="save-npc-btn" class="btn btn-primary">Create NPC</button>
                        <button type="button" id="cancel-npc-btn" class="btn btn-secondary">Cancel</button>
                    </div>
                </form>
            </div>
        `;
    }

    showEditForm() {
        const npc = this.getSelectedNPC();
        if (!npc) return;

        this.container.innerHTML = `
            <div class="npc-form">
                <h3>Edit NPC</h3>
                <form id="npc-edit-form">
                    <input type="hidden" id="npc-id" value="${npc.id}" />
                    
                    <div class="form-group">
                        <label for="npc-name">Name *</label>
                        <input type="text" id="npc-name" value="${this.escapeHtml(npc.name)}" required />
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="npc-class">Class/Role</label>
                            <input type="text" id="npc-class" value="${this.escapeHtml(npc.character_class || '')}" />
                        </div>
                        <div class="form-group">
                            <label for="npc-level">Level</label>
                            <input type="number" id="npc-level" min="1" max="20" value="${npc.level || 1}" />
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="npc-ac">AC *</label>
                            <input type="number" id="npc-ac" required min="1" value="${npc.ac}" />
                        </div>
                        <div class="form-group">
                            <label for="npc-max-hp">Max HP *</label>
                            <input type="number" id="npc-max-hp" required min="1" value="${npc.max_hp}" />
                        </div>
                        <div class="form-group">
                            <label for="npc-initiative">Initiative</label>
                            <input type="number" id="npc-initiative" value="${npc.initiative || 0}" />
                        </div>
                    </div>
                    
                    <h4>Saving Throws</h4>
                    <div class="form-row saves-row">
                        <div class="form-group">
                            <label for="npc-save-str">STR</label>
                            <input type="number" id="npc-save-str" value="${npc.save_strength || 0}" />
                        </div>
                        <div class="form-group">
                            <label for="npc-save-dex">DEX</label>
                            <input type="number" id="npc-save-dex" value="${npc.save_dexterity || 0}" />
                        </div>
                        <div class="form-group">
                            <label for="npc-save-con">CON</label>
                            <input type="number" id="npc-save-con" value="${npc.save_constitution || 0}" />
                        </div>
                        <div class="form-group">
                            <label for="npc-save-int">INT</label>
                            <input type="number" id="npc-save-int" value="${npc.save_intelligence || 0}" />
                        </div>
                        <div class="form-group">
                            <label for="npc-save-wis">WIS</label>
                            <input type="number" id="npc-save-wis" value="${npc.save_wisdom || 0}" />
                        </div>
                        <div class="form-group">
                            <label for="npc-save-cha">CHA</label>
                            <input type="number" id="npc-save-cha" value="${npc.save_charisma || 0}" />
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="npc-notes">Notes</label>
                        <textarea id="npc-notes" rows="3">${this.escapeHtml(npc.notes || '')}</textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" id="save-npc-btn" class="btn btn-primary">Save Changes</button>
                        <button type="button" id="cancel-npc-btn" class="btn btn-secondary">Cancel</button>
                        <button type="button" id="delete-npc-btn" class="btn btn-danger" data-npc-id="${npc.id}">Delete NPC</button>
                    </div>
                </form>
            </div>
        `;
    }

    async saveNPC() {
        try {
            const npcId = document.getElementById('npc-id')?.value;
            const isEdit = !!npcId;
            
            const npcData = {
                campaign_id: state.get('currentCampaignId'),
                name: document.getElementById('npc-name').value,
                character_class: document.getElementById('npc-class').value,
                level: parseInt(document.getElementById('npc-level').value) || 1,
                ac: parseInt(document.getElementById('npc-ac').value),
                max_hp: parseInt(document.getElementById('npc-max-hp').value),
                current_hp: isEdit ? undefined : parseInt(document.getElementById('npc-max-hp').value),
                initiative: parseInt(document.getElementById('npc-initiative').value) || 0,
                save_strength: parseInt(document.getElementById('npc-save-str').value) || 0,
                save_dexterity: parseInt(document.getElementById('npc-save-dex').value) || 0,
                save_constitution: parseInt(document.getElementById('npc-save-con').value) || 0,
                save_intelligence: parseInt(document.getElementById('npc-save-int').value) || 0,
                save_wisdom: parseInt(document.getElementById('npc-save-wis').value) || 0,
                save_charisma: parseInt(document.getElementById('npc-save-cha').value) || 0,
                notes: document.getElementById('npc-notes').value
            };
            
            let npc;
            if (isEdit) {
                npc = await api.updateNPC(npcId, npcData);
                state.updateNPC(parseInt(npcId), npc);
                state.updateCombatant(parseInt(npcId), npc);
            } else {
                npc = await api.createNPC(npcData);
                state.addNPC(npc);
                // Don't automatically add to combat - let user add manually via initiative tracker
            }
            
            this.selectedNPCId = npc.id;
            this.render();
        } catch (error) {
            console.error('Failed to save NPC:', error);
            this.showError('Failed to save NPC');
        }
    }

    async deleteNPC(npcId = null) {
        const id = npcId || this.selectedNPCId;
        const npc = this.getNPCById(id);
        
        if (!npc) {
            this.showError('NPC not found');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete ${npc.name}? This cannot be undone.`)) {
            return;
        }
        
        try {
            console.log('Deleting NPC:', npc.name, 'ID:', id);
            
            await api.deleteNPC(id);
            
            // Remove from state
            const npcs = state.get('npcs').filter(n => n.id !== id);
            state.setState({ npcs });
            
            // Also remove from combatants if present
            const combatants = state.get('combatants').filter(c => c.id !== id);
            state.setState({ combatants });
            
            // Clear selection
            this.selectedNPCId = null;
            state.clearSelection();
            
            this.showSuccess(`${npc.name} deleted successfully`);
            this.render();
        } catch (error) {
            console.error('Failed to delete NPC:', error);
            this.showError(`Failed to delete NPC: ${error.message}`);
        }
    }

    async addToCombat(npcId) {
        try {
            const npc = this.getNPCById(npcId);
            if (!npc) {
                this.showError('NPC not found');
                return;
            }
            
            // Check if already in combat
            const combatants = state.get('combatants') || [];
            const alreadyInCombat = combatants.some(c => c.id === npcId);
            
            if (alreadyInCombat) {
                this.showError('NPC is already in combat');
                return;
            }
            
            // Prompt for initiative
            const initiative = prompt(`Enter initiative for ${npc.name}:`, '10');
            if (initiative === null) return; // User cancelled
            
            const initiativeValue = parseInt(initiative) || 0;
            
            // Update the NPC's initiative (NPCs exist in combatants table with type='NPC')
            const response = await api.updateNPC(npcId, {
                initiative: initiativeValue
            });
            
            if (response) {
                // Update state - add to initiative tracker
                const updatedNPC = { ...npc, initiative: initiativeValue };
                state.addCombatant(updatedNPC);
                state.updateNPC(npcId, { initiative: initiativeValue });
                this.showSuccess(`${npc.name} added to combat!`);
            }
        } catch (error) {
            console.error('Failed to add to combat:', error);
            this.showError(`Failed to add NPC to combat: ${error.message}`);
        }
    }

    hideCreateForm() {
        this.render();
    }

    getNPCById(id) {
        // Check both npcs array and combatants array
        const npcs = state.get('npcs') || [];
        console.log('getNPCById - Looking for ID:', id, 'in', npcs.length, 'NPCs');
        const npc = npcs.find(n => n.id === id);
        if (npc) {
            console.log('Found NPC:', npc.name);
            return npc;
        }
        
        const combatants = state.get('combatants') || [];
        const combatantNPC = combatants.find(c => c.id === id && c.type === 'NPC');
        if (combatantNPC) {
            console.log('Found NPC in combatants:', combatantNPC.name);
        } else {
            console.log('NPC not found anywhere');
        }
        return combatantNPC;
    }

    getSelectedNPC() {
        const selectedId = state.get('selectedCombatantId') || this.selectedNPCId;
        console.log('getSelectedNPC - selectedId:', selectedId, 'this.selectedNPCId:', this.selectedNPCId);
        const npc = this.getNPCById(selectedId);
        console.log('getSelectedNPC - result:', npc ? npc.name : 'null');
        return npc;
    }

    render() {
        const npcs = state.get('npcs') || [];
        console.log('Rendering NPC panel with', npcs.length, 'NPCs');
        const selectedNPC = this.getSelectedNPC();
        console.log('Selected NPC for render:', selectedNPC ? selectedNPC.name : 'none');
        
        this.container.innerHTML = `
            <div class="character-panel">
                <div class="character-list-section">
                    <div class="section-header">
                        <h3>NPCs</h3>
                        <button id="create-npc-btn" class="btn btn-small btn-primary">+ New</button>
                    </div>
                    <ul class="character-list">
                        ${npcs.length > 0 ? npcs.map(npc => `
                            <li class="character-list-item ${selectedNPC?.id === npc.id ? 'selected' : ''}" 
                                data-npc-id="${npc.id}">
                                <span class="char-name">${this.escapeHtml(npc.name)}</span>
                                <span class="char-hp ${npc.current_hp === 0 ? 'hp-zero' : ''}">${npc.current_hp}/${npc.max_hp}</span>
                            </li>
                        `).join('') : '<li class="no-characters">No NPCs yet</li>'}
                    </ul>
                </div>
                
                <div class="character-detail-section">
                    ${this.displayNPC(selectedNPC)}
                </div>
            </div>
        `;
    }

    formatModifier(value) {
        const num = parseInt(value) || 0;
        return num >= 0 ? `+${num}` : `${num}`;
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

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        this.container.insertBefore(successDiv, this.container.firstChild);
        
        setTimeout(() => successDiv.remove(), 3000);
    }
}

export default new NPCPanel();
