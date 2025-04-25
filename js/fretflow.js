// js/fretflow.js
import { UI } from '../core/ui-manager.js';
import { TUNINGS } from '../utils/constants.js';
import { createFretboard, updateFretboardNotes } from './fretboard.js';
import { log, suggestScaleForQuality } from '../utils/helpers.js';

// Import at the end to avoid circular dependencies
let AudioContextManager;
setTimeout(() => {
    import('../core/audio-context.js').then(mod => {
        AudioContextManager = mod.AudioContextManager;
    });
}, 0);

export function initializeFretFlow() {
    const fretboardsGrid = UI.elements.fretboardsGrid;
    if (!fretboardsGrid) {
        log("No .fretboards-grid found!");
        return;
    }
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
        const mappedScale = suggestScaleForQuality(scale);
        updateFretboardNotes(fretboard, UI.elements.keySelect.value, mappedScale, tuning);

        // Add tuning change handler
        const tuningSelect = container.querySelector(`#fretflow-tuning-${index}`);
        tuningSelect.addEventListener('change', () => {
            const newTuning = TUNINGS[tuningSelect.value];
            createFretboard(fretboard, newTuning);
            const mappedScale = suggestScaleForQuality(scale);
            updateFretboardNotes(fretboard, UI.elements.keySelect.value, mappedScale, newTuning);
        });

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

    log("FretFlow initialized");
}

export function playNote(noteName, volume = 0.3, duration = 500, startTime = 0) {
    if (!AudioContextManager) {
        log("AudioContextManager not loaded yet.");
        return;
    }
    AudioContextManager.ensureAudioContext().then(() => {
        const noteMatch = noteName.match(/([A-Ga-g#b]+)(\d+)$/);
        let notePart = noteName;
        let octave = 3;
        if (noteMatch) {
            notePart = noteMatch[1];
            octave = parseInt(noteMatch[2], 10);
        }
        const sanitizedNote = notePart.replace('#', 's').toLowerCase();
        const sampleKey = `${sanitizedNote}${octave}`;
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
        source.start(startTime);
        setTimeout(() => source.stop(), duration);
    }).catch(error => {
        console.error('Error playing note:', error);
    });
}
