// js/playback.js
import { AppState } from './app-state.js';
import { UI } from '../core/ui-manager.js';
import { AudioContextManager } from '../core/audio-context.js';
import { playMetronomeSound } from './metronome.js';
import { playChord } from './music-theory.js';
import { log } from '../utils/helpers.js';
import { TUNINGS } from '../utils/constants.js';

export function startPlayback() {
    if (AppState.isPlaying) return;
    
    // Ensure audio context is running
    AudioContextManager.ensureAudioContext().then(() => {
        AppState.isPlaying = true;
        UI.elements.startStopButton.textContent = 'Stop';
        UI.elements.startStopButton.classList.add('active');
        
        // Reset beat counter
        AppState.currentBeat = 0;
        AppState.currentMeasure = 0;
        
        // Calculate beat duration in milliseconds
        const beatDuration = 60000 / AppState.tempo;
        
        // Start the metronome
        AppState.metronomeInterval = setInterval(() => {
            const beats = document.querySelectorAll('.beat');
            
            // Remove active class from all beats
            beats.forEach(beat => beat.classList.remove('active'));
            
            // Add active class to current beat
            const currentBeatElement = document.querySelector(`.beat[data-beat="${AppState.currentBeat}"]`);
            if (currentBeatElement) {
                currentBeatElement.classList.add('active');
                
                // Play metronome sound if volume > 0
                const volume = parseFloat(currentBeatElement.dataset.volume) || 0;
                if (volume > 0) {
                    playMetronomeSound(volume);
                }
            }
            
        const timeSignature = parseInt(UI.elements.timeSignature.value) || 4;
        const measures = UI.elements.measures.children;
        
        if (measures.length > 0 && AppState.currentMeasure < measures.length) {
            const currentMeasureElement = measures[AppState.currentMeasure];
            const rootNote = currentMeasureElement.querySelector('.chord-controls .root-note').value;
            const chordQuality = currentMeasureElement.querySelector('.chord-controls .chord-quality').value;
        
            // Play chord on beat 1 and 3 (in 4/4 time)
            if (timeSignature === 4 && (AppState.currentBeat === 0 || AppState.currentBeat === 4)) {
                const isSecondHalf = AppState.currentBeat === 4;
                const voicingType = isSecondHalf ? 'drop2' : null;
        
                // Only play if chords are enabled
                if (UI.elements.chordsEnabled.classList.contains('active')) {
                    playChord(rootNote, chordQuality, 0, 1.8, isSecondHalf, voicingType);
                }
            }
        }
        
        // Update beat counter
        AppState.currentBeat = (AppState.currentBeat + 1) % (timeSignature === 4 ? 8 : timeSignature);
            
            // Update measure counter when we loop back to beat 0
            if (AppState.currentBeat === 0) {
                AppState.currentMeasure = (AppState.currentMeasure + 1) % Math.max(1, measures.length);
                
                // Update fretboard when measure changes
                if (measures.length > 0) {
                    const nextMeasureElement = measures[AppState.currentMeasure];
                    const scaleRoot = nextMeasureElement.querySelector('.scale-controls .second-key').value;
                    const scaleType = nextMeasureElement.querySelector('.scale-controls .scale-select').value;
                    const tuning = TUNINGS[UI.elements.chordTuning.value];
                    
                    updateFretboardNotes(UI.elements.chordFretboard, scaleRoot, scaleType, tuning);
                }
            }
        }, beatDuration / (timeSignature === 4 ? 2 : 1)); // Eighth notes for 4/4, quarter notes for others
        
        log("Playback started");
    }).catch(error => {
        console.error("Failed to start playback:", error);
    });
}

export function stopPlayback() {
    if (!AppState.isPlaying) return;
    
    clearInterval(AppState.metronomeInterval);
    AppState.isPlaying = false;
    UI.elements.startStopButton.textContent = 'Start';
    UI.elements.startStopButton.classList.remove('active');
    
    // Remove active class from all beats
    document.querySelectorAll('.beat').forEach(beat => beat.classList.remove('active'));
    
    log("Playback stopped");
}

// Import at the end to avoid circular dependencies
import { updateFretboardNotes } from './fretboard.js';
