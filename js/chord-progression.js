import { UI } from '../core/ui-manager.js';
import { getChordFromFunction, parseChord } from './music-theory.js';
import { log, suggestScaleForQuality } from '../utils/helpers.js';
import { progressions, TUNINGS, NOTES, CHORD_QUALITIES, SCALE_NAMES } from '../utils/constants.js';
import { updateFretboardNotes } from './fretboard.js';

// Added this function since it was missing
export function updateProgressionKey(newKey) {
    const rootNote = newKey;
    const scale = 'major'; // Default scale, can be changed as needed
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
    
    // Update the progression with the current key
    updateProgressionKey(UI.elements.keySelect.value);
    
    // Add new measures based on the progression
    progression.measures.forEach((measure, index) => {
        const measureElement = document.createElement('div');
        measureElement.className = 'measure';
        measureElement.dataset.index = index;

        // Add chord controls (root, quality)
        const chordControls = document.createElement('div');
        chordControls.className = 'chord-controls';
        chordControls.innerHTML = `
            <label>Root:</label>
            <select class="root-note">${NOTES.map(note => `<option>${note}</option>`).join('')}</select>
            <label>Quality:</label>
            <select class="chord-quality">${CHORD_QUALITIES.map(q => `<option>${q}</option>`).join('')}</select>
        `;
        measureElement.appendChild(chordControls);

        // Add scale controls (root and scale type)
        const scaleControls = document.createElement('div');
        scaleControls.className = 'scale-controls';
        scaleControls.innerHTML = `
            <label>Scale Root:</label>
            <select class="second-key">${NOTES.map(note => `<option>${note}</option>`).join('')}</select>
            <label>Scale Type:</label>
            <select class="scale-select">${SCALE_NAMES.map(s => `<option>${s}</option>`).join('')}</select>
        `;
        measureElement.appendChild(scaleControls);

        UI.elements.measures.appendChild(measureElement);
    });

    // Initialize fretboard with first measure's data
    if (progression.measures.length > 0) {
        const firstMeasure = progression.measures[0];
        const rootNote = firstMeasure.root || 'C';
        const chordQuality = firstMeasure.quality || 'maj7';
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

// ... [rest of your existing functions (parseProgression, addMeasure, removeMeasure) remain unchanged]

// ... [rest of your existing functions (parseProgression, addMeasure, removeMeasure) remain unchanged]

export function parseProgression(progText, key) {
    const result = [];
    const chordRegex = /([b#]?\w+|[IViv]+)([^/]*)/g;
    let match;

    while ((match = chordRegex.exec(progText))) {
        let [, root, quality] = match;
        quality = quality.trim() || 'maj';
        if (progText.includes('V7') && root.match(/^[Vv]/)) quality = '7';
        const normalizedRoot = root.match(/^[IViv]+/) 
            ? getChordFromFunction(root, key)[0] 
            : root;
        result.push({ function: root, root: normalizedRoot, quality });
        console.log(`[parseProgression] Parsed chord: ${normalizedRoot} ${quality}`);
    }
    return result;
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
    
    // Add chord function options
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
    
    // Add root note options
    const rootNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    rootNotes.forEach(note => {
        const option = document.createElement('option');
        option.value = note;
        option.textContent = note;
        rootNoteSelect.appendChild(option);
    });
    
    const chordQualityLabel = document.createElement('label');
    chordQualityLabel.textContent = 'Quality:';
    
    const chordQualitySelect = document.createElement('select');
    chordQualitySelect.className = 'chord-quality';
    
    // Add chord quality options
    const chordQualities = ['major', 'minor', 'dim', 'aug', 'dom7', 'maj7', 'min7', 'dim7', 'min7b5', 'sus2', 'sus4'];
    chordQualities.forEach(quality => {
        const option = document.createElement('option');
        option.value = quality;
        option.textContent = quality;
        chordQualitySelect.appendChild(option);
    });
    
    // Scale controls
    const scaleControls = document.createElement('div');
    scaleControls.className = 'scale-controls';
    
    const secondKeyLabel = document.createElement('label');
    secondKeyLabel.textContent = 'Scale Root:';
    
    const secondKeySelect = document.createElement('select');
    secondKeySelect.className = 'second-key';
    
    // Add scale root options (same as chord roots)
    rootNotes.forEach(note => {
        const option = document.createElement('option');
        option.value = note;
        option.textContent = note;
        secondKeySelect.appendChild(option);
    });
    
    const scaleSelectLabel = document.createElement('label');
    scaleSelectLabel.textContent = 'Scale:';
    
    const scaleSelect = document.createElement('select');
    scaleSelect.className = 'scale-select';
    
    // Add scale options
    const scales = ['major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian', 'blues', 'minorPentatonic', 'majorPentatonic', 'harmonicMinor', 'melodicMinor', 'diminished', 'wholeTone', 'alteredDominant', 'lydianDominant'];
    scales.forEach(scale => {
        const option = document.createElement('option');
        option.value = scale;
        option.textContent = scale.replace(/([A-Z])/g, ' $1').trim();
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
    
    // Set initial chord based on function and current key
    const key = UI.elements.keySelect.value;
    const chord = getChordFromFunction(chordFunction, key);
    const [root, quality] = parseChord(chord);
    
    rootNoteSelect.value = defaultRoot || root;
    chordQualitySelect.value = defaultQuality || quality;
    secondKeySelect.value = defaultRoot || root;
    
    // Suggest a scale based on chord quality
    scaleSelect.value = suggestScaleForQuality(defaultQuality || quality);
    
    log(`Added measure with chord: ${root} ${quality}`);
    return measure;
}

export function removeMeasure(measure) {
    UI.elements.measures.removeChild(measure);
    log('Removed measure');
}
