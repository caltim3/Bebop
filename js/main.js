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

// Rest of the file remains the same (as provided previously)
document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
});

async function initializeApp() {
    UI.init();
    await AudioContextManager.initialize();

    const chordFretboardSection = UI.elements.chordFretboardSection;
    const tuning = TUNINGS[UI.elements.chordTuning.value];
    createFretboard(chordFretboardSection, tuning);
    createBeats();
    updateFretboardNotes(chordFretboardSection, UI.elements.keySelect.value, suggestScaleForQuality('major'), tuning);
    loadProgression(UI.elements.progressionSelect.value);
    initializeFretFlow();

    setupEventListeners();

    updateLoadingStatus("App fully initialized");
}

function setupEventListeners() {
    const startStopBtn = UI.elements.startStop;
    const tempoSlider = UI.elements.tempoSlider;
    const chordsEnabledBtn = UI.elements.chordsEnabled;
    const keySelect = UI.elements.keySelect;
    const progressionSelect = UI.elements.progressionSelect;
    const chordTuning = UI.elements.chordTuning;
    const fretboardVolume = UI.elements.fretboardVolume;
    const metronomeVolume = UI.elements.metronomeVolume;
    const soundType = UI.elements.soundType;
    const addMeasureBtn = UI.elements.addMeasureBtn;
    const chordFretboardSection = UI.elements.chordFretboardSection;

    if (startStopBtn) {
        startStopBtn.addEventListener('click', async () => {
            await AudioContextManager.initialize();
            if (AppState.isPlaying) {
                stopPlayback();
            } else {
                startPlayback();
            }
        });
    }

    if (tempoSlider) {
        tempoSlider.addEventListener('input', () => {
            const tempo = parseInt(tempoSlider.value);
            AppState.updateState({ tempo });
        });
    }

    if (chordsEnabledBtn) {
        chordsEnabledBtn.addEventListener('click', () => {
            chordsEnabledBtn.classList.toggle('active');
            const isEnabled = chordsEnabledBtn.classList.contains('active');
            AppState.updateState({ chordsEnabled: isEnabled });
        });
    }

    if (keySelect) {
        keySelect.addEventListener('change', () => {
            updateProgressionKey(keySelect.value);
        });
    }

    if (progressionSelect) {
        progressionSelect.addEventListener('change', () => {
            loadProgression(progressionSelect.value);
        });
    }

    if (chordTuning) {
        chordTuning.addEventListener('change', () => {
            const newTuning = TUNINGS[chordTuning.value];
            createFretboard(chordFretboardSection, newTuning);
            const currentKey = keySelect ? keySelect.value : 'C';
            updateFretboardNotes(chordFretboardSection, currentKey, suggestScaleForQuality('major'), newTuning);
        });
    }

    if (fretboardVolume) {
        fretboardVolume.addEventListener('input', () => {
            const volume = parseFloat(fretboardVolume.value);
            AppState.updateState({ fretboardVolume: volume });
        });
    }

    if (metronomeVolume) {
        metronomeVolume.addEventListener('input', () => {
            const volume = parseFloat(metronomeVolume.value);
            AppState.updateState({ metronomeVolume: volume });
        });
    }

    if (soundType) {
        soundType.addEventListener('change', () => {
            onMetronomeInstrumentChange();
        });
    }

    if (addMeasureBtn) {
        addMeasureBtn.addEventListener('click', () => {
            addMeasure();
        });
    }

    document.addEventListener('click', (event) => {
        const removeBtn = event.target.closest('.remove-measure-btn');
        if (removeBtn) {
            const measure = removeBtn.closest('.measure');
            if (measure) {
                removeMeasure(measure);
            }
        }
    });

    document.addEventListener('click', async (event) => {
        const target = event.target;
        if (target.classList.contains('note')) {
            await ensureAudioInitialized();
        }
    });

    AppState.addListener((state) => {
        if (startStopBtn) {
            startStopBtn.textContent = state.isPlaying ? 'Stop' : 'Start';
            startStopBtn.classList.toggle('active', state.isPlaying);
        }
    });
}
