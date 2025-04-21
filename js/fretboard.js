// js/components/fretboard.js
import { NOTES, SCALES, TUNINGS } from '../utils/constants.js';
import { standardizeNoteName } from '../utils/helpers.js';
import { AudioContextManager } from '../core/audio-context.js';
import { UI } from '../core/ui-manager.js';

export function createFretboard(container, tuning) {
    container.innerHTML = '';

    // Create fret lines and fret numbers
    for (let i = 0; i <= 12; i++) {
        const fretLine = document.createElement('div');
        fretLine.className = 'fret-line';
        fretLine.style.left = `${(i / 12) * 100}%`;
        container.appendChild(fretLine);

        if (i > 0) { // Add fret numbers for frets 1-12
            const fretNumber = document.createElement('div');
            fretNumber.className = 'fret-number';
            fretNumber.textContent = i;
            fretNumber.style.left = `${((i - 0.5) / 12) * 100}%`;
            container.appendChild(fretNumber);
        }
    }

    // Create string lines
    for (let i = 0; i < 6; i++) {
        const stringLine = document.createElement('div');
        stringLine.className = 'string-line';
        stringLine.style.top = `${(i / 5) * 100}%`;
        container.appendChild(stringLine);
    }

    // Add fret markers (dots)
    const markerPositions = [3, 5, 7, 9, 12]; // Frets with markers
    markerPositions.forEach(position => {
        const marker = document.createElement('div');
        marker.className = 'fret-marker';
        marker.style.left = `${((position - 0.5) / 12) * 100}%`;

        if (position === 12) {
            // Double markers at the 12th fret
            const topMarker = marker.cloneNode(true);
            topMarker.style.top = '25%';
            container.appendChild(topMarker);

            const bottomMarker = marker.cloneNode(true);
            bottomMarker.style.top = '75%';
            container.appendChild(bottomMarker);
        } else {
            // Single marker
            marker.style.top = '50%';
            container.appendChild(marker);
        }
    });
}

export function updateFretboardNotes(container, rootNote, scale, tuning) {
    if (!(container instanceof HTMLElement)) {
        console.error('Invalid container element');
        return;
    }
    if (!NOTES.includes(standardizeNoteName(rootNote))) {
        console.error(`Invalid root note: ${rootNote}`);
        return;
    }
    if (!SCALES[scale]) {
        console.error(`Invalid scale: ${scale}`);
        return;
    }
    if (!Array.isArray(tuning) || tuning.length !== 6) {
        console.error('Invalid tuning');
        return;
    }
    
    container.querySelectorAll('.note').forEach(note => note.remove());
    
    if (container.id === 'chord-fretboard') {
        const measures = UI.elements.measures.children;
        if (measures.length > 0 && AppState.currentMeasure < measures.length) {
            const currentMeasureElement = measures[AppState.currentMeasure];
            const chordRoot = currentMeasureElement.querySelector('.chord-controls .root-note')?.value;
            const chordQuality = currentMeasureElement.querySelector('.chord-controls .chord-quality')?.value;
            const scaleRoot = currentMeasureElement.querySelector('.scale-controls .second-key')?.value;
            const scaleType = currentMeasureElement.querySelector('.scale-controls .scale-select')?.value;
            
            if (chordRoot && chordQuality && scaleRoot && scaleType) {
                let displayQuality = chordQuality;
                switch (chordQuality) {
                    case 'dom7': displayQuality = '7'; break;
                    case 'maj7': displayQuality = 'Maj7'; break;
                    case 'min7': displayQuality = 'm7'; break;
                    case 'min7b5': displayQuality = 'm7b5'; break;
                    case 'minor': displayQuality = 'm'; break;
                }
                
                let displayScale = scaleType.charAt(0).toUpperCase() + scaleType.slice(1);
                displayScale = displayScale.replace(/([A-Z])/g, ' $1').trim();
                UI.elements.scaleDisplay.textContent = `${scaleRoot} ${displayScale} over ${chordRoot} ${displayQuality}`;
            }
        }
    }
    
    const scaleIntervals = SCALES[scale];
    const standardizedRoot = standardizeNoteName(rootNote);
    const rootIndex = NOTES.indexOf(standardizedRoot);
    const scaleNotes = scaleIntervals.map(interval => {
        const noteIndex = (rootIndex + interval) % 12;
        return NOTES[noteIndex];
    });
    
    for (let string = 0; string < 6; string++) {
        const openNote = tuning[string];
        const openNoteIndex = NOTES.indexOf(openNote);
        
        for (let fret = 0; fret <= 12; fret++) {
            const noteIndex = (openNoteIndex + fret) % 12;
            const currentNote = NOTES[noteIndex];
            
            if (scaleNotes.includes(currentNote)) {
                const noteElement = document.createElement('div');
                noteElement.className = 'note';
                noteElement.textContent = currentNote;
                const fretOffset = fret === 0 ? 0 : ((fret - 0.5) / 12) * 100;
                noteElement.style.left = `${fretOffset}%`;
                noteElement.style.top = `${(string / 5) * 100}%`;
                
                const degree = scaleNotes.indexOf(currentNote);
                if (currentNote === standardizedRoot) {
                    noteElement.style.backgroundColor = '#BD2031';
                } else if ([2, 4, 6].includes(degree)) {
                    noteElement.style.backgroundColor = '#006400';
                } else {
                    noteElement.style.backgroundColor = '#4CAF50';
                }
                
                noteElement.addEventListener('click', async () => {
                    try {
                        await AudioContextManager.ensureAudioContext();
                        const noteName = currentNote.toLowerCase().replace('b', '#');
                        const octave = 3; // Default to octave 3 for fretboard clicks
                        const sampleKey = `${noteName}${octave}`;
                        const buffer = AudioContextManager.pianoSamples[sampleKey];
                        
                        if (!buffer) {
                            console.error(`No sample for ${sampleKey}`);
                            return;
                        }
                        
                        const source = AudioContextManager.context.createBufferSource();
                        source.buffer = buffer;
                        const gainNode = AudioContextManager.context.createGain();
                        const volume = parseFloat(UI.elements.chordFretboardVolume.value) || 0.3;
                        gainNode.gain.value = volume;
                        source.connect(gainNode);
                        gainNode.connect(AudioContextManager.context.destination);
                        source.start(0);
                        
                        noteElement.style.transform = 'translate(-50%, -50%) scale(1.2)';
                        setTimeout(() => {
                            noteElement.style.transform = 'translate(-50%, -50%) scale(1)';
                        }, 100);
                    } catch (error) {
                        console.error('Error playing note:', error);
                    }
                });
                
                noteElement.addEventListener('mouseenter', () => {
                    noteElement.style.transform = 'translate(-50%, -50%) scale(1.1)';
                });
                
                noteElement.addEventListener('mouseleave', () => {
                    noteElement.style.transform = 'translate(-50%, -50%) scale(1)';
                });
                
                container.appendChild(noteElement);
            }
        }
    }
}