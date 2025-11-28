// Character Panel Component

import api from './api.js';
import state from './state.js';

class CharacterPanel {
    constructor() {
        this.container = document.getElementById('character-content');
        this.selectedCharacterId = null;
        this.referenceData = {
            races: [],
            classes: [],
            subclasses: [],
            backgrounds: []
        };
        this.init();
    }

    async init() {
        await this.loadReferenceData();
        await this.loadCharacters();
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

    async loadReferenceData() {
        try {
            const [races, classes, subclasses, backgrounds] = await Promise.all([
                api.get('/reference/races'),
                api.get('/reference/classes'),
                api.get('/reference/subclasses'),
                api.get('/reference/backgrounds')
            ]);
            
            this.referenceData = {
                races: races.data || [],
                classes: classes.data || [],
                subclasses: subclasses.data || [],
                backgrounds: backgrounds.data || []
            };
        } catch (error) {
            console.error('Failed to load reference data:', error);
        }
    }

    async loadCharacters() {
        try {
            const campaignId = state.get('currentCampaignId');
            const characters = await api.get(`/characters?campaign_id=${campaignId}`);
            
            if (Array.isArray(characters)) {
                state.setState({ characters });
            } else {
                console.error('Invalid characters response:', characters);
                state.setState({ characters: [] });
            }
        } catch (error) {
            console.error('Failed to load characters:', error);
            this.showError('Failed to load characters');
        }
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
            
            // Add to combat button
            if (e.target.closest('.add-to-combat-btn')) {
                const btn = e.target.closest('.add-to-combat-btn');
                const characterId = parseInt(btn.dataset.characterId);
                this.addToCombat(characterId);
            }
        });

