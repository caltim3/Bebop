// js/utils/music-theory.js
import { NOTES, SCALES, SCALE_DEGREES } from './constants.js';
import { standardizeNoteName, isMinorKeyName } from './helpers.js';
import { AudioContextManager } from '../core/audio-context.js';
import { UI } from '../core/ui-manager.js';

export function getChordNotes(root, quality) {
    const standardizeNoteName = (note) => {
        if (!note) return null;
        const normalized = note.toLowerCase().replace('♯', '#').replace('♭', 'b');
        const enharmonicMap = {
            'cb': 'B', 'db': 'C#', 'eb': 'D#', 'fb': 'E', 'gb': 'F#',
            'ab': 'G#', 'bb': 'A#', 'e#': 'F', 'b#': 'C', 'c##': 'D',
            'd##': 'E', 'f##': 'G', 'g##': 'A', 'a##': 'B'
        };
        const baseNote = enharmonicMap[normalized] || normalized.toUpperCase();
        return NOTES.includes(baseNote) ? baseNote : null;
    };

    const CHORD_INTERVALS = {
        'major': [0, 4, 7],
        'minor': [0, 3, 7],
        'dim': [0, 3, 6],
        'aug': [0, 4, 8],
        '6': [0, 4, 7, 9],
        'min6': [0, 3, 7, 9],
        '7': [0, 4, 7, 10],
        'dom7': [0, 4, 7, 10], // Alias for dominant 7
        'maj7': [0, 4, 7, 11],
        'min7': [0, 3, 7, 10],
        'dim7': [0, 3, 6, 9],
        'min7b5': [0, 3, 6, 10],
        'sus2': [0, 2, 7],
        'sus4': [0, 5, 7],
        'add9': [0, 4, 7, 14]
    };

    const standardizedRoot = standardizeNoteName(root);
    if (!standardizedRoot) {
        console.error(`Invalid root note: ${root}`);
        return [];
    }

    const normalizedQuality = quality ? quality.toLowerCase().replace('m7', 'min7') : 'major';
    const intervals = CHORD_INTERVALS[normalizedQuality] || CHORD_INTERVALS['major'];
    if (!intervals) {
        console.error(`Invalid chord quality: ${quality}`);
        return [];
    }

    const rootIndex = NOTES.indexOf(standardizedRoot);
    const chordNotes = intervals.map(interval => {
        const noteIndex = (rootIndex + interval) % 12;
        return NOTES[noteIndex];
    });

    return chordNotes;
}

export async function playChord(root, quality, startTime = 0, duration = 1, isSecondHalf = false, voicingType = null) {
    try {
        await AudioContextManager.ensureAudioContext();
        let chordNotes = getChordNotes(root, quality);
        if (!chordNotes.length) {
            console.error(`No valid notes found for chord: ${root} ${quality}`);
            return;
        }

        // If this is the second half (beat 3), randomize voicing
        if (isSecondHalf && voicingType) {
            chordNotes = getDropVoicing(chordNotes, voicingType);
        }

        const chordVolume = parseFloat(UI.elements.chordVolume.value) || 0.75;
        if (!UI.elements.chordsEnabled.classList.contains('active')) {
            console.warn("Chords are disabled. Skipping chord playback.");
            return;
        }

        chordNotes.forEach((note, i) => {
            // Always root in the bass (octave 3), others in octave 4
            const octave = i === 0 ? 3 : 4;
            const sampleKey = `${note.toLowerCase().replace('b', '#')}${octave}`;
            const buffer = AudioContextManager.pianoSamples[sampleKey];
            if (!buffer) {
                console.error(`No sample found for note: ${sampleKey}`);
                return;
            }
            const source = AudioContextManager.context.createBufferSource();
            source.buffer = buffer;
            const gainNode = AudioContextManager.context.createGain();
            gainNode.gain.value = chordVolume;
            source.connect(gainNode);
            if (AudioContextManager.reverbNode) {
                const reverbGain = AudioContextManager.context.createGain();
                reverbGain.gain.value = 0.1;
                source.connect(reverbGain);
                reverbGain.connect(AudioContextManager.reverbNode);
            }
            gainNode.connect(AudioContextManager.context.destination);
            source.start(startTime);
            source.stop(startTime + duration);
        });

        console.log(`Playing chord: ${root} ${quality} ${isSecondHalf && voicingType ? '(' + voicingType + ')' : ''}`);
    } catch (error) {
        console.error(`Error playing chord: ${root} ${quality}`, error);
    }
}

