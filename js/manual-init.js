// manual-init.js - Script to manually initialize the fretboard

// Wait for the page to fully load
window.addEventListener('load', function() {
    console.log("Manual initialization script running");
    
    // Wait a bit to ensure all other scripts have run
    setTimeout(function() {
        console.log("Running delayed initialization");
        
        // Initialize the fretboard
        const fretboard = document.getElementById('chord-fretboard');
        if (fretboard) {
            console.log("Found fretboard element, initializing");
            
            // Clear the fretboard
            fretboard.innerHTML = '';
            
            // Create fret lines and string lines
            for (let i = 0; i <= 12; i++) {
                const fretLine = document.createElement('div');
                fretLine.className = 'fret-line';
                fretLine.style.left = `${(i / 12) * 100}%`;
                fretboard.appendChild(fretLine);
            }
            
            for (let i = 0; i < 6; i++) {
                const stringLine = document.createElement('div');
                stringLine.className = 'string-line';
                stringLine.style.top = `${(i / 5) * 100}%`;
                fretboard.appendChild(stringLine);
            }
            
            // Get tuning
            const tuningSelect = document.getElementById('chord-tuning');
            const tuningValue = tuningSelect ? tuningSelect.value : 'standard';
            const tuning = window.TUNINGS[tuningValue] || window.TUNINGS.standard;
            
            // Add notes for C major scale
            const root = 'C';
            const scaleType = 'major';
            const scaleIntervals = window.SCALES[scaleType];
            const rootIndex = window.NOTES.indexOf(root);
            
            // Generate scale notes
            const scaleNotes = scaleIntervals.map(interval => {
                const noteIndex = (rootIndex + interval) % 12;
                return window.NOTES[noteIndex];
            });
            
            // Update scale display
            const scaleDisplay = document.getElementById('scale-display');
            if (scaleDisplay) {
                scaleDisplay.textContent = `${root} ${scaleType}: ${scaleNotes.join(' ')}`;
            }
            
            // Add notes to fretboard
            for (let string = 0; string < 6; string++) {
                const openNote = tuning[string];
                const openNoteIndex = window.NOTES.indexOf(openNote);
                
                for (let fret = 0; fret <= 12; fret++) {
                    const noteIndex = (openNoteIndex + fret) % 12;
                    const note = window.NOTES[noteIndex];
                    
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
                            if (window.AudioEngine && typeof window.AudioEngine.playNote === 'function') {
                                window.AudioEngine.playNote(`${note}${octave}`);
                            } else if (typeof window.playNote === 'function') {
                                window.playNote(`${note}${octave}`);
                            }
                        });
                        
                        fretboard.appendChild(noteElement);
                    }
                }
            }
            
            console.log(`Added ${fretboard.querySelectorAll('.note').length} notes to fretboard`);
        } else {
            console.error("Fretboard element not found");
        }
        
        // Initialize metronome if needed
        const startStopButton = document.getElementById('start-stop');
        if (startStopButton) {
            startStopButton.addEventListener('click', function() {
                if (window.AppState && !window.AppState.isPlaying) {
                    if (typeof window.startMetronome === 'function') {
                        window.startMetronome();
                    }
                } else {
                    if (typeof window.stopMetronome === 'function') {
                        window.stopMetronome();
                    }
                }
            });
        }
    }, 1000); // Wait 1 second to ensure everything else has loaded
});
