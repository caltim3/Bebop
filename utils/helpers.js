import { NOTES, ENHARMONIC_MAP, CHORD_QUALITIES, SCALES } from './constants.js';
import { AudioContextManager } from '../core/audio-context.js';

export function log(message) {
    console.log(`[App] ${message}`);
}

export async function ensureAudioInitialized() {
    await AudioContextManager.ensureAudioContext();
}

export function suggestScaleForQuality(quality) {
    if (quality.includes('m') || quality.includes('min') || quality.includes('dim')) {
        return 'Aeolian';
    }
    return 'Ionian';
}

export function updateLoadingStatus(status) {
    const loadingElement = document.getElementById('loading-status');
    if (loadingElement) {
        loadingElement.textContent = status;
    }
}

export function standardizeNoteName(note) {
    note = note.toUpperCase();
    if (note in ENHARMONIC_MAP) {
        return ENHARMONIC_MAP[note];
    }
    return note;
}

export function sharpifyNote(note) {
    const noteWithoutOctave = note.match(/[A-G][b#]?/)[0];
    const octave = note.match(/\d+/)[0];
    const sharpNote = standardizeNoteName(noteWithoutOctave).replace('b', '#');
    return `${sharpNote}${octave}`;
}

export function getQualityValue(quality) {
    return CHORD_QUALITIES[quality] || CHORD_QUALITIES['maj'];
}
