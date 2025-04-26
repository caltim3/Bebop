// js/app-state.js

import { log } from '../utils/helpers.js';

export const AppState = {
    isPlaying: false,
    currentBeat: 0,
    currentMeasure: 0,
    tempo: 120,
    audioInitialized: false,
    darkMode: false,
    metronomeInterval: null,
    lastTap: null,
    listeners: [],

    updateState(newState) {
        Object.assign(this, newState);
        this.notifyListeners();
    },

    addListener(callback) {
        this.listeners.push(callback);
    },

    notifyListeners() {
        this.listeners.forEach(callback => callback(this));
    }
};
