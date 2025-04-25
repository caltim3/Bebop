import { playNote } from './fretflow.js';
import { CHORD_QUALITY_INTERVALS, NOTES, scaleDegrees } from '../utils/constants.js';
import { AudioContextManager } from '../core/audio-context.js';
import { UI } from '../core/ui-manager.js';
import { standardizeNoteName, getQualityValue } from '../utils/helpers.js';

export function getDegreeFromRoman(roman, degreeMap) {
    if (!roman || !degreeMap) return 0;
    const cleanRoman = roman.replace(/\s/g, '');
    return degreeMap[cleanRoman] !== undefined ? degreeMap[cleanRoman] : 0;
}

export function getChordNotes(root, quality) {
    if (!root || !quality) return [];
    const intervals = CHORD_QUALITY_INTERVALS[quality] || CHORD_QUALITY_INTERVALS['major'];
    const rootIndex = NOTES.indexOf(standardizeNoteName(root));
    if (rootIndex === -1) return [];

    return intervals.map(interval => {
        const noteIndex = (rootIndex + interval) % 12;
        return NOTES[noteIndex];
    });
}

export function playChord(root, quality, startTime = 0, duration = 1, isSecondHalf = false, voicingType = 'default') {
    if (!root || !quality) return;

    let sanitizedNotes = getChordNotes(root, getQualityValue(quality));
    if (!sanitizedNotes.length) return;

    if (voicingType !== 'default') {
        sanitizedNotes = getDropVoicing(sanitizedNotes, voicingType);
    }

    const noteNamesWithOctave = sanitizedNotes.map((note, index) => {
        const octave = index === 0 ? 3 : 4; // Root at octave 3, others at octave 4
        return `${note}${octave}`;
    });

    AudioContextManager.ensureAudioContext().then(() => {
        const chordVolume = UI.elements.chordVolume ? parseFloat(UI.elements.chordVolume.value) : 0.75;
        const shouldPlay = UI.elements.chordsEnabled?.classList.contains('active') ?? true;

        if (shouldPlay) {
            noteNamesWithOctave.forEach((note, index) => {
                const noteStartTime = startTime + (isSecondHalf ? duration / 2 : 0);
                const noteDuration = duration * 1000 * (isSecondHalf ? 0.5 : 1);
                playNote(note, chordVolume, noteDuration, noteStartTime);
            });
        }
    });
}

export function getChordFromFunction(chordFunction, key = 'C') {
    if (!chordFunction) return { root: key, quality: 'major' };

    const currentKey = UI.elements.keySelect ? UI.elements.keySelect.value : 'C';
    const isMinor = currentKey.includes('m');
    const degreeMap = isMinor ? scaleDegrees.minor : scaleDegrees.major;

    const degree = getDegreeFromRoman(chordFunction, degreeMap);
    const rootIndex = NOTES.indexOf(standardizeNoteName(currentKey.replace('m', '')));
    const chordRootIndex = (rootIndex + degree) % 12;
    const chordRoot = NOTES[chordRootIndex];

    let quality = 'major';
    if (chordFunction.includes('m7')) quality = 'min7';
    else if (chordFunction.includes('7')) quality = 'dom7';
    else if (chordFunction.includes('maj7')) quality = 'maj7';
    else if (chordFunction.includes('m')) quality = 'minor';
    else if (chordFunction.includes('dim') || chordFunction.includes('°')) quality = 'diminished';
    else if (chordFunction.includes('ø7') || chordFunction.includes('m7b5')) quality = 'min7b5';

    return { root: chordRoot, quality };
}

export function parseChord(chord) {
    if (!chord) return { root: 'C', quality: 'major' };

    const chordMatch = chord.match(/^([A-G][b#]?)(.*)$/);
    if (!chordMatch) return { root: 'C', quality: 'major' };

    const [, root, qualityStr] = chordMatch;
    let quality = 'major';

    if (qualityStr.includes('m7')) quality = 'min7';
    else if (qualityStr.includes('7')) quality = 'dom7';
    else if (qualityStr.includes('maj7')) quality = 'maj7';
    else if (qualityStr.includes('m')) quality = 'minor';
    else if (qualityStr.includes('dim') || qualityStr.includes('°')) quality = 'diminished';
    else if (qualityStr.includes('ø7') || qualityStr.includes('m7b5')) quality = 'min7b5';
    else if (qualityStr.includes('6')) quality = qualityStr.includes('m') ? 'm6' : 'maj6';
    else if (qualityStr.includes('sus2')) quality = 'sus2';
    else if (qualityStr.includes('sus4')) quality = 'sus4';
    else if (qualityStr.includes('9')) quality = qualityStr.includes('m') ? 'm9' : 'maj9';
    else if (qualityStr.includes('add9')) quality = 'add9';

    return { root: standardizeNoteName(root), quality };
}

export function getDropVoicing(notes, voicingType) {
    if (!notes || notes.length < 3) return notes;

    let root = notes[0];
    let upper = notes.slice(1);

    function lowerOctave(note) {
        return note; // Octave handling is done in playChord
    }

    switch (voicingType) {
        case 'drop2':
            if (upper.length >= 2) {
                let idx = upper.length - 2;
                let note = upper.splice(idx, 1)[0];
                upper.unshift(lowerOctave(note));
            }
            break;
        case 'drop3':
            if (upper.length >= 3) {
                let idx = upper.length - 3;
                let note = upper.splice(idx, 1)[0];
                upper.unshift(lowerOctave(note));
            }
            break;
        case 'drop2and4':
            if (upper.length >= 4) {
                let idx2 = upper.length - 2;
                let idx4 = upper.length - 4;
                let note2 = upper.splice(idx2, 1)[0];
                let note4 = upper.splice(idx4, 1)[0];
                upper.unshift(lowerOctave(note4), lowerOctave(note2));
            }
            break;
        default:
            break;
    }

    return [root, ...upper];
}
