// js/ui.js
import { AppState, currentProgressionName, currentFunctionalProgression, updateLoadingStatus, setCurrentProgressionName, setCurrentFunctionalProgression } from './state.js';
import { NOTES, SCALES, TUNINGS, CHORD_INTERVALS, FRETBOARD_NOTES_OCTAVES, PLAYBACK_OCTAVES, progressions, RHYTHMIC_STYLES } from './constants.js';
import { log, standardizeNoteName, parseChord, parseRomanNumeralToAbsoluteChord, suggestScaleForQuality } from './utils.js';
import { AudioContextManager, playNote } from './audio.js';

// REMOVED: import { toggleLoopingMode, resetLoop, highlightGuideTones, clearGuideToneHighlights, toggleGuideTones } from './ui_interactive.js';

// These functions are now defined locally below (prefixed with _)

export function _resetLoop() {
    AppState.loopStartMeasure = -1;
    AppState.loopEndMeasure = -1;
    if (UI.elements.measures) { // Ensure measures element exists
        Array.from(UI.elements.measures.children).forEach(m => m.classList.remove('loop-selected'));
    }
    log("Loop selection cleared by resetLoop.");
}

export function _toggleLoopingMode() {
    AppState.updateState({ loopingActive: !AppState.loopingActive });
    if (UI.elements.loopSelectedToggle) {
        UI.elements.loopSelectedToggle.textContent = AppState.loopingActive ? "Looping ON" : "Looping Off";
        UI.elements.loopSelectedToggle.classList.toggle('active', AppState.loopingActive);
    }

    if (!AppState.loopingActive) {
        _resetLoop();
    } else {
        alert("Looping ON. Click measures to define loop range. Click toggle again to turn off.");
    }
    log(`Looping mode: ${AppState.loopingActive ? 'ON' : 'OFF'}`);
}

export function _clearGuideToneHighlights() {
    if (!UI.elements.chordFretboard) return;
    UI.elements.chordFretboard.querySelectorAll('.note').forEach(n => {
        n.classList.remove('guide-tone-highlight', 'root-highlight-for-guides');
        n.style.transform = 'translate(-50%, -50%) scale(1)';
    });
}

