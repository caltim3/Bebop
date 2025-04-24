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
        // Extract roman and quality
        const match = token.match(/^([b#]?[IViv]+)(.*)$/);
        let roman, quality;
        if (match) {
            roman = match[1];
            quality = match[2] ? match[2].trim() : '';
        } else {
            roman = token;
            quality = '';
        }
        if (!quality || quality === 'maj') {
            // Default to 7 for V, dom7 for V7, etc.
            if (/^[Vv]$/.test(roman)) quality = '7';
            else quality = 'maj';
        }
        // Map roman numeral to root note
        let root = getRootFromRoman(roman, key);
        // Fallback: if not found, use the roman as root
        if (!root) root = roman;
        result.push({ function: roman, root, quality });
        console.log(`[parseProgression] Parsed chord: ${root} ${quality}`);
    });
    return result;
}

// In your chord-progression.js or similar file
export function populateChordQualityDropdowns() {
    const qualitySelects = document.querySelectorAll('.chord-quality');
    
    qualitySelects.forEach(select => {
        // Clear existing options
        select.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select Quality';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        select.appendChild(defaultOption);
        
        // Add all chord qualities
        for (const [value, label] of Object.entries(CHORD_QUALITIES)) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            select.appendChild(option);
        }
        
        // Set initial value if one exists
        if (select.dataset.initialValue) {
            select.value = select.dataset.initialValue;
        }
    });
}

import { CHORD_QUALITIES, NOTES, SCALE_NAMES } from './constants (1).js'; // Ensure correct import path

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
        option.textContent = scale
            .replace(/([A-Z])/g, ' $1') // Add space before capitals
            .replace('Diminished', 'Dim') // Abbreviate for display
            .trim()
            .charAt(0).toUpperCase() + // Capitalize first letter
            option.textContent.slice(1);
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
