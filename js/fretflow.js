import { UI } from '../core/ui-manager.js';
import { TUNINGS } from '../utils/constants.js';
import { createFretboard, updateFretboardNotes } from './fretboard.js';
import { log, suggestScaleForQuality, sharpifyNote } from '../utils/helpers.js';
import { AudioContextManager } from '../core/audio-context.js';

export function initializeFretFlow() {
    const fretboardsGrid = UI.elements.fretboardsGrid;
    if (!fretboardsGrid) {
        log("Error: Fretboards grid not found for FretFlow initialization");
        return;
    }
let AudioContextManager;
setTimeout(() => {
    import('../core/audio-context.js').then(mod => {
        AudioContextManager = mod.AudioContextManager;
    });
}, 0);

export function initializeFretFlow() {
    const fretboardsGrid = UI.elements.fretboardsGrid;
    if (!fretboardsGrid) {
        log("No .fretboards-grid found!");
        return;
    }
    const scales = ['major', 'minor', 'dorian', 'mixolydian'];
    const tuning = TUNINGS[UI.elements.chordTuning.value];
    fretboardsGrid.innerHTML = '';
    
    scales.forEach((scale, index) => {
        const container = document.createElement('div');
        container.className = 'fretboard-container';
        container.innerHTML = `
            <div class="scale-display">${UI.elements.keySelect.value} ${scale.charAt(0).toUpperCase() + scale.slice(1)}</div>
            <div class="controls">
                <select class="tuning-select" id="fretflow-tuning-${index}" aria-label="Select guitar tuning">
                    <option value="standard">Standard (EADGBE)</option>
                    <option value="dropD">Drop D (DADGBE)</option>
                    <option value="openG">Open G (DGDGBD)</option>
                    <option value="DADGAD">DADGAD</option>
                    <option value="openE">Open E (EBEG#BE)</option>
                </select>
            </div>
            <div id="fretflow-fretboard-${index}" class="fretboard"></div>
        `;
        fretboardsGrid.appendChild(container);

        const fretboard = container.querySelector(`#fretflow-fretboard-${index}`);
        createFretboard(fretboard, tuning);
        const mappedScale = suggestScaleForQuality(scale);
        updateFretboardNotes(fretboard, UI.elements.keySelect.value, mappedScale, tuning);

        const tuningSelect = container.querySelector(`#fretflow-tuning-${index}`);
        tuningSelect.addEventListener('change', () => {
            const newTuning = TUNINGS[tuningSelect.value];
            createFretboard(fretboard, newTuning);
            const mappedScale = suggestScaleForQuality(scale);
            updateFretboardNotes(fretboard, UI.elements.keySelect.value, mappedScale, newTuning);
        });

        const updatedNotes = fretboard.getElementsByClassName('note');
        Array.from(updatedNotes).forEach(note => {
            note.addEventListener('click', function(e) {
                e.stopPropagation();
                const noteName = this.dataset.note;
                if (noteName) {
                    const fretboardVolume = parseFloat(UI.elements.fretboardVolume.value) || 1.0;
                    playNote(noteName, fretboardVolume, 500);
                    log(`Playing note: ${noteName}`);
                }
            }); 
        });
    });

    log("FretFlow initialized");
}

export function playNote(noteName, volume = 0.3, duration = 500, startTime = 0) {
    if (!AudioContextManager) {
        log("AudioContextManager not loaded yet.");
        return;
    }
    AudioContextManager.ensureAudioContext().then(() => {
        const noteMatch = noteName.match(/([A-Ga-g#b]+)(\d+)$/);
        let notePart = noteName;
        let octave = 3;
        if (noteMatch) {
            notePart = noteMatch[1];
            octave = parseInt(noteMatch[2], 10);
        }

        let sanitizedNote = notePart.toLowerCase().replace('#', 's');
        if (sanitizedNote.includes('b')) {
            const flatToSharpMap = {
                'ab': 'gs',
                'bb': 'as',
                'cb': 'b',
                'db': 'cs',
                'eb': 'ds',
                'fb': 'e',
                'gb': 'fs'
            };
            sanitizedNote = flatToSharpMap[sanitizedNote] || sanitizedNote.replace('b', '');
        }

        // Try requested octave, then adjacent octaves within 2-5 range
        const tryOctaves = [
            octave,
            octave - 1,
            octave + 1,
            octave - 2,
            octave + 2
        ].filter(oct => oct >= 2 && oct <= 5);

        let buffer = null;
        let usedOctave = null;

        for (const oct of tryOctaves) {
            const sampleKey = `${sanitizedNote}${oct}`;
            buffer = AudioContextManager.pianoSamples[sampleKey];
            if (buffer) {
                usedOctave = oct;
                break;
            }
        }

        if (!buffer) {
            log(`No sample for ${sanitizedNote} in octaves ${tryOctaves.join(', ')}, skipping`);
            return;
        }

        if (usedOctave !== octave) {
            log(`Fallback: playing ${sanitizedNote}${usedOctave} instead of ${sanitizedNote}${octave}`);
        } else {
            log(`Playing sample for ${sanitizedNote}${octave}`);
        }

        const source = AudioContextManager.context.createBufferSource();
        source.buffer = buffer;
        const gainNode = AudioContextManager.context.createGain();
        gainNode.gain.value = volume;
        source.connect(gainNode);
        gainNode.connect(AudioContextManager.context.destination);
        source.start(startTime);
        setTimeout(() => source.stop(), duration);
    }).catch(error => {
        log(`Error playing note: ${error}`);
    });
}
