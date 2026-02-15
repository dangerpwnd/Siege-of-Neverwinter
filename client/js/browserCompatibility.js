// Browser compatibility utilities and polyfills

/**
 * Browser detection (use sparingly, prefer feature detection)
 */
export const browser = {
    isChrome: /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor),
    isFirefox: /Firefox/.test(navigator.userAgent),
    isEdge: /Edg/.test(navigator.userAgent),
    isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
    isIE: /MSIE|Trident/.test(navigator.userAgent)
};

/**
 * Feature detection (preferred over browser detection)
 */
export const features = {
    hasGrid: CSS.supports('display', 'grid'),
    hasFlex: CSS.supports('display', 'flex'),
    hasFetch: typeof fetch !== 'undefined',
    hasLocalStorage: (() => {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    })(),
    hasSessionStorage: (() => {
        try {
            const test = '__storage_test__';
            sessionStorage.setItem(test, test);
            sessionStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    })(),
    hasDragDrop: 'draggable' in document.createElement('div'),
    hasWebWorkers: typeof Worker !== 'undefined',
    hasServiceWorkers: 'serviceWorker' in navigator,
    hasNotifications: 'Notification' in window,
    hasGeolocation: 'geolocation' in navigator
};

/**
 * CSS Grid gap property with fallback for older Safari
 */
export function applyGridGap(element, gapValue) {
    if (!element) return;
    
    // Try modern gap property
    element.style.gap = gapValue;
    
    // Fallback for older browsers
    element.style.gridGap = gapValue;
}

/**
 * Safe localStorage wrapper with quota handling
 */
export const safeStorage = {
    setItem(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
            return true;
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                console.error('localStorage quota exceeded');
                // Try to clear old data
                this.clearOldData();
                // Retry once
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch (retryError) {
                    console.error('Failed to save after clearing:', retryError);
                    return false;
                }
            }
            console.error('localStorage error:', e);
            return false;
        }
    },
    
    getItem(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('localStorage read error:', e);
            return null;
        }
    },
    
    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('localStorage remove error:', e);
            return false;
        }
    },
    
    clearOldData() {
        // Clear items older than 30 days (if timestamp is stored)
        const now = Date.now();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('old_')) {
                try {
                    const item = JSON.parse(localStorage.getItem(key));
                    if (item.timestamp && (now - item.timestamp) > thirtyDays) {
                        localStorage.removeItem(key);
                    }
                } catch (e) {
                    // Skip invalid items
                }
            }
        }
    }
};

/**
 * Fetch wrapper with error handling and timeout
 */
export async function safeFetch(url, options = {}) {
    const timeout = options.timeout || 30000; // 30 second default
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        
        throw error;
    }
}

/**
 * Safari-specific drag and drop fix
 * Safari requires setData to be called in dragstart
 */
export function setupDragAndDrop(element, options = {}) {
    if (!element || !features.hasDragDrop) {
        console.warn('Drag and drop not supported');
        return null;
    }
    
    const {
        onDragStart,
        onDragEnd,
        onDragOver,
        onDrop,
        dragData = {}
    } = options;
    
    // Drag start handler with Safari fix
    const handleDragStart = (e) => {
        // Safari requires setData to be called
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
        
        // Add dragging class
        element.classList.add('dragging');
        
        if (onDragStart) {
            onDragStart(e);
        }
    };
    
    // Drag end handler
    const handleDragEnd = (e) => {
        element.classList.remove('dragging');
        
        if (onDragEnd) {
            onDragEnd(e);
        }
    };
    
    // Attach event listeners
    element.addEventListener('dragstart', handleDragStart);
    element.addEventListener('dragend', handleDragEnd);
    
    // Return cleanup function
    return () => {
        element.removeEventListener('dragstart', handleDragStart);
        element.removeEventListener('dragend', handleDragEnd);
    };
}

/**
 * Setup drop zone with proper event handling
 */
export function setupDropZone(element, options = {}) {
    if (!element || !features.hasDragDrop) {
        console.warn('Drag and drop not supported');
        return null;
    }
    
    const {
        onDragOver,
        onDragLeave,
        onDrop
    } = options;
    
    // Drag over handler (required for drop to work)
    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        element.classList.add('drag-over');
        
        if (onDragOver) {
            onDragOver(e);
        }
    };
    
    // Drag leave handler
    const handleDragLeave = (e) => {
        element.classList.remove('drag-over');
        
        if (onDragLeave) {
            onDragLeave(e);
        }
    };
    
    // Drop handler
    const handleDrop = (e) => {
        e.preventDefault();
        element.classList.remove('drag-over');
        
        try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            
            if (onDrop) {
                onDrop(e, data);
            }
        } catch (error) {
            console.error('Failed to parse drop data:', error);
        }
    };
    
    // Attach event listeners
    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('dragleave', handleDragLeave);
    element.addEventListener('drop', handleDrop);
    
    // Return cleanup function
    return () => {
        element.removeEventListener('dragover', handleDragOver);
        element.removeEventListener('dragleave', handleDragLeave);
        element.removeEventListener('drop', handleDrop);
    };
}

/**
 * Check if browser meets minimum requirements
 */
export function checkBrowserCompatibility() {
    const issues = [];
    
    if (!features.hasGrid) {
        issues.push('CSS Grid not supported - layout may not work correctly');
    }
    
    if (!features.hasFetch) {
        issues.push('Fetch API not supported - API calls may fail');
    }
    
    if (!features.hasLocalStorage) {
        issues.push('localStorage not available - data persistence disabled');
    }
    
    if (browser.isIE) {
        issues.push('Internet Explorer is not supported - please use a modern browser');
    }
    
    return {
        compatible: issues.length === 0,
        issues
    };
}

/**
 * Display browser compatibility warning if needed
 */
export function showCompatibilityWarning() {
    const { compatible, issues } = checkBrowserCompatibility();
    
    if (!compatible) {
        const warning = document.createElement('div');
        warning.className = 'browser-warning';
        warning.setAttribute('role', 'alert');
        warning.innerHTML = `
            <h3>⚠️ Browser Compatibility Issues</h3>
            <ul>
                ${issues.map(issue => `<li>${issue}</li>`).join('')}
            </ul>
            <p>For the best experience, please use the latest version of Chrome, Firefox, Edge, or Safari.</p>
            <button onclick="this.parentElement.remove()">Dismiss</button>
        `;
        
        document.body.insertBefore(warning, document.body.firstChild);
    }
}

/**
 * Log browser information for debugging
 */
export function logBrowserInfo() {
    console.group('Browser Information');
    console.log('User Agent:', navigator.userAgent);
    console.log('Platform:', navigator.platform);
    console.log('Language:', navigator.language);
    console.log('Detected Browser:', 
        browser.isChrome ? 'Chrome' :
        browser.isFirefox ? 'Firefox' :
        browser.isEdge ? 'Edge' :
        browser.isSafari ? 'Safari' :
        browser.isIE ? 'Internet Explorer' :
        'Unknown'
    );
    console.log('Feature Support:', features);
    console.groupEnd();
}

// Export all utilities
export default {
    browser,
    features,
    applyGridGap,
    safeStorage,
    safeFetch,
    setupDragAndDrop,
    setupDropZone,
    checkBrowserCompatibility,
    showCompatibilityWarning,
    logBrowserInfo
};
