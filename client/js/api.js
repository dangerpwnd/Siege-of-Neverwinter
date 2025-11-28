// REST API Client for frontend-backend communication

import cache from './cache.js';

const API_BASE_URL = window.location.origin + '/api';

class APIClient {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
        this.loadingStates = new Map();
        this.loadingCallbacks = new Map();
    }

    /**
     * Set loading state for an endpoint
     */
    setLoading(endpoint, isLoading) {
        this.loadingStates.set(endpoint, isLoading);
        
        // Notify callbacks
        const callbacks = this.loadingCallbacks.get(endpoint) || [];
        callbacks.forEach(cb => cb(isLoading));
    }

    /**
     * Check if endpoint is loading
     */
    isLoading(endpoint) {
        return this.loadingStates.get(endpoint) || false;
    }

    /**
     * Subscribe to loading state changes
     */
    onLoadingChange(endpoint, callback) {
        if (!this.loadingCallbacks.has(endpoint)) {
            this.loadingCallbacks.set(endpoint, []);
        }
        this.loadingCallbacks.get(endpoint).push(callback);
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const method = options.method || 'GET';
        const useCache = options.cache !== false && method === 'GET';
        
        // Check cache for GET requests
        if (useCache) {
            const cacheKey = cache.generateKey(endpoint);
            const cachedData = cache.get(cacheKey);
            
            if (cachedData) {
                console.log(`Cache hit: ${endpoint}`);
                return cachedData;
            }
        }

        // Remove our custom cache option before passing to fetch
        const { cache: _cache, cacheTTL: _cacheTTL, ...fetchOptions } = options;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...fetchOptions.headers,
            },
            ...fetchOptions,
        };

        // Set loading state
        this.setLoading(endpoint, true);

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Request failed' }));
                throw new Error(error.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            
            // Cache GET requests
            if (useCache) {
                const cacheKey = cache.generateKey(endpoint);
                const ttl = options.cacheTTL || 60000; // Default 60 seconds
                cache.set(cacheKey, data, ttl);
            }

            return data;
        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            throw error;
        } finally {
            this.setLoading(endpoint, false);
        }
    }

    // Generic CRUD methods
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        const result = await this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            cache: false,
        });
        
        // Invalidate related cache entries
        this.invalidateCache(endpoint);
        
        return result;
    }

    async put(endpoint, data) {
        const result = await this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            cache: false,
        });
        
        // Invalidate related cache entries
        this.invalidateCache(endpoint);
        
        return result;
    }

    async delete(endpoint) {
        const result = await this.request(endpoint, { 
            method: 'DELETE',
            cache: false,
        });
        
        // Invalidate related cache entries
        this.invalidateCache(endpoint);
        
        return result;
    }

    /**
     * Invalidate cache entries related to an endpoint
     */
    invalidateCache(endpoint) {
        // Extract resource type from endpoint
        const match = endpoint.match(/^\/([^\/\?]+)/);
        if (match) {
            const resource = match[1];
            cache.invalidate(`^/${resource}`);
        }
    }

    // Campaign endpoints
    async getCampaigns() {
        return this.get('/campaigns');
    }

    async createCampaign(data) {
        return this.post('/campaigns', data);
    }

    async deleteCampaign(id) {
        return this.delete(`/campaigns/${id}`);
    }

    // Combatant endpoints
    async getCombatants(campaignId) {
        return this.get(`/combatants?campaign_id=${campaignId}`);
    }

    async createCombatant(data) {
        return this.post('/combatants', data);
    }

    async updateCombatant(id, data) {
        return this.put(`/combatants/${id}`, data);
    }

    async deleteCombatant(id) {
        return this.delete(`/combatants/${id}`);
    }

    // Initiative endpoints
    async getInitiative(campaignId) {
        return this.get(`/initiative?campaign_id=${campaignId}`);
    }

    async updateInitiative(id, initiative) {
        return this.put(`/initiative/${id}`, { initiative });
    }

    // Character endpoints
    async getCharacters(campaignId) {
        return this.get(`/characters?campaign_id=${campaignId}`);
    }

    async createCharacter(data) {
        return this.post('/characters', data);
    }

    async updateCharacter(id, data) {
        return this.put(`/characters/${id}`, data);
    }

    async deleteCharacter(id) {
        return this.delete(`/characters/${id}`);
    }

    // NPC endpoints
    async getNPCs(campaignId) {
        return this.get(`/npcs?campaign_id=${campaignId}`);
    }

    async createNPC(data) {
        return this.post('/npcs', data);
    }

    async updateNPC(id, data) {
        return this.put(`/npcs/${id}`, data);
    }

    async deleteNPC(id) {
        return this.delete(`/npcs/${id}`);
    }

    // Monster endpoints
    async getMonsters(campaignId) {
        return this.get(`/monsters?campaign_id=${campaignId}`);
    }

    async createMonster(data) {
        return this.post('/monsters', data);
    }

    async createMonsterInstance(monsterId) {
        return this.post(`/monsters/${monsterId}/instances`);
    }

    // Condition endpoints
    async addCondition(combatantId, condition) {
        return this.post(`/combatants/${combatantId}/conditions`, { condition });
    }

    async removeCondition(combatantId, conditionId) {
        return this.delete(`/combatants/${combatantId}/conditions/${conditionId}`);
    }

    // Siege endpoints
    async getSiegeState(campaignId) {
        return this.get(`/siege?campaign_id=${campaignId}`);
    }

    async updateSiegeState(data) {
        return this.put('/siege', data);
    }

    async addSiegeNote(data) {
        return this.post('/siege/notes', data);
    }

    // Location endpoints
    async getLocations(campaignId) {
        return this.get(`/locations?campaign_id=${campaignId}`);
    }

    async updateLocation(id, data) {
        return this.put(`/locations/${id}`, data);
    }

    // Plot point endpoints
    async getPlotPoints(locationId) {
        return this.get(`/plotpoints?location_id=${locationId}`);
    }

    async createPlotPoint(data) {
        return this.post('/plotpoints', data);
    }

    async updatePlotPoint(id, data) {
        return this.put(`/plotpoints/${id}`, data);
    }

    async deletePlotPoint(id) {
        return this.delete(`/plotpoints/${id}`);
    }

    // Preferences endpoints
    async getPreferences(campaignId) {
        return this.get(`/preferences?campaign_id=${campaignId}`);
    }

    async updatePreferences(data) {
        return this.put('/preferences', data);
    }

    // Layout configuration endpoints
    async getLayoutConfiguration(campaignId) {
        return this.get(`/layout?campaign_id=${campaignId}`);
    }

    async updateLayoutConfiguration(data) {
        return this.put('/layout', data);
    }

    // Health check
    async healthCheck() {
        return this.get('/health');
    }
}

export default new APIClient();
