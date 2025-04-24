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
import { updateFretboardNotes } from './fretboard.js';

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
        const beatDuration = 60000 / AppState.tempo; // Milliseconds per beat
        const intervalDuration = is44Time ? beatDuration / 2 : beatDuration; // Eighth notes for 4/4

        const measures = UI.elements.measures.children;
        const totalMeasures = measures.length;

        // Clear previous interval
        clearInterval(AppState.metronomeInterval);

        // Start new interval
        AppState.metronomeInterval = setInterval(() => {
            // Clear active beats
            document.querySelectorAll('.beat').forEach(beat => beat.classList.remove('active'));

            // Update current beat
            const currentBeat = AppState.currentBeat;
            const currentBeatElement = document.querySelector(`.beat[data-beat="${currentBeat}"]`);
            if (currentBeatElement) {
                currentBeatElement.classList.add('active');
                const volume = parseFloat(currentBeatElement.dataset.volume) || 0;
                if (volume > 0) {
                    const drumSounds = currentBeatElement.dataset.sound || 'hihat';
                    playMetronomeSound(volume, drumSounds);
                }
            }

            // CHORD PROGRESSION LOGIC
            if (measures.length > 0 && AppState.currentMeasure < totalMeasures) {
                const currentMeasureElement = measures[AppState.currentMeasure];
                const rootNote = currentMeasureElement.querySelector('.chord-controls .root-note')?.value;
                const chordQuality = currentMeasureElement.querySelector('.chord-controls .chord-quality')?.value || 'maj';

                // CHORD UPDATE ON BEAT 1 (0-based)
                if (currentBeat === 0) {
                    const chordsEnabled = UI.elements.chordsEnabled?.classList.contains('active');
                    if (chordsEnabled && rootNote && chordQuality) {
                        playChord(rootNote, chordQuality, 0, 1.8, false, null);
                        updateFretboardNotes(
                            UI.elements.chordFretboard,
                            rootNote,
                            suggestScaleForQuality(chordQuality),
                            TUNINGS[UI.elements.chordTuning.value]
                        );
                        console.log(`[Playback] Updated fretboard for chord: ${rootNote} ${chordQuality}`);
                    }
                }

                // SCALE UPDATE ON MEASURE CHANGE
                if (currentBeat === beatsPerMeasure - 1) { // Last beat of measure
                    AppState.currentMeasure = (AppState.currentMeasure + 1) % totalMeasures;
                    const nextMeasure = measures[AppState.currentMeasure];
                    updateMeasureHighlight(nextMeasure);
                    const scaleRoot = nextMeasure.querySelector('.scale-controls .second-key')?.value;
                    const scaleType = nextMeasure.querySelector('.scale-controls .scale-select')?.value;
                    if (scaleRoot && scaleType && UI.elements.chordFretboard) {
                        updateFretboardNotes(
                            UI.elements.chordFretboard,
                            scaleRoot,
                            suggestScaleForQuality(scaleType),
                            TUNINGS[UI.elements.chordTuning.value]
                        );
                        console.log(`[Playback] Updated scale: ${scaleRoot} ${scaleType}`);
                    }
                }
            }

            // ADVANCE BEAT AND MEASURE
            AppState.currentBeat = (currentBeat + 1) % beatsPerMeasure;

            // UPDATE MEASURE HIGHLIGHT
            updateMeasureHighlight(measures[AppState.currentMeasure]);
        }, intervalDuration);

        // METRONOME SLIDER UPDATE
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
