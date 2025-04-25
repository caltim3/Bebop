// js/playback.js
import { AppState } from './app-state.js';
import { UI } from '../core/ui-manager.js';
import { AudioContextManager } from '../core/audio-context.js';
import { playMetronomeSound } from './metronome.js';
import { playChord } from './music-theory.js';
import { log } from '../utils/helpers.js';
import { TUNINGS } from '../utils/constants.js';
import { suggestScaleForQuality } from '../utils/helpers.js';

// Import at the end to avoid circular dependencies

// Around line 111
if (UI.elements.chordsEnabled) {
    UI.elements.chordsEnabled.addEventListener('click', toggleChordsEnabled);
} else {
    console.error("chordsEnabled element not found during playback setup");
}
export function startPlayback() {
    if (AppState.isPlaying) return;

    AudioContextManager.ensureAudioContext().then(() => {
        AppState.isPlaying = true;
        if (UI.elements.startStopButton) {
            UI.elements.startStopButton.textContent = 'Stop';
            UI.elements.startStopButton.classList.add('active');
        }

        // Reset state
        AppState.currentBeat = 0;
        AppState.currentMeasure = 0;
        const timeSignature = parseInt(UI.elements.timeSignature.value) || 4;
        const is44Time = timeSignature === 4;
        const beatsPerMeasure = is44Time ? 8 : timeSignature; // 8 eighth notes for 4/4
        const measures = UI.elements.measures.children;
        const totalMeasures = measures.length;

        // Clear previous highlights
        document.querySelectorAll('.measure').forEach(m => m.classList.remove('active'));

        // Set initial highlight
        if (measures.length > 0) {
            measures[0].classList.add('active');
        }

        // Calculate timing
        const beatDuration = 60000 / AppState.tempo; // ms per quarter note
        const intervalDuration = is44Time ? beatDuration / 2 : beatDuration; // Eighth notes for 4/4

        // Clear previous interval
        clearInterval(AppState.metronomeInterval);

        AppState.metronomeInterval = setInterval(() => {
            // Update beat display
            document.querySelectorAll('.beat').forEach(beat => beat.classList.remove('active'));
            const currentBeatElement = document.querySelector(`.beat[data-beat="${AppState.currentBeat}"]`);
            if (currentBeatElement) {
                currentBeatElement.classList.add('active');
                const volume = parseFloat(currentBeatElement.dataset.volume) || 0;
                if (volume > 0) {
                    const drumSounds = currentBeatElement.dataset.sound || 'hihat';
                    playMetronomeSound(volume, drumSounds);
                }
            }

            // Handle chord playback
            if (measures.length > 0) {
                const currentMeasure = measures[AppState.currentMeasure];
                const rootNote = currentMeasure.querySelector('.chord-controls .root-note')?.value || 'C';
                const chordQuality = currentMeasure.querySelector('.chord-controls .chord-quality')?.value || 'maj7';

                // Play chord on beat 0 (measure start) and beat 4 (quarter note 3) in 4/4
                if (is44Time && (AppState.currentBeat === 0 || AppState.currentBeat === 4)) {
                    const isSecondHalf = AppState.currentBeat === 4;
                    const voicingType = isSecondHalf ? 'drop2' : null; // Add voicing for second half

                    playChord(
                        rootNote,
                        chordQuality,
                        0,
                        1.8,
                        isSecondHalf,
                        voicingType
                    );

                    // Update fretboard only on measure start (beat 0)
                    if (AppState.currentBeat === 0) {
                        updateFretboardNotes(
                            UI.elements.chordFretboard,
                            rootNote,
                            suggestScaleForQuality(chordQuality),
                            TUNINGS[UI.elements.chordTuning.value]
                        );
                    }
                }
            }

            // Advance to next measure on last beat
            if (AppState.currentBeat === beatsPerMeasure - 1) {
                AppState.currentMeasure = (AppState.currentMeasure + 1) % totalMeasures;
                
                // Update measure highlight
                document.querySelectorAll('.measure').forEach(m => m.classList.remove('active'));
                if (measures.length > 0) {
                    measures[AppState.currentMeasure].classList.add('active');
                }
            }

            // Advance beat
            AppState.currentBeat = (AppState.currentBeat + 1) % beatsPerMeasure;

        }, intervalDuration);

        // Tempo slider handling
        const tempoSlider = document.getElementById('tempo');
        tempoSlider.addEventListener('input', () => {
            AppState.tempo = parseInt(tempoSlider.value);
            document.getElementById('tempo-display').textContent = `${AppState.tempo} BPM`;
            // Restart playback with new tempo
            stopPlayback();
            startPlayback();
        });

        log("Playback started");
    }).catch(error => {
        console.error("Failed to start playback:", error);
    });
}

// HELPER FUNCTION FOR MEASURE HIGHLIGHTING
function updateMeasureHighlight(measureElement) {
    if (!measureElement) return;
    const allMeasures = document.querySelectorAll('.measure');
    allMeasures.forEach(m => m.classList.remove('active-measure'));
    measureElement.classList.add('active-measure');
}

export function stopPlayback() {
    if (!AppState.isPlaying) return;

    console.log('[Playback] Stopping playback, reason: manual stop or error');
    clearInterval(AppState.metronomeInterval);
    AppState.isPlaying = false;
    if (UI.elements.startStopButton) {
        UI.elements.startStopButton.textContent = 'Start';
        UI.elements.startStopButton.classList.remove('active');
    }

    document.querySelectorAll('.beat').forEach(beat => beat.classList.remove('active'));

    log("Playback stopped");
}
import { updateFretboardNotes } from './fretboard.js';
