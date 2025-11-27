// Character Panel Component

import api from './api.js';
import state from './state.js';

class CharacterPanel {
    constructor() {
        this.container = document.getElementById('character-content');
        this.selectedCharacterId = null;
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        
        // Subscribe to state changes
        state.subscribe((newState, oldState) => {
            // Re-render if characters changed or selection changed
            if (newState.characters !== oldState.characters || 
                newState.selectedCombatantId !== oldState.selectedCombatantId ||
                newState.combatants !== oldState.combatants) {
                this.render();
            }
        });
    }

    setupEventListeners() {
        // Event delegation for dynamic content
        this.container.addEventListener('click', (e) => {
            // Character selection
            if (e.target.closest('.character-list-item')) {
                const item = e.target.closest('.character-list-item');
                const characterId = parseInt(item.dataset.characterId);
                this.selectCharacter(characterId);
            }
            
            // HP update buttons
            if (e.target.closest('.hp-btn')) {
                const btn = e.target.closest('.hp-btn');
                const characterId = parseInt(btn.dataset.characterId);
                const change = parseInt(btn.dataset.change);
                this.updateHP(characterId, change);
            }
            
            // Create character button
            if (e.target.closest('#create-character-btn')) {
                this.showCreateForm();
            }
            
            // Save character button
            if (e.target.closest('#save-character-btn')) {
                this.saveCharacter();
            }
            
            // Cancel button
            if (e.target.closest('#cancel-character-btn')) {
                this.hideCreateForm();
            }
            
            // Edit character button
            if (e.target.closest('#edit-character-btn')) {
                this.showEditForm();
            }
        });

        // HP input change
        this.container.addEventListener('change', (e) => {
            if (e.target.id === 'character-hp-input') {
                const characterId = parseInt(e.target.dataset.characterId);
                const newHP = parseInt(e.target.value);
                this.setHP(characterId, newHP);
            }
        });
    }

    async loadCharacters() {
        try {
            const campaignId = state.get('currentCampaignId');
            const characters = await api.getCharacters(campaignId);
            state.setState({ characters });
        } catch (error) {
            console.error('Failed to load characters:', error);
            this.showError('Failed to load characters');
        }
    }

    selectCharacter(characterId) {
        this.selectedCharacterId = characterId;
        state.selectCombatant(characterId);
        this.render();
    }

    async updateHP(characterId, change) {
        try {
            const character = state.getCharacterById(characterId) || 
                             state.getCombatantById(characterId);
            
            if (!character) return;
            
            const newHP = Math.max(0, character.current_hp + change);
            await this.setHP(characterId, newHP);
        } catch (error) {
            console.error('Failed to update HP:', error);
            this.showError('Failed to update HP');
        }
    }

    async setHP(characterId, newHP) {
        try {
            const character = state.getCharacterById(characterId) || 
                             state.getCombatantById(characterId);
            
            if (!character) return;
            
            // Clamp HP between 0 and max
            const clampedHP = Math.max(0, Math.min(newHP, character.max_hp));
            
            // Update via API
            const updated = await api.updateCharacter(characterId, { 
                current_hp: clampedHP 
            });
            
            // Update state - both in characters and combatants
            state.updateCharacter(characterId, { current_hp: clampedHP });
            state.updateCombatant(characterId, { current_hp: clampedHP });
            
            this.render();
        } catch (error) {
            console.error('Failed to set HP:', error);
            this.showError('Failed to update HP');
        }
    }

