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

// Define this locally to avoid circular imports
let currentDrumSetIndex = 0;

// Initialization
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

// Event Listeners
function setupEventListeners() {
    // ... [rest of your event listeners] ...

    // Add the drum set toggle button event listener
    document.getElementById('drumSetToggleBtn').addEventListener('click', () => {
        currentDrumSetIndex = (currentDrumSetIndex + 1) % drumSoundSets.length;
        document.getElementById('drumSetToggleBtn').textContent = `Drum Set ${currentDrumSetIndex + 1}`;
        log(`Switched to drum set ${currentDrumSetIndex + 1}`);
    });

    // ... [rest of your code] ...
}

// Start the app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp().catch(error => {
        console.error("Initialization failed:", error);
        updateLoadingStatus("Initialization failed");
    });
});
