export function loadProgression(...) {
    console.log("progression called");
    // ...rest of function...
}

import { UI } from '../core/ui-manager.js';
import { getChordFromFunction, parseChord } from './music-theory.js';
import { log, suggestScaleForQuality } from '../utils/helpers.js';
import { progressions, TUNINGS, NOTES, CHORD_QUALITIES, SCALE_NAMES } from '../utils/constants.js';
import { updateFretboardNotes } from './fretboard.js';
import { AudioContextManager } from '../core/audio-context.js';
import { CHORD_QUALITY_INTERVALS } from '../utils/constants.js';
import { playChord } from './music-theory.js';


// --- FIXED: Robust Roman numeral to root mapping ---
const MAJOR_SCALE = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const ROMAN_TO_DEGREE = {
    'I': 0, 'II': 1, 'III': 2, 'IV': 3, 'V': 4, 'VI': 5, 'VII': 6,
    'i': 0, 'ii': 1, 'iii': 2, 'iv': 3, 'v': 4, 'vi': 5, 'vii': 6
};

function getRootFromRoman(roman, key) {
    // Accepts roman like "V7", "ii", "IV7", etc.
    const baseRoman = roman.replace(/7|°/g, '');
    const degree = ROMAN_TO_DEGREE[baseRoman];
    if (degree === undefined) return key;

    // Find the index of the key in the scale
    let keyIndex = MAJOR_SCALE.indexOf(key[0].toUpperCase());
    if (keyIndex === -1) keyIndex = 0; // fallback to C

    // Calculate the root note for the degree
    let note = MAJOR_SCALE[(keyIndex + degree) % 7];

    // Handle accidentals in key (e.g., F#, Bb)
    if (key.length > 1 && (key[1] === '#' || key[1] === 'b')) {
        note += key[1];
    }
    return note;
}

export function updateProgressionKey(newKey) {
    const rootNote = newKey;
    const scale = suggestScaleForQuality('maj7'); // Use default or dynamic scale
    const tuning = TUNINGS[UI.elements.chordTuning.value];
    updateFretboardNotes(UI.elements.chordFretboard, rootNote, scale, tuning);
}

export function loadProgression(progressionName) {
    const progression = progressions[progressionName];
    if (!progression) {
        console.error(`Progression ${progressionName} not found`);
        return;
    }
    
    // Clear existing measures
    UI.elements.measures.innerHTML = '';
    
    // Parse progression (e.g., "I V7") and add measures
    const chords = parseProgression(progression.progression, UI.elements.keySelect.value);
    chords.forEach(chord => {
        addMeasure(chord.function, chord.root, chord.quality);
    });

    // Debug: log number of measures created
    console.log('Measures created:', UI.elements.measures.children.length);
    
    // Update the progression with the current key
    updateProgressionKey(UI.elements.keySelect.value);

    // Initialize fretboard with first measure's data
    if (chords.length > 0) {
        const firstChord = chords[0];
        const rootNote = firstChord.root || 'C';
        const chordQuality = firstChord.quality || 'maj7';
        const scale = suggestScaleForQuality(chordQuality);
        const tuning = TUNINGS[UI.elements.chordTuning.value];

        updateFretboardNotes(
            UI.elements.chordFretboard,
            rootNote,
            scale,
            tuning
        );
    }

    log(`Loaded progression: ${progressionName}`);
}

