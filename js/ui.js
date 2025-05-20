import { AppState, currentProgressionName, currentFunctionalProgression, updateLoadingStatus, setCurrentProgressionName, setCurrentFunctionalProgression } from './state.js';
import { NOTES, SCALES, TUNINGS, CHORD_INTERVALS, progressions, RHYTHMIC_STYLES } from './constants.js';
import { log, standardizeNoteName, parseChord, parseRomanNumeralToAbsoluteChord, suggestScaleForQuality } from './utils.js';
import { AudioContextManager, playNote } from './audio.js'; // playNote for fretboard clicks
import { toggleLoopingMode, resetLoop, highlightGuideTones, clearGuideToneHighlights, toggleGuideTones } from './ui_interactive.js'; // Placeholder for now, will create this file

// This will be a new file to break down ui.js further if it gets too big.
// For now, these functions will be part of ui.js and then we can split ui_interactive.js later if needed.
// Let's define those functions here first.

export function toggleMeasureLoopSelection(measureIndex) {
    if (!AppState.loopingActive) {
        // Call the global toggleLoopingMode which should also be in this file or imported
        _toggleLoopingMode(); // Use internal name if needed or ensure it's exported/imported correctly
        if (!AppState.loopingActive) return; // If still not active (e.g. user cancelled prompt)
    }

    const measureElement = UI.elements.measures.children[measureIndex];
    if (!measureElement) return;

    measureElement.classList.toggle('loop-selected');

    // Determine new loop range based on all selected measures
    const selectedIndices = Array.from(UI.elements.measures.children)
        .map((m, i) => m.classList.contains('loop-selected') ? i : -1)
        .filter(i => i !== -1).sort((a, b) => a - b);

    if (selectedIndices.length > 0) {
        AppState.loopStartMeasure = selectedIndices[0];
        AppState.loopEndMeasure = selectedIndices[selectedIndices.length - 1];
        // Ensure all measures within the new range are visually selected
        Array.from(UI.elements.measures.children).forEach((m, i) => {
            m.classList.toggle('loop-selected', i >= AppState.loopStartMeasure && i <= AppState.loopEndMeasure);
        });
    } else {
        // No measures are selected, clear the loop
        _resetLoop();
    }
    log(`Loop range updated: ${AppState.loopStartMeasure} to ${AppState.loopEndMeasure}`);
}

export function _resetLoop() { // Renamed to avoid conflict if imported separately
    AppState.loopStartMeasure = -1;
    AppState.loopEndMeasure = -1;
    Array.from(UI.elements.measures.children).forEach(m => m.classList.remove('loop-selected'));
    log("Loop selection cleared by resetLoop.");
}

export function _toggleLoopingMode() { // Renamed
    AppState.updateState({ loopingActive: !AppState.loopingActive });
    UI.elements.loopSelectedToggle.textContent = AppState.loopingActive ? "Looping ON" : "Looping Off";
    UI.elements.loopSelectedToggle.classList.toggle('active', AppState.loopingActive);

    if (!AppState.loopingActive) {
        _resetLoop();
    } else {
        // Optionally, prompt user or give feedback
        alert("Looping ON. Click measures to define loop range. Click again to turn off.");
    }
    log(`Looping mode: ${AppState.loopingActive ? 'ON' : 'OFF'}`);
}

export function _toggleGuideTones() { // Renamed
    AppState.updateState({ guideTonesActive: !AppState.guideTonesActive });
    UI.elements.guideTonesToggle.textContent = AppState.guideTonesActive ? "Guide Tones ON" : "Guide Tones Off";
    UI.elements.guideTonesToggle.classList.toggle('active', AppState.guideTonesActive);

    const currentMeasureEl = UI.elements.measures.children[AppState.currentMeasure];
    const activePart = currentMeasureEl?.querySelector('.measure-part.part-active') || currentMeasureEl?.querySelector('.measure-part');
    
    if (AppState.guideTonesActive) {
        _highlightGuideTones(activePart);
    } else {
        _clearGuideToneHighlights();
    }
    log(`Guide tones: ${AppState.guideTonesActive ? 'ON' : 'OFF'}`);
}

export function _highlightGuideTones(activeMeasurePartContext = null) { // Renamed
    _clearGuideToneHighlights();
    if (!AppState.guideTonesActive || !UI.elements.chordFretboard) return;

    let chordRootStr, chordQualityStr;

    if (activeMeasurePartContext) {
        chordRootStr = activeMeasurePartContext.querySelector('.root-note')?.value;
        chordQualityStr = activeMeasurePartContext.querySelector('.chord-quality')?.value;
    } else {
        // Fallback to the first measure if no specific context
        const firstMeasurePart = UI.elements.measures.children[0]?.querySelector('.measure-part');
        if (!firstMeasurePart) return;
        chordRootStr = firstMeasurePart.querySelector('.root-note')?.value;
        chordQualityStr = firstMeasurePart.querySelector('.chord-quality')?.value;
    }

    if (!chordRootStr || !chordQualityStr) return;

    const chordRootNote = standardizeNoteName(chordRootStr);
    const chordIntervals = CHORD_INTERVALS[chordQualityStr];
    if (!chordIntervals) {
        console.warn(`No intervals found for quality: ${chordQualityStr}`);
        return;
    }

    const rootNoteIndex = NOTES.indexOf(chordRootNote);
    if (rootNoteIndex === -1) {
        console.warn(`Invalid root note for guide tones: ${chordRootNote}`);
        return;
    }

    // Determine guide tones (typically 3rd and 7th, or 6th for 6th chords)
    const guideToneNotesSet = new Set();

    // 3rd (major or minor)
    if (chordIntervals.includes(3)) guideToneNotesSet.add(NOTES[(rootNoteIndex + 3) % 12]); // Minor 3rd
    else if (chordIntervals.includes(4)) guideToneNotesSet.add(NOTES[(rootNoteIndex + 4) % 12]); // Major 3rd

    // 7th (major, minor, or diminished for dim7) or 6th
    if (chordQualityStr.includes('6')) { // For maj6, min6
        if (chordIntervals.includes(9)) guideToneNotesSet.add(NOTES[(rootNoteIndex + 9) % 12]); // Major 6th
    } else if (chordIntervals.includes(11)) { // Major 7th
        guideToneNotesSet.add(NOTES[(rootNoteIndex + 11) % 12]);
    } else if (chordIntervals.includes(10)) { // Minor 7th (dominant 7th)
        guideToneNotesSet.add(NOTES[(rootNoteIndex + 10) % 12]);
    } else if (chordIntervals.includes(9) && chordQualityStr === 'dim7') { // Diminished 7th (which is a major 6th interval from root)
         guideToneNotesSet.add(NOTES[(rootNoteIndex + 9) % 12]);
    }
    // For triad chords (maj, min, dim, aug), we might not have a 7th/6th.
    // In that case, guideTonesSet will only contain the 3rd.

    UI.elements.chordFretboard.querySelectorAll('.note').forEach(noteElement => {
        const noteName = noteElement.textContent; // Assumes noteElement.textContent is just "C", "Db" etc.
        if (noteName === chordRootNote) {
            noteElement.classList.add('root-highlight-for-guides');
        } else if (guideToneNotesSet.has(noteName)) {
            noteElement.classList.add('guide-tone-highlight');
        }
    });
}

export function _clearGuideToneHighlights() { // Renamed
    if (!UI.elements.chordFretboard) return;
    UI.elements.chordFretboard.querySelectorAll('.note').forEach(n => {
        n.classList.remove('guide-tone-highlight', 'root-highlight-for-guides');
        // Reset transform if it was changed by highlighting
        n.style.transform = 'translate(-50%, -50%) scale(1)';
    });
}


