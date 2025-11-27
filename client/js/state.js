// Application-wide state management system

class StateManager {
    constructor() {
        this.state = {
            currentCampaignId: 1, // Default campaign
            combatants: [],
            characters: [],
            npcs: [],
            monsters: [],
            monsterInstances: [],
            siegeState: null,
            locations: [],
            plotPoints: [],
            moduleVisibility: {},
            modulePositions: {},
            moduleSizes: {},
            currentTurnIndex: 0,
            selectedCombatantId: null,
        };
        
        this.listeners = new Map();
        this.listenerIdCounter = 0;
    }

    // Get current state
    getState() {
        return { ...this.state };
    }

    // Get specific state property
    get(key) {
        return this.state[key];
    }

    // Set state and notify listeners
    setState(updates) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...updates };
        
        // Notify all listeners of state change
        this.notifyListeners(oldState, this.state);
    }

    // Update nested state property
    updateProperty(key, value) {
        this.setState({ [key]: value });
    }

    // Subscribe to state changes
    subscribe(callback) {
        const id = this.listenerIdCounter++;
        this.listeners.set(id, callback);
        
        // Return unsubscribe function
        return () => {
            this.listeners.delete(id);
        };
    }

    // Notify all listeners
    notifyListeners(oldState, newState) {
        this.listeners.forEach(callback => {
            try {
                callback(newState, oldState);
            } catch (error) {
                console.error('Error in state listener:', error);
            }
        });
    }

    // Combatant management
    addCombatant(combatant) {
        const combatants = [...this.state.combatants];
        
        // Use binary search for optimized insertion (O(log n) search + O(n) insert)
        // This is more efficient than push + sort (O(n log n)) for single additions
        const insertIndex = this._findInsertIndex(combatants, combatant.initiative);
        combatants.splice(insertIndex, 0, combatant);
        
        this.setState({ combatants });
    }

    updateCombatant(id, updates) {
        const combatants = this.state.combatants.map(c => 
            c.id === id ? { ...c, ...updates } : c
        );
        // Re-sort if initiative changed
        if (updates.initiative !== undefined) {
            combatants.sort((a, b) => b.initiative - a.initiative);
        }
        this.setState({ combatants });
    }
    
    /**
     * Binary search to find insertion index for initiative value
     * Returns index where new combatant should be inserted to maintain descending order
     * @private
     */
    _findInsertIndex(combatants, initiative) {
        let left = 0;
        let right = combatants.length;
        
        while (left < right) {
            const mid = Math.floor((left + right) / 2);
            if (combatants[mid].initiative > initiative) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }
        
        return left;
    }

    removeCombatant(id) {
        const combatants = this.state.combatants.filter(c => c.id !== id);
        this.setState({ combatants });
    }

    getCombatantById(id) {
        return this.state.combatants.find(c => c.id === id);
    }

    // Turn management
    nextTurn() {
        const { combatants, currentTurnIndex } = this.state;
        if (combatants.length === 0) return;
        
        const newIndex = (currentTurnIndex + 1) % combatants.length;
        this.setState({ currentTurnIndex: newIndex });
    }

    getCurrentCombatant() {
        const { combatants, currentTurnIndex } = this.state;
        return combatants[currentTurnIndex] || null;
    }

    // Character management
    addCharacter(character) {
        const characters = [...this.state.characters, character];
        this.setState({ characters });
    }

    updateCharacter(id, updates) {
        const characters = this.state.characters.map(c => 
            c.id === id ? { ...c, ...updates } : c
        );
        this.setState({ characters });
    }

    getCharacterById(id) {
        return this.state.characters.find(c => c.id === id);
    }

    // NPC management
    addNPC(npc) {
        const npcs = [...this.state.npcs, npc];
        this.setState({ npcs });
    }

    updateNPC(id, updates) {
        const npcs = this.state.npcs.map(n => 
            n.id === id ? { ...n, ...updates } : n
        );
        this.setState({ npcs });
    }

    removeNPC(id) {
        const npcs = this.state.npcs.filter(n => n.id !== id);
        this.setState({ npcs });
    }

    getNPCById(id) {
        return this.state.npcs.find(n => n.id === id);
    }

    // Monster management
    addMonster(monster) {
        const monsters = [...this.state.monsters, monster];
        this.setState({ monsters });
    }

    getMonsterById(id) {
        return this.state.monsters.find(m => m.id === id);
    }

    // Siege state management
    updateSiegeState(updates) {
        const siegeState = { ...this.state.siegeState, ...updates };
        this.setState({ siegeState });
    }

    // Location management
    updateLocation(id, updates) {
        const locations = this.state.locations.map(l => 
            l.id === id ? { ...l, ...updates } : l
        );
        this.setState({ locations });
    }

    // Plot point management
    addPlotPoint(plotPoint) {
        const plotPoints = [...this.state.plotPoints, plotPoint];
        this.setState({ plotPoints });
    }

    updatePlotPoint(id, updates) {
        const plotPoints = this.state.plotPoints.map(p => 
            p.id === id ? { ...p, ...updates } : p
        );
        this.setState({ plotPoints });
    }

    removePlotPoint(id) {
        const plotPoints = this.state.plotPoints.filter(p => p.id !== id);
        this.setState({ plotPoints });
    }

    // Module visibility management
    toggleModuleVisibility(moduleId) {
        const moduleVisibility = { ...this.state.moduleVisibility };
        moduleVisibility[moduleId] = !moduleVisibility[moduleId];
        this.setState({ moduleVisibility });
    }

    setModuleVisibility(moduleId, visible) {
        const moduleVisibility = { ...this.state.moduleVisibility };
        moduleVisibility[moduleId] = visible;
        this.setState({ moduleVisibility });
    }

    isModuleVisible(moduleId) {
        return this.state.moduleVisibility[moduleId] !== false; // Default to visible
    }

    // Module position and size management
    setModulePosition(moduleId, position) {
        const modulePositions = { ...this.state.modulePositions || {} };
        modulePositions[moduleId] = { ...modulePositions[moduleId], ...position };
        this.setState({ modulePositions });
    }

    getModulePosition(moduleId) {
        return this.state.modulePositions?.[moduleId] || null;
    }

    setModuleSize(moduleId, size) {
        const moduleSizes = { ...this.state.moduleSizes || {} };
        moduleSizes[moduleId] = { ...moduleSizes[moduleId], ...size };
        this.setState({ moduleSizes });
    }

    getModuleSize(moduleId) {
        return this.state.moduleSizes?.[moduleId] || null;
    }

    // Selection management
    selectCombatant(id) {
        this.setState({ selectedCombatantId: id });
    }

    clearSelection() {
        this.setState({ selectedCombatantId: null });
    }

    // Reset state
    reset() {
        this.state = {
            currentCampaignId: 1,
            combatants: [],
            characters: [],
            npcs: [],
            monsters: [],
            monsterInstances: [],
            siegeState: null,
            locations: [],
            plotPoints: [],
            moduleVisibility: {},
            modulePositions: {},
            moduleSizes: {},
            currentTurnIndex: 0,
            selectedCombatantId: null,
        };
        this.notifyListeners({}, this.state);
    }
}

export default new StateManager();
