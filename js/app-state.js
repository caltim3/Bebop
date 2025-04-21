// js/core/app-state.js

export const AppState = {
    isPlaying: false,
    currentBeat: 0,
    currentMeasure: 0,
    tempo: 120,
    audioInitialized: false,
    darkMode: false,
    listeners: [],
    intervalId: null,
    lastTap: null,
    
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

export default AppState;