export const AppState = {
    isPlaying: false,
    currentBeat: 0, 
    currentMeasure: 0,
    tempo: 120,
    audioInitialized: false,
    intervalId: null,
    lastTapTime: 0,
    tapTempoTimestamps: [],
    guideTonesActive: false,
    loopingActive: false,
    loopStartMeasure: -1,
    loopEndMeasure: -1,
    currentRhythmicStyle: "standardSwing",
    currentStylePatternBeat: 0,       
    currentStyleBar: 0,               
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

// Global state variables that are frequently modified
export let currentFunctionalProgression = [];
export let currentProgressionName = "";
export let currentDrumSetIndex = 0;
export let previousPlayedVoicingNotesWithOctaves = null;

// Functions to modify these global states if needed (to avoid direct export let)
// For simplicity in this refactor, direct export let is used, but consider encapsulation for larger projects.
export function setCurrentFunctionalProgression(prog) {
    currentFunctionalProgression = prog;
}
export function setCurrentProgressionName(name) {
    currentProgressionName = name;
}
export function setCurrentDrumSetIndex(index) {
    currentDrumSetIndex = index;
}
export function setPreviousPlayedVoicingNotesWithOctaves(notes) {
    previousPlayedVoicingNotesWithOctaves = notes;
}


/**
 * Updates and shows/hides a loading indicator.
 * @param {string} message - The message to display in the indicator.
 * @param {boolean} [isVisible=true] - Whether the indicator should be visible.
 */
export function updateLoadingStatus(message, isVisible = true) {
    let i = document.getElementById('loading-indicator');
    if (!i) { // Should not happen if UI.init() correctly caches it
        i = document.createElement('div');
        i.id = 'loading-indicator';
        document.body.appendChild(i);
        console.warn("Loading indicator was not cached by UI.init(). Created dynamically.");
    }
    i.textContent = message;
    i.style.display = isVisible ? 'block' : 'none';
}