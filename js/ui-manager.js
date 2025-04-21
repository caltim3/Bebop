// js/core/ui-manager.js

export const UI = {
    elements: {},
    
    init() {
        this.elements = {
            chordFretboard: document.getElementById('chord-fretboard'),
            measures: document.getElementById('measures'),
            tempoDisplay: document.getElementById('tempo-display'),
            startStopButton: document.getElementById('start-stop'),
            progressionSelect: document.getElementById('progression-select'),
            keySelect: document.getElementById('keySelect'),
            scaleDisplay: document.getElementById('scale-display'),
            chordTuning: document.getElementById('chord-tuning'),
            timeSignature: document.getElementById('time-signature'),
            soundType: document.getElementById('sound-type'),
            metronomeVolume: document.getElementById('metronome-volume'),
            tempo: document.getElementById('tempo'),
            tapTempo: document.getElementById('tap-tempo'),
            chordFretboardVolume: document.getElementById('chord-fretboard-volume'),
            chordVolume: document.getElementById('chord-volume'),
            chordsEnabled: document.getElementById('chordsEnabled'),
            fretboardVolume: document.getElementById('fretboard-volume'),
            fretboardsGrid: document.querySelector('.fretboards-grid'),
            darkModeToggle: document.getElementById('dark-mode-toggle'),
            accentIntensity: document.getElementById('accent-intensity'),
            drumSetToggleBtn: document.getElementById('drumSetToggleBtn')
        };
        
        Object.entries(this.elements).forEach(([key, el]) => {
            if (!el) console.warn(`Missing DOM element: ${key}`);
        });
    },
    
    updateLoadingStatus(message) {
        let indicator = document.getElementById('loading-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'loading-indicator';
            document.body.appendChild(indicator);
        }
        indicator.textContent = message;
    }
};

export default UI;