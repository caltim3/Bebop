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
    document.addEventListener('click', async () => {
        try {
            await ensureAudioInitialized();
        } catch (error) {
            console.error('Failed to initialize audio on click:', error);
        }
    }, { once: true });
    
    UI.elements.startStopButton.addEventListener('click', () => {
        if (AppState.isPlaying) {
            stopPlayback();
        } else {
            startPlayback();
        }
    });

    // Modified dark mode toggle with three modes
    let colorMode = 0; // 0 = light, 1 = dark-mode-1, 2 = dark-mode-2, 3 = dark-mode-3
    UI.elements.darkModeToggle.addEventListener('click', () => {
        colorMode = (colorMode + 1) % 4; // Cycle through 0, 1, 2, 3
        
        // Remove all mode classes first
        document.body.classList.remove('dark-mode', 'dark-mode-2', 'dark-mode-3');
        UI.elements.darkModeToggle.classList.remove('active', 'active-2', 'active-3');
        
        // Apply appropriate mode
        switch(colorMode) {
            case 1: // First dark mode (green)
                document.body.classList.add('dark-mode');
                UI.elements.darkModeToggle.classList.add('active');
                log('Dark mode 1 enabled');
                break;
            case 2: // Second dark mode (blue)
                document.body.classList.add('dark-mode-2');
                UI.elements.darkModeToggle.classList.add('active-2');
                log('Dark mode 2 enabled');
                break;
            case 3: // Third dark mode (earthy)
                document.body.classList.add('dark-mode-3');
                UI.elements.darkModeToggle.classList.add('active-3');
                log('Dark mode 3 enabled');
                break;
            default: // Light mode
                log('Light mode enabled');
                break;
        }
    });

    // Chords enabled button toggle
    const chordsButton = UI.elements.chordsEnabled;
    let chordsEnabled = true;
    chordsButton.addEventListener('click', () => {
        chordsEnabled = !chordsEnabled;
        chordsButton.textContent = chordsEnabled ? 'Chords Enabled' : 'Chords Disabled';
        chordsButton.classList.toggle('active', chordsEnabled);
        log(`Chords ${chordsEnabled ? 'enabled' : 'disabled'}`);
    });

    UI.elements.tempo.addEventListener('input', () => {
        AppState.tempo = parseInt(UI.elements.tempo.value);
        UI.elements.tempoDisplay.textContent = `${AppState.tempo} BPM`;
        if (AppState.isPlaying) {
            stopPlayback();
            startPlayback();
        }
    });

    UI.elements.timeSignature.addEventListener('change', () => {
        createBeats();
        if (AppState.isPlaying) {
            stopPlayback();
            startPlayback();
        }
    });

    UI.elements.soundType.addEventListener('change', createBeats);

    UI.elements.metronomeVolume.addEventListener('input', () => {
        const volume = parseFloat(UI.elements.metronomeVolume.value);
        log(`Metronome volume set to ${volume}`);
    });

    UI.elements.progressionSelect.addEventListener('change', () => {
        loadProgression(UI.elements.progressionSelect.value);
    });

    UI.elements.keySelect.addEventListener('change', () => {
        updateProgressionKey(UI.elements.keySelect.value);
        initializeFretFlow();
    });

    UI.elements.chordTuning.addEventListener('change', () => {
        const tuning = TUNINGS[UI.elements.chordTuning.value];
        const firstMeasure = UI.elements.measures.firstElementChild;
        if (firstMeasure) {
            const scaleRoot = firstMeasure.querySelector('.second-key').value;
            const scaleType = firstMeasure.querySelector('.scale-select').value;
            updateFretboardNotes(UI.elements.chordFretboard, scaleRoot, scaleType, tuning);
        }
        initializeFretFlow();
    });

    UI.elements.tapTempo.addEventListener('click', () => {
        const now = Date.now();
        if (!AppState.lastTap) AppState.lastTap = now;
        const interval = now - AppState.lastTap;
        if (interval < 2000) {
            const bpm = Math.round(60000 / interval);
            AppState.tempo = Math.max(40, Math.min(220, bpm));
            UI.elements.tempo.value = AppState.tempo;
            UI.elements.tempoDisplay.textContent = `${AppState.tempo} BPM`;
            if (AppState.isPlaying) {
                stopPlayback();
                startPlayback();
            }
        }
        AppState.lastTap = now;
    });

    // Add this to the setupEventListeners function
    UI.elements.soundType.addEventListener('change', (e) => {
        createBeats();
        onMetronomeInstrumentChange(e.target.value);
    });

    // Add the drum set toggle button event listener
    document.getElementById('drumSetToggleBtn').addEventListener('click', () => {
        currentDrumSetIndex = (currentDrumSetIndex + 1) % drumSoundSets.length;
        document.getElementById('drumSetToggleBtn').textContent = `Drum Set ${currentDrumSetIndex + 1}`;
        log(`Switched to drum set ${currentDrumSetIndex + 1}`);
    });

    // Initially hide the drum set toggle button if drums aren't selected
    onMetronomeInstrumentChange(UI.elements.soundType.value);
    
    UI.elements.chordFretboardVolume.addEventListener('input', () => {
        log(`Chord fretboard volume set to ${UI.elements.chordFretboardVolume.value}`);
    });

    UI.elements.chordVolume.addEventListener('input', () => {
        log(`Chord volume set to ${UI.elements.chordVolume.value}`);
    });

    UI.elements.fretboardVolume.addEventListener('input', () => {
        log(`Fretboard volume set to ${UI.elements.fretboardVolume.value}`);
    });

    UI.elements.measures.addEventListener('change', (e) => {
        if (e.target.classList.contains('root-note') || e.target.classList.contains('chord-quality')) {
            const measure = e.target.closest('.measure');
            const root = measure.querySelector('.root-note').value;
            const quality = measure.querySelector('.chord-quality').value;
            const secondKeySelect = measure.querySelector('.second-key');
            const scaleSelect = measure.querySelector('.scale-select');
            secondKeySelect.value = root;
            scaleSelect.value = suggestScaleForQuality(quality);
            if (measure === UI.elements.measures.firstElementChild) {
                const tuning = TUNINGS[UI.elements.chordTuning.value];
                updateFretboardNotes(UI.elements.chordFretboard, root, scaleSelect.value, tuning);
            }
            log(`Updated chord in measure to ${root} ${quality}`);
        }
    });

    log("Event listeners set up");
}

// Start the app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp().catch(error => {
        console.error("Initialization failed:", error);
        updateLoadingStatus("Initialization failed");
    });
});

// Import these functions from their respective modules
import { startPlayback, stopPlayback } from './playback.js';
import { suggestScaleForQuality } from '../utils/helpers.js';
import { updateLoadingStatus } from '../utils/helpers.js';
import { currentDrumSetIndex, drumSoundSets } from './metronome.js';
