// utils.js - Utility functions for the guitar practice app

// Utility Functions
function updateFretboardNotes(fretboard, root, scaleType, tuning) {
    if (!fretboard) {
        console.error("Fretboard element not found");
        return;
    }
    
    console.log(`Updating fretboard with ${root} ${scaleType} scale using tuning:`, tuning);
    
    // Clear existing notes
    const existingNotes = fretboard.querySelectorAll('.note');
    existingNotes.forEach(note => note.remove());
    
    // Get scale intervals
    const scaleIntervals = SCALES[scaleType] || SCALES.major;
    
    // Get root index
    const rootIndex = NOTES.indexOf(root);
    if (rootIndex === -1) {
        console.error(`Invalid root note: ${root}`);
        return;
    }
    
    // Generate scale notes
    const scaleNotes = scaleIntervals.map(interval => {
        const noteIndex = (rootIndex + interval) % 12;
        return NOTES[noteIndex];
    });
    
    // Update scale display
    const scaleDisplay = document.getElementById('scale-display');
    if (scaleDisplay) {
        scaleDisplay.textContent = `${root} ${scaleType}: ${scaleNotes.join(' ')}`;
    }
    
    // Add notes to fretboard
    for (let string = 0; string < 6; string++) {
        // Make sure tuning is valid
        if (!tuning || !Array.isArray(tuning) || tuning.length < 6) {
            console.error("Invalid tuning:", tuning);
            tuning = TUNINGS.standard;
        }
        
        const openNote = tuning[string];
        const openNoteIndex = NOTES.indexOf(openNote);
        
        if (openNoteIndex === -1) {
            console.error(`Invalid open note: ${openNote} for string ${string}`);
            continue;
        }
        
        for (let fret = 0; fret <= 12; fret++) {
            const noteIndex = (openNoteIndex + fret) % 12;
            const note = NOTES[noteIndex];
            
            if (scaleNotes.includes(note)) {
                const noteElement = document.createElement('div');
                noteElement.className = 'note';
                noteElement.textContent = note;
                
                // Position the note
                const stringPosition = (string / 5) * 100;
                const fretPosition = (fret / 12) * 100;
                
                noteElement.style.top = `${stringPosition}%`;
                noteElement.style.left = `${fretPosition}%`;
                
                // Highlight root notes
                if (note === root) {
                    noteElement.classList.add('root');
                }
                
                // Add click event to play the note
                noteElement.addEventListener('click', () => {
                    const octave = 4 - Math.floor(string / 2);
                    if (typeof AudioEngine.playNote === 'function') {
                        AudioEngine.playNote(`${note}${octave}`);
                    } else if (typeof playNote === 'function') {
                        playNote(`${note}${octave}`);
                    }
                });
                
                fretboard.appendChild(noteElement);
            }
        }
    }
    
    console.log(`Added ${fretboard.querySelectorAll('.note').length} notes to fretboard`);
}

// Function to get compatible scales for a chord
function getCompatibleScales(root, quality) {
    // Default to all scales if no specific compatibility logic
    return Object.keys(SCALES);
}

// Make utility functions globally accessible
window.updateFretboardNotes = updateFretboardNotes;
window.getCompatibleScales = getCompatibleScales;