export const UI = {
    elements: {},
    init() {
        this.elements = {
            chordFretboardSection: document.getElementById('chord-fretboard-section'),
            metronomeSection: document.getElementById('metronome-section'),
            chordProgressionSection: document.getElementById('chord-progression-section'),
            fretflowSection: document.getElementById('fretflow-section'),
            measures: document.getElementById('measures'),
            fretboardsGrid: document.querySelector('.fretboards-grid'),
            chordFretboard: document.getElementById('chord-fretboard'),
            chordFretboardVolume: document.getElementById('chord-fretboard-volume'),
            chordTuning: document.getElementById('chord-tuning'),
            scaleDisplay: document.getElementById('scale-display'),
            nextChordDisplay: document.getElementById('next-chord-display'),
            currentSongTitleFretboard: document.getElementById('current-song-title-fretboard'),
            currentSongDescriptionFretboard: document.getElementById('current-song-description-fretboard'),
            guideTonesToggle: document.getElementById('guide-tones-toggle'),
            timeSignature: document.getElementById('time-signature'),
            soundType: document.getElementById('sound-type'),
            drumSetToggleBtn: document.getElementById('drumSetToggleBtn'),
            tempo: document.getElementById('tempo'),
            tempoDisplay: document.getElementById('tempo-display'),
            tapTempo: document.getElementById('tap-tempo'),
            startStopButton: document.getElementById('start-stop'),
            metronomeVolumeControlsStack: document.getElementById('metronome-volume-controls-stack'),
            metronomeVolume: document.getElementById('metronome-volume'),
            kickVolumeContainer: document.getElementById('kick-volume-container'),
            kickVolume: document.getElementById('kick-volume'),
            snareVolumeContainer: document.getElementById('snare-volume-container'),
            snareVolume: document.getElementById('snare-volume'),
            hihatVolumeContainer: document.getElementById('hihat-volume-container'),
            hihatVolume: document.getElementById('hihat-volume'),
            accentIntensity: document.getElementById('accent-intensity'),
            beatsContainer: document.querySelector('.beats-container'),
            progressionSelect: document.getElementById('progression-select'),
            keySelect: document.getElementById('keySelect'),
            loopSelectedToggle: document.getElementById('loop-selected-toggle'),
            userProgressionSelect: document.getElementById('user-progression-select'),
            deleteUserSongButton: document.getElementById('delete-user-song-button'),
            addMeasureButton: document.getElementById('add-measure-button'), // Added for addMeasure event
            removeMeasureButton: document.getElementById('remove-measure-button'), // Added for removeMeasure event
            saveProgressionButton: document.getElementById('save-progression-button'),
            chordsEnabled: document.getElementById('chordsEnabled'),
            chordVolume: document.getElementById('chord-volume'),
            reverbDial: document.getElementById('reverb-dial'),
            reverbDialValue: document.getElementById('reverb-dial-value'),
            darkModeToggle: document.getElementById('dark-mode-toggle'),
            loadingIndicator: document.getElementById('loading-indicator'),
            rhythmicStyleContainer: document.getElementById('rhythmic-style-container'),
            rhythmicStyleSelect: document.getElementById('rhythmic-style-select'),
            swingToggle: document.getElementById('swing-toggle'),
            noteNamingConvention: document.getElementById('note-naming-convention'),
        };
        // Basic check for critical elements
        Object.entries(this.elements).forEach(([key, element]) => {
            // Allow some elements to be initially null if they are optional or for future use
            const optionalElements = ['currentSongTitle', 'currentSongDescription', 'swingToggle', 'noteNamingConvention', 'fretflowSection', 'fretboardsGrid']; // Add other optional elements
            if (!element && !optionalElements.includes(key)) {
                 console.error(`[UI Init - CRITICAL] Missing DOM element for key: '${key}'. Element is ${element}.`);
            }
        });
        log("UI elements cached.");
    }
};

export function createKeyOptions(selectedKey = 'C') {
    return NOTES.map(note =>
        `<option value="${note}"${note === standardizeNoteName(selectedKey) ? ' selected' : ''}>${note}</option>`
    ).join('');
}

export function createQualityOptions(selectedQuality = 'maj7') {
    const qualityDisplayOrder = [
        { value: 'maj7', label: 'maj7' }, { value: 'dom7', label: '7' }, { value: 'min7', label: 'm7' },
        { value: 'min7b5', label: 'm7b5' }, { value: 'dim7', label: 'dim7' }, { value: 'maj6', label: 'maj6' },
        { value: 'min6', label: 'm6' }, { value: 'dom7b9', label: '7b9' }, { value: 'dom7#9', label: '7#9' },
        { value: 'dom7b5', label: '7b5' }, { value: 'alt', label: 'alt' }, { value: 'dom7sus', label: '7sus' },
        { value: 'imaj7', label: 'm(maj7)' }, { value: 'maj', label: 'maj' }, { value: 'min', label: 'min' },
        { value: 'dim', label: 'dim' }, { value: 'aug', label: 'aug' }, { value: 'sus4', label: 'sus4' },
        { value: 'sus2', label: 'sus2' }
    ];
    return qualityDisplayOrder.map(q =>
        `<option value="${q.value}"${q.value === selectedQuality ? ' selected' : ''}>${q.label}</option>`
    ).join('');
}

export function createScaleOptions(selectedScale = 'major') {
    return Object.keys(SCALES).map(scaleName => {
        const displayName = scaleName.replace(/([A-Z]+)/g, ' $1').replace(/([A-Z][a-z])/g, ' $1')
                                   .split(' ').map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(' ').trim();
        return `<option value="${scaleName}"${scaleName === selectedScale ? ' selected' : ''}>${displayName}</option>`;
    }).join('');
}


export function createFretboard(fretboardContainer, tuningArray) {
    if (!(fretboardContainer instanceof HTMLElement)) {
        console.error("Invalid fretboard container provided to createFretboard:", fretboardContainer);
        return;
    }
    if (!Array.isArray(tuningArray) || tuningArray.length === 0) {
        console.error("Invalid or empty tuning array provided to createFretboard:", tuningArray);
        return;
    }

    fretboardContainer.innerHTML = ''; // Clear previous content
    const numFrets = 12;
    const numStrings = tuningArray.length;

    // Create Nut (0th fret) - thicker line
    const nutElement = document.createElement('div');
    nutElement.className = 'fret-line';
    nutElement.style.left = '0%'; // Position at the very beginning
    nutElement.style.width = '4px'; // Make it thicker
    nutElement.style.backgroundColor = '#4A3B31'; // Darker color for nut
    nutElement.style.zIndex = '1'; // Ensure it's above string lines if they overlap
    fretboardContainer.appendChild(nutElement);

    // Create Fret Lines and Numbers
    for (let i = 1; i <= numFrets; i++) {
        const fretLine = document.createElement('div');
        fretLine.className = 'fret-line';
        fretLine.style.left = `${(i / numFrets) * 100}%`;
        fretboardContainer.appendChild(fretLine);

        const fretNumber = document.createElement('div');
        fretNumber.className = 'fret-number';
        fretNumber.textContent = i;
        // Position fret number slightly to the left of the fret line, centered in the fret space
        fretNumber.style.left = `${((i - 0.5) / numFrets) * 100}%`;
        fretboardContainer.appendChild(fretNumber);
    }

    // Create String Lines
    for (let stringIndex = 0; stringIndex < numStrings; stringIndex++) {
        const stringLine = document.createElement('div');
        stringLine.className = 'string-line';
        // Distribute strings evenly across the height, with a small margin
        const stringYPosition = (((numStrings - 1 - stringIndex) / (numStrings - 1)) * 96) + 2; // 2% margin top/bottom
        stringLine.style.top = `${stringYPosition}%`;
        fretboardContainer.appendChild(stringLine);
    }
    
    // Fret Markers (Dots)
    const markerPositions = [3, 5, 7, 9, 12]; // Standard fret marker positions
    markerPositions.forEach(fretPos => {
        const marker = document.createElement('div');
        marker.className = 'fret-marker';
        // Position marker in the middle of the fret space
        marker.style.left = `${((fretPos - 0.5) / numFrets) * 100}%`;

        if (fretPos === 12) { // Double dot for 12th fret
            const topMarker = marker.cloneNode(true);
            topMarker.style.top = `33%`; // Position one dot higher
            fretboardContainer.appendChild(topMarker);
            marker.style.top = `67%`; // Position the other dot lower
        } else {
            marker.style.top = '50%'; // Center vertically
        }
        fretboardContainer.appendChild(marker);
    });
}

