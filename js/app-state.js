import { log } from '../utils/helpers.js';

export const AppState = {
    state: {
        isPlaying: false,
        tempo: 120,
        currentBeat: 0,
        currentMeasure: 0, // Added for playback.js
        chordsEnabled: false,
        fretboardVolume: 1.0,
        metronomeVolume: 1.0,
        audioInitialized: false,
        metronomeInterval: null, // Added for playback.js
    },
    listeners: [],

    updateState(newState) {
        this.state = { ...this.state, ...newState };
        this.listeners.forEach(listener => listener(this.state));
        log(`State updated: ${JSON.stringify(this.state)}`);
    },

    addListener(listener) {
        this.listeners.push(listener);
    },
};
