// js/utils/helpers.js
import { NOTES, ENHARMONIC_MAP } from './constants.js';
import { AudioContextManager } from '../core/audio-context.js';

export function log(message) {
    console.log(`[FretFlow Debug] ${message}`);
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

export function createKeyOptions(selected = 'C') {
    return NOTES.map(note =>
        `<option value="${note}"${note === selected ? ' selected' : ''}>${note}</option>`
    ).join('');
}

export function createQualityOptions(selected = 'major') {
    const qualities = [
        { value: 'major', label: 'Major' },
        { value: 'minor', label: 'Minor' },
        { value: 'dom7', label: '7' },
        { value: 'maj7', label: 'Maj7' },
        { value: 'min7', label: 'Min7' },
        { value: 'min7b5', label: 'Min7b5 (Half Diminished)' }
    ];
    
    return qualities.map(q =>
        `<option value="${q.value}"${q.value === selected ? ' selected' : ''}>${q.label}</option>`
    ).join('');
}

export function createScaleOptions(selected = 'major') {
    return Object.keys(SCALES).map(scale =>
        `<option value="${scale}"${scale === selected ? ' selected' : ''}>${scale.charAt(0).toUpperCase() + scale.slice(1)}</option>`
    ).join('');
}