export function updateFretboardNotes(fretboardContainer, rootNote, scaleName, tuningArray, measureContext = null) {
    if (!(fretboardContainer instanceof HTMLElement)) { console.error('Invalid fretboardContainer for updateFretboardNotes'); return; }
    
    const standardizedRoot = standardizeNoteName(rootNote);
    if (!NOTES.includes(standardizedRoot)) { console.error(`Invalid scale root for fretboard: ${rootNote}`); return; }
    
    const scaleData = SCALES[scaleName];
    if (!scaleData) { console.error(`Invalid scale for fretboard: ${scaleName}`); return; }

    if (!Array.isArray(tuningArray) || tuningArray.length === 0) { console.error('Invalid tuning array for fretboard'); return; }

    // Clear previous guide tone highlights and notes
    if (fretboardContainer.id === 'chord-fretboard') { // Only clear for the main chord fretboard
        _clearGuideToneHighlights();
    }
    fretboardContainer.querySelectorAll('.note').forEach(el => el.remove());

    // Update scale display for the main chord fretboard
    if (fretboardContainer.id === 'chord-fretboard' && UI.elements.scaleDisplay) {
        let displayScaleTypeName = scaleName;
        // Get display name from scale options
        const tempScaleSelect = document.createElement('select');
        tempScaleSelect.innerHTML = createScaleOptions(scaleName); // Use utility to create options
        const selectedOptionEl = tempScaleSelect.querySelector(`option[value="${scaleName}"]`);
        displayScaleTypeName = selectedOptionEl ? selectedOptionEl.textContent : scaleName.replace(/([A-Z])/g, ' $1').split(' ').map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(' ').trim();

        let chordRootForDisplay = "", chordQualityTextForDisplay = "";
        let actualMeasurePartContext = measureContext;

        // If measureContext is the .measure div, find the active part within it
        if (measureContext && measureContext.classList.contains('measure')) {
            actualMeasurePartContext = measureContext.querySelector('.measure-part.part-active') || measureContext.querySelector('.measure-part');
        }
        
        if (actualMeasurePartContext) { // We have a specific measure part
            chordRootForDisplay = actualMeasurePartContext.querySelector('.chord-controls .root-note')?.value;
            const chordQualityRaw = actualMeasurePartContext.querySelector('.chord-controls .chord-quality')?.value;
            const qualityOptionEl = actualMeasurePartContext.querySelector(`.chord-controls .chord-quality option[value="${chordQualityRaw}"]`);
            chordQualityTextForDisplay = qualityOptionEl ? qualityOptionEl.textContent : (chordQualityRaw || "");
        } else { // Fallback to first measure if no specific context (e.g., initial load)
            const firstMeasurePart = UI.elements.measures.children[0]?.querySelector('.measure-part');
            if (firstMeasurePart) {
                chordRootForDisplay = firstMeasurePart.querySelector('.chord-controls .root-note')?.value;
                const chordQualityRaw = firstMeasurePart.querySelector('.chord-controls .chord-quality')?.value;
                const qualityOptionEl = firstMeasurePart.querySelector(`.chord-controls .chord-quality option[value="${chordQualityRaw}"]`);
                chordQualityTextForDisplay = qualityOptionEl ? qualityOptionEl.textContent : (chordQualityRaw || "");
            }
        }
        UI.elements.scaleDisplay.textContent = chordRootForDisplay && chordQualityTextForDisplay ?
            `${standardizedRoot} ${displayScaleTypeName} over ${chordRootForDisplay}${chordQualityTextForDisplay}` :
            `${standardizedRoot} ${displayScaleTypeName}`;
    }


    const rootIndex = NOTES.indexOf(standardizedRoot); 
    const notesInScale = scaleData.map(interval => NOTES[(rootIndex + interval) % 12]); 
    const numStrings = tuningArray.length;
    const numFrets = 12; // Standard number of frets to display

    for (let stringIndex = 0; stringIndex < numStrings; stringIndex++) {
        const openStringNote = standardizeNoteName(tuningArray[stringIndex]);
        const openStringNoteIndex = NOTES.indexOf(openStringNote);
        if (openStringNoteIndex === -1) { console.warn(`Invalid open string note: ${tuningArray[stringIndex]} at string index ${stringIndex}`); continue; }

        const FNO_Key = `string${numStrings - stringIndex}`; // For FRETBOARD_NOTES_OCTAVES (1-indexed from high E)

        for (let fret = 0; fret <= numFrets; fret++) {
            const currentNoteNameOnString = NOTES[(openStringNoteIndex + fret + 12) % 12];
            
            if (notesInScale.includes(currentNoteNameOnString)) {
                const noteElement = document.createElement('div');
                noteElement.className = 'note';
                noteElement.textContent = currentNoteNameOnString; // Display standard note name
                
                // Position note: 0th fret (open string) slightly before the nut visually
                noteElement.style.left = (fret === 0) ? `-2%` : `${((fret - 0.5) / numFrets) * 100}%`;
                
                const stringYPosition = (((numStrings - 1 - stringIndex) / (numStrings - 1)) * 96) + 2;
                noteElement.style.top = `${stringYPosition}%`;

                // Color coding (example: root is red, others green shades)
                noteElement.style.backgroundColor = (currentNoteNameOnString === standardizedRoot) ? '#BD2031' : 
                    (notesInScale.indexOf(currentNoteNameOnString) % 2 === 0) ? '#006400' : '#4CAF50';
                
                // Determine note with octave for playback
                let noteOctaveForPlayback = `${currentNoteNameOnString}3`; // Default fallback
                const isStandardGuitarTuning = tuningArray.length === 6 && tuningArray.join('') === "EADGBE";

                if (isStandardGuitarTuning && FRETBOARD_NOTES_OCTAVES[FNO_Key] && fret < FRETBOARD_NOTES_OCTAVES[FNO_Key].length) {
                    noteOctaveForPlayback = FRETBOARD_NOTES_OCTAVES[FNO_Key][fret];
                } else {
                    // Approximation for non-standard tunings or if FRETBOARD_NOTES_OCTAVES is incomplete
                    let approxOctave = PLAYBACK_OCTAVES[0]; // Start with lowest playback octave
                    if (stringIndex >= numStrings * 2/3 ) approxOctave = PLAYBACK_OCTAVES[PLAYBACK_OCTAVES.length -1]; // Higher strings
                    else if (stringIndex >= numStrings / 3) approxOctave = PLAYBACK_OCTAVES[Math.floor(PLAYBACK_OCTAVES.length / 2)]; // Middle strings
                    // Adjust octave based on fret position
                    if (fret > 7 && approxOctave < OCTAVES_FOR_SAMPLES[OCTAVES_FOR_SAMPLES.length - 1]) { // Higher up the neck
                        approxOctave = Math.min(OCTAVES_FOR_SAMPLES[OCTAVES_FOR_SAMPLES.length - 1], approxOctave + 1);
                    }
                    approxOctave = Math.max(OCTAVES_FOR_SAMPLES[0], Math.min(OCTAVES_FOR_SAMPLES[OCTAVES_FOR_SAMPLES.length - 1], approxOctave));
                    noteOctaveForPlayback = `${currentNoteNameOnString}${approxOctave}`;
                }
                noteElement.dataset.note = noteOctaveForPlayback; // Store note with octave for playback

                noteElement.addEventListener('click', async (event) => {
                    event.stopPropagation(); // Prevent measure click if inside a measure
                    await AudioContextManager.ensureAudioContext();
                    const volume = fretboardContainer.id.startsWith('fretflow-fretboard') ? 0.4 : parseFloat(UI.elements.chordFretboardVolume.value);
                    playNote(noteElement.dataset.note, volume, 500); // Play the stored note with octave
                    
                    // Visual feedback on click
                    noteElement.style.transform = 'translate(-50%, -50%) scale(1.3)';
                    setTimeout(() => {
                        const isHighlighted = noteElement.classList.contains('guide-tone-highlight') || noteElement.classList.contains('root-highlight-for-guides');
                        noteElement.style.transform = `translate(-50%, -50%) scale(${isHighlighted ? 0.95 : 1})`;
                    }, 150);
                });
                fretboardContainer.appendChild(noteElement);
            }
        }
    }
    // Re-apply guide tones if active for the main chord fretboard
    if (AppState.guideTonesActive && fretboardContainer.id === 'chord-fretboard') {
        _highlightGuideTones(measureContext);
    }
}


export function createBeats() {
    const beatsContainer = UI.elements.beatsContainer;
    if (!beatsContainer) { console.error("Beats container not found"); return; }
    beatsContainer.innerHTML = '';

    const timeSignatureNum = parseInt(UI.elements.timeSignature.value);
    const selectedSoundType = UI.elements.soundType.value;
    const isDrumStyleActive = selectedSoundType === 'drums' && timeSignatureNum === 4; // Rhythmic styles only for 4/4 drums
    
    // Determine which style definition to use
    const currentStyleKey = isDrumStyleActive ? AppState.currentRhythmicStyle : "quarterNotes"; // Fallback for non-drum or non-4/4
    const styleDefinition = RHYTHMIC_STYLES[currentStyleKey] || RHYTHMIC_STYLES.quarterNotes; // Ensure fallback

    let beatsToDisplay = timeSignatureNum; // Default for 2/4, 3/4, 7/8 etc.
    let subdivisionFactor = 1; // How many UI beats represent one main beat (e.g., 2 for 8th notes in 4/4)

    if (timeSignatureNum === 4) {
        beatsToDisplay = 8; // Always show 8 subdivisions (eighth notes) for 4/4 time
        subdivisionFactor = 2;
    } else if (timeSignatureNum === 6 || timeSignatureNum === 12) { // Compound meters (e.g., 6/8, 12/8)
        beatsToDisplay = timeSignatureNum; // Display each eighth note pulse
        subdivisionFactor = 3; // Main beat is typically 3 eighth notes (dotted quarter)
    } // Other time signatures will use beatsToDisplay = timeSignatureNum and subdivisionFactor = 1

    for (let i = 0; i < beatsToDisplay; i++) {
        const beatDiv = document.createElement('div');
        beatDiv.className = 'beat';
        beatDiv.dataset.beat = i; // 0-indexed internal beat counter

        // Labeling the beats
        let beatLabel = `${Math.floor(i / subdivisionFactor) + 1}`; // Main beat number
        if (subdivisionFactor === 2 && (i % subdivisionFactor !== 0)) { // For 4/4 eighth notes
            beatLabel = (i % 2 === 1) ? "&" : `${Math.floor(i / 2) + 1}`;
        } else if (subdivisionFactor > 1 && (i % subdivisionFactor !== 0)) {
            // For compound meters or other subdivisions, could add more specific labels
            // For now, just show the main beat number or a generic subdivision marker if needed
            // beatLabel = "."; // Example for a generic subdivision
        }
        beatDiv.innerHTML = beatLabel;

        // Determine sound, volume, and color based on style or defaults
        let sound = 'silent';
        let volume = 0.1; // Default silent volume
        let color = '#666666'; // Default silent color

        if (isDrumStyleActive) { // Apply drum style pattern (for 4/4 drums)
            const patternIndexInStyle = i % styleDefinition.beatsPerPattern; // Loop through pattern if beatsToDisplay > pattern length
            const beatData = styleDefinition.pattern[patternIndexInStyle];

            if (beatData) { // If the style defines this beat
                sound = beatData.sound;
                volume = beatData.volume;
                color = beatData.color;
            } else { // If style has a null entry for this beat (implies silence or rest)
                sound = 'silent';
                volume = 0.0;
                color = '#444444'; // Slightly different silent color for unstyled beats
            }
        } else { // Non-drum sound type (click, woodblock) OR not 4/4 time for drums
            if (i % subdivisionFactor === 0) { // This is a main beat
                sound = selectedSoundType; // 'click' or 'woodblock'
                volume = (i === 0) ? 1.0 : 0.7; // Beat 1 is loudest, others softer
                color = (i === 0) ? '#1F618D' : '#5DADE2'; // Colors for main beats
            } else { // This is a subdivision (e.g., the "&" in 4/4 for click/woodblock)
                sound = 'silent'; // Explicitly make subdivisions silent for click/woodblock
                volume = 0.0;     // Ensure it's truly silent
                color = '#888888'; // A slightly different color for silent subdivisions
            }
        }

        beatDiv.dataset.sound = sound;
        beatDiv.dataset.baseVolume = volume; // Store the style's/default's original volume
        beatDiv.dataset.volume = volume;     // Current volume (can be changed by user click)
        beatDiv.style.backgroundColor = color;
        
        beatDiv.addEventListener('click', () => {
            // Pass whether it's a subdivision and if a drum style is active for toggle logic
            toggleBeatAccent(beatDiv, selectedSoundType, subdivisionFactor > 1 && (i % subdivisionFactor !== 0), isDrumStyleActive);
        });
        beatsContainer.appendChild(beatDiv);
    }
}
        
