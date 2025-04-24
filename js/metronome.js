// core/ui-manager.js
export const UI = {
    elements: {},

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
        'sound-type', // Ensure this exists in your HTML
        'metronome-volume', 
        'tempo-slider', 
        'tap-tempo',
        'chord-fretboard-volume',
        'chord-volume',
        'chordsEnabled',
        'fretboard-volume',
        'dark-mode-toggle',
        'accent-intensity',
        'click-volume'
    ],
    querySelectors: {
        fretboardsGrid: '.fretboards-grid',
        beatsContainer: '.beats-container'
    },

    init() {
        // Initialize elements by ID
        this.elementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
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
        this.verifyCriticalElements();
        this.updateStartStopButton(false);
    },

    validateCriticalElements() {
        const criticalElements = [
            { key: 'startStop', id: 'start-stop' },
            { key: 'tempoSlider', id: 'tempo-slider' },
            { key: 'soundType', id: 'sound-type' }, // Added soundType check
            { key: 'metronomeVolume', id: 'metronome-volume' },
            { key: 'beatsContainer', selector: '.beats-container' }
        ];

        criticalElements.forEach(({ key, id, selector }) => {
            if (!this.elements[key]) {
                const missingElement = id || selector;
                console.error(`Critical element missing: ${missingElement}`);
            }
        });
    },

    verifyCriticalElements() {
        const criticalElements = [
            { key: 'tempoDisplay', id: 'tempo-display' }
        ];

        criticalElements.forEach(({ key, id }) => {
            if (!this.elements[key]) {
                console.error(`Critical UI element missing: ${id}`);
            }
        });
    },

    addListener(elementKey, eventType, callback) {
        if (this.elements[elementKey]) {
            this.elements[elementKey].addEventListener(eventType, callback);
        } else {
            console.warn(`Cannot add listener - element not found: ${elementKey}`);
        }
    },

    updateStartStopButton(isRunning) {
        if (this.elements.startStop) {
            this.elements.startStop.textContent = isRunning ? 'Stop' : 'Start';
            this.elements.startStop.className = isRunning ? 'btn-stop' : 'btn-start';
        }
    },

    setupMetronomeControls() {
        this.addListener('startStop', 'click', () => {
            const isRunning = this.elements.startStop.textContent === 'Stop';
            if (isRunning) {
                stopMetronome();
                this.updateStartStopButton(false);
            } else {
                const tempo = parseInt(this.elements.tempoSlider.value) || 120;
                startMetronome(tempo);
                this.updateStartStopButton(true);
            }
        });

        this.addListener('tempoSlider', 'input', () => {
            if (this.elements.tempoDisplay) {
                this.elements.tempoDisplay.textContent = this.elements.tempoSlider.value;
            }
        });
    }
};

export { UI };
