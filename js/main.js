// js/main.js

import { AppState } from './app-state.js';
import { UI } from '../core/ui-manager.js';
import { AudioContextManager } from '../core/audio-context.js';
import { createFretboard, updateFretboardNotes } from './fretboard.js';
import { createBeats, onMetronomeInstrumentChange } from './metronome.js';
import { loadProgression, updateProgressionKey, addMeasure, removeMeasure } from './chord-progression.js';
import { initializeFretFlow } from './fretflow.js';
import { log, ensureAudioInitialized, suggestScaleForQuality, updateLoadingStatus } from '../utils/helpers.js';
import { TUNINGS, drumSoundSets } from '../utils/constants.js';
import { startPlayback, stopPlayback } from './playback.js';

let currentDrumSetIndex = 0;

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

document.getElementById('drum-kit-select').addEventListener('change', (e) => {
  AudioContextManager.setDrumKit(Number(e.target.value));
});

function setupEventListeners() {
    // Metronome start/stop
    const startStopBtn = document.getElementById('start-stop');
    if (startStopBtn) {
        startStopBtn.addEventListener('click', () => {
            // You may want to toggle between startPlayback and stopPlayback
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
        tapTempoBtn.addEventListener('click', () => {
            // Implement tap tempo logic here
            log('Tap tempo clicked');
        });
    }

    // Drum set toggle
    const drumSetToggleBtn = document.getElementById('drumSetToggleBtn');
    if (drumSetToggleBtn) {
        drumSetToggleBtn.addEventListener('click', () => {
            currentDrumSetIndex = (currentDrumSetIndex + 1) % drumSoundSets.length;
            drumSetToggleBtn.textContent = `Drum Set ${currentDrumSetIndex + 1}`;
            log(`Switched to drum set ${currentDrumSetIndex + 1}`);
            // Optionally, update metronome instrument here
            onMetronomeInstrumentChange(currentDrumSetIndex);
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

    // Chord/scale toggles, volume sliders, etc. (add as needed)
    // Example: Fretboard tuning select
    const tuningSelect = document.getElementById('chord-tuning');
    if (tuningSelect) {
        tuningSelect.addEventListener('change', (e) => {
            updateFretboardNotes(e.target.value);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeApp().catch(error => {
        console.error("Initialization failed:", error);
        updateLoadingStatus("Initialization failed");
    });
});
