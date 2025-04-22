// js/chord-progression.js
import { UI } from '../core/ui-manager.js';
import { getChordFromFunction, parseChord } from './music-theory.js';
import { log, suggestScaleForQuality } from '../utils/helpers.js';
import { progressions, TUNINGS } from '../utils/constants.js';
import { updateFretboardNotes } from './fretboard.js';

export function loadProgression(progressionName) {
    const progression = progressions[progressionName];
    if (!progression) {
        console.error(`Progression ${progressionName} not found`);
        return;
    }
    
    // Clear existing measures
    UI.elements.measures.innerHTML = '';
    
    // Add measures for each chord in the progression
    progression.progression.forEach(chordFunction => {
        addMeasure(chordFunction);
    });
    
    // Update the progression with the current key
    updateProgressionKey(UI.elements.keySelect.value);
    
    log(`Loaded progression: ${progressionName}`);
}

export function updateProgressionKey(key) {
    const measures = UI.elements.measures.children;
    
    for (let i = 0; i < measures.length; i++) {
        const measure = measures[i];
        const chordFunctionElement = measure.querySelector('.chord-function');
        const rootNoteElement = measure.querySelector('.root-note');
        const chordQualityElement = measure.querySelector('.chord-quality');
        const secondKeyElement = measure.querySelector('.second-key');
        
        if (chordFunctionElement && rootNoteElement && chordQualityElement) {
            const chordFunction = chordFunctionElement.value;
            const chord = getChordFromFunction(chordFunction, key);
            const [root, quality] = parseChord(chord);
            
            rootNoteElement.value = root;
            chordQualityElement.value = quality;
            
            // Update scale suggestion
            if (secondKeyElement) {
                secondKeyElement.value = root;
            }
        }
    }
    
    // Update the first measure's scale on the fretboard
    const firstMeasure = measures[0];
    if (firstMeasure) {
        const scaleRoot = firstMeasure.querySelector('.second-key').value;
        const scaleType = firstMeasure.querySelector('.scale-select').value;
        const tuning = TUNINGS[UI.elements.chordTuning.value];
        
        updateFretboardNotes(UI.elements.chordFretboard, scaleRoot, scaleType, tuning);
    }
    
    log(`Updated progression to key: ${key}`);
}

export function addMeasure(chordFunction = 'I') {
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
    
    rootNoteSelect.value = root;
    chordQualitySelect.value = quality;
    secondKeySelect.value = root;
    
    // Suggest a scale based on chord quality
    scaleSelect.value = suggestScaleForQuality(quality);
    
    return measure;
}

export function removeMeasure(measure) {
    UI.elements.measures.removeChild(measure);
    log('Removed measure');
}
