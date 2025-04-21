import { NOTES, SCALES, TUNINGS, progressions, scaleDegrees } from './constants.js';
import { log, standardizeNoteName } from './helpers.js';
import { AppState } from './app-state.js';
import { UI } from './ui-manager.js';
import { AudioContextManager } from './audio-context.js';
import { getChordNotes, playChord, suggestScaleForQuality } from './music-theory.js';
import { updateFretboardNotes } from './fretboard.js';

// Chord Progression Management
export function loadProgression(progressionName, overrideKey = null) {
    if (!progressionName || !progressions[progressionName]) {
        console.error(`Invalid progression name: ${progressionName}`);
        return;
    }

    const progression = progressions[progressionName];
    const selectedKey = overrideKey || progression.defaultKey || "C";
    UI.elements.keySelect.value = selectedKey;

    UI.elements.measures.innerHTML = '';

    progression.progression.forEach((chordFunction, index) => {
        const chord = getChordFromFunction(chordFunction, selectedKey);
        const [root, quality] = parseChord(chord);
        
        // Get the proper quality value and suggested scale
        const qualityValue = getQualityValue(quality);
        const suggestedScale = suggestScaleForQuality(qualityValue);

        const measure = document.createElement('div');
        measure.className = 'measure';
        measure.draggable = true;
        measure.innerHTML = `
            <span class="measure-number">${index + 1}</span>
            <div class="chord-controls">
                <select class="root-note">${createKeyOptions(root)}</select>
                <select class="chord-quality">${createQualityOptions(qualityValue)}</select>
            </div>
            <div class="scale-controls">
                <select class="second-key">${createKeyOptions(root)}</select>
                <select class="scale-select">${createScaleOptions(suggestedScale)}</select>
            </div>
        `;

        UI.elements.measures.appendChild(measure);
        
        // Explicitly set the correct scale based on chord quality
        const scaleSelect = measure.querySelector('.scale-select');
        if (quality === '7' || quality === 'dom7') {
            scaleSelect.value = 'mixolydian';
        } else if (quality === 'min7' || quality === 'm7') {
            scaleSelect.value = 'dorian';
        } else if (quality === 'maj7') {
            scaleSelect.value = 'major';
        } else if (quality === 'min7b5') {
            scaleSelect.value = 'locrian';
        } else if (quality === 'm' || quality === 'minor') {
            scaleSelect.value = 'minor';
        }
    });

    updateMeasureNumbers();
    addFirstChordListener();

    // Update the fretboard with the first measure's scale
    const firstMeasure = UI.elements.measures.firstElementChild;
    if (firstMeasure) {
        const scaleRoot = firstMeasure.querySelector('.second-key').value;
        const scaleType = firstMeasure.querySelector('.scale-select').value;
        const tuning = TUNINGS[UI.elements.chordTuning.value];
        updateFretboardNotes(UI.elements.chordFretboard, scaleRoot, scaleType, tuning);
    }

    log(`Loaded progression "${progressionName}" in key: ${selectedKey}`);
}

export function updateProgressionKey(newKey) {
    const selectedProgression = UI.elements.progressionSelect.value;
    if (!selectedProgression) return;
    const progression = progressions[selectedProgression];
    if (!progression) return;
    Array.from(UI.elements.measures.children).forEach((measure, index) => {
        const chordFunc = progression.progression[index];
        if (!chordFunc) return;
        const chord = getChordFromFunction(chordFunc, newKey);
        const [root, quality] = parseChord(chord);
        const rootSelect = measure.querySelector('.root-note');
        const qualitySelect = measure.querySelector('.chord-quality');
        const secondKeySelect = measure.querySelector('.second-key');
        const scaleSelect = measure.querySelector('.scale-select');
        if (rootSelect) rootSelect.value = standardizeNoteName(root);
        if (qualitySelect) qualitySelect.value = getQualityValue(quality);
        if (secondKeySelect) secondKeySelect.value = standardizeNoteName(root);
        if (scaleSelect) scaleSelect.value = suggestScaleForQuality(getQualityValue(quality));
    });
    const firstMeasure = UI.elements.measures.firstElementChild;
    if (firstMeasure) {
        const scaleRoot = firstMeasure.querySelector('.second-key').value;
        const scaleType = firstMeasure.querySelector('.scale-select').value;
        const tuning = TUNINGS[UI.elements.chordTuning.value];
        updateFretboardNotes(UI.elements.chordFretboard, scaleRoot, scaleType, tuning);
    }
    log(`Progression updated to key: ${newKey}`);
}

export function addMeasure(chord = 'C', quality = 'major', scaleRoot = 'C', scaleType = 'major') {
    const measure = document.createElement('div');
    measure.className = 'measure';
    measure.draggable = true;
    const measureCount = UI.elements.measures.children.length + 1;
    measure.innerHTML = `
        <span class="measure-number">${measureCount}</span>
        <div class="chord-controls">
            <select class="root-note">${createKeyOptions(chord)}</select>
            <select class="chord-quality">${createQualityOptions(quality)}</select>
        </div>
        <div class="scale-controls">
            <select class="second-key">${createKeyOptions(scaleRoot)}</select>
            <select class="scale-select">${createScaleOptions(scaleType)}</select>
        </div>
    `;
    UI.elements.measures.appendChild(measure);
}

export function removeMeasure() {
    const measures = UI.elements.measures.children;
    if (measures.length > 0) {
        measures[measures.length - 1].remove();
        updateMeasureNumbers();
        log(`Removed last measure`);
    }
}

export function updateMeasureNumbers() {
    Array.from(UI.elements.measures.children).forEach((measure, index) => {
        const number = measure.querySelector('.measure-number');
        if (number) number.textContent = index + 1;
    });
}

export function addFirstChordListener() {
    const firstMeasure = UI.elements.measures.firstElementChild;
    if (firstMeasure) {
        const scaleRoot = firstMeasure.querySelector('.second-key');
        const scaleType = firstMeasure.querySelector('.scale-select');
        const updateFretboard = () => {
            const tuning = TUNINGS[UI.elements.chordTuning.value];
            updateFretboardNotes(UI.elements.chordFretboard, scaleRoot.value, scaleType.value, tuning);
        };
        scaleRoot.addEventListener('change', updateFretboard);
        scaleType.addEventListener('change', updateFretboard);
    }
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
    
    // Updated regex to catch more qualities, including dom7, m7b5, and alt chords
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

function isMinorKeyName(key) {
    return key && (key.endsWith('m') || key.endsWith('min'));
}

function createKeyOptions(selected = 'C') {
    return NOTES.map(note =>
        `<option value="${note}"${note === selected ? ' selected' : ''}>${note}</option>`
    ).join('');
}

function createQualityOptions(selected = 'major') {
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

function createScaleOptions(selected = 'major') {
    return Object.keys(SCALES).map(scale =>
        `<option value="${scale}"${scale === selected ? ' selected' : ''}>${scale.charAt(0).toUpperCase() + scale.slice(1)}</option>`
    ).join('');
}