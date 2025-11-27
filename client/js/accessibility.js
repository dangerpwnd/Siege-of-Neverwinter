/**
 * Accessibility Module
 * Provides keyboard navigation, focus management, and screen reader support
 */

export class AccessibilityManager {
    constructor() {
        this.focusTrapStack = [];
        this.lastFocusedElement = null;
        this.init();
    }

    init() {
        this.setupKeyboardNavigation();
        this.setupFocusManagement();
        this.setupSkipLinks();
        this.setupLiveRegions();
        this.announcePageLoad();
    }

    /**
     * Setup keyboard navigation for the entire application
     */
    setupKeyboardNavigation() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape key to close modals/dialogs
            if (e.key === 'Escape') {
                this.handleEscape();
            }

            // Tab key navigation enhancement
            if (e.key === 'Tab') {
                this.handleTabNavigation(e);
            }

            // Arrow key navigation for lists
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                this.handleArrowNavigation(e);
            }

            // Enter/Space for button-like elements
            if ((e.key === 'Enter' || e.key === ' ') && e.target.hasAttribute('role')) {
                const role = e.target.getAttribute('role');
                if (role === 'button' || role === 'tab') {
                    e.preventDefault();
                    e.target.click();
                }
            }
        });
    }

    /**
     * Setup focus management for modals and dynamic content
     */
    setupFocusManagement() {
        // Track focus for restoration
        document.addEventListener('focusin', (e) => {
            if (!e.target.closest('[role="dialog"]')) {
                this.lastFocusedElement = e.target;
            }
        });

        // Ensure visible focus indicators
        document.addEventListener('mousedown', () => {
            document.body.classList.add('using-mouse');
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.remove('using-mouse');
            }
        });
    }

    /**
     * Setup skip navigation links
     */
    setupSkipLinks() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-to-main';
        skipLink.textContent = 'Skip to main content';
        skipLink.setAttribute('aria-label', 'Skip to main content');
        
        skipLink.addEventListener('click', (e) => {
            e.preventDefault();
            const mainContent = document.getElementById('main-content') || 
                               document.querySelector('.app-main');
            if (mainContent) {
                mainContent.setAttribute('tabindex', '-1');
                mainContent.focus();
                mainContent.removeAttribute('tabindex');
            }
        });

        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    /**
     * Setup ARIA live regions for dynamic announcements
     */
    setupLiveRegions() {
        // Create polite live region for non-urgent updates
        const politeLiveRegion = document.createElement('div');
        politeLiveRegion.id = 'aria-live-polite';
        politeLiveRegion.className = 'sr-only';
        politeLiveRegion.setAttribute('aria-live', 'polite');
        politeLiveRegion.setAttribute('aria-atomic', 'true');
        document.body.appendChild(politeLiveRegion);

        // Create assertive live region for urgent updates
        const assertiveLiveRegion = document.createElement('div');
        assertiveLiveRegion.id = 'aria-live-assertive';
        assertiveLiveRegion.className = 'sr-only';
        assertiveLiveRegion.setAttribute('aria-live', 'assertive');
        assertiveLiveRegion.setAttribute('aria-atomic', 'true');
        document.body.appendChild(assertiveLiveRegion);

        // Create status region for status updates
        const statusRegion = document.createElement('div');
        statusRegion.id = 'aria-status';
        statusRegion.className = 'sr-only';
        statusRegion.setAttribute('role', 'status');
        statusRegion.setAttribute('aria-live', 'polite');
        statusRegion.setAttribute('aria-atomic', 'true');
        document.body.appendChild(statusRegion);
    }

    /**
     * Announce message to screen readers
     * @param {string} message - Message to announce
     * @param {string} priority - 'polite' or 'assertive'
     */
    announce(message, priority = 'polite') {
        const regionId = priority === 'assertive' ? 'aria-live-assertive' : 'aria-live-polite';
        const region = document.getElementById(regionId);
        
        if (region) {
            // Clear and set new message
            region.textContent = '';
            setTimeout(() => {
                region.textContent = message;
            }, 100);
        }
    }

    /**
     * Announce status update
     * @param {string} message - Status message
     */
    announceStatus(message) {
        const statusRegion = document.getElementById('aria-status');
        if (statusRegion) {
            statusRegion.textContent = '';
            setTimeout(() => {
                statusRegion.textContent = message;
            }, 100);
        }
    }

    /**
     * Announce page load completion
     */
    announcePageLoad() {
        setTimeout(() => {
            this.announce('Siege of Neverwinter Campaign Manager loaded. Use Tab to navigate between modules.');
        }, 1000);
    }

    /**
     * Handle Escape key press
     */
    handleEscape() {
        // Close any open modals or dialogs
        const openDialog = document.querySelector('[role="dialog"][aria-hidden="false"]');
        if (openDialog) {
            const closeButton = openDialog.querySelector('[aria-label*="Close"]');
            if (closeButton) {
                closeButton.click();
            }
        }

        // Release focus trap if active
        if (this.focusTrapStack.length > 0) {
            this.releaseFocusTrap();
        }
    }

    /**
     * Handle Tab navigation
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleTabNavigation(e) {
        // If focus trap is active, keep focus within trapped element
        if (this.focusTrapStack.length > 0) {
            const trapElement = this.focusTrapStack[this.focusTrapStack.length - 1];
            const focusableElements = this.getFocusableElements(trapElement);
            
            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    /**
     * Handle arrow key navigation
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleArrowNavigation(e) {
        const target = e.target;
        
        // Handle list navigation
        if (target.getAttribute('role') === 'option' || 
            target.getAttribute('role') === 'tab' ||
            target.getAttribute('role') === 'menuitem') {
            
            const parent = target.closest('[role="listbox"], [role="tablist"], [role="menu"]');
            if (!parent) return;

            const items = Array.from(parent.querySelectorAll('[role="option"], [role="tab"], [role="menuitem"]'));
            const currentIndex = items.indexOf(target);

            let nextIndex;
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                nextIndex = (currentIndex + 1) % items.length;
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                nextIndex = (currentIndex - 1 + items.length) % items.length;
            }

            if (nextIndex !== undefined) {
                items[nextIndex].focus();
                
                // For tabs, activate on focus
                if (items[nextIndex].getAttribute('role') === 'tab') {
                    items[nextIndex].click();
                }
            }
        }
    }

    /**
     * Create focus trap within an element
     * @param {HTMLElement} element - Element to trap focus within
     */
    trapFocus(element) {
        this.focusTrapStack.push(element);
        
        // Focus first focusable element
        const focusableElements = this.getFocusableElements(element);
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }

    /**
     * Release focus trap
     */
    releaseFocusTrap() {
        this.focusTrapStack.pop();
        
        // Restore focus to last focused element
        if (this.lastFocusedElement && document.contains(this.lastFocusedElement)) {
            this.lastFocusedElement.focus();
        }
    }

    /**
     * Get all focusable elements within a container
     * @param {HTMLElement} container - Container element
     * @returns {Array<HTMLElement>} Array of focusable elements
     */
    getFocusableElements(container) {
        const selector = 'a[href], button:not([disabled]), textarea:not([disabled]), ' +
                        'input:not([disabled]), select:not([disabled]), ' +
                        '[tabindex]:not([tabindex="-1"])';
        
        return Array.from(container.querySelectorAll(selector))
            .filter(el => {
                return el.offsetParent !== null && // Element is visible
                       !el.hasAttribute('aria-hidden') &&
                       window.getComputedStyle(el).visibility !== 'hidden';
            });
    }

    /**
     * Add ARIA labels to dynamically created elements
     * @param {HTMLElement} element - Element to enhance
     * @param {Object} labels - Object containing label information
     */
    enhanceElement(element, labels = {}) {
        if (labels.label) {
            element.setAttribute('aria-label', labels.label);
        }
        
        if (labels.describedBy) {
            element.setAttribute('aria-describedby', labels.describedBy);
        }
        
        if (labels.labelledBy) {
            element.setAttribute('aria-labelledby', labels.labelledBy);
        }

        if (labels.role) {
            element.setAttribute('role', labels.role);
        }

        if (labels.expanded !== undefined) {
            element.setAttribute('aria-expanded', labels.expanded);
        }

        if (labels.pressed !== undefined) {
            element.setAttribute('aria-pressed', labels.pressed);
        }

        if (labels.selected !== undefined) {
            element.setAttribute('aria-selected', labels.selected);
        }

        if (labels.hidden !== undefined) {
            element.setAttribute('aria-hidden', labels.hidden);
        }
    }

    /**
     * Make an element keyboard accessible
     * @param {HTMLElement} element - Element to make accessible
     * @param {Function} onClick - Click handler
     */
    makeKeyboardAccessible(element, onClick) {
        if (!element.hasAttribute('tabindex')) {
            element.setAttribute('tabindex', '0');
        }

        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e);
            }
        });
    }

    /**
     * Create accessible tooltip
     * @param {HTMLElement} element - Element to attach tooltip to
     * @param {string} text - Tooltip text
     */
    addTooltip(element, text) {
        const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`;
        
        const tooltip = document.createElement('div');
        tooltip.id = tooltipId;
        tooltip.className = 'tooltip';
        tooltip.setAttribute('role', 'tooltip');
        tooltip.textContent = text;
        document.body.appendChild(tooltip);

        element.setAttribute('aria-describedby', tooltipId);

        element.addEventListener('mouseenter', () => {
            this.showTooltip(element, tooltip);
        });

        element.addEventListener('mouseleave', () => {
            this.hideTooltip(tooltip);
        });

        element.addEventListener('focus', () => {
            this.showTooltip(element, tooltip);
        });

        element.addEventListener('blur', () => {
            this.hideTooltip(tooltip);
        });
    }

    /**
     * Show tooltip
     * @param {HTMLElement} element - Element tooltip is attached to
     * @param {HTMLElement} tooltip - Tooltip element
     */
    showTooltip(element, tooltip) {
        const rect = element.getBoundingClientRect();
        tooltip.style.top = `${rect.bottom + 5}px`;
        tooltip.style.left = `${rect.left}px`;
        tooltip.classList.add('show');
    }

    /**
     * Hide tooltip
     * @param {HTMLElement} tooltip - Tooltip element
     */
    hideTooltip(tooltip) {
        tooltip.classList.remove('show');
    }

    /**
     * Update document title for screen readers
     * @param {string} title - New title
     */
    updateDocumentTitle(title) {
        document.title = `${title} - Siege of Neverwinter`;
        this.announceStatus(`Page updated: ${title}`);
    }

    /**
     * Create accessible loading indicator
     * @param {HTMLElement} container - Container for loading indicator
     * @param {string} message - Loading message
     */
    showLoadingIndicator(container, message = 'Loading...') {
        const loader = document.createElement('div');
        loader.className = 'loading';
        loader.setAttribute('role', 'status');
        loader.setAttribute('aria-live', 'polite');
        loader.setAttribute('aria-label', message);
        
        const loaderText = document.createElement('span');
        loaderText.className = 'sr-only';
        loaderText.textContent = message;
        loader.appendChild(loaderText);

        container.innerHTML = '';
        container.appendChild(loader);
    }

    /**
     * Create accessible error message
     * @param {HTMLElement} container - Container for error message
     * @param {string} message - Error message
     */
    showErrorMessage(container, message) {
        const error = document.createElement('div');
        error.className = 'error';
        error.setAttribute('role', 'alert');
        error.setAttribute('aria-live', 'assertive');
        error.textContent = message;

        container.innerHTML = '';
        container.appendChild(error);
        
        this.announce(message, 'assertive');
    }
}

// Export singleton instance
export const accessibilityManager = new AccessibilityManager();
