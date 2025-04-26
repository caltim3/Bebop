import { AppState } from './app-state.js';
import { UI } from '../core/ui-manager.js';
import { AudioContextManager } from '../core/audio-context.js';
import { playMetronomeSound } from './metronome.js';
import { playChord } from './music-theory.js';
import { log, suggestScaleForQuality } from '../utils/helpers.js';
import { TUNINGS } from '../utils/constants.js';
import { updateFretboardNotes } from './fretboard.js';

let playbackInterval = null;

export function startPlayback() {
    if (AppState.state.isPlaying) return;

    AudioContextManager.ensureAudioContext().then(() => {
        AppState.updateState({ isPlaying: true });
        if (UI.elements.startStop) {
            UI.elements.startStop.textContent = 'Stop';
            UI.elements.startStop.classList.add('active');
        }

        // Reset state
        AppState.updateState({ currentBeat: 0, currentMeasure: 0 });
        const timeSignature = parseInt(UI.elements.timeSignature?.value) || 4;
        const is44Time = timeSignature === 4;
        const beatsPerMeasure = is44Time ? 8 : timeSignature; // 8 eighth notes for 4/4
        const measures = UI.elements.measures?.children || [];
        const totalMeasures = measures.length;

        // Clear previous highlights
        document.querySelectorAll('.measure').forEach(m => m.classList.remove('active'));

        // Set initial highlight
        if (measures.length > 0) {
            measures[0].classList.add('active');
        }

        // Calculate timing
        const beatDuration = 60000 / (AppState.state.tempo || 120); // ms per quarter note
        const intervalDuration = is44Time ? beatDuration / 2 : beatDuration; // Eighth notes for 4/4

        // Clear previous interval
        if (playbackInterval) {
            clearInterval(playbackInterval);
        }

        playbackInterval = setInterval(() => {
            // Update beat display
            document.querySelectorAll('.beat').forEach(beat => beat.classList.remove('active'));
            const currentBeatElement = document.querySelector(`.beat[data-beat="${AppState.state.currentBeat}"]`);
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
                const currentMeasure = measures[AppState.state.currentMeasure];
                const rootNote = currentMeasure.querySelector('.chord-controls .root-note')?.value || 'C';
                const chordQuality = currentMeasure.querySelector('.chord-controls .chord-quality')?.value || 'maj7';

                // Play chord on beat 0 (measure start) and beat 4 (quarter note 3) in 4/4
                if (is44Time && (AppState.state.currentBeat === 0 || AppState.state.currentBeat === 4)) {
                    const isSecondHalf = AppState.state.currentBeat === 4;
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
                    if (AppState.state.currentBeat === 0 && UI.elements.chordFretboard) {
                        updateFretboardNotes(
                            UI.elements.chordFretboard,
                            rootNote,
                            suggestScaleForQuality(chordQuality),
                            TUNINGS[UI.elements.chordTuning?.value] || TUNINGS['standard']
                        );
                    }
                }
            }

            // Advance to next measure on last beat
            if (AppState.state.currentBeat === beatsPerMeasure - 1) {
                const newMeasure = (AppState.state.currentMeasure + 1) % totalMeasures;
                AppState.updateState({ currentMeasure: newMeasure });

                // Update measure highlight
                document.querySelectorAll('.measure').forEach(m => m.classList.remove('active'));
                if (measures.length > 0) {
                    measures[AppState.state.currentMeasure].classList.add('active');
                }
            }

            // Advance beat
            AppState.updateState({ currentBeat: (AppState.state.currentBeat + 1) % beatsPerMeasure });

        }, intervalDuration);

        log("Playback started");
    }).catch(error => {
        console.error("Failed to start playback:", error);
    });
}

export function stopPlayback() {
    if (!AppState.state.isPlaying) return;

    console.log('[Playback] Stopping playback, reason: manual stop or error');
    if (playbackInterval) {
        clearInterval(playbackInterval);
        playbackInterval = null;
    }
    AppState.updateState({ isPlaying: false });
    if (UI.elements.startStop) {
        UI.elements.startStop.textContent = 'Start';
        UI.elements.startStop.classList.remove('active');
    }

    document.querySelectorAll('.beat').forEach(beat => beat.classList.remove('active'));

    log("Playback stopped");
}
