// js/fretboard.js
import { NOTES, SCALES, TUNINGS } from '../utils/constants.js';
import { log, standardizeNoteName } from '../utils/helpers.js';
import { UI } from '../core/ui-manager.js';
import { AudioContextManager } from '../core/audio-context.js';

// Remove any duplicate imports or declarations of standardizeNoteName

export function createFretboard(container, tuning = TUNINGS.standard) {
    // Clear existing fretboard
    container.innerHTML = '';
    
    // Create fretboard container
    const fretboard = document.createElement('div');
    fretboard.className = 'fretboard';
    
    // Create strings
    for (let i = 0; i < tuning.length; i++) {
        const string = document.createElement('div');
        string.className = 'string';
        string.dataset.stringNumber = i;
        string.dataset.openNote = tuning[i];
        
        // Create frets
        for (let j = 0; j <= 12; j++) {
            const fret = document.createElement('div');
            fret.className = 'fret';
            fret.dataset.fret = j;
            
            // Calculate note at this fret
            const openNote = tuning[i];
            const noteIndex = NOTES.indexOf(standardizeNoteName(openNote));
            const currentNoteIndex = (noteIndex + j) % 12;
            const currentNote = NOTES[currentNoteIndex];
            
            fret.dataset.note = currentNote;
            
            // Add fret marker for open string
            if (j === 0) {
                fret.classList.add('open');
                fret.textContent = openNote;
            }
            
            // Add fret markers
            if ((j === 3 || j === 5 || j === 7 || j === 9 || j === 12) && i === Math.floor(tuning.length / 2)) {
                const marker = document.createElement('div');
                marker.className = 'fret-marker';
                fret.appendChild(marker);
            }
            
            // Add click handler
            fret.addEventListener('click', () => {
                const audioContext = AudioContextManager.getAudioContext();
                if (!audioContext) return;
                
                const now = audioContext.currentTime;
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                
                // Calculate frequency
                const baseFreq = 440; // A4
                const a4Index = NOTES.indexOf('A');
                const noteIndex = NOTES.indexOf(currentNote);
                const octave = 4 - Math.floor((a4Index - noteIndex + 12) % 12 / 12) - (tuning.length - 1 - i) / 2;
                const semitones = (noteIndex - a4Index + 12) % 12;
                const freq = baseFreq * Math.pow(2, semitones / 12 + (octave - 4));
                
                osc.frequency.value = freq;
                osc.type = 'triangle';
                
                gain.gain.setValueAtTime(0.7, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
                
                osc.connect(gain);
                gain.connect(audioContext.destination);
                
                osc.start(now);
                osc.stop(now + 1.5);
                
                log(`Played note ${currentNote} (${freq.toFixed(2)} Hz) on string ${i + 1}, fret ${j}`);
            });
            
            string.appendChild(fret);
        }
        
        fretboard.appendChild(string);
    }
    
    container.appendChild(fretboard);
    
    return fretboard;
}

export function updateFretboardNotes(container, root, scaleType, tuning = TUNINGS.standard) {
    const scale = SCALES[scaleType];
    if (!scale) {
        console.error(`Scale ${scaleType} not found`);
        return;
    }
    
    // Get scale notes
    const rootIndex = NOTES.indexOf(standardizeNoteName(root));
    const scaleNotes = scale.intervals.map(interval => {
        const noteIndex = (rootIndex + interval) % 12;
        return NOTES[noteIndex];
    });
    
    // Update fretboard
    const fretboard = container.querySelector('.fretboard');
    if (!fretboard) return;
    
    const strings = fretboard.querySelectorAll('.string');
    strings.forEach(string => {
        const frets = string.querySelectorAll('.fret');
        frets.forEach(fret => {
            const note = fret.dataset.note;
            fret.classList.remove('root', 'in-scale');
            
            if (note === standardizeNoteName(root)) {
                fret.classList.add('root');
            } else if (scaleNotes.includes(note)) {
                fret.classList.add('in-scale');
            }
        });
    });
    
    log(`Updated fretboard to ${root} ${scaleType}`);
}

// DO NOT include this if it's already imported at the top
// import { standardizeNoteName } from '../utils/helpers.js';