    displayCharacter(character) {
        if (!character) {
            return '<div class="no-selection">Select a character to view details</div>';
        }

        const conditions = character.conditions || [];
        const isDown = character.current_hp === 0;
        
        return `
            <div class="character-detail ${isDown ? 'character-down' : ''}">
                <div class="character-header">
                    <h3>${this.escapeHtml(character.name)}</h3>
                    ${character.character_class && character.level ? 
                        `<span class="character-class">${this.escapeHtml(character.character_class)} ${character.level}</span>` 
                        : ''}
                    <button id="edit-character-btn" class="btn btn-small">Edit</button>
                </div>
                
                ${isDown ? '<div class="down-indicator">⚠️ DOWN</div>' : ''}
                
                <div class="character-stats">
                    <div class="stat-block">
                        <label>AC</label>
                        <div class="stat-value">${character.ac}</div>
                    </div>
                    
                    <div class="stat-block hp-block">
                        <label>Hit Points</label>
                        <div class="hp-controls">
                            <button class="hp-btn" data-character-id="${character.id}" data-change="-10">-10</button>
                            <button class="hp-btn" data-character-id="${character.id}" data-change="-5">-5</button>
                            <button class="hp-btn" data-character-id="${character.id}" data-change="-1">-1</button>
                            <input 
                                type="number" 
                                id="character-hp-input"
                                class="hp-input" 
                                value="${character.current_hp}" 
                                min="0" 
                                max="${character.max_hp}"
                                data-character-id="${character.id}"
                            />
                            <span class="hp-max">/ ${character.max_hp}</span>
                            <button class="hp-btn" data-character-id="${character.id}" data-change="1">+1</button>
                            <button class="hp-btn" data-character-id="${character.id}" data-change="5">+5</button>
                            <button class="hp-btn" data-character-id="${character.id}" data-change="10">+10</button>
                        </div>
                    </div>
                </div>
                
                <div class="saving-throws">
                    <h4>Saving Throws</h4>
                    <div class="saves-grid">
                        <div class="save-item">
                            <span class="save-label">STR</span>
                            <span class="save-value">${this.formatModifier(character.save_strength)}</span>
                        </div>
                        <div class="save-item">
                            <span class="save-label">DEX</span>
                            <span class="save-value">${this.formatModifier(character.save_dexterity)}</span>
                        </div>
                        <div class="save-item">
                            <span class="save-label">CON</span>
                            <span class="save-value">${this.formatModifier(character.save_constitution)}</span>
                        </div>
                        <div class="save-item">
                            <span class="save-label">INT</span>
                            <span class="save-value">${this.formatModifier(character.save_intelligence)}</span>
                        </div>
                        <div class="save-item">
                            <span class="save-label">WIS</span>
                            <span class="save-value">${this.formatModifier(character.save_wisdom)}</span>
                        </div>
                        <div class="save-item">
                            <span class="save-label">CHA</span>
                            <span class="save-value">${this.formatModifier(character.save_charisma)}</span>
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
                
                ${character.notes ? `
                    <div class="character-notes">
                        <h4>Notes</h4>
                        <p>${this.escapeHtml(character.notes)}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    showCreateForm() {
        this.container.innerHTML = `
            <div class="character-form">
                <h3>Create New Character</h3>
                <form id="character-create-form">
                    <div class="form-group">
                        <label for="char-name">Name *</label>
                        <input type="text" id="char-name" required />
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="char-class">Class</label>
                            <input type="text" id="char-class" />
                        </div>
                        <div class="form-group">
                            <label for="char-level">Level</label>
                            <input type="number" id="char-level" min="1" max="20" value="1" />
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="char-ac">AC *</label>
                            <input type="number" id="char-ac" required min="1" value="10" />
                        </div>
                        <div class="form-group">
                            <label for="char-max-hp">Max HP *</label>
                            <input type="number" id="char-max-hp" required min="1" value="10" />
                        </div>
                        <div class="form-group">
                            <label for="char-initiative">Initiative</label>
                            <input type="number" id="char-initiative" value="0" />
                        </div>
                    </div>
                    
                    <h4>Saving Throws</h4>
                    <div class="form-row saves-row">
                        <div class="form-group">
                            <label for="char-save-str">STR</label>
                            <input type="number" id="char-save-str" value="0" />
                        </div>
                        <div class="form-group">
                            <label for="char-save-dex">DEX</label>
                            <input type="number" id="char-save-dex" value="0" />
                        </div>
                        <div class="form-group">
                            <label for="char-save-con">CON</label>
                            <input type="number" id="char-save-con" value="0" />
                        </div>
                        <div class="form-group">
                            <label for="char-save-int">INT</label>
                            <input type="number" id="char-save-int" value="0" />
                        </div>
                        <div class="form-group">
                            <label for="char-save-wis">WIS</label>
                            <input type="number" id="char-save-wis" value="0" />
                        </div>
                        <div class="form-group">
                            <label for="char-save-cha">CHA</label>
                            <input type="number" id="char-save-cha" value="0" />
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="char-notes">Notes</label>
                        <textarea id="char-notes" rows="3"></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" id="save-character-btn" class="btn btn-primary">Create Character</button>
                        <button type="button" id="cancel-character-btn" class="btn btn-secondary">Cancel</button>
                    </div>
                </form>
            </div>
        `;
    }

    showEditForm() {
        const character = this.getSelectedCharacter();
        if (!character) return;

        this.container.innerHTML = `
            <div class="character-form">
                <h3>Edit Character</h3>
                <form id="character-edit-form">
                    <input type="hidden" id="char-id" value="${character.id}" />
                    
                    <div class="form-group">
                        <label for="char-name">Name *</label>
                        <input type="text" id="char-name" value="${this.escapeHtml(character.name)}" required />
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="char-class">Class</label>
                            <input type="text" id="char-class" value="${this.escapeHtml(character.character_class || '')}" />
                        </div>
                        <div class="form-group">
                            <label for="char-level">Level</label>
                            <input type="number" id="char-level" min="1" max="20" value="${character.level || 1}" />
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="char-ac">AC *</label>
                            <input type="number" id="char-ac" required min="1" value="${character.ac}" />
                        </div>
                        <div class="form-group">
                            <label for="char-max-hp">Max HP *</label>
                            <input type="number" id="char-max-hp" required min="1" value="${character.max_hp}" />
                        </div>
                        <div class="form-group">
                            <label for="char-initiative">Initiative</label>
                            <input type="number" id="char-initiative" value="${character.initiative || 0}" />
                        </div>
                    </div>
                    
                    <h4>Saving Throws</h4>
                    <div class="form-row saves-row">
                        <div class="form-group">
                            <label for="char-save-str">STR</label>
                            <input type="number" id="char-save-str" value="${character.save_strength || 0}" />
                        </div>
                        <div class="form-group">
                            <label for="char-save-dex">DEX</label>
                            <input type="number" id="char-save-dex" value="${character.save_dexterity || 0}" />
                        </div>
                        <div class="form-group">
                            <label for="char-save-con">CON</label>
                            <input type="number" id="char-save-con" value="${character.save_constitution || 0}" />
                        </div>
                        <div class="form-group">
                            <label for="char-save-int">INT</label>
                            <input type="number" id="char-save-int" value="${character.save_intelligence || 0}" />
                        </div>
                        <div class="form-group">
                            <label for="char-save-wis">WIS</label>
                            <input type="number" id="char-save-wis" value="${character.save_wisdom || 0}" />
                        </div>
                        <div class="form-group">
                            <label for="char-save-cha">CHA</label>
                            <input type="number" id="char-save-cha" value="${character.save_charisma || 0}" />
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="char-notes">Notes</label>
                        <textarea id="char-notes" rows="3">${this.escapeHtml(character.notes || '')}</textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" id="save-character-btn" class="btn btn-primary">Save Changes</button>
                        <button type="button" id="cancel-character-btn" class="btn btn-secondary">Cancel</button>
                    </div>
                </form>
            </div>
        `;
    }

    async saveCharacter() {
        try {
            const characterId = document.getElementById('char-id')?.value;
            const isEdit = !!characterId;
            
            const characterData = {
                campaign_id: state.get('currentCampaignId'),
                name: document.getElementById('char-name').value,
                character_class: document.getElementById('char-class').value,
                level: parseInt(document.getElementById('char-level').value) || 1,
                ac: parseInt(document.getElementById('char-ac').value),
                max_hp: parseInt(document.getElementById('char-max-hp').value),
                current_hp: isEdit ? undefined : parseInt(document.getElementById('char-max-hp').value),
                initiative: parseInt(document.getElementById('char-initiative').value) || 0,
                save_strength: parseInt(document.getElementById('char-save-str').value) || 0,
                save_dexterity: parseInt(document.getElementById('char-save-dex').value) || 0,
                save_constitution: parseInt(document.getElementById('char-save-con').value) || 0,
                save_intelligence: parseInt(document.getElementById('char-save-int').value) || 0,
                save_wisdom: parseInt(document.getElementById('char-save-wis').value) || 0,
                save_charisma: parseInt(document.getElementById('char-save-cha').value) || 0,
                notes: document.getElementById('char-notes').value
            };
            
            let character;
            if (isEdit) {
                character = await api.updateCharacter(characterId, characterData);
                state.updateCharacter(parseInt(characterId), character);
                state.updateCombatant(parseInt(characterId), character);
            } else {
                character = await api.createCharacter(characterData);
                state.addCharacter(character);
                state.addCombatant(character);
            }
            
            this.selectedCharacterId = character.id;
            this.render();
        } catch (error) {
            console.error('Failed to save character:', error);
            this.showError('Failed to save character');
        }
    }

    hideCreateForm() {
        this.render();
    }

    getSelectedCharacter() {
        const selectedId = state.get('selectedCombatantId') || this.selectedCharacterId;
        return state.getCharacterById(selectedId) || state.getCombatantById(selectedId);
    }

    render() {
        const characters = state.get('characters');
        const selectedCharacter = this.getSelectedCharacter();
        
        this.container.innerHTML = `
            <div class="character-panel">
                <div class="character-list-section">
                    <div class="section-header">
                        <h3>Characters</h3>
                        <button id="create-character-btn" class="btn btn-small btn-primary">+ New</button>
                    </div>
                    <ul class="character-list">
                        ${characters.length > 0 ? characters.map(char => `
                            <li class="character-list-item ${selectedCharacter?.id === char.id ? 'selected' : ''}" 
                                data-character-id="${char.id}">
                                <span class="char-name">${this.escapeHtml(char.name)}</span>
                                <span class="char-hp ${char.current_hp === 0 ? 'hp-zero' : ''}">${char.current_hp}/${char.max_hp}</span>
                            </li>
                        `).join('') : '<li class="no-characters">No characters yet</li>'}
                    </ul>
                </div>
                
                <div class="character-detail-section">
                    ${this.displayCharacter(selectedCharacter)}
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
}

export default new CharacterPanel();