export function toggleBeatAccent(beatElement, currentSoundType, isSubdivision, isDrumStyleActive) {
    const currentVolume = parseFloat(beatElement.dataset.volume);
    let newVolume, newSound, newColor;

    if (isDrumStyleActive) { 
        // Cycle through a predefined set of drum sounds/volumes for user interaction
        const drumCycle = [
            { sound: 'silent',      volume: 0,   color: '#444' }, // Off
            { sound: 'hihat',       volume: 0.3, color: '#9E9E9E' }, // Light Hi-hat
            { sound: 'snare',       volume: 0.8, color: '#D9534F' }, // Snare
            { sound: 'kick',        volume: 1.0, color: '#1F618D' }, // Kick
            { sound: 'snare,hihat', volume: 0.8, color: '#D35400' }, // Snare + Hi-hat
            { sound: 'kick,hihat',  volume: 1.0, color: '#27AE60' }  // Kick + Hi-hat
        ];
        
        // Find current state in cycle (approximate match for volume)
        let currentIndex = drumCycle.findIndex(s => s.sound === beatElement.dataset.sound && Math.abs(s.volume - currentVolume) < 0.01);
        if (currentIndex === -1) { // If not exact match, try to find a reasonable starting point
            currentIndex = drumCycle.findIndex(s => s.sound.startsWith(beatElement.dataset.sound.split(',')[0])) || 0;
        }

        let nextIndex = (currentIndex + 1) % drumCycle.length;
        
        // Prevent assigning strong kick/snare to pure subdivisions if it wasn't already one
        // This helps maintain rhythmic feel when user clicks on an "&" beat
        if (isSubdivision && (drumCycle[nextIndex].sound.includes('kick') || drumCycle[nextIndex].sound.includes('snare,'))) {
             // If the subdivision wasn't originally a kick/snare, cycle it to hi-hat or silent
             if (!beatElement.dataset.sound.includes('kick') && !beatElement.dataset.sound.includes('snare')) {
                nextIndex = drumCycle.findIndex(s => s.sound === 'hihat') ?? 1; // Default to hi-hat if not found
             }
        }

        newSound = drumCycle[nextIndex].sound; 
        newVolume = drumCycle[nextIndex].volume; 
        newColor = drumCycle[nextIndex].color;

    } else { // For non-drum styles (click, woodblock) or non-4/4 time
        const simpleCycle = [
            { volume: 0,   sound: 'silent',         color: '#666' },    // Off
            { volume: 0.3, sound: currentSoundType, color: '#9E9E9E' }, // Soft
            { volume: 1.0, sound: currentSoundType, color: '#1F618D' }  // Loud
        ];

        // Find current state in cycle by volume (sound type should be consistent or silent)
        let currentIndex = simpleCycle.findIndex(s => Math.abs(s.volume - currentVolume) < 0.01 && (s.sound === beatElement.dataset.sound || (s.sound === 'silent' && currentVolume === 0)));
        if (currentIndex === -1) { // Fallback if no exact match
            currentIndex = (currentVolume > 0.5) ? 2 : (currentVolume > 0) ? 1 : 0;
        }
        
        const nextState = simpleCycle[(currentIndex + 1) % simpleCycle.length];
        newVolume = nextState.volume;
        newSound = nextState.sound;
        newColor = nextState.color;
    }

    // Update the beat element's data and appearance
    beatElement.dataset.volume = newVolume;
    beatElement.dataset.sound = newSound;
    beatElement.style.backgroundColor = newColor;
}


export function onMetronomeInstrumentChange(selectedInstrument) {
    const showDrumsUI = selectedInstrument === "drums";
    // Toggle visibility of drum-specific volume controls
    if (UI.elements.drumSetToggleBtn) UI.elements.drumSetToggleBtn.style.display = showDrumsUI ? "inline-block" : "none";
    if (UI.elements.kickVolumeContainer) UI.elements.kickVolumeContainer.style.display = showDrumsUI ? "flex" : "none";
    if (UI.elements.snareVolumeContainer) UI.elements.snareVolumeContainer.style.display = showDrumsUI ? "flex" : "none";
    if (UI.elements.hihatVolumeContainer) UI.elements.hihatVolumeContainer.style.display = showDrumsUI ? "flex" : "none";
    
    // Update rhythmic style UI visibility based on new instrument and current time signature
    updateRhythmicStyleUIVisibility();
    
    // Recreate beats based on the new sound type and potentially new rhythmic style
    createBeats(); 
}

export function updateRhythmicStyleUIVisibility() {
    const soundType = UI.elements.soundType.value;
    const timeSig = UI.elements.timeSignature.value;
    const styleContainer = UI.elements.rhythmicStyleContainer;

    if (styleContainer) { // Rhythmic styles are only for 4/4 time with "drums" selected
        if (soundType === 'drums' && timeSig === '4') {
            styleContainer.style.display = 'inline-flex'; // Or 'flex' or 'block' depending on desired layout
        } else {
            styleContainer.style.display = 'none';
        }
    }
}

export function updateNextChordDisplay(currentMeasureIndex = AppState.currentMeasure) {
    const nextChordDisplayElement = UI.elements.nextChordDisplay;
    if (!nextChordDisplayElement) return;

    const measures = UI.elements.measures.children;
    if (measures.length === 0) {
        nextChordDisplayElement.textContent = ""; return;
    }

    let upcomingChords = [];
    let displayCount = 0;
    let tempMeasureIdx = currentMeasureIndex;
    let tempPartIdx = 0; // 0 for first part, 1 for second part of a split measure

    const displayedBeats = UI.elements.beatsContainer.querySelectorAll('.beat'); // To check if we are in 8th note subdivision mode for 4/4

    // Determine starting point for "next" chord based on current beat and measure structure
    const currentMeasureEl = measures[currentMeasureIndex];
    if (currentMeasureEl && currentMeasureEl.dataset.isSplit === 'true' && parseInt(UI.elements.timeSignature.value) === 4 && displayedBeats.length === 8) {
        // In a split 4/4 measure with 8th note display, if current beat is in the first half, the "next" chord is the second part of THIS measure.
        // If current beat is in the second half, the "next" chord is the first part of the NEXT measure.
        if (AppState.currentBeat < 4) { // First half of the split measure (beats 0-3 of 8)
            tempPartIdx = 1; // Next chord is the second part of the current measure
        } else { // Second half of the split measure (beats 4-7 of 8)
            tempMeasureIdx = (currentMeasureIndex + 1); // Move to next measure index
            tempPartIdx = 0; // Look for first part of that next measure
        }
    } else { // Not a split 4/4 measure, or not 8th note display; "next" chord is in the next measure
        tempMeasureIdx = (currentMeasureIndex + 1);
        tempPartIdx = 0;
    }


    // Loop to gather up to 4 upcoming chords
    while (displayCount < 4) {
        // Handle looping for progression
        if (AppState.loopingActive && AppState.loopStartMeasure !== -1 && AppState.loopEndMeasure !== -1) {
            if (tempMeasureIdx > AppState.loopEndMeasure || tempMeasureIdx < AppState.loopStartMeasure) {
                tempMeasureIdx = AppState.loopStartMeasure; // Wrap around to loop start
                tempPartIdx = 0; // Start from first part of loop start measure
            }
        } else { // No loop active, wrap around progression if at the end
            if (tempMeasureIdx >= measures.length) {
                if (measures.length === 0) break; // No measures to display
                tempMeasureIdx = 0; // Wrap to start of progression
                tempPartIdx = 0;
            }
        }
        
        if (tempMeasureIdx >= measures.length) break; // Should not happen if measures.length > 0 due to wrap

        const measureElement = measures[tempMeasureIdx];
        if (!measureElement) break; // Should not happen

        const measureParts = measureElement.querySelectorAll('.measure-part');
        const isSplit = measureElement.dataset.isSplit === 'true' && parseInt(UI.elements.timeSignature.value) === 4;

        for (let pIdx = tempPartIdx; pIdx < (isSplit ? 2 : 1) && displayCount < 4; pIdx++) {
            const partElement = measureParts[pIdx];
            if (!partElement) continue;

            const root = partElement.querySelector('.root-note')?.value;
            const qualityRaw = partElement.querySelector('.chord-quality')?.value;

            if (root && qualityRaw) {
                const qualityOption = partElement.querySelector(`.chord-quality option[value="${qualityRaw}"]`);
                const qualityDisplay = qualityOption ? qualityOption.textContent : qualityRaw;
                upcomingChords.push(`${root}${qualityDisplay}`);
                displayCount++;
            }
        }
        
        tempMeasureIdx++; // Move to the next measure index for the next iteration
        tempPartIdx = 0;  // Reset part index to 0 for the start of the next measure

        // Break conditions to prevent infinite loops or excessive display
        if (displayCount >= 4) break;
        // If we've cycled through all unique chords in a short non-looping progression
        if (measures.length > 0 && tempMeasureIdx === currentMeasureIndex && !AppState.loopingActive && measures.length > 1 && upcomingChords.length >= measures.length * (isSplit ? 2:1) ) break; 
        // If looping a single measure and we've displayed its parts
        if (AppState.loopingActive && tempMeasureIdx > AppState.loopEndMeasure && AppState.loopStartMeasure === AppState.loopEndMeasure && upcomingChords.length > 0) break;
    }

    nextChordDisplayElement.textContent = upcomingChords.length > 0 ? `Next: ${upcomingChords.join(', ')}` : "";
}