export function _highlightGuideTones(activeMeasurePartContext = null) {
    _clearGuideToneHighlights();
    if (!AppState.guideTonesActive || !UI.elements.chordFretboard) return;

    let chordRootStr, chordQualityStr;

    if (activeMeasurePartContext) {
        chordRootStr = activeMeasurePartContext.querySelector('.root-note')?.value;
        chordQualityStr = activeMeasurePartContext.querySelector('.chord-quality')?.value;
    } else {
        const firstMeasure = UI.elements.measures?.children[0];
        const firstMeasurePart = firstMeasure?.querySelector('.measure-part');
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

    const guideToneNotesSet = new Set();
    if (chordIntervals.includes(3)) guideToneNotesSet.add(NOTES[(rootNoteIndex + 3) % 12]);
    else if (chordIntervals.includes(4)) guideToneNotesSet.add(NOTES[(rootNoteIndex + 4) % 12]);

    if (chordQualityStr.includes('6')) {
        if (chordIntervals.includes(9)) guideToneNotesSet.add(NOTES[(rootNoteIndex + 9) % 12]);
    } else if (chordIntervals.includes(11)) {
        guideToneNotesSet.add(NOTES[(rootNoteIndex + 11) % 12]);
    } else if (chordIntervals.includes(10)) {
        guideToneNotesSet.add(NOTES[(rootNoteIndex + 10) % 12]);
    } else if (chordIntervals.includes(9) && chordQualityStr === 'dim7') {
         guideToneNotesSet.add(NOTES[(rootNoteIndex + 9) % 12]);
    }

    UI.elements.chordFretboard.querySelectorAll('.note').forEach(noteElement => {
        const noteName = noteElement.textContent;
        if (noteName === chordRootNote) {
            noteElement.classList.add('root-highlight-for-guides');
        } else if (guideToneNotesSet.has(noteName)) {
            noteElement.classList.add('guide-tone-highlight');
        }
    });
}

export function _toggleGuideTones() {
    AppState.updateState({ guideTonesActive: !AppState.guideTonesActive });
    if (UI.elements.guideTonesToggle) {
        UI.elements.guideTonesToggle.textContent = AppState.guideTonesActive ? "Guide Tones ON" : "Guide Tones Off";
        UI.elements.guideTonesToggle.classList.toggle('active', AppState.guideTonesActive);
    }

    const currentMeasureEl = UI.elements.measures?.children[AppState.currentMeasure];
    const activePart = currentMeasureEl?.querySelector('.measure-part.part-active') || currentMeasureEl?.querySelector('.measure-part');

    if (AppState.guideTonesActive) {
        _highlightGuideTones(activePart);
    } else {
        _clearGuideToneHighlights();
    }
    log(`Guide tones: ${AppState.guideTonesActive ? 'ON' : 'OFF'}`);
}

export function toggleMeasureLoopSelection(measureIndex) {
    if (!AppState.loopingActive) {
        _toggleLoopingMode();
        if (!AppState.loopingActive) return;
    }

    const measureElement = UI.elements.measures?.children[measureIndex];
    if (!measureElement) return;

    measureElement.classList.toggle('loop-selected');

    const selectedIndices = Array.from(UI.elements.measures.children)
        .map((m, i) => m.classList.contains('loop-selected') ? i : -1)
        .filter(i => i !== -1).sort((a, b) => a - b);

    if (selectedIndices.length > 0) {
        AppState.loopStartMeasure = selectedIndices[0];
        AppState.loopEndMeasure = selectedIndices[selectedIndices.length - 1];
        Array.from(UI.elements.measures.children).forEach((m, i) => {
            m.classList.toggle('loop-selected', i >= AppState.loopStartMeasure && i <= AppState.loopEndMeasure);
        });
    } else {
        _resetLoop();
    }
    log(`Loop range updated: ${AppState.loopStartMeasure} to ${AppState.loopEndMeasure}`);
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
            addMeasureButton: document.getElementById('add-measure-button'),
            removeMeasureButton: document.getElementById('remove-measure-button'),
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
        Object.entries(this.elements).forEach(([key, element]) => {
            const optionalElements = ['currentSongTitle', 'currentSongDescription', 'swingToggle', 'noteNamingConvention', 'fretflowSection', 'fretboardsGrid'];
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

    fretboardContainer.innerHTML = '';
    const numFrets = 12;
    const numStrings = tuningArray.length;

    const nutElement = document.createElement('div');
    nutElement.className = 'fret-line';
    nutElement.style.left = '0%';
    nutElement.style.width = '4px';
    nutElement.style.backgroundColor = '#4A3B31';
    nutElement.style.zIndex = '1';
    fretboardContainer.appendChild(nutElement);

    for (let i = 1; i <= numFrets; i++) {
        const fretLine = document.createElement('div');
        fretLine.className = 'fret-line';
        fretLine.style.left = `${(i / numFrets) * 100}%`;
        fretboardContainer.appendChild(fretLine);

        const fretNumber = document.createElement('div');
        fretNumber.className = 'fret-number';
        fretNumber.textContent = i;
        fretNumber.style.left = `${((i - 0.5) / numFrets) * 100}%`;
        fretboardContainer.appendChild(fretNumber);
    }

    for (let stringIndex = 0; stringIndex < numStrings; stringIndex++) {
        const stringLine = document.createElement('div');
        stringLine.className = 'string-line';
        const stringYPosition = (((numStrings - 1 - stringIndex) / (numStrings - 1)) * 96) + 2;
        stringLine.style.top = `${stringYPosition}%`;
        fretboardContainer.appendChild(stringLine);
    }

    const markerPositions = [3, 5, 7, 9, 12];
    markerPositions.forEach(fretPos => {
        const marker = document.createElement('div');
        marker.className = 'fret-marker';
        marker.style.left = `${((fretPos - 0.5) / numFrets) * 100}%`;

        if (fretPos === 12) {
            const topMarker = marker.cloneNode(true);
            topMarker.style.top = `33%`;
            fretboardContainer.appendChild(topMarker);
            marker.style.top = `67%`;
        } else {
            marker.style.top = '50%';
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

    if (fretboardContainer.id === 'chord-fretboard') {
        _clearGuideToneHighlights();
    }
    fretboardContainer.querySelectorAll('.note').forEach(el => el.remove());

    if (fretboardContainer.id === 'chord-fretboard' && UI.elements.scaleDisplay) {
        let displayScaleTypeName = scaleName;
        const tempScaleSelect = document.createElement('select');
        tempScaleSelect.innerHTML = createScaleOptions(scaleName);
        const selectedOptionEl = tempScaleSelect.querySelector(`option[value="${scaleName}"]`);
        displayScaleTypeName = selectedOptionEl ? selectedOptionEl.textContent : scaleName.replace(/([A-Z])/g, ' $1').split(' ').map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(' ').trim();

        let chordRootForDisplay = "", chordQualityTextForDisplay = "";
        let actualMeasurePartContext = measureContext;

        if (measureContext && measureContext.classList.contains('measure')) {
            actualMeasurePartContext = measureContext.querySelector('.measure-part.part-active') || measureContext.querySelector('.measure-part');
        }

        if (actualMeasurePartContext) {
            chordRootForDisplay = actualMeasurePartContext.querySelector('.chord-controls .root-note')?.value;
            const chordQualityRaw = actualMeasurePartContext.querySelector('.chord-controls .chord-quality')?.value;
            const qualityOptionEl = actualMeasurePartContext.querySelector(`.chord-controls .chord-quality option[value="${chordQualityRaw}"]`);
            chordQualityTextForDisplay = qualityOptionEl ? qualityOptionEl.textContent : (chordQualityRaw || "");
        } else {
            const firstMeasure = UI.elements.measures?.children[0];
            const firstMeasurePart = firstMeasure?.querySelector('.measure-part');
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
    const numFrets = 12;

    for (let stringIndex = 0; stringIndex < numStrings; stringIndex++) {
        const openStringNote = standardizeNoteName(tuningArray[stringIndex]);
        const openStringNoteIndex = NOTES.indexOf(openStringNote);
        if (openStringNoteIndex === -1) { console.warn(`Invalid open string note: ${tuningArray[stringIndex]} at string index ${stringIndex}`); continue; }

        const FNO_Key = `string${numStrings - stringIndex}`;

        for (let fret = 0; fret <= numFrets; fret++) {
            const currentNoteNameOnString = NOTES[(openStringNoteIndex + fret + 12) % 12];

            if (notesInScale.includes(currentNoteNameOnString)) {
                const noteElement = document.createElement('div');
                noteElement.className = 'note';
                noteElement.textContent = currentNoteNameOnString;
                noteElement.style.left = (fret === 0) ? `-2%` : `${((fret - 0.5) / numFrets) * 100}%`;
                const stringYPosition = (((numStrings - 1 - stringIndex) / (numStrings - 1)) * 96) + 2;
                noteElement.style.top = `${stringYPosition}%`;
                noteElement.style.backgroundColor = (currentNoteNameOnString === standardizedRoot) ? '#BD2031' :
                    (notesInScale.indexOf(currentNoteNameOnString) % 2 === 0) ? '#006400' : '#4CAF50';

                let noteOctaveForPlayback = `${currentNoteNameOnString}3`;
                const isStandardGuitarTuning = tuningArray.length === 6 && tuningArray.join('') === "EADGBE";

                if (isStandardGuitarTuning && FRETBOARD_NOTES_OCTAVES[FNO_Key] && fret < FRETBOARD_NOTES_OCTAVES[FNO_Key].length) {
                    noteOctaveForPlayback = FRETBOARD_NOTES_OCTAVES[FNO_Key][fret];
                } else {
                    let approxOctave = PLAYBACK_OCTAVES[0];
                    if (stringIndex >= numStrings * 2/3 ) approxOctave = PLAYBACK_OCTAVES[PLAYBACK_OCTAVES.length -1];
                    else if (stringIndex >= numStrings / 3) approxOctave = PLAYBACK_OCTAVES[Math.floor(PLAYBACK_OCTAVES.length / 2)];
                    if (fret > 7 && approxOctave < OCTAVES_FOR_SAMPLES[OCTAVES_FOR_SAMPLES.length - 1]) {
                        approxOctave = Math.min(OCTAVES_FOR_SAMPLES[OCTAVES_FOR_SAMPLES.length - 1], approxOctave + 1);
                    }
                    approxOctave = Math.max(OCTAVES_FOR_SAMPLES[0], Math.min(OCTAVES_FOR_SAMPLES[OCTAVES_FOR_SAMPLES.length - 1], approxOctave));
                    noteOctaveForPlayback = `${currentNoteNameOnString}${approxOctave}`;
                }
                noteElement.dataset.note = noteOctaveForPlayback;

                noteElement.addEventListener('click', async (event) => {
                    event.stopPropagation();
                    await AudioContextManager.ensureAudioContext();
                    const volume = fretboardContainer.id.startsWith('fretflow-fretboard') ? 0.4 : parseFloat(UI.elements.chordFretboardVolume.value);
                    playNote(noteElement.dataset.note, volume, 500);
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
    const isDrumStyleActive = selectedSoundType === 'drums' && timeSignatureNum === 4;

    const currentStyleKey = isDrumStyleActive ? AppState.currentRhythmicStyle : "quarterNotes";
    const styleDefinition = RHYTHMIC_STYLES[currentStyleKey] || RHYTHMIC_STYLES.quarterNotes;

    let beatsToDisplay = timeSignatureNum;
    let subdivisionFactor = 1;

    if (timeSignatureNum === 4) {
        beatsToDisplay = 8;
        subdivisionFactor = 2;
    } else if (timeSignatureNum === 6 || timeSignatureNum === 12) {
        beatsToDisplay = timeSignatureNum;
        subdivisionFactor = 3;
    }

    for (let i = 0; i < beatsToDisplay; i++) {
        const beatDiv = document.createElement('div');
        beatDiv.className = 'beat';
        beatDiv.dataset.beat = i;

        let beatLabel = `${Math.floor(i / subdivisionFactor) + 1}`;
        if (subdivisionFactor === 2 && (i % subdivisionFactor !== 0)) {
            beatLabel = (i % 2 === 1) ? "&" : `${Math.floor(i / 2) + 1}`;
        }

        let sound = 'silent';
        let volume = 0.1;
        let color = '#666666';

        if (isDrumStyleActive) {
            const patternIndexInStyle = i % styleDefinition.beatsPerPattern;
            const beatData = styleDefinition.pattern[patternIndexInStyle];
            if (beatData) {
                sound = beatData.sound;
                volume = beatData.volume;
                color = beatData.color;
            } else {
                sound = 'silent';
                volume = 0.0;
                color = '#444444';
            }
        } else {
            if (i % subdivisionFactor === 0) {
                sound = selectedSoundType;
                volume = (i === 0) ? 1.0 : 0.7;
                color = (i === 0) ? '#1F618D' : '#5DADE2';
            } else {
                sound = 'silent';
                volume = 0.0;
                color = '#888888';
            }
        }
        beatDiv.dataset.sound = sound;
        beatDiv.dataset.baseVolume = volume;
        beatDiv.dataset.volume = volume;
        beatDiv.style.backgroundColor = color;
        beatDiv.innerHTML = beatLabel; // Set innerHTML after other attributes for clarity

        beatDiv.addEventListener('click', () => {
            toggleBeatAccent(beatDiv, selectedSoundType, subdivisionFactor > 1 && (i % subdivisionFactor !== 0), isDrumStyleActive);
        });
        beatsContainer.appendChild(beatDiv);
    }
}

export function toggleBeatAccent(beatElement, currentSoundType, isSubdivision, isDrumStyleActive) {
    const currentVolume = parseFloat(beatElement.dataset.volume);
    let newVolume, newSound, newColor;

    if (isDrumStyleActive) {
        const drumCycle = [
            { sound: 'silent',      volume: 0,   color: '#444' },
            { sound: 'hihat',       volume: 0.3, color: '#9E9E9E' },
            { sound: 'snare',       volume: 0.8, color: '#D9534F' },
            { sound: 'kick',        volume: 1.0, color: '#1F618D' },
            { sound: 'snare,hihat', volume: 0.8, color: '#D35400' },
            { sound: 'kick,hihat',  volume: 1.0, color: '#27AE60' }
        ];
        let currentIndex = drumCycle.findIndex(s => s.sound === beatElement.dataset.sound && Math.abs(s.volume - currentVolume) < 0.01);
        if (currentIndex === -1) {
            currentIndex = drumCycle.findIndex(s => s.sound.startsWith(beatElement.dataset.sound.split(',')[0])) || 0;
        }
        let nextIndex = (currentIndex + 1) % drumCycle.length;
        if (isSubdivision && (drumCycle[nextIndex].sound.includes('kick') || drumCycle[nextIndex].sound.includes('snare,'))) {
             if (!beatElement.dataset.sound.includes('kick') && !beatElement.dataset.sound.includes('snare')) {
                nextIndex = drumCycle.findIndex(s => s.sound === 'hihat') ?? 1;
             }
        }
        newSound = drumCycle[nextIndex].sound;
        newVolume = drumCycle[nextIndex].volume;
        newColor = drumCycle[nextIndex].color;
    } else {
        const simpleCycle = [
            { volume: 0,   sound: 'silent',         color: '#666' },
            { volume: 0.3, sound: currentSoundType, color: '#9E9E9E' },
            { volume: 1.0, sound: currentSoundType, color: '#1F618D' }
        ];
        let currentIndex = simpleCycle.findIndex(s => Math.abs(s.volume - currentVolume) < 0.01 && (s.sound === beatElement.dataset.sound || (s.sound === 'silent' && currentVolume === 0)));
        if (currentIndex === -1) currentIndex = (currentVolume > 0.5) ? 2 : (currentVolume > 0) ? 1 : 0;
        const nextState = simpleCycle[(currentIndex + 1) % simpleCycle.length];
        newVolume = nextState.volume; newSound = nextState.sound; newColor = nextState.color;
    }
    beatElement.dataset.volume = newVolume;
    beatElement.dataset.sound = newSound;
    beatElement.style.backgroundColor = newColor;
}


export function onMetronomeInstrumentChange(selectedInstrument) {
    const showDrumsUI = selectedInstrument === "drums";
    if (UI.elements.drumSetToggleBtn) UI.elements.drumSetToggleBtn.style.display = showDrumsUI ? "inline-block" : "none";
    if (UI.elements.kickVolumeContainer) UI.elements.kickVolumeContainer.style.display = showDrumsUI ? "flex" : "none";
    if (UI.elements.snareVolumeContainer) UI.elements.snareVolumeContainer.style.display = showDrumsUI ? "flex" : "none";
    if (UI.elements.hihatVolumeContainer) UI.elements.hihatVolumeContainer.style.display = showDrumsUI ? "flex" : "none";
    updateRhythmicStyleUIVisibility();
    createBeats();
}

export function updateRhythmicStyleUIVisibility() {
    const soundType = UI.elements.soundType.value;
    const timeSig = UI.elements.timeSignature.value;
    const styleContainer = UI.elements.rhythmicStyleContainer;
    if (styleContainer) {
        if (soundType === 'drums' && timeSig === '4') {
            styleContainer.style.display = 'inline-flex';
        } else {
            styleContainer.style.display = 'none';
        }
    }
}

export function updateNextChordDisplay(currentMeasureIndex = AppState.currentMeasure) {
    const nextChordDisplayElement = UI.elements.nextChordDisplay;
    if (!nextChordDisplayElement || !UI.elements.measures) return;

    const measures = UI.elements.measures.children;
    if (measures.length === 0) {
        nextChordDisplayElement.textContent = ""; return;
    }

    let upcomingChords = [];
    let displayCount = 0;
    let tempMeasureIdx = currentMeasureIndex;
    let tempPartIdx = 0;

    const displayedBeats = UI.elements.beatsContainer?.querySelectorAll('.beat');

    const currentMeasureEl = measures[currentMeasureIndex];
    if (currentMeasureEl && currentMeasureEl.dataset.isSplit === 'true' && parseInt(UI.elements.timeSignature.value) === 4 && displayedBeats && displayedBeats.length === 8) {
        if (AppState.currentBeat < 4) {
            tempPartIdx = 1;
        } else {
            tempMeasureIdx = (currentMeasureIndex + 1);
            tempPartIdx = 0;
        }
    } else {
        tempMeasureIdx = (currentMeasureIndex + 1);
        tempPartIdx = 0;
    }

    while (displayCount < 4) {
        if (AppState.loopingActive && AppState.loopStartMeasure !== -1 && AppState.loopEndMeasure !== -1) {
            if (tempMeasureIdx > AppState.loopEndMeasure || tempMeasureIdx < AppState.loopStartMeasure) {
                tempMeasureIdx = AppState.loopStartMeasure;
                tempPartIdx = 0;
            }
        } else {
            if (tempMeasureIdx >= measures.length) {
                if (measures.length === 0) break;
                tempMeasureIdx = 0;
                tempPartIdx = 0;
            }
        }

        if (tempMeasureIdx >= measures.length) break;

        const measureElement = measures[tempMeasureIdx];
        if (!measureElement) break;

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
        tempMeasureIdx++;
        tempPartIdx = 0;
        if (displayCount >= 4) break;
        if (measures.length > 0 && tempMeasureIdx === currentMeasureIndex && !AppState.loopingActive && measures.length > 1 && upcomingChords.length >= measures.length * (isSplit ? 2:1) ) break;
        if (AppState.loopingActive && tempMeasureIdx > AppState.loopEndMeasure && AppState.loopStartMeasure === AppState.loopEndMeasure && upcomingChords.length > 0) break;
    }
    nextChordDisplayElement.textContent = upcomingChords.length > 0 ? `Next: ${upcomingChords.join(', ')}` : "";
}


export function loadProgression(progressionName, overrideKey = null, isUserSong = false) {
    setCurrentFunctionalProgression([]);

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
        if (UI.elements.measures) UI.elements.measures.innerHTML = '<p>Select a progression.</p>';
        if (songTitleElem) songTitleElem.textContent = "";
        if (songDescElem) songDescElem.textContent = "";
        if (UI.elements.scaleDisplay) UI.elements.scaleDisplay.textContent = "Select a progression and key.";
        updateNextChordDisplay();
        _resetLoop();
        return;
    }

    setCurrentProgressionName(progressionName);
    setCurrentFunctionalProgression(progressionData.progression);

    const targetGlobalKey = overrideKey || progressionData.defaultKey || "C";
    const originalSongDefaultKey = progressionData.defaultKey || "C";

    const originalSongDefaultKeyRoot = standardizeNoteName(originalSongDefaultKey.replace('m', ''));
    const targetGlobalKeyRoot = standardizeNoteName(targetGlobalKey.replace('m', ''));

    if (songTitleElem) songTitleElem.textContent = progressionData.displayName || progressionName.replace(/_/g, ' ');
    if (songDescElem) songDescElem.textContent = progressionData.description || "";
    if (UI.elements.keySelect) UI.elements.keySelect.value = targetGlobalKey;

    if (UI.elements.measures) UI.elements.measures.innerHTML = '';
    _resetLoop();

    currentFunctionalProgression.forEach((rawChordStringFromDefinition, index) => {
        let partsToProcessBasedOnOriginalDefinition = [];
        let isSplitInOriginalDefinition = false;

        if (isUserSong && progressionData.parts && progressionData.parts[index] && progressionData.splitStatus) {
            isSplitInOriginalDefinition = progressionData.splitStatus[index];
            progressionData.parts[index].forEach(userPartData => {
                const parsedOriginal = parseRomanNumeralToAbsoluteChord(userPartData.originalRoman || `${userPartData.root}${userPartData.quality}`, originalSongDefaultKey);
                partsToProcessBasedOnOriginalDefinition.push({
                    parsedInOriginalContext: parsedOriginal,
                    originalScaleRoot: userPartData.scaleRoot,
                    originalScaleType: userPartData.scaleType
                });
            });
        } else {
            const potentialSplit = rawChordStringFromDefinition.split('/');
            if (potentialSplit.length === 2 &&
                !parseChord(rawChordStringFromDefinition) &&
                parseChord(potentialSplit[0].trim()) && parseChord(potentialSplit[1].trim())) {
                isSplitInOriginalDefinition = true;
                partsToProcessBasedOnOriginalDefinition.push({
                    parsedInOriginalContext: parseRomanNumeralToAbsoluteChord(potentialSplit[0].trim(), originalSongDefaultKey)
                });
                partsToProcessBasedOnOriginalDefinition.push({
                    parsedInOriginalContext: parseRomanNumeralToAbsoluteChord(potentialSplit[1].trim(), originalSongDefaultKey)
                });
            } else {
                isSplitInOriginalDefinition = false;
                partsToProcessBasedOnOriginalDefinition.push({
                    parsedInOriginalContext: parseRomanNumeralToAbsoluteChord(rawChordStringFromDefinition, originalSongDefaultKey)
                });
            }
        }

        let finalPartsDataForMeasure = [];
        partsToProcessBasedOnOriginalDefinition.forEach(originalPart => {
            const parsedChord = originalPart.parsedInOriginalContext;
            if (!parsedChord || !parsedChord.root || !parsedChord.quality) {
                console.error("Invalid parsed chord in originalPart for transposition:", originalPart);
                return; // Skip this part if invalid
            }
            const finalTransposedChord = globalThis.transposeChordData(parsedChord, originalSongDefaultKeyRoot, targetGlobalKeyRoot);

            let finalScaleRoot, finalScaleType;
            if (originalPart.originalScaleRoot && originalPart.originalScaleType) {
                const originalScaleRootData = { root: originalPart.originalScaleRoot, quality: 'maj' };
                const transposedScaleRootInfo = globalThis.transposeChordData(originalScaleRootData, originalSongDefaultKeyRoot, targetGlobalKeyRoot);
                finalScaleRoot = transposedScaleRootInfo.root;
                finalScaleType = originalPart.originalScaleType;
            } else {
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

        if (isSplitInOriginalDefinition && finalPartsDataForMeasure.length === 1 && finalPartsDataForMeasure[0]) {
            finalPartsDataForMeasure.push({ ...finalPartsDataForMeasure[0] });
        }

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
            addMeasure('C', 'maj7', 'C', 'major', true, {root: 'G', quality: 'dom7', scaleRoot: 'G', scaleType: 'mixolydian'});
        } else {
            addMeasure('C', 'maj7', 'C', 'major', false, null);
        }
    });

    updateMeasureNumbers();
    addFirstChordListener();
    updateNextChordDisplay();
    log(`Loaded ${isUserSong ? 'user song' : 'standard progression'}: ${progressionName} in key ${targetGlobalKey}`);
}

export function updateProgressionKey(newKey) {
    if (!currentFunctionalProgression || currentFunctionalProgression.length === 0 || !UI.elements.measures || UI.elements.measures.children.length === 0) {
        const targetGlobalKeyRoot_noProg = standardizeNoteName(newKey.replace('m', ''));
        const initialTuning = TUNINGS[UI.elements.chordTuning.value];
        let defaultScaleType = 'major';
        const firstMeasure = UI.elements.measures?.children[0];
        const firstMeasurePartForDefault = firstMeasure?.querySelector('.measure-part');
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

    const songDataForOriginalKey = progressions[currentProgressionName] ||
                                  JSON.parse(localStorage.getItem('userBebopProgressions') || '{}')[currentProgressionName];

    if (!songDataForOriginalKey || !songDataForOriginalKey.defaultKey) {
        console.warn(`Cannot re-key progression '${currentProgressionName}': Original defaultKey missing.`);
        const firstMeasure = UI.elements.measures.children[0];
        const previousGlobalKey = firstMeasure?.dataset.lastKeyContext || newKey;
        const previousGlobalKeyRoot = standardizeNoteName(previousGlobalKey.replace('m', ''));
        const newTargetGlobalKeyRoot_fallback = standardizeNoteName(newKey.replace('m', ''));
        Array.from(UI.elements.measures.children).forEach((measureElement) => {
            measureElement.querySelectorAll('.measure-part').forEach(partElement => {
                const currentRoot = partElement.querySelector('.root-note').value;
                const currentQuality = partElement.querySelector('.chord-quality').value;
                const currentScaleRoot = partElement.querySelector('.second-key').value;
                const transposedChord = globalThis.transposeChordData({ root: currentRoot, quality: currentQuality }, previousGlobalKeyRoot, newTargetGlobalKeyRoot_fallback);
                const transposedScaleRootInfo = globalThis.transposeChordData({ root: currentScaleRoot, quality: 'maj' }, previousGlobalKeyRoot, newTargetGlobalKeyRoot_fallback);
                partElement.querySelector('.root-note').value = transposedChord.root;
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

    Array.from(UI.elements.measures.children).forEach((measureElement, measureIndex) => {
        if (measureIndex < currentFunctionalProgression.length) {
            const rawChordStringFromOriginalDefinition = currentFunctionalProgression[measureIndex];
            const measurePartsUI = measureElement.querySelectorAll('.measure-part');
            let originalPartsToProcess = [];
            if (isUserSongCurrentlyLoaded() && songDataForOriginalKey.parts && songDataForOriginalKey.parts[measureIndex]) {
                songDataForOriginalKey.parts[measureIndex].forEach(userPartData => {
                    const parsedOriginal = parseRomanNumeralToAbsoluteChord(userPartData.originalRoman || `${userPartData.root}${userPartData.quality}`, originalSongDefaultKey);
                    originalPartsToProcess.push({
                        parsedInOriginalContext: parsedOriginal,
                        originalScaleRoot: userPartData.scaleRoot,
                        originalScaleType: userPartData.scaleType
                    });
                });
            } else {
                const potentialSplit = rawChordStringFromOriginalDefinition.split('/');
                 if (potentialSplit.length === 2 && !parseChord(rawChordStringFromOriginalDefinition) && parseChord(potentialSplit[0].trim()) && parseChord(potentialSplit[1].trim())) {
                    originalPartsToProcess.push({ parsedInOriginalContext: parseRomanNumeralToAbsoluteChord(potentialSplit[0].trim(), originalSongDefaultKey) });
                    originalPartsToProcess.push({ parsedInOriginalContext: parseRomanNumeralToAbsoluteChord(potentialSplit[1].trim(), originalSongDefaultKey) });
                } else {
                    originalPartsToProcess.push({ parsedInOriginalContext: parseRomanNumeralToAbsoluteChord(rawChordStringFromOriginalDefinition, originalSongDefaultKey) });
                }
            }
            measurePartsUI.forEach((partElement, partIndex) => {
                if (partIndex < originalPartsToProcess.length) {
                    const originalPart = originalPartsToProcess[partIndex];
                    const transposedChord = globalThis.transposeChordData(originalPart.parsedInOriginalContext, originalSongDefaultKeyRoot, newTargetGlobalKeyRoot);
                    partElement.querySelector('.root-note').value = transposedChord.root;
                    partElement.querySelector('.chord-quality').value = transposedChord.quality;
                    let finalScaleRoot, finalScaleType;
                    if (originalPart.originalScaleRoot && originalPart.originalScaleType) {
                        const transposedScaleRootInfo = globalThis.transposeChordData({ root: originalPart.originalScaleRoot, quality: 'maj' }, originalSongDefaultKeyRoot, newTargetGlobalKeyRoot);
                        finalScaleRoot = transposedScaleRootInfo.root;
                        finalScaleType = originalPart.originalScaleType;
                    } else {
                        finalScaleRoot = transposedChord.root;
                        finalScaleType = suggestScaleForQuality(transposedChord.quality);
                    }
                    partElement.querySelector('.second-key').value = finalScaleRoot;
                    partElement.querySelector('.scale-select').value = finalScaleType;
                } else if (originalPartsToProcess.length > 0) {
                    const lastOriginalPart = originalPartsToProcess[originalPartsToProcess.length - 1];
                    const transposedChord = globalThis.transposeChordData(lastOriginalPart.parsedInOriginalContext, originalSongDefaultKeyRoot, newTargetGlobalKeyRoot);
                     partElement.querySelector('.root-note').value = transposedChord.root;
                    partElement.querySelector('.chord-quality').value = transposedChord.quality;
                    partElement.querySelector('.second-key').value = transposedChord.root;
                    partElement.querySelector('.scale-select').value = suggestScaleForQuality(transposedChord.quality);
                }
            });
        } else {
            const previousGlobalKey = measureElement.dataset.lastKeyContext || originalSongDefaultKey;
            const previousGlobalKeyRoot = standardizeNoteName(previousGlobalKey.replace('m', ''));
            measureElement.querySelectorAll('.measure-part').forEach(partElement => {
                const currentRoot = partElement.querySelector('.root-note').value;
                const currentQuality = partElement.querySelector('.chord-quality').value;
                const currentScaleRoot = partElement.querySelector('.second-key').value;
                const chordToTranspose = { root: currentRoot, quality: currentQuality };
                const transposedChord = globalThis.transposeChordData(chordToTranspose, previousGlobalKeyRoot, newTargetGlobalKeyRoot);
                partElement.querySelector('.root-note').value = transposedChord.root;
                const scaleRootToTranspose = {root: currentScaleRoot, quality: 'maj'};
                const transposedScale = globalThis.transposeChordData(scaleRootToTranspose, previousGlobalKeyRoot, newTargetGlobalKeyRoot);
                partElement.querySelector('.second-key').value = transposedScale.root;
            });
            measureElement.dataset.lastKeyContext = newKey;
        }
    });
    addFirstChordListener();
    updateNextChordDisplay();
    log(`Progression '${currentProgressionName}' re-keyed to: ${newKey}`);
}

export function isUserSongCurrentlyLoaded() {
    if (!currentProgressionName) return false;
    const userSongs = JSON.parse(localStorage.getItem('userBebopProgressions') || '{}');
    return userSongs.hasOwnProperty(currentProgressionName);
}


export function createMeasurePartHTML(data, partIndex = 0) {
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
    if (!measuresContainer) return;
    const newMeasureIndex = measuresContainer.children.length;

    const measureDiv = document.createElement('div');
    measureDiv.className = 'measure';
    measureDiv.dataset.measureIndex = newMeasureIndex;
    measureDiv.dataset.isSplit = isInitiallySplit ? 'true' : 'false';
    if (isInitiallySplit) measureDiv.classList.add('split-active');
    measureDiv.dataset.lastKeyContext = UI.elements.keySelect.value;

    let measureHTML = `<div class="measure-header"><span class="measure-number">${newMeasureIndex + 1}</span></div>`;
    measureHTML += createMeasurePartHTML({ root, quality, scaleRoot, scaleType }, 0);
    if (isInitiallySplit) {
        const spData = secondPartData || { root, quality, scaleRoot, scaleType };
        measureHTML += createMeasurePartHTML(spData, 1);
    }
    measureHTML += `<div class="measure-footer"><button class="split-measure-button">${isInitiallySplit ? 'Unsplit' : 'Split'}</button></div>`;
    measureDiv.innerHTML = measureHTML;
    measuresContainer.appendChild(measureDiv);

    measureDiv.querySelectorAll('select').forEach(selectElement => {
        selectElement.addEventListener('change', (event) => {
            handleMeasureControlChange(event.target.closest('.measure-part'), event.target);
        });
    });

    measureDiv.querySelector('.measure-header').addEventListener('click', (event) => {
        if (event.target.tagName !== 'SELECT' && event.target.tagName !== 'BUTTON') {
            toggleMeasureLoopSelection(newMeasureIndex);
        }
    });

    const splitButton = measureDiv.querySelector('.split-measure-button');
    const is44Time = parseInt(UI.elements.timeSignature.value) === 4;
    splitButton.disabled = !is44Time;
    splitButton.title = is44Time ? "" : "Splitting measures only available in 4/4 time.";
    splitButton.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleSplitMeasure(measureDiv);
    });

    updateMeasureNumbers();
    if (newMeasureIndex === 0) addFirstChordListener();
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

    if (isSplit) {
        measureDiv.querySelector('.measure-part[data-part-index="1"]')?.remove();
        measureDiv.dataset.isSplit = 'false';
        measureDiv.classList.remove('split-active');
        splitButton.textContent = 'Split';
    } else {
        if (!firstPart) return;
        const firstPartData = {
            root: firstPart.querySelector('.root-note').value,
            quality: firstPart.querySelector('.chord-quality').value,
            scaleRoot: firstPart.querySelector('.second-key').value,
            scaleType: firstPart.querySelector('.scale-select').value
        };
        measureDiv.querySelector('.measure-footer').insertAdjacentHTML('beforebegin', createMeasurePartHTML(firstPartData, 1));
        const newSecondPart = measureDiv.querySelector('.measure-part[data-part-index="1"]');
        newSecondPart.querySelectorAll('select').forEach(select => {
            select.addEventListener('change', (e) => handleMeasureControlChange(e.target.closest('.measure-part'), e.target));
        });
        measureDiv.dataset.isSplit = 'true';
        measureDiv.classList.add('split-active');
        splitButton.textContent = 'Unsplit';
    }
    updateNextChordDisplay();
    const currentActiveMeasure = UI.elements.measures.querySelector('.measure.active');
    if (currentActiveMeasure === measureDiv) {
        const activePart = measureDiv.querySelector('.measure-part.part-active') || firstPart;
        if (activePart) handleMeasureControlChange(activePart, activePart.querySelector('select'));
    }
}


export function removeMeasure() {
    const measuresChildren = UI.elements.measures?.children;
    if (!measuresChildren || measuresChildren.length === 0) return;

    const removedMeasureIndex = measuresChildren.length - 1;
    if (AppState.loopStartMeasure === removedMeasureIndex || AppState.loopEndMeasure === removedMeasureIndex) {
        _resetLoop();
    }
    if (AppState.loopEndMeasure >= measuresChildren.length -1 ) {
        AppState.loopEndMeasure = Math.max(-1, measuresChildren.length - 2);
        if (AppState.loopStartMeasure > AppState.loopEndMeasure) AppState.loopStartMeasure = AppState.loopEndMeasure;
        if (AppState.loopStartMeasure === -1 && AppState.loopEndMeasure > -1) AppState.loopStartMeasure = AppState.loopEndMeasure;
         if (AppState.loopStartMeasure === -1 && AppState.loopEndMeasure === -1 && AppState.loopingActive) _toggleLoopingMode();
    }
    measuresChildren[measuresChildren.length - 1].remove();
    updateMeasureNumbers();
    if (measuresChildren.length > 0) {
        addFirstChordListener();
    } else {
        if (UI.elements.scaleDisplay) UI.elements.scaleDisplay.textContent = "Select a progression and key.";
        _resetLoop();
    }
    updateNextChordDisplay();
    log('Removed last measure');
}

export function updateMeasureNumbers() {
    if (!UI.elements.measures) return;
    Array.from(UI.elements.measures.children).forEach((measure, index) => {
        const numEl = measure.querySelector('.measure-number');
        if (numEl) numEl.textContent = index + 1;
        measure.dataset.measureIndex = index;
    });
}

export function handleMeasureControlChange(measurePartDiv, changedElement) {
    if (!measurePartDiv) return;
    const rootSelect = measurePartDiv.querySelector('.root-note');
    const qualitySelect = measurePartDiv.querySelector('.chord-quality');
    const scaleKeySelect = measurePartDiv.querySelector('.second-key');
    const scaleTypeSelect = measurePartDiv.querySelector('.scale-select');

    if (!rootSelect || !qualitySelect || !scaleKeySelect || !scaleTypeSelect) return;


    if (changedElement.classList.contains('root-note') || changedElement.classList.contains('chord-quality')) {
        scaleKeySelect.value = rootSelect.value;
        scaleTypeSelect.value = suggestScaleForQuality(qualitySelect.value);
    }

    updateFretboardNotes(
        UI.elements.chordFretboard,
        scaleKeySelect.value,
        scaleTypeSelect.value,
        TUNINGS[UI.elements.chordTuning.value],
        measurePartDiv
    );

    if (AppState.guideTonesActive) _highlightGuideTones(measurePartDiv);
    updateNextChordDisplay();
}


export function saveCurrentProgression() {
    if (!UI.elements.measures) return;
    const measures = Array.from(UI.elements.measures.children);
    if (measures.length === 0) {
        alert("No progression to save!");
        return;
    }
    let suggestedName = "My Custom Song";
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
    const keyForSaving = UI.elements.keySelect.value;
    const savedProgressionData = {
        progression: [], parts: [], splitStatus: [],
        defaultKey: keyForSaving,
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
            const qualityValue = partEl.querySelector('.chord-quality').value;
            const scaleRoot = partEl.querySelector('.second-key').value;
            const scaleType = partEl.querySelector('.scale-select').value;
            const qualityOption = partEl.querySelector(`.chord-quality option[value="${qualityValue}"]`);
            const qualityDisplayText = qualityOption ? qualityOption.textContent : qualityValue;
            const absoluteChordStringForStorage = `${root}${qualityDisplayText}`;
            measurePartsDataForStorage.push({
                root: root, quality: qualityValue,
                originalRoman: absoluteChordStringForStorage,
                scaleRoot: scaleRoot, scaleType: scaleType
            });
            if (partIdx > 0) measureCombinedString += " / ";
            measureCombinedString += absoluteChordStringForStorage;
        });
        savedProgressionData.parts.push(measurePartsDataForStorage);
        savedProgressionData.progression.push(measureCombinedString);
    });
    const userSongs = JSON.parse(localStorage.getItem('userBebopProgressions') || '{}');
    userSongs[progressionNameInput] = savedProgressionData;
    localStorage.setItem('userBebopProgressions', JSON.stringify(userSongs));
    populateUserSongsDropdown();
    UI.elements.userProgressionSelect.value = progressionNameInput;
    setCurrentProgressionName(progressionNameInput);
    setCurrentFunctionalProgression(savedProgressionData.progression);
    alert(`Progression "${progressionNameInput}" saved!`);
    log(`User progression saved: ${progressionNameInput} with defaultKey: ${keyForSaving}`);
}

export function populateUserSongsDropdown() {
    const selectElement = UI.elements.userProgressionSelect;
    if (!selectElement) return;
    selectElement.innerHTML = '<option value="">-- Select a saved song --</option>';
    const userSongs = JSON.parse(localStorage.getItem('userBebopProgressions') || '{}');
    Object.keys(userSongs).sort().forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = userSongs[name].displayName || name;
        selectElement.appendChild(option);
    });
}

export function deleteSelectedUserSong() {
    const selectedSongName = UI.elements.userProgressionSelect.value;
    if (!selectedSongName) {
        alert("Please select a saved song to delete.");
        return;
    }
    const selectedSongDisplayName = UI.elements.userProgressionSelect.options[UI.elements.userProgressionSelect.selectedIndex].text;
    if (confirm(`Are you sure you want to delete "${selectedSongDisplayName}"? This cannot be undone.`)) {
        const userSongs = JSON.parse(localStorage.getItem('userBebopProgressions') || '{}');
        delete userSongs[selectedSongName];
        localStorage.setItem('userBebopProgressions', JSON.stringify(userSongs));
        populateUserSongsDropdown();
        if (currentProgressionName === selectedSongName) {
            if (UI.elements.measures) UI.elements.measures.innerHTML = '<p>Select a progression.</p>';
            if(UI.elements.currentSongTitleFretboard) UI.elements.currentSongTitleFretboard.textContent = "";
            if(UI.elements.currentSongDescriptionFretboard) UI.elements.currentSongDescriptionFretboard.textContent = "";
            setCurrentProgressionName("");
            setCurrentFunctionalProgression([]);
            _resetLoop();
        }
        alert(`Song "${selectedSongDisplayName}" deleted.`);
        log(`User song deleted: ${selectedSongName}`);
    }
}


export function initializeFretFlow() {
    const fretboardsGrid = UI.elements.fretboardsGrid;
    if (!fretboardsGrid) { console.error("FretFlow grid not found."); return; }
    fretboardsGrid.innerHTML = '';
    for (let i = 0; i < 4; i++) {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'fretboard-section';
        sectionDiv.innerHTML = `
            <div class="fretboard-controls">
                <div class="control-group"><label for="ff-key-${i}">Key:</label><select id="ff-key-${i}" class="fretflow-key">${createKeyOptions()}</select></div>
                <div class="control-group"><label for="ff-scale-${i}">Scale:</label><select id="ff-scale-${i}" class="fretflow-scale">${createScaleOptions()}</select></div>
                <div class="control-group"><label for="ff-tuning-${i}">Tuning:</label><select id="ff-tuning-${i}" class="tuning-select">
                    <option value="standard">Std</option><option value="dropD">DropD</option><option value="openG">OpG</option>
                    <option value="DADGAD">DADGAD</option><option value="openE">OpE</option></select></div>
            </div>
            <div class="scale-display" id="ff-scale-display-${i}"></div>
            <div id="ff-fretboard-${i}" class="fretboard"></div>`;
        fretboardsGrid.appendChild(sectionDiv);
        const fretboardEl = sectionDiv.querySelector(`#ff-fretboard-${i}`);
        const keySelect = sectionDiv.querySelector(`#ff-key-${i}`);
        const scaleSelect = sectionDiv.querySelector(`#ff-scale-${i}`);
        const tuningSelect = sectionDiv.querySelector(`#ff-tuning-${i}`);
        const scaleDisplay = sectionDiv.querySelector(`#ff-scale-display-${i}`);
        const updateDisplay = () => {
            const tuningArr = TUNINGS[tuningSelect.value] || TUNINGS.standard;
            scaleDisplay.textContent = `${keySelect.value} ${scaleSelect.options[scaleSelect.selectedIndex].text}`;
            createFretboard(fretboardEl, tuningArr);
            updateFretboardNotes(fretboardEl, keySelect.value, scaleSelect.value, tuningArr);
        };
        [keySelect, scaleSelect, tuningSelect].forEach(el => el.addEventListener('change', updateDisplay));
        updateDisplay();
    }
    log("FretFlow initialized.");
}


export function addFirstChordListener() {
    if (!UI.elements.measures) return;
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
                        firstMeasurePart
                    );
                }
            };
            updateFunc();
        }
    } else {
        updateFretboardNotes(UI.elements.chordFretboard, "C", "major", TUNINGS[UI.elements.chordTuning.value]);
        if (UI.elements.scaleDisplay) UI.elements.scaleDisplay.textContent = "C Major (Default)";
    }
}
