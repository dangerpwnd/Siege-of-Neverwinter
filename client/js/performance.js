/**
 * Performance monitoring and optimization utilities
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.enabled = true;
    }

    /**
     * Start timing an operation
     */
    startTimer(label) {
        if (!this.enabled) return;
        
        this.metrics.set(label, {
            startTime: performance.now(),
            endTime: null,
            duration: null
        });
    }

    /**
     * End timing an operation
     */
    endTimer(label) {
        if (!this.enabled) return;
        
        const metric = this.metrics.get(label);
        if (metric) {
            metric.endTime = performance.now();
            metric.duration = metric.endTime - metric.startTime;
            
            if (metric.duration > 100) {
                console.warn(`Slow operation: ${label} took ${metric.duration.toFixed(2)}ms`);
            }
        }
    }

    /**
     * Measure a function execution time
     */
    async measure(label, fn) {
        this.startTimer(label);
        try {
            const result = await fn();
            return result;
        } finally {
            this.endTimer(label);
        }
    }

    /**
     * Get metrics for a specific operation
     */
    getMetric(label) {
        return this.metrics.get(label);
    }

    /**
     * Get all metrics
     */
    getAllMetrics() {
        const results = {};
        this.metrics.forEach((value, key) => {
            results[key] = value;
        });
        return results;
    }

    /**
     * Clear all metrics
     */
    clear() {
        this.metrics.clear();
    }

    /**
     * Enable/disable monitoring
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Log performance summary
     */
    logSummary() {
        console.group('Performance Summary');
        this.metrics.forEach((metric, label) => {
            if (metric.duration !== null) {
                console.log(`${label}: ${metric.duration.toFixed(2)}ms`);
            }
        });
        console.groupEnd();
    }
}

export default new PerformanceMonitor();
