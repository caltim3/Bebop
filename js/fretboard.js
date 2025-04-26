import { NOTES, SCALES, TUNINGS } from '../utils/constants.js';
import { AudioContextManager } from '../core/audio-context.js';
import { UI } from '../core/ui-manager.js';
import { standardizeNoteName, log } from '../utils/helpers.js';
import { AppState } from './app-state.js';

export function createFretboard(container, tuning = TUNINGS['standard']) {
    if (!container) {
        log("Error: Fretboard container not found");
        return;
    }

    container.innerHTML = ''; // Clear existing fretboard
    const fretboard = document.createElement('div');
    fretboard.className = 'fretboard';

    // Create strings
    tuning.forEach((openNote, stringIndex) => {
        const string = document.createElement('div');
        string.className = 'string';
        string.dataset.stringIndex = stringIndex;

        // Create frets (0 to 12 for simplicity)
        for (let fret = 0; fret <= 12; fret++) {
            const noteDiv = document.createElement('div');
            noteDiv.className = 'fret';
            noteDiv.dataset.fret = fret;
            noteDiv.dataset.note = getNoteAtFret(openNote, fret);
            string.appendChild(noteDiv);
        }

        fretboard.appendChild(string);
    });

    container.appendChild(fretboard);
    log("Fretboard created");
}

export function updateFretboardNotes(container, key, scaleName, tuning = TUNINGS['standard']) {
    if (!container) {
        log("Error: Fretboard container not found for updating notes");
        return;
    }

    log(`updateFretboardNotes called with scaleName: ${scaleName}`);

    let scale = SCALES[scaleName];
    if (!scale) {
        log(`Scale not found: ${scaleName}. Falling back to 'major'.`);
        scale = SCALES['major'];
    }
    const rootIndex = NOTES.indexOf(standardizeNoteName(key));
    const scaleNotes = scale.map(interval => NOTES[(rootIndex + interval) % 12]);

    const strings = container.querySelectorAll('.string');
    strings.forEach((string, stringIndex) => {
        const openNote = tuning[stringIndex];
        const frets = string.querySelectorAll('.fret');
        frets.forEach(fret => {
            const note = fret.dataset.note;
            const noteName = note.replace(/\d/, ''); // Remove octave for comparison
            const isInScale = scaleNotes.includes(noteName);
            fret.classList.toggle('in-scale', isInScale);
            fret.classList.toggle('root', noteName === standardizeNoteName(key));

            // Add click listener to play note
            fret.addEventListener('click', async () => {
                await AudioContextManager.ensureAudioContext();
                const noteWithOctave = fret.dataset.note;
                AudioContextManager.playChord([noteWithOctave], 1, 0.5);
            });
        });
    });

    log(`Fretboard updated for key: ${key}, scale: ${scaleName}`);
}

function getNoteAtFret(openNote, fret) {
    const noteMatch = openNote.match(/([A-G][b#]?)(\d+)/);
    if (!noteMatch) return openNote;

    const [, note, octave] = noteMatch;
    const noteIndex = NOTES.indexOf(standardizeNoteName(note));
    const newNoteIndex = (noteIndex + fret) % 12;
    const newOctave = parseInt(octave) + Math.floor((noteIndex + fret) / 12);
    return `${NOTES[newNoteIndex]}${newOctave}`;
}
