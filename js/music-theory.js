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
    
    // Extract the Roman numeral and quality
    const match = chordFunction.match(/^([b#]?[ivIV]+)(.*)$/);
    if (match) {
        const roman = match[1];
        quality = match[2] || '';
        
        // Look up the degree in the scale degrees map
        if (degreeMap[roman]) {
            degree = degreeMap[roman];
        }
    }
    
    if (degree === null) {
        // Fallback: just return the function as-is
        return chordFunction;
    }
    
    // Calculate the note index
    let noteIndex = (keyIndex + degree) % 12;
    let note = NOTES[noteIndex];
    
    // Map Roman numeral qualities to actual chord qualities
    if (quality === '7' && roman.toUpperCase() === roman) {
        // Major chord with dominant 7th (e.g., V7)
        return note + '7';
    } else if (quality === '7' && roman.toLowerCase() === roman) {
        // Minor chord with minor 7th (e.g., ii7)
        return note + 'm7';
    } else if (quality === 'maj7' || quality === 'M7') {
        // Major chord with major 7th
        return note + 'maj7';
    } else if (quality === 'dim' || quality === '°') {
        return note + 'dim';
    } else if (quality === 'dim7' || quality === '°7') {
        return note + 'dim7';
    } else if (quality === 'm7b5' || quality === 'ø') {
        return note + 'm7b5';
    } else if (roman.toLowerCase() === roman && !quality) {
        // Lowercase Roman numeral with no quality = minor chord
        return note + 'm';
    }
    
    // Default: return the note with the quality
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
        
        // Direct parsing of the actual chord without recursion
        const regex = /^([A-Ga-g][b#]?)(maj7|m7b5|min7|m7|maj|min|dim7|dim|aug|sus2|sus4|add9|7b9|7#9|7b13|7#11|7|6|9|11|13|°|ø)?$/;
        const match = actualChord.match(regex);
        
        if (!match) {
            console.warn(`Unable to parse converted chord: ${actualChord} (from ${chord})`);
            return [standardizeNoteName(actualChord), 'maj'];
        }
        
        let [, root, quality] = match;
        root = standardizeNoteName(root);
        
        if (!quality) quality = 'maj';
        
        // Normalize quality
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
                break; // leave as-is (e.g., add9, 9, 13, etc.)
        }
        
        return [root, quality];
    }
    
    // Regular chord parsing for letter-based chords (C, Am7, etc.)
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
            break; // leave as-is (e.g., add9, 9, 13, etc.)
    }
    
    return [root, quality];
}

// Add the getDropVoicing function that was referenced but not defined
export function getDropVoicing(notes, voicingType = 'drop2') {
    if (!notes || notes.length < 3) return notes;
    
    const voicedNotes = [...notes];
    
    switch (voicingType) {
        case 'drop2':
            // Drop the second highest note down an octave
            if (voicedNotes.length >= 4) {
                const secondHighestIdx = voicedNotes.length - 2;
                // We don't actually change the note, just its position in the array
                // In a real implementation, you'd adjust the octave
                const secondHighest = voicedNotes.splice(secondHighestIdx, 1)[0];
                voicedNotes.splice(1, 0, secondHighest);
            }
            break;
        case 'drop3':
            // Drop the third highest note down an octave
            if (voicedNotes.length >= 4) {
                const thirdHighestIdx = voicedNotes.length - 3;
                const thirdHighest = voicedNotes.splice(thirdHighestIdx, 1)[0];
                voicedNotes.splice(1, 0, thirdHighest);
            }
            break;
        case 'spread':
            // Spread voicing - root in bass, then 5th, 3rd, 7th (if present)
            if (voicedNotes.length >= 3) {
                // This is a simplified version - in a real implementation
                // you'd need to identify the actual chord tones
                const root = voicedNotes[0];
                const third = voicedNotes.find((_, i) => i !== 0 && i !== 2);
                const fifth = voicedNotes[2];
                const seventh = voicedNotes[3];
                
                voicedNotes.length = 0;
                voicedNotes.push(root);
                if (fifth) voicedNotes.push(fifth);
                if (third) voicedNotes.push(third);
                if (seventh) voicedNotes.push(seventh);
            }
            break;
        default:
            // No voicing change
            break;
    }
    
    return voicedNotes;
}