export function loadProgression(progressionName, overrideKey = null, isUserSong = false) {
    // Reset any previous playback state related to voicings
    // previousPlayedVoicingNotesWithOctaves = null; // Moved to state.js
    setCurrentFunctionalProgression([]); // from state.js
    
    const songTitleElem = UI.elements.currentSongTitleFretboard;
    const songDescElem = UI.elements.currentSongDescriptionFretboard;

    let progressionData;
    if (isUserSong) {
        const userSongs = JSON.parse(localStorage.getItem('userBebopProgressions') || '{}');
        progressionData = userSongs[progressionName];
    } else {
        progressionData = progressions[progressionName];
    }

    if (!progressionName || !progressionData) {
        setCurrentProgressionName("");
        UI.elements.measures.innerHTML = '<p>Select a progression.</p>';
        if (songTitleElem) songTitleElem.textContent = "";
        if (songDescElem) songDescElem.textContent = "";
        if (UI.elements.scaleDisplay) UI.elements.scaleDisplay.textContent = "Select a progression and key.";
        updateNextChordDisplay();
        _resetLoop(); // Use the local resetLoop
        return;
    }

    setCurrentProgressionName(progressionName);
    setCurrentFunctionalProgression(progressionData.progression); // Store the raw progression strings
    
    // Determine the target key for this load operation
    const targetGlobalKey = overrideKey || progressionData.defaultKey || "C";
    // This is the key the progression was defined or saved in.
    const originalSongDefaultKey = progressionData.defaultKey || "C"; 

    const originalSongDefaultKeyRoot = standardizeNoteName(originalSongDefaultKey.replace('m', ''));
    const targetGlobalKeyRoot = standardizeNoteName(targetGlobalKey.replace('m', ''));

    // Update song info display
    if (songTitleElem) songTitleElem.textContent = progressionData.displayName || progressionName.replace(/_/g, ' ');
    if (songDescElem) songDescElem.textContent = progressionData.description || "";
    if (UI.elements.keySelect) UI.elements.keySelect.value = targetGlobalKey; // Set global key select

    UI.elements.measures.innerHTML = ''; // Clear existing measures
    _resetLoop(); // Clear any active loop

    // Process each chord string from the progression definition
    currentFunctionalProgression.forEach((rawChordStringFromDefinition, index) => {
        let partsToProcessBasedOnOriginalDefinition = [];
        let isSplitInOriginalDefinition = false;

        // For user songs, we rely on the 'parts' and 'splitStatus' arrays if they exist
        if (isUserSong && progressionData.parts && progressionData.parts[index] && progressionData.splitStatus) {
            isSplitInOriginalDefinition = progressionData.splitStatus[index];
            progressionData.parts[index].forEach(userPartData => {
                // User parts store absolute chords and original scale info relative to their 'defaultKey'
                const parsedOriginal = parseRomanNumeralToAbsoluteChord(userPartData.originalRoman || `${userPartData.root}${userPartData.quality}`, originalSongDefaultKey);
                partsToProcessBasedOnOriginalDefinition.push({
                    parsedInOriginalContext: parsedOriginal,
                    originalScaleRoot: userPartData.scaleRoot,
                    originalScaleType: userPartData.scaleType
                });
            });
        } else { // For predefined progressions, parse the raw string
            const potentialSplit = rawChordStringFromDefinition.split('/');
            // Check if it's a valid split: "Chord1 / Chord2" and not just "C/G" (slash chord)
            // A simple check: if parsing the whole thing fails, but parsing parts succeeds, it's likely a split measure.
            if (potentialSplit.length === 2 &&
                !parseChord(rawChordStringFromDefinition) && // Whole string is not a single chord
                parseChord(potentialSplit[0].trim()) && parseChord(potentialSplit[1].trim())) {
                isSplitInOriginalDefinition = true;
                partsToProcessBasedOnOriginalDefinition.push({
                    parsedInOriginalContext: parseRomanNumeralToAbsoluteChord(potentialSplit[0].trim(), originalSongDefaultKey)
                });
                partsToProcessBasedOnOriginalDefinition.push({
                    parsedInOriginalContext: parseRomanNumeralToAbsoluteChord(potentialSplit[1].trim(), originalSongDefaultKey)
                });
            } else { // Not a split measure, or it's a slash chord like C/G
                isSplitInOriginalDefinition = false;
                partsToProcessBasedOnOriginalDefinition.push({
                    parsedInOriginalContext: parseRomanNumeralToAbsoluteChord(rawChordStringFromDefinition, originalSongDefaultKey)
                });
            }
        }

        // Transpose parts and determine final scale info
        let finalPartsDataForMeasure = [];
        partsToProcessBasedOnOriginalDefinition.forEach(originalPart => {
            // Transpose the chord from its original key context to the target global key
            const transposedChord = parseChord(originalPart.parsedInOriginalContext.originalString); // Re-parse to ensure it's absolute before transposing
            if(!transposedChord) {
                console.error("Failed to parse original part for transposition:", originalPart.parsedInOriginalContext);
                return; // skip this part
            }
            const finalTransposedChord = global.transposeChordData(transposedChord, originalSongDefaultKeyRoot, targetGlobalKeyRoot); // Assuming transposeChordData is global or imported
            
            let finalScaleRoot, finalScaleType;
            if (originalPart.originalScaleRoot && originalPart.originalScaleType) {
                // If scale info was explicitly defined (e.g., in user song), transpose that too
                const originalScaleRootData = { root: originalPart.originalScaleRoot, quality: 'maj' }; // Treat scale root as major for transposition
                const transposedScaleRootInfo = global.transposeChordData(originalScaleRootData, originalSongDefaultKeyRoot, targetGlobalKeyRoot);
                finalScaleRoot = transposedScaleRootInfo.root;
                finalScaleType = originalPart.originalScaleType;
            } else {
                // Otherwise, suggest scale based on the transposed chord
                finalScaleRoot = finalTransposedChord.root;
                finalScaleType = suggestScaleForQuality(finalTransposedChord.quality);
            }

            finalPartsDataForMeasure.push({
                root: finalTransposedChord.root,
                quality: finalTransposedChord.quality,
                scaleRoot: finalScaleRoot,
                scaleType: finalScaleType
            });
        });

        // Ensure split measures have two parts, even if they were identical initially
        if (isSplitInOriginalDefinition && finalPartsDataForMeasure.length === 1 && finalPartsDataForMeasure[0]) {
            finalPartsDataForMeasure.push({ ...finalPartsDataForMeasure[0] });
        }
        
        // Add the measure to the UI
        if (finalPartsDataForMeasure.length > 0 && finalPartsDataForMeasure[0]) {
            addMeasure(
                finalPartsDataForMeasure[0].root,
                finalPartsDataForMeasure[0].quality,
                finalPartsDataForMeasure[0].scaleRoot,
                finalPartsDataForMeasure[0].scaleType,
                isSplitInOriginalDefinition,
                finalPartsDataForMeasure.length > 1 ? finalPartsDataForMeasure[1] : null
            );
        } else if (finalPartsDataForMeasure.length === 0 && isSplitInOriginalDefinition) {
            // Handle case where a split measure had no valid parts after processing
             addMeasure('C', 'maj7', 'C', 'major', true, {root: 'G', quality: 'dom7', scaleRoot: 'G', scaleType: 'mixolydian'}); // Default split
        } else {
            // Default measure if everything failed
            addMeasure('C', 'maj7', 'C', 'major', false, null);
        }
    });

    updateMeasureNumbers();
    addFirstChordListener(); // Update main fretboard for the first chord
    updateNextChordDisplay(); // Update the "Next: ..." display
    log(`Loaded ${isUserSong ? 'user song' : 'standard progression'}: ${progressionName} in key ${targetGlobalKey}`);
}

