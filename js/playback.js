import { AppState } from './app-state.js'; // was ../core/app-state.js
import { UI } from './ui-manager.js'; // was ../core/ui-manager.js
import { AudioContextManager } from './audio-context.js'; // was ../core/audio-context.js
import { playMetronomeSound } from './metronome.js'; // was ./metronome.js
import { playChord } from './music-theory.js'; // was ./music-theory.js
import { log } from './helpers.js'; // was ../utils/helpers.js
import { TUNINGS, suggestScaleForQuality, updateFretboardNotes } from './constants.js'; // was ../utils/constants.js (split imports as needed)
// Define toggleChordsEnabled function
function toggleChordsEnabled() {
    const chordsEnabledBtn = UI.elements.chordsEnabled || document.getElementById('chordsEnabled');
    if (chordsEnabledBtn) {
        chordsEnabledBtn.classList.toggle('active');
        console.log("Chords enabled toggled:", chordsEnabledBtn.classList.contains('active'));
    } else {
        console.error("toggleChordsEnabled: chordsEnabled button not found");
    }
}

// Around line 26 (DOMContentLoaded event listener remains unchanged)
document.addEventListener('DOMContentLoaded', () => {
    // Wait for UI.init() to complete if not already
    if (!UI.elements.chordsEnabled) {
        console.warn("chordsEnabled not found in UI.elements, attempting direct DOM query");
        UI.elements.chordsEnabled = document.getElementById('chordsEnabled');
    }

    if (UI.elements.chordsEnabled) {
        UI.elements.chordsEnabled.addEventListener('click', toggleChordsEnabled);
        console.log("chordsEnabled event listener added successfully");
    } else {
        console.error("chordsEnabled element not found during playback setup");
    }
});

export function startPlayback() {
    if (AppState.isPlaying) return;

    AudioContextManager.ensureAudioContext().then(() => {
        AppState.isPlaying = true;
        if (UI.elements.startStop) {
            UI.elements.startStop.textContent = 'Stop';
            UI.elements.startStop.classList.add('active');
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
        const tempoSlider = UI.elements.tempoSlider; // Use UI.elements.tempoSlider instead of document.getElementById('tempo')
        if (tempoSlider) {
            tempoSlider.addEventListener('input', () => {
                AppState.tempo = parseInt(tempoSlider.value);
                const tempoDisplay = document.getElementById('tempo-display');
                if (tempoDisplay) {
                    tempoDisplay.textContent = `${AppState.tempo} BPM`;
                }
                // Restart playback with new tempo
                stopPlayback();
                startPlayback();
            });
        } else {
            console.error("Tempo slider not found, cannot add event listener");
        }

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
    if (UI.elements.startStop) {
        UI.elements.startStop.textContent = 'Start';
        UI.elements.startStop.classList.remove('active');
    }

    document.querySelectorAll('.beat').forEach(beat => beat.classList.remove('active'));

    log("Playback stopped");
}
import { updateFretboardNotes } from './fretboard.js';
