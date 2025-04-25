// core/ui-manager.js
export const UI = {
    elements: {},

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
        console.log("UI.init: start");
        // Initialize elements by ID
        this.elementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                const key = id.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
                this.elements[key] = element;
                console.log(`UI.init: found #${id} as elements.${key}`);
            } else {
                console.warn(`UI.init: Missing DOM element: #${id}`);
            }
        });

        // Initialize elements via selectors
        Object.entries(this.querySelectors).forEach(([key, selector]) => {
            const element = document.querySelector(selector);
            if (element) {
                this.elements[key] = element;
                console.log(`UI.init: found ${selector} as elements.${key}`);
            } else {
                console.warn(`UI.init: Missing element for selector: ${selector}`);
            }
        });

        // Critical element validation
        this.validateCriticalElements();
        this.verifyCriticalElements();
        this.updateStartStopButton(false);
        console.log("UI.init: end");
    },

    validateCriticalElements() {
        const criticalElements = [
            { key: 'startStop', id: 'start-stop' },
            { key: 'tempoSlider', id: 'tempo-slider' },
            { key: 'metronomeVolume', id: 'metronome-volume' },
            { key: 'beatsContainer', selector: '.beats-container' }
        ];

        criticalElements.forEach(({ key, id, selector }) => {
            if (!this.elements[key]) {
                const missingElement = id || selector;
                console.error(`UI.validateCriticalElements: Critical element missing: ${missingElement}`);
            }
        });
    },

    verifyCriticalElements() {
        const criticalElements = [
            { key: 'tempoDisplay', id: 'tempo-display' },
            { key: 'soundType', id: 'sound-type' }
        ];

        criticalElements.forEach(({ key, id }) => {
            if (!this.elements[key]) {
                console.error(`UI.verifyCriticalElements: Critical UI element missing: ${id}`);
            }
        });
    },

    addListener(elementKey, eventType, callback) {
        if (this.elements[elementKey]) {
            this.elements[elementKey].addEventListener(eventType, callback);
            console.log(`UI.addListener: Added ${eventType} to ${elementKey}`);
        } else {
            console.warn(`UI.addListener: Cannot add listener - element not found: ${elementKey}`);
        }
    },

    updateStartStopButton(isRunning) {
        if (this.elements.startStop) {
            this.elements.startStop.textContent = isRunning ? 'Stop' : 'Start';
            this.elements.startStop.className = isRunning ? 'btn-stop' : 'btn-start';
            console.log(`UI.updateStartStopButton: Set to ${isRunning ? 'Stop' : 'Start'}`);
        } else {
            console.warn("UI.updateStartStopButton: startStop element not found");
        }
    },

    setupMetronomeControls() {
        console.log("UI.setupMetronomeControls: start");
        this.addListener('startStop', 'click', () => {
            const isRunning = this.elements.startStop.textContent === 'Stop';
            if (isRunning) {
                if (typeof stopMetronome === "function") {
                    stopMetronome();
                } else {
                    console.warn("UI.setupMetronomeControls: stopMetronome() is not defined");
                }
                this.updateStartStopButton(false);
            } else {
                const tempo = parseInt(this.elements.tempoSlider.value) || 120;
                if (typeof startMetronome === "function") {
                    startMetronome(tempo);
                } else {
                    console.warn("UI.setupMetronomeControls: startMetronome() is not defined");
                }
                this.updateStartStopButton(true);
            }
        });

        this.addListener('tempoSlider', 'input', () => {
            if (this.elements.tempoDisplay) {
                this.elements.tempoDisplay.textContent = this.elements.tempoSlider.value;
                console.log(`UI.setupMetronomeControls: tempoDisplay updated to ${this.elements.tempoSlider.value}`);
            } else {
                console.warn("UI.setupMetronomeControls: tempoDisplay element not found");
            }
        });
        console.log("UI.setupMetronomeControls: end");
    }
};
