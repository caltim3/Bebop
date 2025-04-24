// core/ui-manager.js
export const UI = {
    elements: {}, // Will be populated in init()

    // List of all required element IDs
    elementIds: [
        'chord-fretboard',
        'measures',
        'tempo-display',
        'start-stop', // Single button for start/stop
        'progression-select',
        'keySelect',
        'scale-display',
        'chord-tuning',
        'time-signature',
        'sound-type',
        'metronome-volume', // Updated to match your HTML
        'tempo-slider', // Updated to match your HTML
        'tap-tempo',
        'chord-fretboard-volume',
        'chord-volume',
        'chordsEnabled',
        'fretboard-volume',
        'dark-mode-toggle',
        'accent-intensity',
        'click-volume' // Added to match your HTML
    ],

    // Additional elements that use querySelector
    querySelectors: {
        'fretboardsGrid': '.fretboards-grid',
        'beatsContainer': '.beats-container'
    },

   init() {
    // Initialize elements by ID
    this.elementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            // Convert ID to camelCase (e.g., "my-element" → "myElement")
            const key = id.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
            this.elements[key] = element;
        } else {
            console.warn(`Missing DOM element: ${id}`);
        }
    });

    // Initialize elements via selectors
    Object.entries(this.querySelectors).forEach(([key, selector]) => {
        const element = document.querySelector(selector);
        if (element) {
            this.elements[key] = element;
        } else {
            console.warn(`Missing element for selector: ${selector}`);
        }
    });

    // Critical element validation
    this.validateCriticalElements();
}

validateCriticalElements() {
    const criticalElements = [
        { key: 'startStop', id: 'start-stop' },
        { key: 'tempoSlider', id: 'tempo-slider' },
        { key: 'metronomeVolume', id: 'metronome-volume' },
        { key: 'beatsContainer', selector: '#beats-container' }
    ];

    criticalElements.forEach(({ key, id, selector }) => {
        if (!this.elements[key]) {
            const missingElement = id || selector;
            console.error(`Critical element missing: ${missingElement}`);
            // Optional: Throw error to halt execution if critical
            // throw new Error(`Missing critical element: ${missingElement}`);
        }
    });
}

        // Verify critical elements
        this.verifyCriticalElements();

        // Initialize the start/stop button text
        this.updateStartStopButton(false);
    },

    verifyCriticalElements() {
        const criticalElements = [
            { key: 'tempoDisplay', id: 'tempo-display' },
            { key: 'startStop', id: 'start-stop' }, // Updated to match your single button
            { key: 'soundType', id: 'sound-type' }
        ];

        criticalElements.forEach(({key, id}) => {
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
    },

    // Update the start/stop button text and appearance
    updateStartStopButton(isRunning) {
        if (this.elements.startStop) {
            this.elements.startStop.textContent = isRunning ? 'Stop' : 'Start';
            this.elements.startStop.className = isRunning ? 'btn-stop' : 'btn-start';
        }
    },

    // Setup metronome controls
    setupMetronomeControls() {
        this.addListener('startStop', 'click', () => {
            const isRunning = this.elements.startStop.textContent === 'Stop';
            if (isRunning) {
                // Stop logic
                stopMetronome();
                this.updateStartStopButton(false);
            } else {
                // Start logic
                const tempo = parseInt(this.elements.tempoSlider.value) || 120;
                startMetronome(tempo);
                this.updateStartStopButton(true);
            }
        });

        // Tempo slider updates
        this.addListener('tempoSlider', 'input', () => {
            if (this.elements.tempoDisplay) {
                this.elements.tempoDisplay.textContent = this.elements.tempoSlider.value;
            }
        });
    }
};
