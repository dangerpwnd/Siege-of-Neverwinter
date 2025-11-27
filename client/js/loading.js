/**
 * Loading state management and UI indicators
 */

class LoadingManager {
    constructor() {
        this.loadingStates = new Map();
        this.createLoadingOverlay();
    }

    /**
     * Create global loading overlay element
     */
    createLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay hidden';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p class="loading-text">Loading...</p>
            </div>
        `;
        document.body.appendChild(overlay);
        this.overlay = overlay;
    }

    /**
     * Show loading indicator for a specific component
     */
    show(componentId, message = 'Loading...') {
        this.loadingStates.set(componentId, true);
        
        const component = document.getElementById(componentId);
        if (component) {
            this.addLoadingIndicator(component, message);
        }
    }

    /**
     * Hide loading indicator for a specific component
     */
    hide(componentId) {
        this.loadingStates.set(componentId, false);
        
        const component = document.getElementById(componentId);
        if (component) {
            this.removeLoadingIndicator(component);
        }
    }

    /**
     * Show global loading overlay
     */
    showGlobal(message = 'Loading...') {
        this.overlay.querySelector('.loading-text').textContent = message;
        this.overlay.classList.remove('hidden');
    }

    /**
     * Hide global loading overlay
     */
    hideGlobal() {
        this.overlay.classList.add('hidden');
    }

    /**
     * Add loading indicator to a component
     */
    addLoadingIndicator(element, message) {
        // Remove existing indicator if present
        this.removeLoadingIndicator(element);
        
        const indicator = document.createElement('div');
        indicator.className = 'component-loading';
        indicator.innerHTML = `
            <div class="loading-spinner-small">
                <div class="spinner-small"></div>
                <span>${message}</span>
            </div>
        `;
        
        element.style.position = 'relative';
        element.appendChild(indicator);
    }

    /**
     * Remove loading indicator from a component
     */
    removeLoadingIndicator(element) {
        const existing = element.querySelector('.component-loading');
        if (existing) {
            existing.remove();
        }
    }

    /**
     * Check if component is loading
     */
    isLoading(componentId) {
        return this.loadingStates.get(componentId) || false;
    }
}

export default new LoadingManager();
