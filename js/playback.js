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

        const timeSignature = parseInt(UI.elements.timeSignature.value) || 4;
        const totalBeatsPerMeasure = timeSignature === 4 ? 8 : timeSignature;
        const measures = UI.elements.measures.children;

        const beatDuration = 60000 / AppState.tempo;

        AppState.metronomeInterval = setInterval(() => {
            const beats = document.querySelectorAll('.beat');
            beats.forEach(beat => beat.classList.remove('active'));

            const currentBeatElement = document.querySelector(`.beat[data-beat="${AppState.currentBeat}"]`);
            if (currentBeatElement) {
                currentBeatElement.classList.add('active');
                const volume = parseFloat(currentBeatElement.dataset.volume) || 0;
                console.log('[Playback] Beat', AppState.currentBeat, 'volume:', volume);
                if (volume > 0) {
                    const drumSounds = currentBeatElement.dataset.sound || 'hihat';
                    playMetronomeSound(volume, drumSounds);
                }
            }

            // Chord playback logic (trigger on beat 0 of each measure)
            if (measures.length > 0 && AppState.currentMeasure < measures.length) {
                const currentMeasureElement = measures[AppState.currentMeasure];
                const rootNote = currentMeasureElement.querySelector('.chord-controls .root-note')?.value;
                const chordQuality = currentMeasureElement.querySelector('.chord-controls .chord-quality')?.value || 'maj';

                // Play chord on the first beat of each measure (beat 0)
                if (AppState.currentBeat === 0) {
                    const isSecondHalf = false; // Reset for new measure
                    const voicingType = null;

                    const chordsEnabled = UI.elements.chordsEnabled?.classList.contains('active');
                    if (chordsEnabled) {
                        if (rootNote && chordQuality) {
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
                            console.warn('[Playback] Chords enabled but missing root/quality, skipping chord playback');
                        }
                    }
                }

                // Advance measure when reaching the last beat of the current measure
                if (AppState.currentBeat === (totalBeatsPerMeasure - 1)) {
                    AppState.currentMeasure = (AppState.currentMeasure + 1) % Math.max(1, measures.length);

                    // Update scale for next measure
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
            }

            // Advance beat
            AppState.currentBeat = (AppState.currentBeat + 1) % totalBeatsPerMeasure;

        }, beatDuration);

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