export function updateProgressionKey(newKey) {
    // previousPlayedVoicingNotesWithOctaves = null; // Moved to state.js

    if (!currentFunctionalProgression || currentFunctionalProgression.length === 0 || UI.elements.measures.children.length === 0) {
        // No progression loaded, just update the main fretboard to the new key with a default scale
        const targetGlobalKeyRoot_noProg = standardizeNoteName(newKey.replace('m', ''));
        const initialTuning = TUNINGS[UI.elements.chordTuning.value];
        let defaultScaleType = 'major';
        
        // Try to get scale type from the (potentially empty) first measure's UI if it exists
        const firstMeasurePartForDefault = UI.elements.measures.children[0]?.querySelector('.measure-part');
        if (firstMeasurePartForDefault) {
            defaultScaleType = firstMeasurePartForDefault.querySelector('.scale-select')?.value || 'major';
        }
        
        updateFretboardNotes(UI.elements.chordFretboard, targetGlobalKeyRoot_noProg, defaultScaleType, initialTuning, firstMeasurePartForDefault);
        if (UI.elements.scaleDisplay) {
            const scaleTypeName = firstMeasurePartForDefault ? (firstMeasurePartForDefault.querySelector('.scale-select option:checked')?.textContent || defaultScaleType) : 'Major';
            UI.elements.scaleDisplay.textContent = `${targetGlobalKeyRoot_noProg} ${scaleTypeName}`;
        }
        log(`No active progression. Fretboard updated for key: ${newKey}`);
        return;
    }

    // Get original song data to find its 'defaultKey' for correct transposition reference
    const songDataForOriginalKey = progressions[currentProgressionName] ||
                                  JSON.parse(localStorage.getItem('userBebopProgressions') || '{}')[currentProgressionName];

    if (!songDataForOriginalKey || !songDataForOriginalKey.defaultKey) {
        console.warn(`Cannot re-key progression '${currentProgressionName}': Original defaultKey information is missing. Attempting relative transposition from current UI state.`);
        // Fallback: Transpose from current UI state if original key is unknown
        const previousGlobalKey = UI.elements.measures.children[0]?.dataset.lastKeyContext || newKey; // Use newKey if no prior context
        const previousGlobalKeyRoot = standardizeNoteName(previousGlobalKey.replace('m', ''));
        const newTargetGlobalKeyRoot_fallback = standardizeNoteName(newKey.replace('m', ''));

        Array.from(UI.elements.measures.children).forEach((measureElement) => {
            measureElement.querySelectorAll('.measure-part').forEach(partElement => {
                const currentRoot = partElement.querySelector('.root-note').value;
                const currentQuality = partElement.querySelector('.chord-quality').value;
                const currentScaleRoot = partElement.querySelector('.second-key').value;
                // currentScaleType remains the same relative to its new root

                const transposedChord = global.transposeChordData({ root: currentRoot, quality: currentQuality }, previousGlobalKeyRoot, newTargetGlobalKeyRoot_fallback);
                const transposedScaleRootInfo = global.transposeChordData({ root: currentScaleRoot, quality: 'maj' }, previousGlobalKeyRoot, newTargetGlobalKeyRoot_fallback);

                partElement.querySelector('.root-note').value = transposedChord.root;
                // Quality doesn't change with transposition
                partElement.querySelector('.second-key').value = transposedScaleRootInfo.root;
            });
            measureElement.dataset.lastKeyContext = newKey;
        });
        addFirstChordListener(); 
        updateNextChordDisplay();
        return;
    }

    const originalSongDefaultKey = songDataForOriginalKey.defaultKey;
    const originalSongDefaultKeyRoot = standardizeNoteName(originalSongDefaultKey.replace('m', ''));
    const newTargetGlobalKeyRoot = standardizeNoteName(newKey.replace('m', ''));

    // Iterate over UI measures and update them based on the original progression definition
    Array.from(UI.elements.measures.children).forEach((measureElement, measureIndex) => {
        if (measureIndex < currentFunctionalProgression.length) {
            const rawChordStringFromOriginalDefinition = currentFunctionalProgression[measureIndex];
            const measurePartsUI = measureElement.querySelectorAll('.measure-part');
            
            let originalPartsToProcess = []; // Array to hold data of parts from original definition

            // Logic to get parts from original definition (user song or predefined)
            if (isUserSongCurrentlyLoaded() && songDataForOriginalKey.parts && songDataForOriginalKey.parts[measureIndex]) {
                songDataForOriginalKey.parts[measureIndex].forEach(userPartData => {
                    const parsedOriginal = parseRomanNumeralToAbsoluteChord(userPartData.originalRoman || `${userPartData.root}${userPartData.quality}`, originalSongDefaultKey);
                    originalPartsToProcess.push({
                        parsedInOriginalContext: parsedOriginal,
                        originalScaleRoot: userPartData.scaleRoot,
                        originalScaleType: userPartData.scaleType
                    });
                });
            } else { // Predefined progression
                const potentialSplit = rawChordStringFromOriginalDefinition.split('/');
                 if (potentialSplit.length === 2 && !parseChord(rawChordStringFromOriginalDefinition) && parseChord(potentialSplit[0].trim()) && parseChord(potentialSplit[1].trim())) {
                    originalPartsToProcess.push({ parsedInOriginalContext: parseRomanNumeralToAbsoluteChord(potentialSplit[0].trim(), originalSongDefaultKey) });
                    originalPartsToProcess.push({ parsedInOriginalContext: parseRomanNumeralToAbsoluteChord(potentialSplit[1].trim(), originalSongDefaultKey) });
                } else {
                    originalPartsToProcess.push({ parsedInOriginalContext: parseRomanNumeralToAbsoluteChord(rawChordStringFromOriginalDefinition, originalSongDefaultKey) });
                }
            }

            // Update UI parts based on transposed original data
            measurePartsUI.forEach((partElement, partIndex) => {
                if (partIndex < originalPartsToProcess.length) {
                    const originalPart = originalPartsToProcess[partIndex];
                    // Transpose chord
                    const transposedChord = global.transposeChordData(originalPart.parsedInOriginalContext, originalSongDefaultKeyRoot, newTargetGlobalKeyRoot);
                    
                    partElement.querySelector('.root-note').value = transposedChord.root;
                    partElement.querySelector('.chord-quality').value = transposedChord.quality; 

                    // Transpose scale root and set scale type
                    let finalScaleRoot, finalScaleType;
                    if (originalPart.originalScaleRoot && originalPart.originalScaleType) {
                        const transposedScaleRootInfo = global.transposeChordData({ root: originalPart.originalScaleRoot, quality: 'maj' }, originalSongDefaultKeyRoot, newTargetGlobalKeyRoot);
                        finalScaleRoot = transposedScaleRootInfo.root;
                        finalScaleType = originalPart.originalScaleType;
                    } else { // Suggest scale if not explicitly defined
                        finalScaleRoot = transposedChord.root;
                        finalScaleType = suggestScaleForQuality(transposedChord.quality);
                    }
                    partElement.querySelector('.second-key').value = finalScaleRoot;
                    partElement.querySelector('.scale-select').value = finalScaleType;
                } else if (originalPartsToProcess.length > 0) {
                    // If UI has more parts than original definition (e.g. user split a non-split measure after load)
                    // duplicate the last processed original part's transposed data.
                    const lastOriginalPart = originalPartsToProcess[originalPartsToProcess.length - 1];
                    const transposedChord = global.transposeChordData(lastOriginalPart.parsedInOriginalContext, originalSongDefaultKeyRoot, newTargetGlobalKeyRoot);
                     partElement.querySelector('.root-note').value = transposedChord.root;
                    partElement.querySelector('.chord-quality').value = transposedChord.quality;
                    partElement.querySelector('.second-key').value = transposedChord.root; // Suggest scale based on chord
                    partElement.querySelector('.scale-select').value = suggestScaleForQuality(transposedChord.quality);
                }
            });
        } else { // For measures added by the user beyond the original progression length
            const previousGlobalKey = measureElement.dataset.lastKeyContext || originalSongDefaultKey; // Key context when this measure was created/last updated
            const previousGlobalKeyRoot = standardizeNoteName(previousGlobalKey.replace('m', ''));
            
            measureElement.querySelectorAll('.measure-part').forEach(partElement => {
                const currentRoot = partElement.querySelector('.root-note').value;
                const currentQuality = partElement.querySelector('.chord-quality').value;
                const currentScaleRoot = partElement.querySelector('.second-key').value;
                // currentScaleType remains the same relative to its new root

                const chordToTranspose = { root: currentRoot, quality: currentQuality };
                const transposedChord = global.transposeChordData(chordToTranspose, previousGlobalKeyRoot, newTargetGlobalKeyRoot);
                
                partElement.querySelector('.root-note').value = transposedChord.root;
                // partElement.querySelector('.chord-quality').value = transposedChord.quality; // Quality remains same

                const scaleRootToTranspose = {root: currentScaleRoot, quality: 'maj'}; // Treat scale root as major for transposition
                const transposedScale = global.transposeChordData(scaleRootToTranspose, previousGlobalKeyRoot, newTargetGlobalKeyRoot);
                partElement.querySelector('.second-key').value = transposedScale.root;
                // partElement.querySelector('.scale-select').value = currentScaleType; // Scale type remains same
            });
            measureElement.dataset.lastKeyContext = newKey; // Update key context for this user-added measure
        }
    });

    addFirstChordListener(); // Update main fretboard for the (potentially new) first chord
    updateNextChordDisplay();
    log(`Progression '${currentProgressionName}' re-keyed to: ${newKey}`);
}

