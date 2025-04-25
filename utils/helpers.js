// Likely imports from constants.js
import { NOTES, ENHARMONIC_MAP, CHORD_QUALITIES, SCALES } from './constants.js'; // was ../utils/constants.js
// Utility Functions
export function log(message) {
    console.log(`[FretFlow Debug] ${message}`);
}

// Place updateLoadingStatus here:
export function updateLoadingStatus(message) {
    let indicator = document.getElementById('loading-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'loading-indicator';
        document.body.appendChild(indicator);
    }
    indicator.textContent = message;
}

export function standardizeNoteName(note) {
    if (!note) return 'C';
    const match = note.match(/^([A-G])([b#])?(\d)?$/);
    if (!match) return note.toUpperCase();
    let [, letter, accidental, octave] = match;
    letter = letter.toUpperCase();
    const CHROMATIC = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    if (accidental === 'b') {
        const index = CHROMATIC.indexOf(letter);
        return CHROMATIC[(index - 1 + 12) % 12];
    } else if (accidental === '#') {
        const index = CHROMATIC.indexOf(letter);
        return CHROMATIC[(index + 1) % 12];
    }
    return letter;
}

export function isMinorKeyName(key) {
    return key && (key.endsWith('m') || key.endsWith('min'));
}

export function flattenNote(note) {
    const sharpToFlat = {
        'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb'
    };
    return sharpToFlat[note] || note;
}

export function sharpifyNote(note) {
    const flatToSharp = {
        'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
    };
    return flatToSharp[note] || note;
}

export function getQualityValue(quality) {
    const qualityMap = {
        '': 'major',
        'm': 'minor',
        '7': 'dom7',
        'dom7': 'dom7',  // Add explicit mapping
        'maj7': 'maj7',
        'm7': 'min7',
        'min7': 'min7',
        'dim': 'dim',
        'min7b5': 'min7b5'
    };
    return qualityMap[quality] || 'major';
}

export function suggestScaleForQuality(quality) {
    const scaleMap = {
        '': 'major',
        'maj7': 'major',
        'maj9': 'major',
        'maj13': 'major',
        'maj7#11': 'lydian',
        'm': 'dorian',
        'm7': 'dorian',
        'm9': 'dorian',
        'm11': 'dorian',
        'm13': 'dorian',
        'dom7': 'mixolydian',    // Ensure this mapping exists
        '7': 'mixolydian',    // Add this explicit mapping
        '9': 'mixolydian',
        '13': 'mixolydian',
        '7b9': 'bebopPhrygian',
        '7#9': 'mixolydian',
        '7#11': 'lydian',
        '7b13': 'mixolydian',
        '7#5': 'wholeHalf',
        '7b5': 'mixolydian',
        'dim7': 'diminished',
        'dim': 'diminished',
        'min7b5': 'locrian',
        'aug7': 'wholeHalf',
        'aug': 'wholeHalf',
        '6': 'major',
        'm6': 'melodicMinor',
        'sus4': 'mixolydian',
        'sus2': 'mixolydian',
        'add9': 'major',
        '7sus4': 'mixolydian',
        'minMaj7': 'melodicMinor',
        '7alt': 'altered'
    };
    return scaleMap[quality] || 'major';
}

export function getCompatibleScales(chord, quality) {
    const scaleChoices = {
        'major': ['major', 'lydian', 'mixolydian'],
        'minor': ['dorian', 'phrygian', 'aeolian'],
        'dominant': ['mixolydian', 'lydianDominant', 'altered', 'bebopDominant'],
        'halfDiminished': ['locrian', 'locrian#2'],
        'diminished': ['diminishedWH', 'diminishedHW'],
        'altered': ['altered', 'diminishedWH']
    };
    // Example return (customize as needed)
    return scaleChoices[quality] || [];
}

export function getDropVoicing(notes, type) {
    // notes: array of note names, e.g. ["C", "E", "G", "B"]
    // type: "drop2", "drop3", "drop2and4"
    let root = notes[0];
    let upper = notes.slice(1);

    function lowerOctave(note, octave) {
        // e.g., "E", 4 -> "E3"
        return note + (octave - 1);
    }

    // We'll assign octaves later, just shuffle the order here
    switch(type) {
        case "drop2":
            if (upper.length >= 2) {
                // Move 2nd highest down
                let idx = upper.length - 2;
                let note = upper.splice(idx, 1)[0];
                upper.unshift(note); // Will assign lower octave later
            }
            break;
        case "drop3":
            if (upper.length >= 3) {
                let idx = upper.length - 3;
                let note = upper.splice(idx, 1)[0];
                upper.unshift(note);
            }
            break;
        case "drop2and4":
            if (upper.length >= 4) {
                let idx2 = upper.length - 2;
                let idx4 = upper.length - 4;
                let note2 = upper.splice(idx2, 1)[0];
                let note4 = upper.splice(idx4, 1)[0];
                upper.unshift(note4, note2);
            }
            break;
        default:
            break;
    }
    return [root, ...upper];
}

export async function ensureAudioInitialized() {
    if (!AudioContextManager.context || AudioContextManager.context.state === 'suspended') {
        try {
            await AudioContextManager.initialize();
            if (AudioContextManager.context.state === 'suspended') {
                await AudioContextManager.context.resume();
            }
        } catch (error) {
            console.error('Audio initialization failed:', error);
            alert('Please click anywhere on the page to enable audio playback');
            throw error;
        }
    }
}