        // HP input change and class selection change
        this.container.addEventListener('change', (e) => {
            if (e.target.id === 'character-hp-input') {
                const characterId = parseInt(e.target.dataset.characterId);
                const newHP = parseInt(e.target.value);
                this.setHP(characterId, newHP);
            }
            
            // Class selection change - update subclass options
            if (e.target.id === 'char-class') {
                this.updateSubclassOptions(e.target.value);
            }
        });
    }

    updateSubclassOptions(selectedClass) {
        const subclassSelect = document.getElementById('char-subclass');
        if (!subclassSelect) return;
        
        if (!selectedClass) {
            subclassSelect.disabled = true;
            subclassSelect.innerHTML = '<option value="">Select class first</option>';
            return;
        }
        
        const subclasses = this.getSubclassOptions(selectedClass);
        subclassSelect.disabled = false;
        subclassSelect.innerHTML = '<option value="">Select subclass</option>' + 
            subclasses.map(sub => `<option value="${this.escapeHtml(sub)}">${this.escapeHtml(sub)}</option>`).join('');
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
                    <div class="character-info">
                        ${character.race ? 
                            `<span class="character-race">${this.escapeHtml(character.race)}</span>` 
                            : ''}
                        ${character.character_class && character.level ? 
                            `<span class="character-class">${this.escapeHtml(character.character_class)} ${character.level}${character.subclass ? ` (${this.escapeHtml(character.subclass)})` : ''}</span>` 
                            : ''}
                        ${character.background ? 
                            `<span class="character-background">${this.escapeHtml(character.background)}</span>` 
                            : ''}
                        ${character.alignment ? 
                            `<span class="character-alignment">${this.escapeHtml(character.alignment)}</span>` 
                            : ''}
                    </div>
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
                
                <div class="features-display">
                    <h4>Class & Racial Features</h4>
                    ${this.displayFeatures(character.features)}
                </div>
                
                <div class="items-display">
                    <h4>Magical Items</h4>
                    ${this.displayMagicalItems(character.magical_items)}
                </div>
                
                ${character.notes ? `
                    <div class="character-notes">
                        <h4>Notes</h4>
                        <p>${this.escapeHtml(character.notes)}</p>
                    </div>
                ` : ''}
                
                <div class="character-combat-actions">
                    <button class="btn btn-primary add-to-combat-btn" data-character-id="${character.id}">
                        Add to Combat
                    </button>
                </div>
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
                    
                    <div class="form-group">
                        <label for="char-race">Race</label>
                        <select id="char-race">
                            <option value="">Select race</option>
                            <optgroup label="Dragonborn">
                                <option value="Dragonborn">Dragonborn</option>
                            </optgroup>
                            <optgroup label="Dwarf">
                                <option value="Hill Dwarf">Hill Dwarf</option>
                                <option value="Mountain Dwarf">Mountain Dwarf</option>
                                <option value="Duergar">Duergar</option>
                            </optgroup>
                            <optgroup label="Elf">
                                <option value="High Elf">High Elf</option>
                                <option value="Wood Elf">Wood Elf</option>
                                <option value="Dark Elf (Drow)">Dark Elf (Drow)</option>
                                <option value="Eladrin">Eladrin</option>
                                <option value="Sea Elf">Sea Elf</option>
                                <option value="Shadar-kai">Shadar-kai</option>
                            </optgroup>
                            <optgroup label="Gnome">
                                <option value="Forest Gnome">Forest Gnome</option>
                                <option value="Rock Gnome">Rock Gnome</option>
                                <option value="Deep Gnome">Deep Gnome</option>
                            </optgroup>
                            <optgroup label="Half-Elf">
                                <option value="Half-Elf">Half-Elf</option>
                            </optgroup>
                            <optgroup label="Half-Orc">
                                <option value="Half-Orc">Half-Orc</option>
                            </optgroup>
                            <optgroup label="Halfling">
                                <option value="Lightfoot Halfling">Lightfoot Halfling</option>
                                <option value="Stout Halfling">Stout Halfling</option>
                                <option value="Ghostwise Halfling">Ghostwise Halfling</option>
                            </optgroup>
                            <optgroup label="Human">
                                <option value="Human">Human</option>
                                <option value="Variant Human">Variant Human</option>
                            </optgroup>
                            <optgroup label="Tiefling">
                                <option value="Tiefling">Tiefling</option>
                            </optgroup>
                            <optgroup label="Aasimar">
                                <option value="Protector Aasimar">Protector Aasimar</option>
                                <option value="Scourge Aasimar">Scourge Aasimar</option>
                                <option value="Fallen Aasimar">Fallen Aasimar</option>
                            </optgroup>
                            <optgroup label="Firbolg">
                                <option value="Firbolg">Firbolg</option>
                            </optgroup>
                            <optgroup label="Genasi">
                                <option value="Air Genasi">Air Genasi</option>
                                <option value="Earth Genasi">Earth Genasi</option>
                                <option value="Fire Genasi">Fire Genasi</option>
                                <option value="Water Genasi">Water Genasi</option>
                            </optgroup>
                            <optgroup label="Goliath">
                                <option value="Goliath">Goliath</option>
                            </optgroup>
                            <optgroup label="Kenku">
                                <option value="Kenku">Kenku</option>
                            </optgroup>
                            <optgroup label="Lizardfolk">
                                <option value="Lizardfolk">Lizardfolk</option>
                            </optgroup>
                            <optgroup label="Tabaxi">
                                <option value="Tabaxi">Tabaxi</option>
                            </optgroup>
                            <optgroup label="Triton">
                                <option value="Triton">Triton</option>
                            </optgroup>
                        </select>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="char-class">Class</label>
                            <select id="char-class">
                                <option value="">Select class</option>
                                <option value="Artificer">Artificer</option>
                                <option value="Barbarian">Barbarian</option>
                                <option value="Bard">Bard</option>
                                <option value="Cleric">Cleric</option>
                                <option value="Druid">Druid</option>
                                <option value="Fighter">Fighter</option>
                                <option value="Monk">Monk</option>
                                <option value="Paladin">Paladin</option>
                                <option value="Ranger">Ranger</option>
                                <option value="Rogue">Rogue</option>
                                <option value="Sorcerer">Sorcerer</option>
                                <option value="Warlock">Warlock</option>
                                <option value="Wizard">Wizard</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="char-level">Level</label>
                            <input type="number" id="char-level" min="1" max="20" value="1" />
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="char-subclass">Subclass</label>
                        <select id="char-subclass" disabled>
                            <option value="">Select class first</option>
                        </select>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="char-background">Background</label>
                            <select id="char-background">
                                <option value="">Select background</option>
                                <option value="Acolyte">Acolyte</option>
                                <option value="Charlatan">Charlatan</option>
                                <option value="Criminal">Criminal</option>
                                <option value="Entertainer">Entertainer</option>
                                <option value="Folk Hero">Folk Hero</option>
                                <option value="Guild Artisan">Guild Artisan</option>
                                <option value="Hermit">Hermit</option>
                                <option value="Noble">Noble</option>
                                <option value="Outlander">Outlander</option>
                                <option value="Sage">Sage</option>
                                <option value="Sailor">Sailor</option>
                                <option value="Soldier">Soldier</option>
                                <option value="Urchin">Urchin</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="char-alignment">Alignment</label>
                            <select id="char-alignment">
                                <option value="">Select alignment</option>
                                <option value="Lawful Good">Lawful Good</option>
                                <option value="Neutral Good">Neutral Good</option>
                                <option value="Chaotic Good">Chaotic Good</option>
                                <option value="Lawful Neutral">Lawful Neutral</option>
                                <option value="True Neutral">True Neutral</option>
                                <option value="Chaotic Neutral">Chaotic Neutral</option>
                                <option value="Lawful Evil">Lawful Evil</option>
                                <option value="Neutral Evil">Neutral Evil</option>
                                <option value="Chaotic Evil">Chaotic Evil</option>
                            </select>
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
                    
                    <h4>Class & Racial Features</h4>
                    <div class="form-group">
                        <label for="char-features">Features (one per line: Name | Description)</label>
                        <textarea id="char-features" rows="4" placeholder="Rage | Enter a rage as a bonus action&#10;Darkvision | See in dim light within 60 feet"></textarea>
                        <small>Format: Feature Name | Description (optional)</small>
                    </div>
                    
                    <h4>Magical Items</h4>
                    <div class="form-group">
                        <label for="char-items">Magical Items (one per line: Name | Description | Attunement)</label>
                        <textarea id="char-items" rows="4" placeholder="Flame Tongue | +2d6 fire damage | yes&#10;Ring of Protection | +1 AC and saves"></textarea>
                        <small>Format: Item Name | Description (optional) | Attunement (yes/no, optional)</small>
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
                    
                    <div class="form-group">
                        <label for="char-race">Race</label>
                        <select id="char-race">
                            <option value="">Select race</option>
                            <optgroup label="Dragonborn">
                                <option value="Dragonborn" ${character.race === 'Dragonborn' ? 'selected' : ''}>Dragonborn</option>
                            </optgroup>
                            <optgroup label="Dwarf">
                                <option value="Hill Dwarf" ${character.race === 'Hill Dwarf' ? 'selected' : ''}>Hill Dwarf</option>
                                <option value="Mountain Dwarf" ${character.race === 'Mountain Dwarf' ? 'selected' : ''}>Mountain Dwarf</option>
                                <option value="Duergar" ${character.race === 'Duergar' ? 'selected' : ''}>Duergar</option>
                            </optgroup>
                            <optgroup label="Elf">
                                <option value="High Elf" ${character.race === 'High Elf' ? 'selected' : ''}>High Elf</option>
                                <option value="Wood Elf" ${character.race === 'Wood Elf' ? 'selected' : ''}>Wood Elf</option>
                                <option value="Dark Elf (Drow)" ${character.race === 'Dark Elf (Drow)' ? 'selected' : ''}>Dark Elf (Drow)</option>
                                <option value="Eladrin" ${character.race === 'Eladrin' ? 'selected' : ''}>Eladrin</option>
                                <option value="Sea Elf" ${character.race === 'Sea Elf' ? 'selected' : ''}>Sea Elf</option>
                                <option value="Shadar-kai" ${character.race === 'Shadar-kai' ? 'selected' : ''}>Shadar-kai</option>
                            </optgroup>
                            <optgroup label="Gnome">
                                <option value="Forest Gnome" ${character.race === 'Forest Gnome' ? 'selected' : ''}>Forest Gnome</option>
                                <option value="Rock Gnome" ${character.race === 'Rock Gnome' ? 'selected' : ''}>Rock Gnome</option>
                                <option value="Deep Gnome" ${character.race === 'Deep Gnome' ? 'selected' : ''}>Deep Gnome</option>
                            </optgroup>
                            <optgroup label="Half-Elf">
                                <option value="Half-Elf" ${character.race === 'Half-Elf' ? 'selected' : ''}>Half-Elf</option>
                            </optgroup>
                            <optgroup label="Half-Orc">
                                <option value="Half-Orc" ${character.race === 'Half-Orc' ? 'selected' : ''}>Half-Orc</option>
                            </optgroup>
                            <optgroup label="Halfling">
                                <option value="Lightfoot Halfling" ${character.race === 'Lightfoot Halfling' ? 'selected' : ''}>Lightfoot Halfling</option>
                                <option value="Stout Halfling" ${character.race === 'Stout Halfling' ? 'selected' : ''}>Stout Halfling</option>
                                <option value="Ghostwise Halfling" ${character.race === 'Ghostwise Halfling' ? 'selected' : ''}>Ghostwise Halfling</option>
                            </optgroup>
                            <optgroup label="Human">
                                <option value="Human" ${character.race === 'Human' ? 'selected' : ''}>Human</option>
                                <option value="Variant Human" ${character.race === 'Variant Human' ? 'selected' : ''}>Variant Human</option>
                            </optgroup>
                            <optgroup label="Tiefling">
                                <option value="Tiefling" ${character.race === 'Tiefling' ? 'selected' : ''}>Tiefling</option>
                            </optgroup>
                            <optgroup label="Aasimar">
                                <option value="Protector Aasimar" ${character.race === 'Protector Aasimar' ? 'selected' : ''}>Protector Aasimar</option>
                                <option value="Scourge Aasimar" ${character.race === 'Scourge Aasimar' ? 'selected' : ''}>Scourge Aasimar</option>
                                <option value="Fallen Aasimar" ${character.race === 'Fallen Aasimar' ? 'selected' : ''}>Fallen Aasimar</option>
                            </optgroup>
                            <optgroup label="Firbolg">
                                <option value="Firbolg" ${character.race === 'Firbolg' ? 'selected' : ''}>Firbolg</option>
                            </optgroup>
                            <optgroup label="Genasi">
                                <option value="Air Genasi" ${character.race === 'Air Genasi' ? 'selected' : ''}>Air Genasi</option>
                                <option value="Earth Genasi" ${character.race === 'Earth Genasi' ? 'selected' : ''}>Earth Genasi</option>
                                <option value="Fire Genasi" ${character.race === 'Fire Genasi' ? 'selected' : ''}>Fire Genasi</option>
                                <option value="Water Genasi" ${character.race === 'Water Genasi' ? 'selected' : ''}>Water Genasi</option>
                            </optgroup>
                            <optgroup label="Goliath">
                                <option value="Goliath" ${character.race === 'Goliath' ? 'selected' : ''}>Goliath</option>
                            </optgroup>
                            <optgroup label="Kenku">
                                <option value="Kenku" ${character.race === 'Kenku' ? 'selected' : ''}>Kenku</option>
                            </optgroup>
                            <optgroup label="Lizardfolk">
                                <option value="Lizardfolk" ${character.race === 'Lizardfolk' ? 'selected' : ''}>Lizardfolk</option>
                            </optgroup>
                            <optgroup label="Tabaxi">
                                <option value="Tabaxi" ${character.race === 'Tabaxi' ? 'selected' : ''}>Tabaxi</option>
                            </optgroup>
                            <optgroup label="Triton">
                                <option value="Triton" ${character.race === 'Triton' ? 'selected' : ''}>Triton</option>
                            </optgroup>
                        </select>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="char-class">Class</label>
                            <select id="char-class">
                                <option value="">Select class</option>
                                <option value="Artificer" ${character.character_class === 'Artificer' ? 'selected' : ''}>Artificer</option>
                                <option value="Barbarian" ${character.character_class === 'Barbarian' ? 'selected' : ''}>Barbarian</option>
                                <option value="Bard" ${character.character_class === 'Bard' ? 'selected' : ''}>Bard</option>
                                <option value="Cleric" ${character.character_class === 'Cleric' ? 'selected' : ''}>Cleric</option>
                                <option value="Druid" ${character.character_class === 'Druid' ? 'selected' : ''}>Druid</option>
                                <option value="Fighter" ${character.character_class === 'Fighter' ? 'selected' : ''}>Fighter</option>
                                <option value="Monk" ${character.character_class === 'Monk' ? 'selected' : ''}>Monk</option>
                                <option value="Paladin" ${character.character_class === 'Paladin' ? 'selected' : ''}>Paladin</option>
                                <option value="Ranger" ${character.character_class === 'Ranger' ? 'selected' : ''}>Ranger</option>
                                <option value="Rogue" ${character.character_class === 'Rogue' ? 'selected' : ''}>Rogue</option>
                                <option value="Sorcerer" ${character.character_class === 'Sorcerer' ? 'selected' : ''}>Sorcerer</option>
                                <option value="Warlock" ${character.character_class === 'Warlock' ? 'selected' : ''}>Warlock</option>
                                <option value="Wizard" ${character.character_class === 'Wizard' ? 'selected' : ''}>Wizard</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="char-level">Level</label>
                            <input type="number" id="char-level" min="1" max="20" value="${character.level || 1}" />
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="char-subclass">Subclass</label>
                        <select id="char-subclass" ${!character.character_class ? 'disabled' : ''}>
                            <option value="">Select subclass</option>
                            ${character.character_class ? this.getSubclassOptions(character.character_class).map(sub => 
                                `<option value="${sub}" ${character.subclass === sub ? 'selected' : ''}>${sub}</option>`
                            ).join('') : ''}
                        </select>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="char-background">Background</label>
                            <select id="char-background">
                                <option value="">Select background</option>
                                <option value="Acolyte" ${character.background === 'Acolyte' ? 'selected' : ''}>Acolyte</option>
                                <option value="Charlatan" ${character.background === 'Charlatan' ? 'selected' : ''}>Charlatan</option>
                                <option value="Criminal" ${character.background === 'Criminal' ? 'selected' : ''}>Criminal</option>
                                <option value="Entertainer" ${character.background === 'Entertainer' ? 'selected' : ''}>Entertainer</option>
                                <option value="Folk Hero" ${character.background === 'Folk Hero' ? 'selected' : ''}>Folk Hero</option>
                                <option value="Guild Artisan" ${character.background === 'Guild Artisan' ? 'selected' : ''}>Guild Artisan</option>
                                <option value="Hermit" ${character.background === 'Hermit' ? 'selected' : ''}>Hermit</option>
                                <option value="Noble" ${character.background === 'Noble' ? 'selected' : ''}>Noble</option>
                                <option value="Outlander" ${character.background === 'Outlander' ? 'selected' : ''}>Outlander</option>
                                <option value="Sage" ${character.background === 'Sage' ? 'selected' : ''}>Sage</option>
                                <option value="Sailor" ${character.background === 'Sailor' ? 'selected' : ''}>Sailor</option>
                                <option value="Soldier" ${character.background === 'Soldier' ? 'selected' : ''}>Soldier</option>
                                <option value="Urchin" ${character.background === 'Urchin' ? 'selected' : ''}>Urchin</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="char-alignment">Alignment</label>
                            <select id="char-alignment">
                                <option value="">Select alignment</option>
                                <option value="Lawful Good" ${character.alignment === 'Lawful Good' ? 'selected' : ''}>Lawful Good</option>
                                <option value="Neutral Good" ${character.alignment === 'Neutral Good' ? 'selected' : ''}>Neutral Good</option>
                                <option value="Chaotic Good" ${character.alignment === 'Chaotic Good' ? 'selected' : ''}>Chaotic Good</option>
                                <option value="Lawful Neutral" ${character.alignment === 'Lawful Neutral' ? 'selected' : ''}>Lawful Neutral</option>
                                <option value="True Neutral" ${character.alignment === 'True Neutral' ? 'selected' : ''}>True Neutral</option>
                                <option value="Chaotic Neutral" ${character.alignment === 'Chaotic Neutral' ? 'selected' : ''}>Chaotic Neutral</option>
                                <option value="Lawful Evil" ${character.alignment === 'Lawful Evil' ? 'selected' : ''}>Lawful Evil</option>
                                <option value="Neutral Evil" ${character.alignment === 'Neutral Evil' ? 'selected' : ''}>Neutral Evil</option>
                                <option value="Chaotic Evil" ${character.alignment === 'Chaotic Evil' ? 'selected' : ''}>Chaotic Evil</option>
                            </select>
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
                    
                    <h4>Class & Racial Features</h4>
                    <div class="form-group">
                        <label for="char-features">Features (one per line: Name | Description)</label>
                        <textarea id="char-features" rows="4" placeholder="Rage | Enter a rage as a bonus action&#10;Darkvision | See in dim light within 60 feet">${this.formatFeaturesForEdit(character.features)}</textarea>
                        <small>Format: Feature Name | Description (optional)</small>
                    </div>
                    
                    <h4>Magical Items</h4>
                    <div class="form-group">
                        <label for="char-items">Magical Items (one per line: Name | Description | Attunement)</label>
                        <textarea id="char-items" rows="4" placeholder="Flame Tongue | +2d6 fire damage | yes&#10;Ring of Protection | +1 AC and saves">${this.formatItemsForEdit(character.magical_items)}</textarea>
                        <small>Format: Item Name | Description (optional) | Attunement (yes/no, optional)</small>
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
            
            const featuresText = document.getElementById('char-features').value;
            const itemsText = document.getElementById('char-items').value;
            
            const characterData = {
                campaign_id: state.get('currentCampaignId'),
                name: document.getElementById('char-name').value,
                race: document.getElementById('char-race').value,
                character_class: document.getElementById('char-class').value,
                subclass: document.getElementById('char-subclass').value,
                level: parseInt(document.getElementById('char-level').value) || 1,
                background: document.getElementById('char-background').value,
                alignment: document.getElementById('char-alignment').value,
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
                notes: document.getElementById('char-notes').value,
                features: this.parseFeaturesFromForm(featuresText),
                magical_items: this.parseItemsFromForm(itemsText)
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

    async addToCombat(characterId) {
        try {
            const character = state.getCharacterById(characterId);
            if (!character) {
                this.showError('Character not found');
                return;
            }
            
            // Check if already in combat
            const combatants = state.get('combatants') || [];
            const alreadyInCombat = combatants.some(c => c.id === characterId);
            
            if (alreadyInCombat) {
                this.showError('Character is already in combat');
                return;
            }
            
            // Prompt for initiative
            const initiative = prompt(`Enter initiative for ${character.name}:`, '10');
            if (initiative === null) return; // User cancelled
            
            const initiativeValue = parseInt(initiative) || 0;
            
            // Add to initiative tracker via API
            const response = await api.post('/initiative', {
                campaign_id: state.get('currentCampaignId'),
                combatant_id: characterId,
                initiative: initiativeValue
            });
            
            if (response.success) {
                // Update state
                state.addCombatant({ ...character, initiative: initiativeValue });
                this.showSuccess(`${character.name} added to combat!`);
            }
        } catch (error) {
            console.error('Failed to add to combat:', error);
            this.showError('Failed to add character to combat');
        }
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

    getSubclassOptions(characterClass) {
        return this.referenceData.subclasses
            .filter(sub => sub.class_name === characterClass)
            .map(sub => sub.name);
    }

    getRacesByFamily() {
        const grouped = {};
        this.referenceData.races.forEach(race => {
            if (!grouped[race.race_family]) {
                grouped[race.race_family] = [];
            }
            grouped[race.race_family].push(race.name);
        });
        return grouped;
    }

    displayFeatures(features) {
        const featureList = Array.isArray(features) ? features : [];
        
        if (featureList.length === 0) {
            return '<p class="no-features">No features listed</p>';
        }
        
        return `
            <ul class="feature-list">
                ${featureList.map(feature => `
                    <li class="feature-item">
                        <strong>${this.escapeHtml(feature.name)}</strong>
                        ${feature.description ? `<p>${this.escapeHtml(feature.description)}</p>` : ''}
                    </li>
                `).join('')}
            </ul>
        `;
    }

    formatFeaturesForEdit(features) {
        const featureList = Array.isArray(features) ? features : [];
        return featureList.map(f => {
            return f.description ? `${f.name} | ${f.description}` : f.name;
        }).join('\n');
    }

    parseFeaturesFromForm(text) {
        if (!text || !text.trim()) return [];
        
        return text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => {
                const parts = line.split('|').map(p => p.trim());
                return {
                    name: parts[0],
                    description: parts[1] || ''
                };
            });
    }

    displayMagicalItems(items) {
        const itemList = Array.isArray(items) ? items : [];
        
        if (itemList.length === 0) {
            return '<p class="no-items">No magical items</p>';
        }
        
        return `
            <ul class="item-list">
                ${itemList.map(item => `
                    <li class="item-entry">
                        <strong>${this.escapeHtml(item.name)}</strong>
                        ${item.attunement ? '<span class="attunement-badge">Attunement</span>' : ''}
                        ${item.description ? `<p>${this.escapeHtml(item.description)}</p>` : ''}
                    </li>
                `).join('')}
            </ul>
        `;
    }

    formatItemsForEdit(items) {
        const itemList = Array.isArray(items) ? items : [];
        return itemList.map(item => {
            let line = item.name;
            if (item.description) line += ` | ${item.description}`;
            if (item.attunement) line += ' | yes';
            return line;
        }).join('\n');
    }

    parseItemsFromForm(text) {
        if (!text || !text.trim()) return [];
        
        return text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => {
                const parts = line.split('|').map(p => p.trim());
                return {
                    name: parts[0],
                    description: parts[1] || '',
                    attunement: parts[2] && parts[2].toLowerCase() === 'yes'
                };
            });
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

export default new CharacterPanel();