export function isUserSongCurrentlyLoaded() {
    if (!currentProgressionName) return false;
    const userSongs = JSON.parse(localStorage.getItem('userBebopProgressions') || '{}');
    return userSongs.hasOwnProperty(currentProgressionName);
}


export function createMeasurePartHTML(data, partIndex = 0) {
    // data = { root, quality, scaleRoot, scaleType }
    return `
        <div class="measure-part" data-part-index="${partIndex}">
            <div class="chord-controls">
                <select class="root-note">${createKeyOptions(data.root)}</select>
                <select class="chord-quality">${createQualityOptions(data.quality)}</select>
            </div>
            <div class="scale-controls">
                <select class="second-key">${createKeyOptions(data.scaleRoot)}</select>
                <select class="scale-select">${createScaleOptions(data.scaleType)}</select>
            </div>
        </div>`;
}


export function addMeasure(root = 'C', quality = 'maj7', scaleRoot = 'C', scaleType = 'major', 
                    isInitiallySplit = false, secondPartData = null) {
    const measuresContainer = UI.elements.measures;
    const newMeasureIndex = measuresContainer.children.length;

    const measureDiv = document.createElement('div');
    measureDiv.className = 'measure';
    measureDiv.dataset.measureIndex = newMeasureIndex;
    measureDiv.dataset.isSplit = isInitiallySplit ? 'true' : 'false';
    if (isInitiallySplit) measureDiv.classList.add('split-active');

    // Store the current global key context when this measure is created
    measureDiv.dataset.lastKeyContext = UI.elements.keySelect.value;


    let measureHTML = `<div class="measure-header"><span class="measure-number">${newMeasureIndex + 1}</span></div>`;
    
    measureHTML += createMeasurePartHTML({ root, quality, scaleRoot, scaleType }, 0);

    if (isInitiallySplit) {
        const spData = secondPartData || { root, quality, scaleRoot, scaleType }; // Use first part data if second not provided
        measureHTML += createMeasurePartHTML(spData, 1);
    }
    
    measureHTML += `<div class="measure-footer"><button class="split-measure-button">${isInitiallySplit ? 'Unsplit' : 'Split'}</button></div>`;
    measureDiv.innerHTML = measureHTML;
    measuresContainer.appendChild(measureDiv);

    // Add event listeners to new select elements
    measureDiv.querySelectorAll('select').forEach(selectElement => {
        selectElement.addEventListener('change', (event) => {
            handleMeasureControlChange(event.target.closest('.measure-part'), event.target);
        });
    });
    
    // Add event listener for loop selection (click on header part of measure)
    measureDiv.querySelector('.measure-header').addEventListener('click', (event) => {
        // Avoid triggering if a control inside header is clicked (if any added later)
        if (event.target.tagName !== 'SELECT' && event.target.tagName !== 'BUTTON') {
            toggleMeasureLoopSelection(newMeasureIndex);
        }
    });
    
    // Split button functionality
    const splitButton = measureDiv.querySelector('.split-measure-button');
    const is44Time = parseInt(UI.elements.timeSignature.value) === 4;
    splitButton.disabled = !is44Time; // Disable if not 4/4
    splitButton.title = is44Time ? "" : "Splitting measures only available in 4/4 time.";

    splitButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent measure loop selection
        toggleSplitMeasure(measureDiv);
    });


    updateMeasureNumbers(); 
    if (newMeasureIndex === 0) addFirstChordListener(); // If it's the first measure, update main fretboard
    updateNextChordDisplay();
}

export function toggleSplitMeasure(measureDiv) {
    if (parseInt(UI.elements.timeSignature.value) !== 4) {
        alert("Splitting measures is only available in 4/4 time.");
        return;
    }

    const isSplit = measureDiv.dataset.isSplit === 'true';
    const splitButton = measureDiv.querySelector('.split-measure-button');
    const firstPart = measureDiv.querySelector('.measure-part[data-part-index="0"]');

    if (isSplit) { // Unsplit: Remove second part
        measureDiv.querySelector('.measure-part[data-part-index="1"]')?.remove();
        measureDiv.dataset.isSplit = 'false';
        measureDiv.classList.remove('split-active');
        splitButton.textContent = 'Split';
    } else { // Split: Add second part, copying data from first
        if (!firstPart) return; // Should not happen
        const firstPartData = {
            root: firstPart.querySelector('.root-note').value,
            quality: firstPart.querySelector('.chord-quality').value,
            scaleRoot: firstPart.querySelector('.second-key').value,
            scaleType: firstPart.querySelector('.scale-select').value
        };
        // Insert new part HTML before the footer
        measureDiv.querySelector('.measure-footer').insertAdjacentHTML('beforebegin', createMeasurePartHTML(firstPartData, 1));
        // Add listeners to the newly created second part's selects
        const newSecondPart = measureDiv.querySelector('.measure-part[data-part-index="1"]');
        newSecondPart.querySelectorAll('select').forEach(select => {
            select.addEventListener('change', (e) => handleMeasureControlChange(e.target.closest('.measure-part'), e.target));
        });

        measureDiv.dataset.isSplit = 'true';
        measureDiv.classList.add('split-active');
        splitButton.textContent = 'Unsplit';
    }
    updateNextChordDisplay(); // Update next chord display as measure structure changed
    // If this measure is currently active, refresh its display/fretboard
    const currentActiveMeasure = UI.elements.measures.querySelector('.measure.active');
    if (currentActiveMeasure === measureDiv) {
        const activePart = measureDiv.querySelector('.measure-part.part-active') || firstPart;
        if (activePart) handleMeasureControlChange(activePart, activePart.querySelector('select')); // Trigger update
    }
}


export function removeMeasure() {
    const measuresChildren = UI.elements.measures.children;
    if (measuresChildren.length > 0) {
        const removedMeasureIndex = measuresChildren.length - 1;

        // Adjust loop range if the removed measure was part of it
        if (AppState.loopStartMeasure === removedMeasureIndex || AppState.loopEndMeasure === removedMeasureIndex) {
            _resetLoop(); // Simplest: just reset the loop
        }
        // More precise adjustment:
        if (AppState.loopEndMeasure >= measuresChildren.length -1 ) { // If last measure was loop end or beyond
            AppState.loopEndMeasure = Math.max(-1, measuresChildren.length - 2); // New end is previous or -1
            if (AppState.loopStartMeasure > AppState.loopEndMeasure) AppState.loopStartMeasure = AppState.loopEndMeasure; // Start can't be after end
            if (AppState.loopStartMeasure === -1 && AppState.loopEndMeasure > -1) AppState.loopStartMeasure = AppState.loopEndMeasure; // If start was -1, make it same as end
             if (AppState.loopStartMeasure === -1 && AppState.loopEndMeasure === -1 && AppState.loopingActive) _toggleLoopingMode(); // Turn off if loop becomes invalid
        }


        measuresChildren[measuresChildren.length - 1].remove();
        updateMeasureNumbers();
        if (measuresChildren.length > 0) {
            addFirstChordListener(); // Update main fretboard if measures still exist
        } else {
            // No measures left, clear display
            if (UI.elements.scaleDisplay) UI.elements.scaleDisplay.textContent = "Select a progression and key.";
            _resetLoop(); // Ensure loop is off
        }
        updateNextChordDisplay();
        log('Removed last measure');
    }
}

export function updateMeasureNumbers() {
    Array.from(UI.elements.measures.children).forEach((measure, index) => {
        measure.querySelector('.measure-number').textContent = index + 1;
        measure.dataset.measureIndex = index; // Keep data attribute in sync
    });
}

export function handleMeasureControlChange(measurePartDiv, changedElement) {
    // This function is called when any select within a measure part changes.
    // It updates the scale suggestion and the main fretboard display.
    const rootSelect = measurePartDiv.querySelector('.root-note');
    const qualitySelect = measurePartDiv.querySelector('.chord-quality');
    const scaleKeySelect = measurePartDiv.querySelector('.second-key');
    const scaleTypeSelect = measurePartDiv.querySelector('.scale-select');

    // If chord root or quality changed, auto-update the suggested scale root and type
    if (changedElement.classList.contains('root-note') || changedElement.classList.contains('chord-quality')) {
        scaleKeySelect.value = rootSelect.value;    // Scale root matches chord root
        scaleTypeSelect.value = suggestScaleForQuality(qualitySelect.value); // Suggest scale based on quality
    }

    // Update the main chord fretboard based on the current measure part's scale settings
    updateFretboardNotes(
        UI.elements.chordFretboard,      // The main fretboard element
        scaleKeySelect.value,     // Root for the scale display
        scaleTypeSelect.value,    // Type of scale for display
        TUNINGS[UI.elements.chordTuning.value], // Current tuning
        measurePartDiv // Context for displaying "Scale X over Chord Y"
    );

    if (AppState.guideTonesActive) _highlightGuideTones(measurePartDiv); // Re-apply guide tones if active
    updateNextChordDisplay(); // Chord might have changed, so update "Next:"
}


