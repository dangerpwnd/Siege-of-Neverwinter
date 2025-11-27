/**
 * Simple in-memory cache for API responses
 * Implements LRU (Least Recently Used) eviction policy
 */

class APICache {
    constructor(maxSize = 50, defaultTTL = 60000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.defaultTTL = defaultTTL; // Time to live in milliseconds
    }

    /**
     * Generate cache key from endpoint and params
     */
    generateKey(endpoint, params = {}) {
        const paramString = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');
        return `${endpoint}${paramString ? '?' + paramString : ''}`;
    }

    /**
     * Get cached value if it exists and is not expired
     */
    get(key) {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return null;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, entry);

        return entry.data;
    }

    /**
     * Set cache value with optional TTL
     */
    set(key, data, ttl = this.defaultTTL) {
        // Evict oldest entry if cache is full
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            data,
            expiresAt: Date.now() + ttl
        });
    }

    /**
     * Invalidate cache entries matching a pattern
     */
    invalidate(pattern) {
        const regex = new RegExp(pattern);
        const keysToDelete = [];

        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.cache.delete(key));
    }

    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            entries: Array.from(this.cache.keys())
        };
    }
}

export default new APICache();
