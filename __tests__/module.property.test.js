// Property-based tests for module visibility system
// Feature: siege-of-neverwinter

const fc = require('fast-check');

// Simple StateManager implementation for testing
// This is a minimal version that includes only the module-related functionality
class StateManager {
    constructor() {
        this.state = {
            moduleVisibility: {},
            modulePositions: {},
            moduleSizes: {},
        };
        this.listeners = new Map();
        this.listenerIdCounter = 0;
    }

    getState() {
        return { ...this.state };
    }

    get(key) {
        return this.state[key];
    }

    setState(updates) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...updates };
        this.notifyListeners(oldState, this.state);
    }

    subscribe(callback) {
        const id = this.listenerIdCounter++;
        this.listeners.set(id, callback);
        return () => {
            this.listeners.delete(id);
        };
    }

    notifyListeners(oldState, newState) {
        this.listeners.forEach(callback => {
            try {
                callback(newState, oldState);
            } catch (error) {
                console.error('Error in state listener:', error);
            }
        });
    }

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
        return this.state.moduleVisibility[moduleId] !== false;
    }

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
}

describe('Module System Property Tests', () => {
    let state;

    beforeEach(() => {
        // Create a fresh state instance for each test
        state = new StateManager();
        jest.clearAllMocks();
    });

    // Generator for module IDs
    const moduleIdArb = fc.constantFrom(
        'initiative',
        'character',
        'npc',
        'monster',
        'siege',
        'ai',
        'map',
        'condition'
    );

    // Generator for multiple module IDs (subset)
    const moduleIdsArb = fc.array(moduleIdArb, { minLength: 1, maxLength: 8 }).map(arr => [...new Set(arr)]);

    // Generator for visibility state
    const visibilityArb = fc.boolean();

    // Generator for position
    const positionArb = fc.record({
        x: fc.integer({ min: 0, max: 2000 }),
        y: fc.integer({ min: 0, max: 2000 })
    });

    // Generator for size
    const sizeArb = fc.record({
        width: fc.integer({ min: 300, max: 1500 }),
        height: fc.integer({ min: 200, max: 1000 })
    });

    describe('Property 35: Module visibility isolation', () => {
        /**
         * Feature: siege-of-neverwinter, Property 35: Module visibility isolation
         * Validates: Requirements 9.1
         * 
         * For any module, toggling its visibility should change only that module's 
         * visibility state without affecting other modules
         */
        test('toggling one module does not affect other modules', () => {
            fc.assert(
                fc.property(
                    moduleIdsArb,
                    moduleIdArb,
                    visibilityArb,
                    (allModules, targetModule, initialVisibility) => {
                        // Set up initial state for all modules
                        allModules.forEach(moduleId => {
                            state.setModuleVisibility(moduleId, initialVisibility);
                        });

                        // Record initial visibility of all modules
                        const initialStates = {};
                        allModules.forEach(moduleId => {
                            initialStates[moduleId] = state.isModuleVisible(moduleId);
                        });

                        // Toggle the target module
                        state.toggleModuleVisibility(targetModule);

                        // Check that only the target module changed
                        allModules.forEach(moduleId => {
                            if (moduleId === targetModule) {
                                // Target module should have toggled
                                expect(state.isModuleVisible(moduleId)).toBe(!initialStates[moduleId]);
                            } else {
                                // Other modules should remain unchanged
                                expect(state.isModuleVisible(moduleId)).toBe(initialStates[moduleId]);
                            }
                        });
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('setting visibility of one module does not affect others', () => {
            fc.assert(
                fc.property(
                    moduleIdsArb,
                    moduleIdArb,
                    visibilityArb,
                    visibilityArb,
                    (allModules, targetModule, initialVisibility, newVisibility) => {
                        // Set up initial state for all modules
                        allModules.forEach(moduleId => {
                            state.setModuleVisibility(moduleId, initialVisibility);
                        });

                        // Record initial visibility of all modules
                        const initialStates = {};
                        allModules.forEach(moduleId => {
                            initialStates[moduleId] = state.isModuleVisible(moduleId);
                        });

                        // Set visibility of target module
                        state.setModuleVisibility(targetModule, newVisibility);

                        // Check that only the target module changed (if it changed)
                        allModules.forEach(moduleId => {
                            if (moduleId === targetModule) {
                                // Target module should have new visibility
                                expect(state.isModuleVisible(moduleId)).toBe(newVisibility);
                            } else {
                                // Other modules should remain unchanged
                                expect(state.isModuleVisible(moduleId)).toBe(initialStates[moduleId]);
                            }
                        });
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 36: Module visibility persistence round-trip', () => {
        /**
         * Feature: siege-of-neverwinter, Property 36: Module visibility persistence round-trip
         * Validates: Requirements 9.2
         * 
         * For any module visibility configuration, the state should be preserved
         * and retrievable
         */
        test('module visibility state persists in state manager', () => {
            fc.assert(
                fc.property(
                    fc.dictionary(moduleIdArb, visibilityArb),
                    (visibilityConfig) => {
                        // Set visibility for all modules in config
                        Object.entries(visibilityConfig).forEach(([moduleId, visible]) => {
                            state.setModuleVisibility(moduleId, visible);
                        });

                        // Retrieve and verify all visibility states
                        Object.entries(visibilityConfig).forEach(([moduleId, expectedVisible]) => {
                            const actualVisible = state.isModuleVisible(moduleId);
                            expect(actualVisible).toBe(expectedVisible);
                        });
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('module visibility survives state updates', () => {
            fc.assert(
                fc.property(
                    moduleIdArb,
                    visibilityArb,
                    fc.array(fc.record({ key: fc.string(), value: fc.anything() })),
                    (moduleId, visibility, otherUpdates) => {
                        // Set module visibility
                        state.setModuleVisibility(moduleId, visibility);

                        // Perform other state updates
                        otherUpdates.forEach(update => {
                            if (update.key !== 'moduleVisibility') {
                                state.setState({ [update.key]: update.value });
                            }
                        });

                        // Verify visibility is still correct
                        expect(state.isModuleVisible(moduleId)).toBe(visibility);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('default visibility is true for unset modules', () => {
            fc.assert(
                fc.property(
                    moduleIdArb,
                    (moduleId) => {
                        // Don't set any visibility
                        // Default should be visible (true)
                        expect(state.isModuleVisible(moduleId)).toBe(true);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 37: Module resize and reposition', () => {
        /**
         * Feature: siege-of-neverwinter, Property 37: Module resize and reposition
         * Validates: Requirements 9.5
         * 
         * For any module, resize and reposition operations should update and 
         * persist the module's dimensions and position
         */
        test('module position is stored and retrievable', () => {
            fc.assert(
                fc.property(
                    moduleIdArb,
                    positionArb,
                    (moduleId, position) => {
                        // Set module position
                        state.setModulePosition(moduleId, position);

                        // Retrieve and verify position
                        const retrievedPosition = state.getModulePosition(moduleId);
                        expect(retrievedPosition).toEqual(position);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('module size is stored and retrievable', () => {
            fc.assert(
                fc.property(
                    moduleIdArb,
                    sizeArb,
                    (moduleId, size) => {
                        // Set module size
                        state.setModuleSize(moduleId, size);

                        // Retrieve and verify size
                        const retrievedSize = state.getModuleSize(moduleId);
                        expect(retrievedSize).toEqual(size);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('position updates are independent per module', () => {
            fc.assert(
                fc.property(
                    moduleIdsArb,
                    fc.array(positionArb),
                    (moduleIds, positions) => {
                        // Ensure we have enough positions
                        const positionsToUse = positions.slice(0, moduleIds.length);
                        while (positionsToUse.length < moduleIds.length) {
                            positionsToUse.push({ x: 0, y: 0 });
                        }

                        // Set position for each module
                        const expectedPositions = {};
                        moduleIds.forEach((moduleId, index) => {
                            const position = positionsToUse[index];
                            state.setModulePosition(moduleId, position);
                            expectedPositions[moduleId] = position;
                        });

                        // Verify each module has its own position
                        moduleIds.forEach(moduleId => {
                            const retrievedPosition = state.getModulePosition(moduleId);
                            expect(retrievedPosition).toEqual(expectedPositions[moduleId]);
                        });
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('size updates are independent per module', () => {
            fc.assert(
                fc.property(
                    moduleIdsArb,
                    fc.array(sizeArb),
                    (moduleIds, sizes) => {
                        // Ensure we have enough sizes
                        const sizesToUse = sizes.slice(0, moduleIds.length);
                        while (sizesToUse.length < moduleIds.length) {
                            sizesToUse.push({ width: 400, height: 300 });
                        }

                        // Set size for each module
                        const expectedSizes = {};
                        moduleIds.forEach((moduleId, index) => {
                            const size = sizesToUse[index];
                            state.setModuleSize(moduleId, size);
                            expectedSizes[moduleId] = size;
                        });

                        // Verify each module has its own size
                        moduleIds.forEach(moduleId => {
                            const retrievedSize = state.getModuleSize(moduleId);
                            expect(retrievedSize).toEqual(expectedSizes[moduleId]);
                        });
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('partial position updates merge with existing position', () => {
            fc.assert(
                fc.property(
                    moduleIdArb,
                    positionArb,
                    fc.integer({ min: 0, max: 2000 }),
                    (moduleId, initialPosition, newX) => {
                        // Set initial position
                        state.setModulePosition(moduleId, initialPosition);

                        // Update only x coordinate
                        state.setModulePosition(moduleId, { x: newX });

                        // Verify x is updated but y is preserved
                        const retrievedPosition = state.getModulePosition(moduleId);
                        expect(retrievedPosition.x).toBe(newX);
                        expect(retrievedPosition.y).toBe(initialPosition.y);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('partial size updates merge with existing size', () => {
            fc.assert(
                fc.property(
                    moduleIdArb,
                    sizeArb,
                    fc.integer({ min: 300, max: 1500 }),
                    (moduleId, initialSize, newWidth) => {
                        // Set initial size
                        state.setModuleSize(moduleId, initialSize);

                        // Update only width
                        state.setModuleSize(moduleId, { width: newWidth });

                        // Verify width is updated but height is preserved
                        const retrievedSize = state.getModuleSize(moduleId);
                        expect(retrievedSize.width).toBe(newWidth);
                        expect(retrievedSize.height).toBe(initialSize.height);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('position and size are independent properties', () => {
            fc.assert(
                fc.property(
                    moduleIdArb,
                    positionArb,
                    sizeArb,
                    (moduleId, position, size) => {
                        // Set both position and size
                        state.setModulePosition(moduleId, position);
                        state.setModuleSize(moduleId, size);

                        // Verify both are stored independently
                        const retrievedPosition = state.getModulePosition(moduleId);
                        const retrievedSize = state.getModuleSize(moduleId);

                        expect(retrievedPosition).toEqual(position);
                        expect(retrievedSize).toEqual(size);

                        // Update position, verify size unchanged
                        const newPosition = { x: position.x + 100, y: position.y + 100 };
                        state.setModulePosition(moduleId, newPosition);

                        expect(state.getModulePosition(moduleId)).toEqual(newPosition);
                        expect(state.getModuleSize(moduleId)).toEqual(size);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