export function saveCurrentProgression() {
    const measures = Array.from(UI.elements.measures.children);
    if (measures.length === 0) {
        alert("No progression to save!");
        return;
    }

    let suggestedName = "My Custom Song";
    // If a song is loaded, use its name as suggestion
    if (currentProgressionName && (progressions[currentProgressionName] || JSON.parse(localStorage.getItem('userBebopProgressions') || '{}')[currentProgressionName])) {
        const currentSongData = progressions[currentProgressionName] || JSON.parse(localStorage.getItem('userBebopProgressions') || '{}')[currentProgressionName];
        suggestedName = currentSongData.displayName || currentProgressionName.replace(/_/g, ' ');
    }

    let progressionNameInput = prompt("Enter a name for this progression:", suggestedName);
    if (!progressionNameInput || progressionNameInput.trim() === "") {
        alert("Save cancelled or empty name provided.");
        return;
    }
    progressionNameInput = progressionNameInput.trim();

    const keyForSaving = UI.elements.keySelect.value; // Save with the currently selected global key

    const savedProgressionData = {
        progression: [], // This will store the combined chord strings for each measure (e.g., "Cmaj7 / G7")
        parts: [],       // This will store detailed data for each part of each measure
        splitStatus: [], // Boolean array indicating if a measure is split
        defaultKey: keyForSaving, // The key in which this progression is saved
        description: `User saved song - ${new Date().toLocaleDateString()}`,
        displayName: progressionNameInput
    };

    measures.forEach(measureEl => {
        const isSplit = measureEl.dataset.isSplit === 'true';
        savedProgressionData.splitStatus.push(isSplit);
        
        const measurePartsDataForStorage = [];
        let measureCombinedString = "";

        measureEl.querySelectorAll('.measure-part').forEach((partEl, partIdx) => {
            const root = partEl.querySelector('.root-note').value;
            const qualityValue = partEl.querySelector('.chord-quality').value; // e.g., "maj7"
            const scaleRoot = partEl.querySelector('.second-key').value;
            const scaleType = partEl.querySelector('.scale-select').value;

            // Get display text for quality (e.g., "7" for "dom7")
            const qualityOption = partEl.querySelector(`.chord-quality option[value="${qualityValue}"]`);
            const qualityDisplayText = qualityOption ? qualityOption.textContent : qualityValue;
            
            const absoluteChordStringForStorage = `${root}${qualityDisplayText}`; // e.g., "Cmaj7", "G7"

            measurePartsDataForStorage.push({
                root: root, // Store actual root
                quality: qualityValue, // Store standard quality value
                originalRoman: absoluteChordStringForStorage, // Store as absolute chord for easier re-parsing
                scaleRoot: scaleRoot,
                scaleType: scaleType
            });

            if (partIdx > 0) measureCombinedString += " / ";
            measureCombinedString += absoluteChordStringForStorage;
        });
        
        savedProgressionData.parts.push(measurePartsDataForStorage);
        savedProgressionData.progression.push(measureCombinedString);
    });

    const userSongs = JSON.parse(localStorage.getItem('userBebopProgressions') || '{}');
    userSongs[progressionNameInput] = savedProgressionData; // Use input name as key
    localStorage.setItem('userBebopProgressions', JSON.stringify(userSongs));

    populateUserSongsDropdown();
    UI.elements.userProgressionSelect.value = progressionNameInput; // Select the newly saved song
    
    // Update current app state to reflect the saved song is now "loaded"
    setCurrentProgressionName(progressionNameInput);
    setCurrentFunctionalProgression(savedProgressionData.progression);

    alert(`Progression "${progressionNameInput}" saved!`);
    log(`User progression saved: ${progressionNameInput} with defaultKey: ${keyForSaving}`);
}

export function populateUserSongsDropdown() {
    const selectElement = UI.elements.userProgressionSelect;
    if (!selectElement) return;

    selectElement.innerHTML = '<option value="">-- Select a saved song --</option>'; // Clear existing options
    const userSongs = JSON.parse(localStorage.getItem('userBebopProgressions') || '{}');
    
    Object.keys(userSongs).sort().forEach(name => { // Sort names alphabetically
        const option = document.createElement('option');
        option.value = name; // Store the key (original input name)
        option.textContent = userSongs[name].displayName || name; // Display the displayName or key
        selectElement.appendChild(option);
    });
}

export function deleteSelectedUserSong() {
    const selectedSongName = UI.elements.userProgressionSelect.value;
    if (!selectedSongName) {
        alert("Please select a saved song to delete.");
        return;
    }

    if (confirm(`Are you sure you want to delete "${UI.elements.userProgressionSelect.options[UI.elements.userProgressionSelect.selectedIndex].text}"? This cannot be undone.`)) {
        const userSongs = JSON.parse(localStorage.getItem('userBebopProgressions') || '{}');
        delete userSongs[selectedSongName];
        localStorage.setItem('userBebopProgressions', JSON.stringify(userSongs));
        
        populateUserSongsDropdown(); // Refresh the dropdown

        // If the deleted song was the currently loaded one, clear the measures
        if (currentProgressionName === selectedSongName) {
            UI.elements.measures.innerHTML = '<p>Select a progression.</p>';
            if(UI.elements.currentSongTitleFretboard) UI.elements.currentSongTitleFretboard.textContent = "";
            if(UI.elements.currentSongDescriptionFretboard) UI.elements.currentSongDescriptionFretboard.textContent = "";
            setCurrentProgressionName("");
            setCurrentFunctionalProgression([]);
            _resetLoop(); // Use local resetLoop
        }
        alert(`Song "${selectedSongName}" deleted.`);
        log(`User song deleted: ${selectedSongName}`);
    }
}


export function initializeFretFlow() {
    const fretboardsGrid = UI.elements.fretboardsGrid;
    if (!fretboardsGrid) { console.error("FretFlow grid not found."); return; }

    fretboardsGrid.innerHTML = ''; // Clear existing FretFlow sections

    for (let i = 0; i < 4; i++) { // Create 4 FretFlow sections
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'fretboard-section'; // Re-use class for styling
        
        sectionDiv.innerHTML = `
            <div class="fretboard-controls">
                <div class="control-group"><label for="ff-key-${i}">Key:</label><select id="ff-key-${i}" class="fretflow-key">${createKeyOptions()}</select></div>
                <div class="control-group"><label for="ff-scale-${i}">Scale:</label><select id="ff-scale-${i}" class="fretflow-scale">${createScaleOptions()}</select></div>
                <div class="control-group"><label for="ff-tuning-${i}">Tuning:</label><select id="ff-tuning-${i}" class="tuning-select">
                    <option value="standard">Std</option><option value="dropD">DropD</option><option value="openG">OpG</option>
                    <option value="DADGAD">DADGAD</option><option value="openE">OpE</option></select></div>
            </div>
            <div class="scale-display" id="ff-scale-display-${i}"></div>
            <div id="ff-fretboard-${i}" class="fretboard"></div>`; // Unique ID for each fretboard
        
        fretboardsGrid.appendChild(sectionDiv);

        const fretboardEl = sectionDiv.querySelector(`#ff-fretboard-${i}`);
        const keySelect = sectionDiv.querySelector(`#ff-key-${i}`);
        const scaleSelect = sectionDiv.querySelector(`#ff-scale-${i}`);
        const tuningSelect = sectionDiv.querySelector(`#ff-tuning-${i}`);
        const scaleDisplay = sectionDiv.querySelector(`#ff-scale-display-${i}`);

        const updateDisplay = () => {
            const tuningArr = TUNINGS[tuningSelect.value] || TUNINGS.standard;
            // Update scale display text for this FretFlow instance
            scaleDisplay.textContent = `${keySelect.value} ${scaleSelect.options[scaleSelect.selectedIndex].text}`;
            createFretboard(fretboardEl, tuningArr); // Create the fretboard structure
            updateFretboardNotes(fretboardEl, keySelect.value, scaleSelect.value, tuningArr); // Draw notes
        };

        // Add event listeners to controls for this FretFlow section
        [keySelect, scaleSelect, tuningSelect].forEach(el => el.addEventListener('change', updateDisplay));
        
        updateDisplay(); // Initial draw
    }
    log("FretFlow initialized.");
}


export function addFirstChordListener() {
    // This function ensures the main chord fretboard displays the scale
    // of the first chord in the progression, or a default if no progression.
    const firstMeasure = UI.elements.measures.firstElementChild;
    if (firstMeasure) {
        const firstMeasurePart = firstMeasure.querySelector('.measure-part[data-part-index="0"]');
        if (firstMeasurePart) {
            const scaleRootSelect = firstMeasurePart.querySelector('.scale-controls .second-key');
            const scaleTypeSelect = firstMeasurePart.querySelector('.scale-controls .scale-select');

            const updateFunc = () => {
                if (scaleRootSelect && scaleTypeSelect && UI.elements.chordTuning) {
                    updateFretboardNotes(
                        UI.elements.chordFretboard,
                        scaleRootSelect.value,
                        scaleTypeSelect.value,
                        TUNINGS[UI.elements.chordTuning.value],
                        firstMeasurePart // Provide context for scale display text
                    );
                }
            };
            // Call it once to set initial state
            updateFunc();
            // Note: Event listeners for changes on these selects are added in addMeasure/toggleSplitMeasure
            // This function is primarily for the *initial* setup or when the first measure changes.
        }
    } else { 
        // No measures exist, display a default on the main fretboard
        updateFretboardNotes(UI.elements.chordFretboard, "C", "major", TUNINGS[UI.elements.chordTuning.value]);
        if (UI.elements.scaleDisplay) UI.elements.scaleDisplay.textContent = "C Major (Default)";
    }
}
