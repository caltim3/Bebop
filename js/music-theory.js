// js/music-theory.js
import { NOTES, scaleDegrees } from '../utils/constants.js';
import { AudioContextManager } from '../core/audio-context.js';
import { UI } from '../core/ui-manager.js';
import { standardizeNoteName, getQualityValue } from '../utils/helpers.js';

export function getChordNotes(root, quality) {
    // Use uppercase NOTES to match fretboard logic
    const standardizedRoot = standardizeNoteName(root);
    if (!standardizedRoot) {
    console.error(`Invalid root note: ${root}`);
    return [];
    }

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

export function getChordFromFunction(chordFunction, key) {
    // Determine if the key is minor
    const isMinor = key && (key.endsWith('m') || key.endsWith('min'));
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

    // Use the imported scaleDegrees
    const degreeMap = isMinor ? scaleDegrees.minor : scaleDegrees.major;

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

export function parseChord(chord) {
    if (!chord) return ['C', 'maj'];
    
    // First check if this is a Roman numeral chord (I, V7, etc.)
    const romanNumeralRegex = /^([b#]?[ivIV]+)(7|maj7|m7|dim7|dim|aug|sus2|sus4|add9|6|9|11|13)?$/;
    const romanMatch = chord.match(romanNumeralRegex);
    
    if (romanMatch) {
        // This is a Roman numeral chord, convert it to a real chord based on current key
        // Default to C if no key is set
        const currentKey = UI.elements.keySelector ? UI.elements.keySelector.value : 'C';
        const actualChord = getChordFromFunction(chord, currentKey);
        return parseChord(actualChord); // Recursively parse the actual chord
    }
    
    // Regular chord parsing for letter-based chords (C, Am7, etc.)
    const regex = /^([A-Ga-g][b#]?)(maj7|m7b5|min7|m7|maj|min|dim7|dim|aug|sus2|sus4|add9|7b9|7#9|7b13|7#11|7|6|9|11|13|°|ø)?$/;
    const match = chord.match(regex);
    
    if (!match) {
        console.warn(`Unable to parse chord: ${
