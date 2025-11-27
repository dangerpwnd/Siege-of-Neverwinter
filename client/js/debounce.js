/**
 * Debounce utility for limiting function call frequency
 */

/**
 * Debounce a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute on leading edge instead of trailing
 */
export function debounce(func, wait = 300, immediate = false) {
    let timeout;
    
    return function executedFunction(...args) {
        const context = this;
        
        const later = () => {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        
        const callNow = immediate && !timeout;
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        
        if (callNow) func.apply(context, args);
    };
}

/**
 * Throttle a function call
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between calls in milliseconds
 */
export function throttle(func, limit = 300) {
    let inThrottle;
    
    return function executedFunction(...args) {
        const context = this;
        
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
