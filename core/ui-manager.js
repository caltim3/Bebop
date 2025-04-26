import { log } from '../utils/helpers.js';
import { startMetronome, stopMetronome } from '../js/metronome.js';

export const UI = {
    elements: {},

    init() {
        this.elements = {
            startStop: document.getElementById('start-stop'),
            tempoSlider: document.getElementById('tempo-slider'),
            tempoDisplay: document.getElementById('tempo-display'),
            chordsEnabled: document.getElementById('chordsEnabled'),
            keySelect: document.getElementById('keySelect'),
            progressionSelect: document.getElementById('progression-select'),
            chordTuning: document.getElementById('chord-tuning'),
            fretboardVolume: document.getElementById('fretboard-volume'),
            metronomeVolume: document.getElementById('metronome-volume'),
            soundType: document.getElementById('sound-type'),
            addMeasureBtn: document.getElementById('add-measure-btn'),
            chordFretboardSection: document.getElementById('chord-fretboard-section'),
            metronomeSection: document.getElementById('metronome-section'),
            measures: document.getElementById('measures'),
            fretboardsGrid: document.querySelector('.fretboards-grid'),
            darkModeToggle: document.getElementById('dark-mode-toggle'),
            chordVolume: document.getElementById('chord-volume'),
        };

        this.validateCriticalElements();
        this.verifyCriticalElements();
        this.setupMetronomeControls();
    },

    validateCriticalElements() {
        const criticalElements = [
            'startStop',
            'tempoSlider',
            'tempoDisplay',
            'chordsEnabled',
            'keySelect',
            'progressionSelect',
            'chordTuning',
            'fretboardVolume',
            'metronomeVolume',
            'soundType',
            'addMeasureBtn',
            'chordFretboardSection',
            'metronomeSection',
            'measures',
            'fretboardsGrid',
        ];

        criticalElements.forEach(key => {
            if (!this.elements[key]) {
                log(`Critical UI element missing: ${key}`);
            } else {
                log(`Found UI element: ${key}`);
            }
        });
    },

    verifyCriticalElements() {
        const elementsToVerify = [
            'startStop',
            'tempoSlider',
            'tempoDisplay',
            'chordsEnabled',
            'keySelect',
            'progressionSelect',
            'chordTuning',
            'fretboardVolume',
            'metronomeVolume',
            'soundType',
            'addMeasureBtn',
            'chordFretboardSection',
            'metronomeSection',
            'measures',
            'fretboardsGrid',
        ];

        elementsToVerify.forEach(elementKey => {
            if (this.elements[elementKey]) {
                log(`Verified UI element: ${elementKey}`);
            }
        });
    },

    addListener(elementKey, eventType, callback) {
        const element = this.elements[elementKey];
        if (element) {
            element.addEventListener(eventType, callback);
        } else {
            log(`Cannot add listener to ${elementKey}: element not found`);
        }
    },

    updateStartStopButton(isRunning) {
        if (this.elements.startStop) {
            this.elements.startStop.textContent = isRunning ? 'Stop' : 'Start';
            this.elements.startStop.classList.toggle('active', isRunning);
        }
    },

    setupMetronomeControls() {
        if (this.elements.tempoSlider && this.elements.tempoDisplay) {
            this.elements.tempoDisplay.textContent = this.elements.tempoSlider.value;
            this.addListener('tempoSlider', 'input', () => {
                this.elements.tempoDisplay.textContent = this.elements.tempoSlider.value;
            });
        }
    }
};