export function parseProgression(progText, key) {
    let tokens = [];
    if (Array.isArray(progText)) {
        tokens = progText;
    } else if (typeof progText === 'string') {
        tokens = progText.split(/[\s,;]+/).filter(Boolean);
    } else {
        console.error('parseProgression: progText is not a string or array:', progText);
        return [];
    }

    const result = [];
    tokens.forEach(token => {
        // Extract roman and quality with improved regex
        const match = token.match(/^([b#]?[IViv]+)(.*)$/);
        let roman, quality;
        if (match) {
            roman = match[1];
            quality = match[2].trim() || '';
        } else {
            roman = token;
            quality = '';
        }

        // Standardize quality
        if (!quality || quality === 'maj') {
            quality = roman.toLowerCase() === 'v' ? '7' : 'maj7';
        } else {
            // Clean up quality strings (remove trailing numbers)
            quality = quality.replace(/(\d+)$/, '');
            // Map to valid qualities
            if (quality.includes('m')) quality = 'm7';
            else if (quality.includes('dom')) quality = '7';
        }

        // Map roman to root
        let root = getRootFromRoman(roman, key) || roman;

        result.push({ roman, root, quality });
        console.log(`[parseProgression] Parsed chord: ${root} ${quality}`);
    });
    return result;
}

export function populateChordQualityDropdowns() {
    const qualitySelects = document.querySelectorAll('.chord-quality');
    
    qualitySelects.forEach(select => {
        select.innerHTML = ''; // Clear existing options
        
        // Add default placeholder
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select Quality';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        select.appendChild(defaultOption);
        
        // Format each quality into user-friendly text
        CHORD_QUALITIES.forEach(quality => {
            const option = document.createElement('option');
            option.value = quality; // Keep internal name
            
            // Format display text
            let displayText = quality
                .replace('maj', 'Major')
                .replace('m', 'Minor')
                .replace('dom', 'Dominant')
                .replace('aug', 'Augmented')
                .replace('dim', 'Diminished')
                .replace('sus', 'Suspended')
                .replace('add', 'Add')
                .replace('lydian', 'Lydian')
                .replace('b', '♭') // Flat symbol
                .replace('#', '♯'); // Sharp symbol
            
            // Capitalize first letter
            displayText = displayText.charAt(0).toUpperCase() + displayText.slice(1);
            
            option.textContent = displayText;
            select.appendChild(option);
        });
    });
}

export function addMeasure(chordFunction = 'I', defaultRoot = null, defaultQuality = null) {
    const measure = document.createElement('div');
    measure.className = 'measure';
    
    // Chord controls
    const chordControls = document.createElement('div');
    chordControls.className = 'chord-controls';
    
    const chordFunctionLabel = document.createElement('label');
    chordFunctionLabel.textContent = 'Function:';
    
    const chordFunctionSelect = document.createElement('select');
    chordFunctionSelect.className = 'chord-function';
    
    // Use CHORD_QUALITIES for chord functions (ensure they match your constants)
    const chordFunctions = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°', 'I7', 'ii7', 'iii7', 'IV7', 'V7', 'vi7', 'vii°7'];
    chordFunctions.forEach(func => {
        const option = document.createElement('option');
        option.value = func;
        option.textContent = func;
        chordFunctionSelect.appendChild(option);
    });
    chordFunctionSelect.value = chordFunction;
    
    const rootNoteLabel = document.createElement('label');
    rootNoteLabel.textContent = 'Root:';
    
    const rootNoteSelect = document.createElement('select');
    rootNoteSelect.className = 'root-note';
    NOTES.forEach(note => {
        const option = document.createElement('option');
        option.value = note;
        option.textContent = note;
        rootNoteSelect.appendChild(option);
    });
    
    const chordQualityLabel = document.createElement('label');
    chordQualityLabel.textContent = 'Quality:';
    
    const chordQualitySelect = document.createElement('select');
    chordQualitySelect.className = 'chord-quality';
    
    // Populate chord qualities with proper display names
    CHORD_QUALITIES.forEach(quality => {
        const option = document.createElement('option');
        option.value = quality;
        option.textContent = quality
            .replace(/([A-Z])/g, ' $1') // Add space before capitals
            .replace('dom', 'Dominant') // Special case for 'dom7'
            .replace('maj', 'Major')
            .replace('m', 'Minor')
            .trim()
            .charAt(0).toUpperCase() + // Capitalize first letter
            option.textContent.slice(1);
        chordQualitySelect.appendChild(option);
    });
    
    // Scale controls
    const scaleControls = document.createElement('div');
    scaleControls.className = 'scale-controls';
    
    const secondKeyLabel = document.createElement('label');
    secondKeyLabel.textContent = 'Scale Root:';
    
    const secondKeySelect = document.createElement('select');
    secondKeySelect.className = 'second-key';
    NOTES.forEach(note => {
        const option = document.createElement('option');
        option.value = note;
        option.textContent = note;
        secondKeySelect.appendChild(option);
    });
    
    const scaleSelectLabel = document.createElement('label');
    scaleSelectLabel.textContent = 'Scale:';
    
const scaleSelect = document.createElement('select');
scaleSelect.className = 'scale-select';

SCALE_NAMES.forEach(scale => {
    const option = document.createElement('option');
    option.value = scale;
    
    // Format display text
    let displayText = scale
        .replace(/([A-Z])/g, ' $1') // Add space before capitals
        .replace('Diminished', 'Dim')
        .replace('Major', 'Maj')
        .replace('Minor', 'Min')
        .replace('Pentatonic', 'Pent')
        .trim();
    
    // Capitalize first letter
    displayText = displayText.charAt(0).toUpperCase() + displayText.slice(1);
    
    option.textContent = displayText;
    scaleSelect.appendChild(option);
});
    
    // Remove button
    const removeButton = document.createElement('button');
    removeButton.className = 'remove-measure';
    removeButton.textContent = 'X';
    removeButton.addEventListener('click', () => {
        if (UI.elements.measures.children.length > 1) {
            removeMeasure(measure);
        }
    });
    
    // Assemble the measure
    chordControls.appendChild(chordFunctionLabel);
    chordControls.appendChild(chordFunctionSelect);
    chordControls.appendChild(rootNoteLabel);
    chordControls.appendChild(rootNoteSelect);
    chordControls.appendChild(chordQualityLabel);
    chordControls.appendChild(chordQualitySelect);
    
    scaleControls.appendChild(secondKeyLabel);
    scaleControls.appendChild(secondKeySelect);
    scaleControls.appendChild(scaleSelectLabel);
    scaleControls.appendChild(scaleSelect);
    
    measure.appendChild(chordControls);
    measure.appendChild(scaleControls);
    measure.appendChild(removeButton);
    
    UI.elements.measures.appendChild(measure);
    
    // Set initial values
    const key = UI.elements.keySelect.value;
    // Use the provided root and quality, or fallback to parsed
    rootNoteSelect.value = defaultRoot || 'C';
    chordQualitySelect.value = defaultQuality || 'maj7';
    secondKeySelect.value = defaultRoot || 'C';
    
    // Suggest scale based on quality
    scaleSelect.value = suggestScaleForQuality(defaultQuality) || 'major';
    
    log(`Added measure with chord: ${defaultRoot} ${defaultQuality}`);
    return measure;
}

export function removeMeasure(measure) {
    UI.elements.measures.removeChild(measure);
    log('Removed measure');
    
    // Re-index measure numbers after removal
    Array.from(UI.elements.measures.children).forEach((m, index) => {
        m.querySelector('.measure-number').textContent = (index + 1).toString();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    populateChordQualityDropdowns();
});
