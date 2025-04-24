// core/ui-manager.js
export const UI = {
    elements: {}, // Will be populated in init()

    // List of all required element IDs
    elementIds: [
        'chord-fretboard',
        'measures',
        'tempo-display',
        'start-stop',
        'progression-select',
        'keySelect',
        'scale-display',
        'chord-tuning',
        'time-signature',
        'sound-type',
        'metronome-volume',
        'tempo',
        'tap-tempo',
        'chord-fretboard-volume',
        'chord-volume',
        'chordsEnabled',
        'fretboard-volume',
        'dark-mode-toggle',
        'accent-intensity'
    ],

    // Additional elements that use querySelector
    querySelectors: {
        'fretboardsGrid': '.fretboards-grid'
    },

    init() {
        // Initialize standard elements by ID
        this.elementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                // Convert ID to camelCase for the elements object key
                const key = id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                this.elements[key] = element;
            } else {
                console.warn(`Missing DOM element: ${id}`);
            }
        });

        // Initialize elements that need querySelector
        Object.entries(this.querySelectors).forEach(([key, selector]) => {
            const element = document.querySelector(selector);
            if (element) {
                this.elements[key] = element;
            } else {
                console.warn(`Missing DOM element (querySelector): ${selector}`);
            }
        });

        // Verify critical elements
        this.verifyCriticalElements();
    },

    // Verify critical elements (must be inside the UI object)
    verifyCriticalElements() {
        const criticalElements = [
            { key: 'tempoDisplay', id: 'tempo-display' },
            { key: 'startStopButton', id: 'start-stop' },
            { key: 'soundType', id: 'sound-type' }
        ];

        criticalElements.forEach(({ key, id }) => {
            if (!this.elements[key]) {
                console.error(`Critical UI element missing: ${id}`);
                // Create fallback element if absolutely necessary
                if (key === 'soundType') {
                    this.elements.soundType = { value: 'click' };
                }
            }
        });
    },

    // Helper to safely add event listeners
    addListener(elementKey, eventType, callback) {
        if (this.elements[elementKey]) {
            this.elements[elementKey].addEventListener(eventType, callback);
        } else {
            console.warn(`Cannot add listener - element not found: ${elementKey}`);
        }
    }
}; // End of UI object
