import { NOTES, SCALES, TUNINGS } from './constants.js';
import { log } from './helpers.js';
import { UI } from './ui-manager.js';
import { AudioContextManager } from './audio-context.js';
import { createFretboard, updateFretboardNotes } from './fretboard.js';

export function initializeFretFlow() {
    const fretboardsGrid = UI.elements.fretboardsGrid;
    const scales = ['major', 'minor', 'dorian', 'mixolydian'];
    const tuning = TUNINGS[UI.elements.chordTuning.value];
    fretboardsGrid.innerHTML = '';
    
    scales.forEach((scale, index) => {
        const container = document.createElement('div');
        container.className = 'fretboard-container';
        container.innerHTML = `
            <div class="scale-display">${UI.elements.keySelect.value} ${scale.charAt(0).toUpperCase() + scale.slice(1)}</div>
            <div class="controls">
                <select class="tuning-select" id="fretflow-tuning-${index}" aria-label="Select guitar tuning">
                    <option value="standard">Standard (EADGBE)</option>
                    <option value="dropD">Drop D (DADGBE)</option>
                    <option value="openG">Open G (DGDGBD)</option>
                    <option value="DADGAD">DADGAD</option>
                    <option value="openE">Open E (EBEG#BE)</option>
                </select>
            </div>
            <div id="fretflow-fretboard-${index}" class="fretboard"></div>
        `;
        fretboardsGrid.appendChild(container);
        
        const fretboard = container.querySelector(`#fretflow-fretboard-${index}`);
        createFretboard(fretboard, tuning);
        updateFretboardNotes(fretboard, UI.elements.keySelect.value, scale, tuning);
        
        // Add tuning change handler
        const tuningSelect = container.querySelector(`#fretflow-tuning-${index}`);
        tuningSelect.addEventListener('change', () => {
            const newTuning = TUNINGS[tuningSelect.value];
            createFretboard(fretboard, newTuning);
            updateFretboardNotes(fretboard, UI.elements.keySelect.value, scale, newTuning);
            
            // Reattach note click handlers
            const updatedNotes = fretboard.getElementsByClassName('note');
            Array.from(updatedNotes).forEach(note => {
                note.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const noteName = this.dataset.note;
                    if (noteName) {
                        const fretboardVolume = parseFloat(UI.elements.fretboardVolume.value) || 1.0;
                        playNote(noteName, fretboardVolume, 500);
                        log(`Playing note: ${noteName}`);
                    }
                }); 
            });
        });
    });
    
    log("FretFlow initialized");
}

async function playNote(noteName, volume, duration) {
    try {
        await AudioContextManager.ensureAudioContext();
        const noteLower = noteName.toLowerCase().replace('b', '#');
        const octave = 3; // Default octave
        const sampleKey = `${noteLower}${octave}`;
        const buffer = AudioContextManager.pianoSamples[sampleKey];
        
        if (!buffer) {
            console.error(`No sample for ${sampleKey}`);
            return;
        }
        
        const source = AudioContextManager.context.createBufferSource();
        source.buffer = buffer;
        const gainNode = AudioContextManager.context.createGain();
        gainNode.gain.value = volume;
        source.connect(gainNode);
        gainNode.connect(AudioContextManager.context.destination);
        source.start(0);
        
        if (duration) {
            setTimeout(() => {
                source.stop();
            }, duration);
        }
    } catch (error) {
        console.error('Error playing note:', error);
    }
}