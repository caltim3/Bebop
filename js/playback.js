import { AppState, currentDrumSetIndex, previousPlayedVoicingNotesWithOctaves, setPreviousPlayedVoicingNotesWithOctaves } from './state.js';
import { UI, updateFretboardNotes, updateNextChordDisplay, _highlightGuideTones } from './ui.js'; // Assuming _highlightGuideTones is now in ui.js
import { AudioContextManager } from './audio.js';
import { TUNINGS, drumSoundSets, RHYTHMIC_STYLES } from './constants.js';
import { getChordNotes, getBestVoicing_VoiceLed, log } from './utils.js';


export function playChordInstance(notesWithOctavesToPlay, instanceStartTime, instanceDuration, connectToGainNode) {
    if (!AudioContextManager.context || !AudioContextManager.samplesLoaded) return;
    if (!notesWithOctavesToPlay || notesWithOctavesToPlay.length === 0) {
        // console.warn("playChordInstance: No notes to play.");
        return;
    }

    notesWithOctavesToPlay.forEach(noteWithOctave => {
        const match = noteWithOctave.match(/^([A-G][#bs]?)(\d)$/i);
        if (!match) {
            console.warn(`Invalid note format in playChordInstance: ${noteWithOctave}`);
            return;
        }
        // standardizeNoteNameForSamples handles conversion to sample file names (e.g. Db -> cs)
        let [, pitchClass, octaveStr] = match;
        const samplePitchClass = standardizeNoteNameForSamples(pitchClass); 
        
        // Ensure octave is within the range of available samples
        const finalSampleOctave = Math.max(OCTAVES_FOR_SAMPLES[0], Math.min(OCTAVES_FOR_SAMPLES[OCTAVES_FOR_SAMPLES.length - 1], parseInt(octaveStr)));

        const sampleKey = `${samplePitchClass}${finalSampleOctave}`;
        const buffer = AudioContextManager.pianoSampleBuffers[sampleKey];

        if (!buffer) {
            // console.warn(`Piano sample not found for chord note: ${sampleKey} (original: ${noteWithOctave})`);
            return;
        }

        try {
            const source = AudioContextManager.context.createBufferSource();
            source.buffer = buffer;
            source.connect(connectToGainNode); // Connect to the chord's master gain node

            // Slight random timing offset for a more natural feel ("strum")
            const timingVariance = Math.random() * 0.03; // up to 30ms
            source.start(instanceStartTime + timingVariance);
            // Stop the note after its duration, adjusted by the same variance
            source.stop(instanceStartTime + instanceDuration + timingVariance);
        } catch (e) {
            console.error(`Error playing sample ${sampleKey}:`, e);
        }
    });
}

export async function playChord(root, quality, startTime, duration) {
    if (!UI.elements.chordsEnabled.classList.contains('active') || !AudioContextManager.samplesLoaded) {
        setPreviousPlayedVoicingNotesWithOctaves(null); // Clear previous voicing if chords disabled
        return;
    }
    await AudioContextManager.ensureAudioContext(); // Ensure context is active
    if (!AudioContextManager.context) {
        console.error("AudioContext not available in playChord");
        return;
    }

    const baseNotesInRootPosition = getChordNotes(root, quality);
    if (!baseNotesInRootPosition || baseNotesInRootPosition.length === 0) {
        console.warn(`Cannot play chord for ${root}${quality}: No notes found.`);
        setPreviousPlayedVoicingNotesWithOctaves(null);
        return;
    }

    const overallVolume = parseFloat(UI.elements.chordVolume.value) * 0.7; // Apply master chord volume
    if (overallVolume <= 0.001) { // Effectively silent
        setPreviousPlayedVoicingNotesWithOctaves(null);
        return;
    }

    // Fade out previous chord if it's still playing
    if (AudioContextManager.currentChordGain) {
        try {
            // Check if gain.value is a valid number before trying to use it
            if (typeof AudioContextManager.currentChordGain.gain.value === 'number' && isFinite(AudioContextManager.currentChordGain.gain.value)) {
                AudioContextManager.currentChordGain.gain.setValueAtTime(AudioContextManager.currentChordGain.gain.value, startTime);
                AudioContextManager.currentChordGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05); // Quick fade
            } else {
                 // If gain.value is not valid, just set to a low value to ensure it stops
                AudioContextManager.currentChordGain.gain.setValueAtTime(0.001, startTime + 0.05);
            }
        } catch (e) { console.warn("Error fading out previous chord gain:", e); }
    }

    // Create a new master gain node for this chord instance
    const chordMasterGain = AudioContextManager.context.createGain();
    chordMasterGain.gain.setValueAtTime(0, startTime); // Start silent
    chordMasterGain.gain.linearRampToValueAtTime(overallVolume, startTime + 0.02); // Quick fade in

    // Connect to reverb if active
    if (AudioContextManager.reverbNode && AudioContextManager.reverbAmount > 0.001) {
        const dryGain = AudioContextManager.context.createGain();
        const wetGain = AudioContextManager.context.createGain();
        dryGain.gain.value = 1.0; // Full dry signal
        wetGain.gain.value = AudioContextManager.reverbAmount; // Reverb mix

        chordMasterGain.connect(dryGain);
        dryGain.connect(AudioContextManager.context.destination);
        
        chordMasterGain.connect(wetGain);
        wetGain.connect(AudioContextManager.reverbNode);

        // Ensure reverb node is connected to destination (should be handled in setupReverb too)
        if (!AudioContextManager.reverbNodeConnected && AudioContextManager.context.destination) {
            try { AudioContextManager.reverbNode.disconnect(); } catch(e) { /* ignore if not connected */ } 
            AudioContextManager.reverbNode.connect(AudioContextManager.context.destination);
            AudioContextManager.reverbNodeConnected = true;
        }
    } else { // No reverb, connect directly
        chordMasterGain.connect(AudioContextManager.context.destination);
    }
    AudioContextManager.currentChordGain = chordMasterGain; // Store for next chord's fade out

    // Get the first voicing for the chord (initial hit)
    const firstVoicingNotesWithOctaves = getBestVoicing_VoiceLed(
        baseNotesInRootPosition,
        quality,
        previousPlayedVoicingNotesWithOctaves, // Pass previous voicing for voice leading
        PLAYBACK_OCTAVES // Target octave range from constants
    );

    if (!firstVoicingNotesWithOctaves || firstVoicingNotesWithOctaves.length === 0) {
        console.warn("getBestVoicing_VoiceLed returned no notes for first hit.");
        setPreviousPlayedVoicingNotesWithOctaves(null);
        return;
    }
    
    playChordInstance(firstVoicingNotesWithOctaves, startTime, duration / 2, chordMasterGain); // Play first half
    setPreviousPlayedVoicingNotesWithOctaves([...firstVoicingNotesWithOctaves]); // Update for next call

    // If the chord duration is long enough (e.g., a full measure), play a second rhythmic hit/re-articulation
    const beatDurationSec = 60 / AppState.tempo;
    const timeSigNum = parseInt(UI.elements.timeSignature.value);
    // Heuristic: if chord lasts more than ~2.5 beats in 4/4, or more than half the bar in other meters
    const isLikelyFullMeasureChord = (timeSigNum === 4 && duration > (beatDurationSec * 2.5)) || 
                                     (timeSigNum !== 4 && duration > (beatDurationSec * (timeSigNum / 2 + 0.5)));

    if (isLikelyFullMeasureChord) {
        const secondVoicingNotesWithOctaves = getBestVoicing_VoiceLed(
            baseNotesInRootPosition,
            quality,
            firstVoicingNotesWithOctaves, // Voice lead from the first hit of *this* chord
            PLAYBACK_OCTAVES,
            true // Allow more variation for this rhythmic hit
        );
        if (!secondVoicingNotesWithOctaves || secondVoicingNotesWithOctaves.length === 0) {
             console.warn("getBestVoicing_VoiceLed returned no notes for second hit.");
        } else {
            const secondHitStartTime = startTime + duration / 2; // Play in the second half of the duration
            playChordInstance(secondVoicingNotesWithOctaves, secondHitStartTime, duration / 2, chordMasterGain);
            // Optionally, update previousPlayedVoicingNotesWithOctaves to this second voicing if you want the *next* chord
            // to voice-lead from this re-articulation. For now, it voice-leads from the initial hit.
        }
    }
}
        
export async function playMetronomeSound(volumeForThisTick, soundsForThisTickString) { 
    if (!AudioContextManager.context || !soundsForThisTickString) return;

    const metronomeOverallVolume = parseFloat(UI.elements.metronomeVolume.value);
    const selectedSoundType = UI.elements.soundType.value; // "click", "woodblock", "drums"

    const soundsToPlayArray = soundsForThisTickString.split(',');
    
    // Determine if this beat is styled as a strong beat for accent intensity
    const beatElement = UI.elements.beatsContainer.querySelector(`.beat[data-beat="${AppState.currentBeat}"]`);
    const isStrongStyledBeat = beatElement ? (parseFloat(beatElement.dataset.baseVolume) >= 0.9) : false; // Heuristic for "strong"
    const accentMultiplier = isStrongStyledBeat ? parseFloat(UI.elements.accentIntensity?.value || 1.0) : 1.0;

    for (let soundKey of soundsToPlayArray) {
        soundKey = soundKey.trim();
        if (soundKey === 'silent') continue;

        let bufferToPlay;
        let effectiveSoundKey = soundKey; // This might change if using drum sets
        let soundSpecificMixLevel = 1.0; // For individual drum instrument volumes

        if (selectedSoundType === 'drums') { 
            const currentDrumSet = drumSoundSets[currentDrumSetIndex];
            let soundFilename;
            switch (soundKey) { // soundKey here refers to 'kick', 'snare', 'hihat' from RHYTHMIC_STYLES
                case 'kick':
                    soundFilename = currentDrumSet.kick; // e.g., "drumsamples/Kick.wav"
                    if (UI.elements.kickVolume) soundSpecificMixLevel = parseFloat(UI.elements.kickVolume.value);
                    break;
                case 'snare':
                    soundFilename = currentDrumSet.snare;
                    if (UI.elements.snareVolume) soundSpecificMixLevel = parseFloat(UI.elements.snareVolume.value);
                    break;
                case 'hihat':
                    soundFilename = currentDrumSet.hihat;
                    if (UI.elements.hihatVolume) soundSpecificMixLevel = parseFloat(UI.elements.hihatVolume.value);
                    break;
                default: // If soundKey is not kick/snare/hihat, fallback to click
                    effectiveSoundKey = 'click'; 
                    soundFilename = null; // Will use AudioContextManager.soundBuffers['click']
                    soundSpecificMixLevel = 1.0; 
                    break;
            }

            if (soundFilename) { // We have a specific drum sample filename
                effectiveSoundKey = soundFilename; // Use the filename as the key for soundBuffers
                // Load on-the-fly if not already in soundBuffers (should be preloaded by loadSecondarySounds for defaults)
                if (!AudioContextManager.soundBuffers[soundFilename]) {
                    try {
                        // Path relative to index.html
                        const response = await fetch(`./main/${soundFilename}`); 
                        if (!response.ok) throw new Error(`HTTP ${response.status} for ${soundFilename}`);
                        const arrayBuffer = await response.arrayBuffer();
                        AudioContextManager.soundBuffers[soundFilename] = await AudioContextManager.context.decodeAudioData(arrayBuffer);
                    } catch (e) {
                        console.error(`Failed to load drum sample ${soundFilename} on-the-fly:`, e);
                        // Fallback to generic soundKey (e.g. 'kick' if 'drumsamples/Kick.wav' failed) or 'click'
                        bufferToPlay = AudioContextManager.soundBuffers[soundKey] || AudioContextManager.soundBuffers['click'];
                        effectiveSoundKey = soundKey; // Revert to generic key
                    }
                }
                bufferToPlay = AudioContextManager.soundBuffers[soundFilename];
            } else { // No specific drum filename (e.g., fallback to 'click')
                 bufferToPlay = AudioContextManager.soundBuffers[effectiveSoundKey] || AudioContextManager.soundBuffers['click'];
            }
        } else { // Not "drums" sound type (i.e., "click" or "woodblock")
            effectiveSoundKey = selectedSoundType; // Use "click" or "woodblock" as the key
            bufferToPlay = AudioContextManager.soundBuffers[selectedSoundType] || AudioContextManager.soundBuffers['click']; // Fallback to click
            soundSpecificMixLevel = 1.0; // No individual mix for non-drumset sounds
        }

        if (!bufferToPlay) {
            console.warn(`No buffer found for sound: ${effectiveSoundKey}`);
            continue;
        }
        
        let actualFinalVolume = metronomeOverallVolume * volumeForThisTick * soundSpecificMixLevel * accentMultiplier;
        actualFinalVolume = Math.min(Math.max(actualFinalVolume, 0), 1.0); // Clamp volume

        if (actualFinalVolume <= 0.001) continue; // Effectively silent

        const source = AudioContextManager.context.createBufferSource();
        source.buffer = bufferToPlay;
        const gainNode = AudioContextManager.context.createGain();

        gainNode.gain.setValueAtTime(actualFinalVolume, AudioContextManager.context.currentTime);
        source.connect(gainNode);
        
        // Connect metronome sounds (drums only for now) to reverb slightly
        if (selectedSoundType === 'drums' && AudioContextManager.reverbNode && AudioContextManager.reverbAmount > 0.01) {
            const reverbSendGain = AudioContextManager.context.createGain();
            // Send a small amount of the drum sound to reverb
            reverbSendGain.gain.setValueAtTime(0.05 * AudioContextManager.reverbAmount, AudioContextManager.context.currentTime); 
            gainNode.connect(reverbSendGain); 
            reverbSendGain.connect(AudioContextManager.reverbNode);
            // Ensure reverb node is connected (should be done in setupReverb too)
            if (!AudioContextManager.reverbNodeConnected && AudioContextManager.context.destination) {
                 try { AudioContextManager.reverbNode.disconnect(); } catch(e) {}
                 AudioContextManager.reverbNode.connect(AudioContextManager.context.destination);
                 AudioContextManager.reverbNodeConnected = true;
            }
        } else {
            gainNode.connect(AudioContextManager.context.destination); // Connect directly if no reverb
        }
        source.start(AudioContextManager.context.currentTime);
    }
}


export async function playBeat() {
    const beatsUI = UI.elements.beatsContainer.querySelectorAll('.beat');
    const measures = UI.elements.measures.children;
    if (beatsUI.length === 0) return; // No UI beats to play

    const timeSignatureNum = parseInt(UI.elements.timeSignature.value);
    const selectedSoundType = UI.elements.soundType.value;
    // Rhythmic styles apply mainly to 4/4 drums
    const isDrumStyleActive = selectedSoundType === 'drums' && timeSignatureNum === 4;
    const activeStyleKey = isDrumStyleActive ? AppState.currentRhythmicStyle : "quarterNotes"; // Default to quarter notes
    const activeStyle = RHYTHMIC_STYLES[activeStyleKey] || RHYTHMIC_STYLES.quarterNotes; // Fallback

    // Update UI for active beat
    beatsUI.forEach(b => b.classList.remove('active'));
    const currentUIBeatElement = beatsUI[AppState.currentBeat]; 
    if (currentUIBeatElement) {
        currentUIBeatElement.classList.add('active');
    }
    
    // Determine sound and volume for this tick
    // Priority: User-clicked beat UI > Rhythmic Style Pattern > Default silence
    let soundToPlay, volumeToPlay;

    if (currentUIBeatElement) { // Sound defined by user click on UI beat
        soundToPlay = currentUIBeatElement.dataset.sound;
        volumeToPlay = parseFloat(currentUIBeatElement.dataset.volume);
    } else if (activeStyle.pattern[AppState.currentStylePatternBeat]) { // Sound from rhythmic style
        const stylePatternData = activeStyle.pattern[AppState.currentStylePatternBeat];
        soundToPlay = stylePatternData.sound;
        volumeToPlay = stylePatternData.volume;
    } else { // Fallback if no UI element and no style pattern data (should be rare)
        soundToPlay = 'silent';
        volumeToPlay = 0;
    }
    
    // Play the metronome sound if not silent
    if (volumeToPlay > 0 || (selectedSoundType === 'drums' && soundToPlay !== 'silent') ) { 
        await playMetronomeSound(volumeToPlay, soundToPlay); 
    }

    // Handle chord playback and fretboard updates
    if (measures.length > 0) {
        let measureToPlayIndex = AppState.currentMeasure;
         // Handle looping
         if (AppState.loopingActive && AppState.loopStartMeasure !== -1 && AppState.loopEndMeasure !== -1) {
            // If current measure is outside loop range, jump to loop start
            if (AppState.currentMeasure < AppState.loopStartMeasure || AppState.currentMeasure > AppState.loopEndMeasure) {
                AppState.currentMeasure = AppState.loopStartMeasure;
            }
            measureToPlayIndex = AppState.currentMeasure; // Use the (potentially corrected) currentMeasure
        }

        const currentMeasureElement = measures[measureToPlayIndex];
        if (currentMeasureElement) {
            // Visual feedback for active measure
            Array.from(measures).forEach((m, idx) => m.classList.toggle('active', idx === measureToPlayIndex));
            
            const isSplitMeasure = currentMeasureElement.dataset.isSplit === 'true';
            const is44Time = timeSignatureNum === 4; 
            const numDisplayedBeats = beatsUI.length; // e.g., 8 for 4/4 eighths, 4 for 4/4 quarters

            let activePartIndex = 0; // Default to first part of the measure
            let playChordOnThisBeat = AppState.currentBeat === 0; // Play chord on downbeat by default

            // For split 4/4 measures displayed with 8th notes
            if (is44Time && isSplitMeasure && numDisplayedBeats === 8) {
                activePartIndex = (AppState.currentBeat < 4) ? 0 : 1; // Part 0 for beats 0-3, Part 1 for beats 4-7
                playChordOnThisBeat = (AppState.currentBeat === 0 || AppState.currentBeat === 4); // Play on downbeat of each part
            }
            
            // Visual feedback for active part within the measure
            currentMeasureElement.querySelectorAll('.measure-part').forEach((part, idx) => {
                part.classList.toggle('part-active', idx === activePartIndex);
            });

            const activeMeasurePart = currentMeasureElement.querySelectorAll('.measure-part')[activePartIndex];
            if (activeMeasurePart && playChordOnThisBeat) { 
                const root = activeMeasurePart.querySelector('.root-note')?.value;
                const quality = activeMeasurePart.querySelector('.chord-quality')?.value;
                const scaleRoot = activeMeasurePart.querySelector('.second-key')?.value;
                const scaleType = activeMeasurePart.querySelector('.scale-select')?.value;

                if (root && quality && scaleRoot && scaleType) {
                    const tuning = TUNINGS[UI.elements.chordTuning.value];
                    updateFretboardNotes(UI.elements.chordFretboard, scaleRoot, scaleType, tuning, activeMeasurePart);
                    if (AppState.guideTonesActive) _highlightGuideTones(activeMeasurePart); // Use local _highlightGuideTones
                    
                    const beatDurationSec = 60 / AppState.tempo;
                    // Duration for the chord playback
                    let chordPlayDurationSec = beatDurationSec * (timeSignatureNum === 4 && numDisplayedBeats === 8 ? 4 : timeSignatureNum) ; // Default: full measure
                    if (is44Time && isSplitMeasure && numDisplayedBeats === 8) { // Half measure for split 4/4
                         chordPlayDurationSec = beatDurationSec * 2; // 2 main beats (4 eighths)
                    }
                    await playChord(root, quality, AudioContextManager.context.currentTime, chordPlayDurationSec);
                }
            }
        }
    }

    // Advance beat counters
    AppState.currentBeat = (AppState.currentBeat + 1) % beatsUI.length; // Cycle through UI beats
    AppState.currentStylePatternBeat = (AppState.currentStylePatternBeat + 1) % activeStyle.beatsPerPattern; // Cycle through style pattern

    // Advance measure if UI beat cycle completes (i.e., on the next "1")
    if (AppState.currentBeat === 0) { 
        // For multi-bar patterns like Clave
        AppState.currentStyleBar = (AppState.currentStyleBar + 1) % (activeStyle.beatsPerPattern / beatsUI.length || 1); 

        if (AppState.loopingActive && AppState.loopStartMeasure !== -1 && AppState.loopEndMeasure !== -1) {
            // If at end of loop, go to start; otherwise increment
            AppState.currentMeasure = (AppState.currentMeasure >= AppState.loopEndMeasure) ? AppState.loopStartMeasure : AppState.currentMeasure + 1;
        } else if (measures.length > 0) { // No loop, standard progression
            AppState.currentMeasure = (AppState.currentMeasure + 1) % measures.length;
        }
        
        // Reset style bar if the full style pattern (which might be multi-bar) has completed
        if (AppState.currentStylePatternBeat === 0) { // Implies full pattern cycle if beatsPerPattern is a multiple of beatsUI.length
            AppState.currentStyleBar = 0;
        }
        updateNextChordDisplay(); // Update "Next: " display at start of new measure
    }
}

export async function startPlayback() {
    try {
        await AudioContextManager.ensureAudioContext();
        if (AppState.isPlaying) return;

        const timeSignatureNumerator = parseInt(UI.elements.timeSignature.value);
        let intervalMs = (60 / AppState.tempo) * 1000; // Duration of one main beat

        // Adjust interval if metronome subdivides (e.g., 8th notes in 4/4)
        // This depends on how `createBeats` sets up `beatsUI.length`
        if (timeSignatureNumerator === 4 && UI.elements.beatsContainer.querySelectorAll('.beat').length === 8) {
            intervalMs /= 2; // Playing 8th notes, so interval is half of a quarter note
        } else if ((timeSignatureNumerator === 6 || timeSignatureNumerator === 12) && UI.elements.beatsContainer.querySelectorAll('.beat').length === timeSignatureNumerator){
            // For 6/8 or 12/8, if `beatsUI.length` is `timeSignatureNumerator`, we are playing each 8th note.
            // The `intervalMs` calculated from tempo usually refers to the main beat (dotted quarter).
            // If tempo is for dotted quarter, and we play 8ths, interval is 1/3 of main beat.
            // This needs clarification: is tempo for quarter or dotted quarter in compound time?
            // Assuming tempo is per "main beat" (e.g. 2 in 6/8, 4 in 12/8)
            // If beatsUI.length reflects 8th notes, intervalMs should be for 8th notes.
            // If tempo is 120 BPM for dotted quarters in 6/8, then 1 dotted quarter = 0.5s. 1 eighth = 0.5s/3.
            // If tempo is 120 BPM for eighths in 6/8, then intervalMs is already correct if it's per 8th.
            // Let's assume `intervalMs` is for the main beat subdivision shown in `beatsUI`.
            // No change needed here if `beatsUI.length` matches the number of ticks per main beat cycle.
        }

        // Reset counters if starting fresh (not resuming)
        if (!AppState.intervalId) { // Ensures this only happens on a true start, not a tempo change while playing
            AppState.currentBeat = 0;
            AppState.currentStylePatternBeat = 0;
            AppState.currentStyleBar = 0;
            AppState.currentMeasure = (AppState.loopingActive && AppState.loopStartMeasure !== -1) ? AppState.loopStartMeasure : 0;
        }
        
        await playBeat(); // Play the first beat immediately
        clearInterval(AppState.intervalId); // Clear any existing interval (e.g., from tempo change)
        AppState.intervalId = setInterval(async () => { await playBeat(); }, intervalMs);

        AppState.updateState({ isPlaying: true });
        UI.elements.startStopButton.textContent = 'Stop';
        log("Playback started.");
    } catch (e) {
        console.error('Failed to start playback:', e);
        stopPlayback(); // Ensure consistent state on failure
        alert("Error starting playback. Audio system might not be available.");
    }
}

export function stopPlayback() {
    clearInterval(AppState.intervalId);
    AppState.intervalId = null; // Important to clear, indicates fully stopped
    AppState.updateState({ isPlaying: false });
    setPreviousPlayedVoicingNotesWithOctaves(null); // Clear chord memory

    // Clear visual indicators
    UI.elements.beatsContainer.querySelectorAll('.beat.active').forEach(b => b.classList.remove('active'));
    UI.elements.measures.querySelectorAll('.measure.active').forEach(m => m.classList.remove('active'));
    UI.elements.measures.querySelectorAll('.measure-part.part-active').forEach(p => p.classList.remove('part-active'));

    // Fade out any playing chord
    if (AudioContextManager.currentChordGain && AudioContextManager.context) {
        try {
            const now = AudioContextManager.context.currentTime;
            if (AudioContextManager.currentChordGain.gain) { // Check if gain property exists
                // Ensure gain.value is valid before using it.
                const currentGainValue = (typeof AudioContextManager.currentChordGain.gain.value === 'number' && isFinite(AudioContextManager.currentChordGain.gain.value))
                                         ? AudioContextManager.currentChordGain.gain.value
                                         : 0.001; // Default to a small value if current is invalid
                AudioContextManager.currentChordGain.gain.setValueAtTime(currentGainValue, now);
                AudioContextManager.currentChordGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1); // Quick fade
            }
        } catch (rampError) { console.warn("Gain ramp error on stop:", rampError.message); }
        finally { AudioContextManager.currentChordGain = null; } // Clear reference
    }
    if (UI.elements.nextChordDisplay) UI.elements.nextChordDisplay.textContent = ""; // Clear next chord display
    UI.elements.startStopButton.textContent = 'Start';
    log("Playback stopped.");
}
```

**`js/main.js`** (The entry point)

```javascript
import { AppState, updateLoadingStatus, currentDrumSetIndex, setCurrentDrumSetIndex } from './state.js';
import { UI, createBeats, updateFretboardNotes, loadProgression, initializeFretFlow, onMetronomeInstrumentChange, updateProgressionKey, addMeasure, removeMeasure, saveCurrentProgression, deleteSelectedUserSong, populateUserSongsDropdown, addFirstChordListener, updateRhythmicStyleUIVisibility } from './ui.js';
import { _toggleLoopingMode, _toggleGuideTones } from './ui.js'; // Import renamed UI interaction functions
import { AudioContextManager, ensureAudioInitializedUserInteraction } from './audio.js';
import { startPlayback, stopPlayback } from './playback.js';
import { TUNINGS, drumSoundSets } from './constants.js';
import { log, safeAddEventListener } from './utils.js';


function setupEventListeners() {
    try {
        // Critical elements needed for basic functionality
        const requiredElements = [
            'startStopButton', 'tempo', 'tempoDisplay', 'timeSignature',
            'progressionSelect', 'keySelect', 'darkModeToggle', 'chordsEnabled',
            'soundType', 'rhythmicStyleSelect', 'addMeasureButton', 'removeMeasureButton',
            'saveProgressionButton', 'deleteUserSongButton', 'loopSelectedToggle', 'guideTonesToggle',
            'tapTempo', 'chordTuning', 'reverbDial'
        ];
        
        const missingElements = requiredElements.filter(id => {
            const element = UI.elements[id];
            return !element;
        });

        if (missingElements.length > 0) {
            const specificErrorMsg = `[CRITICAL] UI elements missing: ${missingElements.join(', ')}. Check HTML IDs and UI.init(). Execution of setupEventListeners will halt.`;
            console.error(specificErrorMsg);
            alert(specificErrorMsg);
            updateLoadingStatus(specificErrorMsg, true);
            return; 
        }

        // General page interaction to initialize audio
        document.body.addEventListener('click', ensureAudioInitializedUserInteraction, { once: true });

        // Playback Controls
        UI.elements.startStopButton.addEventListener('click', () => AppState.isPlaying ? stopPlayback() : startPlayback());
        
        // Drum Set Toggle (if element exists)
        if (UI.elements.drumSetToggleBtn) {
            UI.elements.drumSetToggleBtn.addEventListener('click', () => {
                let newIndex = (currentDrumSetIndex + 1) % drumSoundSets.length;
                setCurrentDrumSetIndex(newIndex);
                UI.elements.drumSetToggleBtn.textContent = drumSoundSets[newIndex].name;
                log(`Drum set changed to: ${drumSoundSets[newIndex].name}`);
                // Potentially update beats if drum sounds change fundamentally
                // createBeats(); // Uncomment if changing drum set should reset beat accents/sounds
            });
        }

        // Metronome Sound Type
        UI.elements.soundType.addEventListener('change', (e) => {
            onMetronomeInstrumentChange(e.target.value); // Handles UI changes for drum volumes etc.
            // updateRhythmicStyleUIVisibility(); // Called within onMetronomeInstrumentChange
            // createBeats(); // Called within onMetronomeInstrumentChange
        });
        
        // Dark Mode Toggle
        let currentDarkModeIndexState = 0; // Local state for dark mode cycling
        const darkModeClasses = ['', 'dark-mode', 'dark-mode-2', 'dark-mode-3'];
        const activeToggleClasses = ['', 'active', 'active-2', 'active-3'];
        UI.elements.darkModeToggle.addEventListener('click', () => {
            currentDarkModeIndexState = (currentDarkModeIndexState + 1) % darkModeClasses.length;
            darkModeClasses.forEach(cls => { if (cls) document.body.classList.remove(cls); });
            activeToggleClasses.forEach(cls => { if (cls) UI.elements.darkModeToggle.classList.remove(cls); });
            
            if (currentDarkModeIndexState > 0) {
                document.body.classList.add(darkModeClasses[currentDarkModeIndexState]);
                UI.elements.darkModeToggle.classList.add(activeToggleClasses[currentDarkModeIndexState]);
            }
            log(`Color mode changed to: ${darkModeClasses[currentDarkModeIndexState] || 'Light Mode'}`);
        });

        // Chords Enabled Toggle
        UI.elements.chordsEnabled.addEventListener('click', () => {
            const isActive = UI.elements.chordsEnabled.classList.toggle('active');
            UI.elements.chordsEnabled.textContent = isActive ? 'Chords Enabled' : 'Chords Disabled';
            log(`Chords ${isActive ? 'enabled' : 'disabled'}`);
        });

        // Tempo Slider
        UI.elements.tempo.addEventListener('input', () => {
            AppState.tempo = parseInt(UI.elements.tempo.value);
            UI.elements.tempoDisplay.textContent = `${AppState.tempo} BPM`;
            if (AppState.isPlaying) { // If playing, restart with new tempo
                stopPlayback(); 
                startPlayback(); 
            }
        });

        // Tap Tempo Button
        UI.elements.tapTempo.addEventListener('click', () => {
            const now = Date.now();
            AppState.tapTempoTimestamps.push(now);
            if (AppState.tapTempoTimestamps.length > 4) AppState.tapTempoTimestamps.shift(); // Keep last 4 taps

            if (AppState.tapTempoTimestamps.length > 1) {
                let totalInterval = 0;
                for (let i = 1; i < AppState.tapTempoTimestamps.length; i++) {
                    totalInterval += AppState.tapTempoTimestamps[i] - AppState.tapTempoTimestamps[i-1];
                }
                const avgInterval = totalInterval / (AppState.tapTempoTimestamps.length - 1);
                if (avgInterval > 0 && avgInterval < 3000) { // Reasonable interval range
                    AppState.tempo = Math.max(40, Math.min(220, Math.round(60000 / avgInterval)));
                    UI.elements.tempo.value = AppState.tempo;
                    UI.elements.tempoDisplay.textContent = `${AppState.tempo} BPM`;
                    if (AppState.isPlaying) { stopPlayback(); startPlayback(); }
                }
            }
            // Reset timestamps if too long since last tap
            setTimeout(() => { 
                if (AppState.tapTempoTimestamps.length > 0 && (Date.now() - AppState.tapTempoTimestamps[AppState.tapTempoTimestamps.length - 1] > 3000)) {
                    AppState.tapTempoTimestamps = []; 
                }
            }, 3100);
        });

        // Time Signature Select
        UI.elements.timeSignature.addEventListener('change', () => {
            createBeats(); // Recreate beat display for new time signature
            const is44 = parseInt(UI.elements.timeSignature.value) === 4;
            // Enable/disable split measure buttons based on time signature
            document.querySelectorAll('.measure .split-measure-button').forEach(btn => {
                btn.disabled = !is44;
                btn.title = is44 ? "" : "Splitting measures only available in 4/4 time.";
                // If not 4/4 and measure was split, unsplit it (optional behavior)
                if (!is44 && btn.closest('.measure').dataset.isSplit === 'true') {
                    // toggleSplitMeasure(btn.closest('.measure')); // toggleSplitMeasure is in ui.js
                }
            });
            updateRhythmicStyleUIVisibility(); // Rhythmic styles depend on time sig
            if (AppState.isPlaying) { stopPlayback(); startPlayback(); }
        });

        // Rhythmic Style Select
        UI.elements.rhythmicStyleSelect.addEventListener('change', (e) => {
            AppState.currentRhythmicStyle = e.target.value;
            AppState.currentStylePatternBeat = 0; // Reset pattern beat index
            AppState.currentStyleBar = 0; // Reset bar count for multi-bar patterns
            createBeats(); // Recreate beats based on new style
            log(`Rhythmic style changed to: ${AppState.currentRhythmicStyle}`);
        });

        // Reverb Dial
        UI.elements.reverbDial.addEventListener('input', (e) => {
            AudioContextManager.reverbAmount = parseInt(e.target.value, 10) / 100;
            if (UI.elements.reverbDialValue) UI.elements.reverbDialValue.textContent = e.target.value;
            log(`Reverb amount set to: ${AudioContextManager.reverbAmount}`);
        });

        // Progression Loading
        UI.elements.progressionSelect.addEventListener('change', (e) => {
            loadProgression(e.target.value, null, false); // Load standard progression
            if (UI.elements.userProgressionSelect) UI.elements.userProgressionSelect.value = ""; // Deselect user song
        });

        if (UI.elements.userProgressionSelect) {
            UI.elements.userProgressionSelect.addEventListener('change', (e) => {
                if (e.target.value) { // If a user song is selected
                    const userSongs = JSON.parse(localStorage.getItem('userBebopProgressions') || '{}');
                    const selectedSongData = userSongs[e.target.value];
                    // Load user song, using its saved defaultKey or current global key as override
                    loadProgression(e.target.value, selectedSongData?.defaultKey || UI.elements.keySelect.value, true);
                    if (UI.elements.progressionSelect) UI.elements.progressionSelect.value = ""; // Deselect standard progression
                }
            });
        }

        // Global Key Select
        UI.elements.keySelect.addEventListener('change', (e) => updateProgressionKey(e.target.value));
        
        // Chord Fretboard Tuning
        if (UI.elements.chordTuning) {
            UI.elements.chordTuning.addEventListener('change', () => { 
                addFirstChordListener(); // Update main fretboard with new tuning
                initializeFretFlow(); // Reinitialize FretFlow boards with new default tuning (if they use it)
            });
        }

        // Progression Management Buttons
        safeAddEventListener(UI.elements.addMeasureButton, 'click', () => addMeasure());
        safeAddEventListener(UI.elements.removeMeasureButton, 'click', removeMeasure);
        safeAddEventListener(UI.elements.saveProgressionButton, 'click', saveCurrentProgression);
        safeAddEventListener(UI.elements.deleteUserSongButton, 'click', deleteSelectedUserSong);

        // UI Toggles
        safeAddEventListener(UI.elements.guideTonesToggle, 'click', _toggleGuideTones);
        safeAddEventListener(UI.elements.loopSelectedToggle, 'click', _toggleLoopingMode);

        // Collapsible Sections
        document.querySelectorAll('.collapsible-toggle').forEach(button => {
            button.addEventListener('click', () => {
                const contentId = button.getAttribute('aria-controls');
                const content = document.getElementById(contentId);
                if (!content) return;
                
                const isExpanded = button.getAttribute('aria-expanded') === 'true' || false;
                button.setAttribute('aria-expanded', !isExpanded);
                // Adjust display based on original display type (flex for volume stack)
                content.style.display = isExpanded ? 'none' : (contentId === 'metronome-volume-controls-stack' ? 'flex' : 'block'); 
                button.querySelector('.toggle-icon').textContent = isExpanded ? '+' : '-';
                log(`Collapsible section '${contentId}' ${isExpanded ? 'collapsed' : 'expanded'}`);
            });
        });

        // Keyboard Shortcuts
        document.addEventListener('keydown', (event) => {
            const targetTagName = event.target.tagName.toLowerCase();
            // Ignore if typing in input/select/textarea
            if (['input', 'select', 'textarea'].includes(targetTagName)) return; 
            
            let tempoChanged = false;
            switch (event.key) {
                case ' ': 
                    event.preventDefault(); 
                    UI.elements.startStopButton.click(); 
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    UI.elements.tempo.value = AppState.tempo = Math.min(220, parseInt(UI.elements.tempo.value) + 1);
                    tempoChanged = true; 
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    UI.elements.tempo.value = AppState.tempo = Math.max(40, parseInt(UI.elements.tempo.value) - 1);
                    tempoChanged = true; 
                    break;
                // Add more shortcuts if needed (e.g., for looping, guide tones)
            }
            if (tempoChanged) {
                UI.elements.tempoDisplay.textContent = `${AppState.tempo} BPM`;
                if (AppState.isPlaying) { stopPlayback(); startPlayback(); }
            }
        });
        log("Event listeners set up successfully.");

    } catch (error) {
        console.error("Error during setupEventListeners execution (outer catch):", error);
        if (error.message && error.message.startsWith("[CRITICAL]")) {
            // Already handled by alert and updateLoadingStatus
        } else {
            updateLoadingStatus("Error setting up controls. Some features may not work. Check console.", true);
        }
    }
}


async function initializeApp() {
    UI.init(); // Cache DOM elements first
    
    createBeats(); // Initial beat display
    const initialTuning = TUNINGS[UI.elements.chordTuning?.value || 'standard'] || TUNINGS.standard;
    updateFretboardNotes(UI.elements.chordFretboard, "C", "major", initialTuning); // Initial main fretboard

    onMetronomeInstrumentChange(UI.elements.soundType?.value || 'click'); // Setup metronome UI
    populateUserSongsDropdown(); // Load any saved user songs

    // Determine initial progression to load
    let initialProgressionName = "I V7"; // Default fallback
    if (UI.elements.progressionSelect && UI.elements.progressionSelect.options.length > 0) {
        const firstOptgroupOption = UI.elements.progressionSelect.querySelector('optgroup > option');
        if (firstOptgroupOption) {
            initialProgressionName = firstOptgroupOption.value;
        } else if (UI.elements.progressionSelect.options[0]) { // Fallback to very first option if no optgroups
            initialProgressionName = UI.elements.progressionSelect.options[0].value;
        }
    }
    
    // Load the initial progression
    const initialProgData = progressions[initialProgressionName] || {}; // Get data for the determined progression
    const initialKey = UI.elements.keySelect?.value || initialProgData.defaultKey || "C";
    loadProgression(initialProgressionName, initialKey, false);

    initializeFretFlow(); // Setup the FretFlow section
    setupEventListeners(); // Add all event listeners

    // Initialize Audio
    try {
        await AudioContextManager.initialize();
    } catch (e) {
        // Error already logged and alerted in AudioContextManager.initialize
        // Provide a way for user to retry initialization on interaction
        updateLoadingStatus("Audio initialization failed. Click screen to retry.", true);
        document.body.addEventListener('click', async function retryAudioInit() {
            document.body.removeEventListener('click', retryAudioInit); // Remove listener after first attempt
            updateLoadingStatus("Retrying audio initialization...", true);
            try {
                await AudioContextManager.initialize();
                updateLoadingStatus("Audio initialized!", true);
                setTimeout(() => updateLoadingStatus("", false), 1500);
            } catch (err) {
                updateLoadingStatus("Audio retry failed. Please refresh or check browser settings.", true);
                console.error("Audio retry failed:", err);
            }
        }, { once: true });
    }

    if (AppState.audioInitialized) {
        updateLoadingStatus("Application initialized.", true);
        setTimeout(() => updateLoadingStatus("", false), 1500);
    }
    log("Application initialized.");
}

// DOMContentLoaded ensures HTML is parsed before JS runs
document.addEventListener('DOMContentLoaded', () => {
    initializeApp().catch(error => {
        console.error("Application initialization failed with an unhandled error:", error);
        updateLoadingStatus("Fatal Error: App could not initialize. Check console for details.", true);
        // Potentially display a more user-friendly error message on the page itself
    });
});