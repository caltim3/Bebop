// event-handlers.js - Extracted from index (19.2).html

// Create EventHandlers object to hold all event-related functions
const EventHandlers = {
    initializeFretboard: function(container) {
        if (!container) {
            console.error("Fretboard container not found");
            return;
        }
        
        console.log("Initializing fretboard in container:", container.id);
        container.innerHTML = '';

        // Set explicit dimensions for the fretboard container if not already set
        if (!container.style.height) {
            container.style.height = '200px';
        }
        if (!container.style.width) {
            container.style.width = '100%';
        }

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
        
        // Initialize with default scale
        const tuningSelect = document.getElementById('chord-tuning');
        const tuningValue = tuningSelect ? tuningSelect.value : 'standard';
        const tuning = TUNINGS[tuningValue] || TUNINGS.standard;
        
        // Directly add notes to the fretboard for C major scale
        const root = 'C';
        const scaleType = 'major';
        const scaleIntervals = SCALES[scaleType] || SCALES.major;
        const rootIndex = NOTES.indexOf(root);
        
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
            const openNote = tuning[string];
            const openNoteIndex = NOTES.indexOf(openNote);
            
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
                    
                    container.appendChild(noteElement);
                }
            }
        }
        
        console.log(`Added ${container.querySelectorAll('.note').length} notes to fretboard`);
    },

    // Add measure function
    addMeasure: function(chord = 'C', quality = 'major', scaleRoot = 'C', scaleType = 'major') {
        const measure = document.createElement('div');
        measure.className = 'measure';
        measure.draggable = true;
        const measureCount = document.getElementById('measures').children.length + 1;
        
        // Create scale options from all available scales
        const scaleOptionsHtml = Object.keys(SCALES).map(scale => {
            const selected = scale === scaleType ? 'selected' : '';
            return `<option value="${scale}" ${selected}>${scale}</option>`;
        }).join('');

        measure.innerHTML = `
            <span class="measure-number">${measureCount}</span>
            <div class="chord-controls">
                <select class="root-note">${createNoteOptions(chord)}</select>
                <select class="chord-quality">${createQualityOptions(quality)}</select>
            </div>
            <div class="scale-controls">
                <select class="second-key">${createNoteOptions(scaleRoot)}</select>
                <select class="scale-select">${scaleOptionsHtml}</select>
            </div>
        `;
        
        document.getElementById('measures').appendChild(measure);
        
        // Add event listeners
        measure.addEventListener('dragstart', this.dragStart);
        measure.addEventListener('dragover', this.dragOver);
        measure.addEventListener('drop', this.drop);
        measure.addEventListener('dragend', this.dragEnd);
        
        // Add change listeners for controls
        const controls = measure.querySelectorAll('select');
        controls.forEach(control => {
            control.addEventListener('change', () => this.updateChordProgression(measure));
        });
        
        this.updateMeasureNumbers();
        log(`Added measure ${measureCount}`);
    },

    removeMeasure: function() {
        const measures = document.getElementById('measures').children;
        if (measures.length > 0) {
            measures[measures.length - 1].remove();
            this.updateMeasureNumbers();
            log(`Removed last measure`);
        }
    },

    updateMeasureNumbers: function() {
        Array.from(document.getElementById('measures').children).forEach((measure, index) => {
            const number = measure.querySelector('.measure-number');
            if (number) number.textContent = index + 1;
        });
    },

    // Drag and Drop Handlers
    dragStart: function(e) {
        e.dataTransfer.setData('text/plain', Array.from(document.getElementById('measures').children).indexOf(e.target));
        setTimeout(() => e.target.classList.add('dragging'), 0);
    },

    dragOver: function(e) {
        e.preventDefault();
    },

    drop: function(e) {
        e.preventDefault();
        const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const targetIndex = Array.from(document.getElementById('measures').children).indexOf(e.target.closest('.measure'));
        if (draggedIndex === targetIndex || isNaN(draggedIndex) || isNaN(targetIndex)) return;
        const measures = Array.from(document.getElementById('measures').children);
        const draggedMeasure = measures[draggedIndex];
        document.getElementById('measures').insertBefore(draggedMeasure, targetIndex < draggedIndex ? measures[targetIndex] : measures[targetIndex + 1]);
        EventHandlers.updateMeasureNumbers();
        log(`Moved measure from index ${draggedIndex} to ${targetIndex}`);
    },

    dragEnd: function(e) {
        e.target.classList.remove('dragging');
    },

    updateChordProgression: function(measure) {
        const rootSelect = measure.querySelector('.root-note');
        const qualitySelect = measure.querySelector('.chord-quality');
        const scaleSelect = measure.querySelector('.scale-select');
        
        if (!rootSelect || !qualitySelect || !scaleSelect) return;
        
        const root = rootSelect.value;
        const quality = qualitySelect.value;
        
        // Get compatible scales
        const compatibleScales = getCompatibleScales(root, quality);
        
        // Update scale options
        scaleSelect.innerHTML = compatibleScales
            .map(scale => `<option value="${scale}">${scale}</option>`)
            .join('');
        
        // Set default scale
        scaleSelect.value = suggestScaleForQuality(quality);
        
        // Update fretboard if this is the current measure
        if (measure === document.getElementById('measures').children[AppState.currentMeasure]) {
            const tuning = TUNINGS[document.getElementById('chord-tuning').value];
            updateFretboardNotes(document.getElementById('chord-fretboard'), root, scaleSelect.value, tuning);
        }
    },

    // Add all other event handler functions from the original file
    setupEventListeners: function() {
        // Set up all event listeners for the application
        document.addEventListener('DOMContentLoaded', this.onDOMContentLoaded.bind(this));
        
        // Add metronome beat click handlers
        const beatsContainer = document.querySelector('.beats-container');
        if (beatsContainer) {
            beatsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('beat')) {
                    this.toggleBeatSound(e.target);
                }
            });
        }
        
        // Add tuning change handler
        const tuningSelect = document.getElementById('chord-tuning');
        if (tuningSelect) {
            tuningSelect.addEventListener('change', () => {
                const tuningValue = tuningSelect.value;
                const tuning = TUNINGS[tuningValue] || TUNINGS.standard;
                const fretboard = document.getElementById('chord-fretboard');
                
                if (fretboard) {
                    // Get current scale info
                    const scaleDisplay = document.getElementById('scale-display');
                    let root = 'C';
                    let scaleType = 'major';
                    
                    if (scaleDisplay) {
                        const scaleInfo = scaleDisplay.textContent.split(':')[0].trim();
                        const parts = scaleInfo.split(' ');
                        if (parts.length >= 2) {
                            root = parts[0];
                            scaleType = parts.slice(1).join(' ');
                        }
                    }
                    
                    updateFretboardNotes(fretboard, root, scaleType, tuning);
                }
            });
        }
        
        // Add dark mode toggle
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', this.toggleDarkMode);
        }
        
        // Add chord progression select handler
        const progressionSelect = document.getElementById('progression-select');
        if (progressionSelect) {
            progressionSelect.addEventListener('change', this.loadProgression);
        }
        
        // Add chord toggle button handler
        const chordsEnabled = document.getElementById('chordsEnabled');
        if (chordsEnabled) {
            chordsEnabled.addEventListener('click', () => {
                chordsEnabled.classList.toggle('active');
            });
        }
    },
    
    toggleBeatSound: function(beatElement) {
        const sounds = ['kick', 'snare', 'hihat', 'silent'];
        let currentSound = beatElement.dataset.sound || 'silent';
        
        // Find the index of the current sound
        let index = sounds.indexOf(currentSound);
        if (index === -1) index = 0;
        
        // Get the next sound in the cycle
        const nextIndex = (index + 1) % sounds.length;
        const nextSound = sounds[nextIndex];
        
        // Update the beat element
        beatElement.dataset.sound = nextSound;
        
        // Update visual indication
        beatElement.classList.remove('kick', 'snare', 'hihat', 'silent');
        beatElement.classList.add(nextSound);
        
        // Update volume based on sound type
        if (nextSound === 'kick' || nextSound === 'snare') {
            beatElement.dataset.baseVolume = '1.0';
        } else if (nextSound === 'hihat') {
            beatElement.dataset.baseVolume = '0.8';
        } else {
            beatElement.dataset.baseVolume = '0';
        }
        
        // Play the sound for feedback
        if (nextSound !== 'silent' && AudioEngine.context) {
            UIComponents.playDrumSample(nextSound);
        }
    },
    
    toggleDarkMode: function() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        
        // Update button text
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            darkModeToggle.textContent = isDarkMode ? 'Light Mode' : 'Dark Mode';
        }
        
        // Update app state
        if (AppState) {
            AppState.updateState({ darkMode: isDarkMode });
        }
    },
    
    loadProgression: function() {
        const progressionSelect = document.getElementById('progression-select');
        const keySelect = document.getElementById('keySelect');
        const measuresContainer = document.getElementById('measures');
        
        if (!progressionSelect || !keySelect || !measuresContainer) return;
        
        const progressionKey = progressionSelect.value;
        const progression = progressions[progressionKey];
        
        if (!progression) return;
        
        // Set the key
        const defaultKey = progression.defaultKey || 'C';
        keySelect.value = defaultKey;
        
        // Clear existing measures
        measuresContainer.innerHTML = '';
        
        // Add measures for the progression
        progression.progression.forEach(chord => {
            EventHandlers.addMeasure(chord, 'major');
        });
    },
    
    onDOMContentLoaded: function() {
        // Initialize the application when the DOM is fully loaded
        console.log('DOM fully loaded and parsed');
        
        // Initialize audio engine first
        AudioEngine.initialize().then(() => {
            console.log("Audio engine initialized, setting up UI");
            
            // Set up all event listeners first
            this.setupEventListeners();
            
            // Initialize metronome
            const beatsContainer = document.querySelector('.beats-container');
            if (beatsContainer) {
                // Clear existing beats
                beatsContainer.innerHTML = '';
                
                // Get time signature
                const timeSignature = document.getElementById('time-signature');
                const beats = timeSignature ? parseInt(timeSignature.value) : 4;
                
                // Create beat elements
                for (let i = 0; i < beats; i++) {
                    const beat = document.createElement('div');
                    beat.className = 'beat';
                    beat.dataset.beat = i;
                    beat.dataset.sound = i === 0 ? 'kick' : 'hihat';
                    beat.dataset.baseVolume = i === 0 ? '1.0' : '0.8';
                    beat.textContent = i + 1;
                    beatsContainer.appendChild(beat);
                }
            }
            
            // Add initial measure if none exist
            const measuresContainer = document.getElementById('measures');
            if (measuresContainer && measuresContainer.children.length === 0) {
                this.addMeasure();
            }
            
            // Initialize UI components last to ensure dependencies are ready
            const fretboardElement = document.getElementById('chord-fretboard');
            if (fretboardElement) {
                console.log("Initializing fretboard element");
                this.initializeFretboard(fretboardElement);
                
                // Explicitly update the fretboard with default scale
                const tuningSelect = document.getElementById('chord-tuning');
                const tuningValue = tuningSelect ? tuningSelect.value : 'standard';
                const tuning = TUNINGS[tuningValue] || TUNINGS.standard;
                
                if (typeof updateFretboardNotes === 'function') {
                    console.log("Updating fretboard notes with default scale");
                    updateFretboardNotes(fretboardElement, 'C', 'major', tuning);
                }
            } else {
                console.error("Fretboard element not found");
            }
            
            console.log("Application initialization complete");
        }).catch(error => {
            console.error("Error during initialization:", error);
        });
    }
};

// Make EventHandlers globally accessible
window.EventHandlers = EventHandlers;

// Expose individual functions for backward compatibility
window.initializeFretboard = EventHandlers.initializeFretboard.bind(EventHandlers);
window.addMeasure = EventHandlers.addMeasure.bind(EventHandlers);
window.removeMeasure = EventHandlers.removeMeasure.bind(EventHandlers);
window.updateMeasureNumbers = EventHandlers.updateMeasureNumbers.bind(EventHandlers);
window.dragStart = EventHandlers.dragStart.bind(EventHandlers);
window.dragOver = EventHandlers.dragOver.bind(EventHandlers);
window.drop = EventHandlers.drop.bind(EventHandlers);
window.dragEnd = EventHandlers.dragEnd.bind(EventHandlers);
window.updateChordProgression = EventHandlers.updateChordProgression.bind(EventHandlers);
