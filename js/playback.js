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

        AppState.currentBeat = 0;
        AppState.currentMeasure = 0;

        const beatDuration = 60000 / AppState.tempo;
        const timeSignature = parseInt(UI.elements.timeSignature.value) || 4;
        const measures = UI.elements.measures.children;

        AppState.metronomeInterval = setInterval(() => {
            const beats = document.querySelectorAll('.beat');
            beats.forEach(beat => beat.classList.remove('active'));

            const currentBeatElement = document.querySelector(`.beat[data-beat="${AppState.currentBeat}"]`);
            if (currentBeatElement) {
                currentBeatElement.classList.add('active');
                const volume = parseFloat(currentBeatElement.dataset.volume) || 0;
                console.log('[Playback] Beat', AppState.currentBeat, 'volume:', volume);
                if (volume > 0) {
                    // Ensure valid drum sound (use hihat instead of click)
                    const soundType = UI.elements.soundType?.value || 'drums';
                    const drumSound = soundType === 'click' ? 'hihat' : soundType;
                    playMetronomeSound(volume, drumSound);
                }
            }

            // Chord playback logic (default: 4/4, beats 0 and 4)
            if (measures.length > 0 && AppState.currentMeasure < measures.length) {
                const currentMeasureElement = measures[AppState.currentMeasure];
                const rootNote = currentMeasureElement.querySelector('.chord-controls .root-note')?.value;
                const chordQuality = currentMeasureElement.querySelector('.chord-controls .chord-quality')?.value || 'maj';

                // Play chord on beat 1 and 3 in 4/4, or on first beat in other signatures
                if (
                    (timeSignature === 4 && (AppState.currentBeat === 0 || AppState.currentBeat === 4)) ||
                    (timeSignature !== 4 && AppState.currentBeat === 0)
                ) {
                    const isSecondHalf = (timeSignature === 4 && AppState.currentBeat === 4);
                    const voicingType = isSecondHalf ? 'drop2' : null;

                    if (UI.elements.chordsEnabled?.classList.contains('active') && rootNote && chordQuality) {
                        console.log(`[Playback] Playing chord: ${rootNote} ${chordQuality}, isSecondHalf: ${isSecondHalf}, voicing: ${voicingType}`);
                        playChord(rootNote, chordQuality, 0, 1.8, isSecondHalf, voicingType);
                        // Update fretboard with chord
                        if (UI.elements.chordFretboard) {
                            const scale = suggestScaleForQuality(chordQuality);
                            updateFretboardNotes(
                                UI.elements.chordFretboard,
                                rootNote,
                                scale,
                                TUNINGS[UI.elements.chordTuning.value]
                            );
                            console.log(`[Playback] Updated fretboard for chord: ${rootNote} ${chordQuality} (scale: ${scale})`);
                        }
                    } else {
                        console.warn('[Playback] Chords disabled or missing root/quality, skipping chord playback');
                    }
                }
            }

            // Advance beat
            AppState.currentBeat = (AppState.currentBeat + 1) % (timeSignature === 4 ? 8 : timeSignature);

            // Advance measure and update fretboard at start of each measure
            if (AppState.currentBeat === 0) {
                AppState.currentMeasure = (AppState.currentMeasure + 1) % Math.max(1, measures.length);

                if (measures.length > 0) {
                    const nextMeasureElement = measures[AppState.currentMeasure];
                    const scaleRoot = nextMeasureElement.querySelector('.scale-controls .second-key')?.value;
                    const scaleType = nextMeasureElement.querySelector('.scale-controls .scale-select')?.value;
                    const tuning = TUNINGS[UI.elements.chordTuning.value];

                    if (UI.elements.chordFretboard && scaleRoot && scaleType && tuning) {
                        const mappedScale = suggestScaleForQuality(scaleType);
                        updateFretboardNotes(
                            UI.elements.chordFretboard,
                            scaleRoot,
                            mappedScale,
                            tuning
                        );
                        console.log(`[Playback] Updated fretboard for scale: ${scaleRoot} ${scaleType} (mapped: ${mappedScale})`);
                    }
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