export function getDropVoicing(notes, type) {
    // notes: array of note names, e.g. ["C", "E", "G", "B"]
    // type: "drop2", "drop3", "drop2and4"
    let root = notes[0];
    let upper = notes.slice(1);

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

export function getQualityValue(quality) {
    const qualityMap = {
        '': 'major',
        'm': 'minor',
        '7': 'dom7',
        'dom7': 'dom7',
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
        'dom7': 'mixolydian',
        '7': 'mixolydian',
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
        'm7b5': 'locrian',
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
    return scaleChoices[quality] || [];
}

export function parseChord(chord) {
    if (!chord) return ['C', 'maj'];
    
    // Updated regex to catch more qualities
    const regex = /^([A-Ga-g][b#]?)(maj7|m7b5|min7|m7|maj|min|dim7|dim|aug|sus2|sus4|add9|7b9|7#9|7b13|7#11|7|6|9|11|13|°|ø)?$/;
    const match = chord.match(regex);
    
    if (!match) {
        console.warn(`Unable to parse chord: ${chord}`);
        return [standardizeNoteName(chord), 'maj'];
    }
    
    let [, root, quality] = match;
    root = standardizeNoteName(root);
    
    if (!quality) quality = 'maj';
    
    switch (quality.toLowerCase()) {
        case 'min':
        case 'm':
            quality = 'min';
            break;
        case 'min7':
        case 'm7':
            quality = 'min7';
            break;
        case 'maj7':
        case 'maj':
            quality = 'maj7';
            break;
        case 'dim7':
        case '°':
            quality = 'dim7';
            break;
        case 'ø':
        case 'm7b5':
            quality = 'm7b5';
            break;
        case '7':
            quality = '7';
            break;
        default:
            break; // leave as-is
    }
    
    return [root, quality];
}

export function getChordFromFunction(chordFunction, key) {
    // Determine if the key is minor
    const isMinor = isMinorKeyName(key);
    // Remove 'm' or 'min' from key to get the root
    const keyRoot = key.replace(/m(in)?$/, '');
    // Standardize key name (handle flats)
    let keyIndex = NOTES.indexOf(keyRoot);
    if (keyIndex === -1) {
        // Try enharmonic equivalents
        const enharmonic = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
        keyIndex = NOTES.indexOf(enharmonic[keyRoot] || keyRoot);
    }
    if (keyIndex === -1) keyIndex = 0; // Default to C if not found

    // Choose the correct scaleDegrees mapping
    const degreeMap = isMinor ? SCALE_DEGREES.minor : SCALE_DEGREES.major;

    // Try to find the degree and quality
    let degree = null;
    let quality = '';
    // Try to match the full chordFunction (e.g., "iim7b5")
    if (degreeMap[chordFunction]) {
        degree = degreeMap[chordFunction];
        // Extract quality (e.g., "m7b5" from "iim7b5")
        quality = chordFunction.replace(/^[b#]?[ivIV]+/, '');
    } else {
        // Try to match the root (e.g., "ii" from "iim7b5")
        const match = chordFunction.match(/^([b#]?[ivIV]+)(.*)$/);
        if (match) {
            const roman = match[1];
            quality = match[2] || '';
            if (degreeMap[roman]) {
                degree = degreeMap[roman];
            }
        }
    }
    if (degree === null) {
        // Fallback: just return the function as-is
        return chordFunction;
    }
    // Calculate the note index
    let noteIndex = (keyIndex + degree) % 12;
    let note = NOTES[noteIndex];
    return note + quality;
}