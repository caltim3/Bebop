// js/main.js

import { AppState } from './app-state.js';
import { UI } from '../core/ui-manager.js';
import { AudioContextManager } from '../core/audio-context.js';
import { createFretboard, updateFretboardNotes } from './fretboard.js';
import { createBeats, onMetronomeInstrumentChange } from './metronome.js';
import { loadProgression, updateProgressionKey, addMeasure, removeMeasure } from './chord-progression.js';
import { initializeFretFlow } from './fretflow.js';
import { log, ensureAudioInitialized, suggestScaleForQuality, updateLoadingStatus } from '../utils/helpers.js';
import { TUNINGS } from '../utils/constants.js';
import { startPlayback, stopPlayback } from './playback.js';

async function initializeApp() {
    UI.init();
    createBeats();
    createFretboard(UI.elements.chordFretboard, TUNINGS.standard);
    loadProgression(UI.elements.progressionSelect.value);
    initializeFretFlow();
    setupEventListeners();
    updateLoadingStatus("Application initialized");
    setTimeout(() => {
        const indicator = document.getElementById('loading-indicator');
        if (indicator) indicator.remove();
    }, 1000);
    log("Application initialized");
}

function setupEventListeners() {
    // Metronome start/stop
    const startStopBtn = document.getElementById('start-stop');
    if (startStopBtn) {
        startStopBtn.addEventListener('click', async () => {
            await AudioContextManager.initialize();
            if (startStopBtn.textContent === 'Start') {
                startPlayback();
                startStopBtn.textContent = 'Stop';
            } else {
                stopPlayback();
                startStopBtn.textContent = 'Start';
            }
        });
    }

    // Tap tempo
    const tapTempoBtn = document.getElementById('tap-tempo');
    if (tapTempoBtn) {
        tapTempoBtn.addEventListener('click', async () => {
            await AudioContextManager.initialize();
            log('Tap tempo clicked');
        });
    }

    // Drum kit select
    const drumKitSelect = document.getElementById('drum-kit-select');
    if (drumKitSelect) {
        drumKitSelect.addEventListener('change', (e) => {
            const kitIndex = Number(e.target.value);
            if (AudioContextManager) AudioContextManager.currentDrumKitIndex = kitIndex;
            // Optionally, update metronome instrument here
            onMetronomeInstrumentChange('drums');
        });
    }

    // Metronome sound type select (click/woodblock/drums)
    const soundTypeSelect = document.getElementById('sound-type');
    if (soundTypeSelect) {
        soundTypeSelect.addEventListener('change', (e) => {
            createBeats();
            onMetronomeInstrumentChange(e.target.value);
        });
    }

    // Progression select
    const progressionSelect = document.getElementById('progression-select');
    if (progressionSelect) {
        progressionSelect.addEventListener('change', (e) => {
            loadProgression(e.target.value);
        });
    }

    // Key select
    const keySelect = document.getElementById('keySelect');
    if (keySelect) {
        keySelect.addEventListener('change', (e) => {
            updateProgressionKey(e.target.value);
        });
    }

    // Add/Remove measure
    const addMeasureBtn = document.querySelector('button[aria-label="Add measure"]');
    if (addMeasureBtn) {
        addMeasureBtn.addEventListener('click', addMeasure);
    }
    const removeMeasureBtn = document.querySelector('button[aria-label="Remove measure"]');
    if (removeMeasureBtn) {
        removeMeasureBtn.addEventListener('click', removeMeasure);
    }

    // Chords Enabled button toggle
    const chordsEnabledBtn = document.getElementById('chordsEnabled');
    if (chordsEnabledBtn) {
        chordsEnabledBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            this.textContent = this.classList.contains('active') ? 'Chords Enabled' : 'Chords Disabled';
        });
    }

    // Fretboard tuning select
    const tuningSelect = document.getElementById('chord-tuning');
    if (tuningSelect) {
        tuningSelect.addEventListener('change', (e) => {
            const container = UI.elements.chordFretboard;
            const rootNote = UI.elements.keySelect.value;
            // Try to get a global scaleSelect, otherwise use 'major'
            let scaleInput = 'major';
            if (UI.elements.scaleSelect && UI.elements.scaleSelect.value) {
                scaleInput = UI.elements.scaleSelect.value;
            } else {
                // Try to get from the current measure if available
                const currentMeasure = UI.elements.measures.children[AppState.currentMeasure];
                if (currentMeasure) {
                    const scaleSelect = currentMeasure.querySelector('.scale-controls .scale-select');
                    if (scaleSelect && scaleSelect.value) {
                        scaleInput = scaleSelect.value;
                    }
                }
            }
            const scale = suggestScaleForQuality(scaleInput);
            const tuning = TUNINGS[e.target.value];
            updateFretboardNotes(container, rootNote, scale, tuning);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    UI.init();
    UI.setupMetronomeControls();
});
