// js/playback.js
import { AppState, currentDrumSetIndex, previousPlayedVoicingNotesWithOctaves, setPreviousPlayedVoicingNotesWithOctaves } from './state.js';
import { UI, updateFretboardNotes, updateNextChordDisplay, _highlightGuideTones } from './ui.js';
import { AudioContextManager } from './audio.js';
import { TUNINGS, OCTAVES_FOR_SAMPLES, drumSoundSets, RHYTHMIC_STYLES, PLAYBACK_OCTAVES } from './constants.js'; // Added PLAYBACK_OCTAVES
import { getChordNotes, getBestVoicing_VoiceLed, log, standardizeNoteNameForSamples } from './utils.js'; // Added standardizeNoteNameForSamples

export function playChordInstance(notesWithOctavesToPlay, instanceStartTime, instanceDuration, connectToGainNode) {
    if (!AudioContextManager.context || !AudioContextManager.samplesLoaded) return;
    if (!notesWithOctavesToPlay || notesWithOctavesToPlay.length === 0) {
        return;
    }

    notesWithOctavesToPlay.forEach(noteWithOctave => {
        const match = noteWithOctave.match(/^([A-G][#bs]?)(\d)$/i);
        if (!match) {
            console.warn(`Invalid note format in playChordInstance: ${noteWithOctave}`);
            return;
        }
        let [, pitchClass, octaveStr] = match;
        const samplePitchClass = standardizeNoteNameForSamples(pitchClass);
        const finalSampleOctave = Math.max(OCTAVES_FOR_SAMPLES[0], Math.min(OCTAVES_FOR_SAMPLES[OCTAVES_FOR_SAMPLES.length - 1], parseInt(octaveStr)));

        const sampleKey = `${samplePitchClass}${finalSampleOctave}`;
        const buffer = AudioContextManager.pianoSampleBuffers[sampleKey];

        if (!buffer) {
            return;
        }

        try {
            const source = AudioContextManager.context.createBufferSource();
            source.buffer = buffer;
            source.connect(connectToGainNode);
            const timingVariance = Math.random() * 0.03;
            source.start(instanceStartTime + timingVariance);
            source.stop(instanceStartTime + instanceDuration + timingVariance);
        } catch (e) {
            console.error(`Error playing sample ${sampleKey}:`, e);
        }
    });
}

export async function playChord(root, quality, startTime, duration) {
    if (!UI.elements.chordsEnabled.classList.contains('active') || !AudioContextManager.samplesLoaded) {
        setPreviousPlayedVoicingNotesWithOctaves(null);
        return;
    }
    await AudioContextManager.ensureAudioContext();
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

    const overallVolume = parseFloat(UI.elements.chordVolume.value) * 0.7;
    if (overallVolume <= 0.001) {
        setPreviousPlayedVoicingNotesWithOctaves(null);
        return;
    }

    if (AudioContextManager.currentChordGain) {
        try {
            if (typeof AudioContextManager.currentChordGain.gain.value === 'number' && isFinite(AudioContextManager.currentChordGain.gain.value)) {
                AudioContextManager.currentChordGain.gain.setValueAtTime(AudioContextManager.currentChordGain.gain.value, startTime);
                AudioContextManager.currentChordGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);
            } else {
                AudioContextManager.currentChordGain.gain.setValueAtTime(0.001, startTime + 0.05);
            }
        } catch (e) { console.warn("Error fading out previous chord gain:", e); }
    }

    const chordMasterGain = AudioContextManager.context.createGain();
    chordMasterGain.gain.setValueAtTime(0, startTime);
    chordMasterGain.gain.linearRampToValueAtTime(overallVolume, startTime + 0.02);

    if (AudioContextManager.reverbNode && AudioContextManager.reverbAmount > 0.001) {
        const dryGain = AudioContextManager.context.createGain();
        const wetGain = AudioContextManager.context.createGain();
        dryGain.gain.value = 1.0;
        wetGain.gain.value = AudioContextManager.reverbAmount;

        chordMasterGain.connect(dryGain);
        dryGain.connect(AudioContextManager.context.destination);
        chordMasterGain.connect(wetGain);
        wetGain.connect(AudioContextManager.reverbNode);

        if (!AudioContextManager.reverbNodeConnected && AudioContextManager.context.destination) {
            try { AudioContextManager.reverbNode.disconnect(); } catch(e) {}
            AudioContextManager.reverbNode.connect(AudioContextManager.context.destination);
            AudioContextManager.reverbNodeConnected = true;
        }
    } else {
        chordMasterGain.connect(AudioContextManager.context.destination);
    }
    AudioContextManager.currentChordGain = chordMasterGain;

    const firstVoicingNotesWithOctaves = getBestVoicing_VoiceLed(
        baseNotesInRootPosition,
        quality,
        previousPlayedVoicingNotesWithOctaves,
        PLAYBACK_OCTAVES
    );

    if (!firstVoicingNotesWithOctaves || firstVoicingNotesWithOctaves.length === 0) {
        console.warn("getBestVoicing_VoiceLed returned no notes for first hit.");
        setPreviousPlayedVoicingNotesWithOctaves(null);
        return;
    }

    playChordInstance(firstVoicingNotesWithOctaves, startTime, duration / 2, chordMasterGain);
    setPreviousPlayedVoicingNotesWithOctaves([...firstVoicingNotesWithOctaves]);

    const beatDurationSec = 60 / AppState.tempo;
    const timeSigNum = parseInt(UI.elements.timeSignature.value);
    const isLikelyFullMeasureChord = (timeSigNum === 4 && duration > (beatDurationSec * 2.5)) ||
                                     (timeSigNum !== 4 && duration > (beatDurationSec * (timeSigNum / 2 + 0.5)));

    if (isLikelyFullMeasureChord) {
        const secondVoicingNotesWithOctaves = getBestVoicing_VoiceLed(
            baseNotesInRootPosition,
            quality,
            firstVoicingNotesWithOctaves,
            PLAYBACK_OCTAVES,
            true
        );
        if (!secondVoicingNotesWithOctaves || secondVoicingNotesWithOctaves.length === 0) {
             console.warn("getBestVoicing_VoiceLed returned no notes for second hit.");
        } else {
            const secondHitStartTime = startTime + duration / 2;
            playChordInstance(secondVoicingNotesWithOctaves, secondHitStartTime, duration / 2, chordMasterGain);
        }
    }
}

export async function playMetronomeSound(volumeForThisTick, soundsForThisTickString) {
    if (!AudioContextManager.context || !soundsForThisTickString) return;

    const metronomeOverallVolume = parseFloat(UI.elements.metronomeVolume.value);
    const selectedSoundType = UI.elements.soundType.value;

    const soundsToPlayArray = soundsForThisTickString.split(',');

    const beatElement = UI.elements.beatsContainer.querySelector(`.beat[data-beat="${AppState.currentBeat}"]`);
    const isStrongStyledBeat = beatElement ? (parseFloat(beatElement.dataset.baseVolume) >= 0.9) : false;
    const accentMultiplier = isStrongStyledBeat ? parseFloat(UI.elements.accentIntensity?.value || 1.0) : 1.0;

    for (let soundKey of soundsToPlayArray) {
        soundKey = soundKey.trim();
        if (soundKey === 'silent') continue;

        let bufferToPlay;
        let effectiveSoundKey = soundKey;
        let soundSpecificMixLevel = 1.0;

        if (selectedSoundType === 'drums') {
            const currentDrumSet = drumSoundSets[currentDrumSetIndex];
            let soundFilename; // This will be like "drumsamples/Kick.wav"
            switch (soundKey) {
                case 'kick':
                    soundFilename = currentDrumSet.kick;
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
                default:
                    effectiveSoundKey = 'click';
                    soundFilename = null;
                    soundSpecificMixLevel = 1.0;
                    break;
            }

            if (soundFilename) {
                effectiveSoundKey = soundFilename; // Use the full path as the key in soundBuffers
                if (!AudioContextManager.soundBuffers[soundFilename]) {
                    try {
                        // soundFilename is already "drumsamples/Kick.wav", relative to index.html
                        const response = await fetch(soundFilename); // CORRECTED: No leading './main/'
                        if (!response.ok) throw new Error(`HTTP ${response.status} for ${soundFilename}`);
                        const arrayBuffer = await response.arrayBuffer();
                        AudioContextManager.soundBuffers[soundFilename] = await AudioContextManager.context.decodeAudioData(arrayBuffer);
                    } catch (e) {
                        console.error(`Failed to load drum sample ${soundFilename} on-the-fly:`, e);
                        bufferToPlay = AudioContextManager.soundBuffers[soundKey] || AudioContextManager.soundBuffers['click']; // Fallback to generic key
                        effectiveSoundKey = soundKey; // Revert to generic key for buffer lookup
                    }
                }
                // This ensures bufferToPlay is assigned even if loaded on-the-fly or preloaded
                bufferToPlay = AudioContextManager.soundBuffers[soundFilename] || AudioContextManager.soundBuffers[soundKey] || AudioContextManager.soundBuffers['click'];
            } else {
                 bufferToPlay = AudioContextManager.soundBuffers[effectiveSoundKey] || AudioContextManager.soundBuffers['click'];
            }
        } else { // "click" or "woodblock"
            effectiveSoundKey = selectedSoundType;
            bufferToPlay = AudioContextManager.soundBuffers[selectedSoundType] || AudioContextManager.soundBuffers['click'];
            soundSpecificMixLevel = 1.0;
        }

        if (!bufferToPlay) {
            console.warn(`No buffer found for sound: ${effectiveSoundKey}`);
            continue;
        }

        let actualFinalVolume = metronomeOverallVolume * volumeForThisTick * soundSpecificMixLevel * accentMultiplier;
        actualFinalVolume = Math.min(Math.max(actualFinalVolume, 0), 1.0);

        if (actualFinalVolume <= 0.001) continue;

        const source = AudioContextManager.context.createBufferSource();
        source.buffer = bufferToPlay;
        const gainNode = AudioContextManager.context.createGain();

        gainNode.gain.setValueAtTime(actualFinalVolume, AudioContextManager.context.currentTime);
        source.connect(gainNode);

        if (selectedSoundType === 'drums' && AudioContextManager.reverbNode && AudioContextManager.reverbAmount > 0.01) {
            const reverbSendGain = AudioContextManager.context.createGain();
            reverbSendGain.gain.setValueAtTime(0.05 * AudioContextManager.reverbAmount, AudioContextManager.context.currentTime);
            gainNode.connect(reverbSendGain);
            reverbSendGain.connect(AudioContextManager.reverbNode);
            if (!AudioContextManager.reverbNodeConnected && AudioContextManager.context.destination) {
                 try { AudioContextManager.reverbNode.disconnect(); } catch(e) {}
                 AudioContextManager.reverbNode.connect(AudioContextManager.context.destination);
                 AudioContextManager.reverbNodeConnected = true;
            }
        } else {
            gainNode.connect(AudioContextManager.context.destination);
        }
        source.start(AudioContextManager.context.currentTime);
    }
}

export async function playBeat() {
    const beatsUI = UI.elements.beatsContainer.querySelectorAll('.beat');
    const measures = UI.elements.measures.children;
    if (beatsUI.length === 0) return;

    const timeSignatureNum = parseInt(UI.elements.timeSignature.value);
    const selectedSoundType = UI.elements.soundType.value;
    const isDrumStyleActive = selectedSoundType === 'drums' && timeSignatureNum === 4;
    const activeStyleKey = isDrumStyleActive ? AppState.currentRhythmicStyle : "quarterNotes";
    const activeStyle = RHYTHMIC_STYLES[activeStyleKey] || RHYTHMIC_STYLES.quarterNotes;

    beatsUI.forEach(b => b.classList.remove('active'));
    const currentUIBeatElement = beatsUI[AppState.currentBeat];
    if (currentUIBeatElement) {
        currentUIBeatElement.classList.add('active');
    }

    let soundToPlay, volumeToPlay;
    if (currentUIBeatElement) {
        soundToPlay = currentUIBeatElement.dataset.sound;
        volumeToPlay = parseFloat(currentUIBeatElement.dataset.volume);
    } else if (activeStyle.pattern[AppState.currentStylePatternBeat]) {
        const stylePatternData = activeStyle.pattern[AppState.currentStylePatternBeat];
        soundToPlay = stylePatternData.sound;
        volumeToPlay = stylePatternData.volume;
    } else {
        soundToPlay = 'silent';
        volumeToPlay = 0;
    }

    if (volumeToPlay > 0 || (selectedSoundType === 'drums' && soundToPlay !== 'silent') ) {
        await playMetronomeSound(volumeToPlay, soundToPlay);
    }

    if (measures.length > 0) {
        let measureToPlayIndex = AppState.currentMeasure;
         if (AppState.loopingActive && AppState.loopStartMeasure !== -1 && AppState.loopEndMeasure !== -1) {
            if (AppState.currentMeasure < AppState.loopStartMeasure || AppState.currentMeasure > AppState.loopEndMeasure) {
                AppState.currentMeasure = AppState.loopStartMeasure;
            }
            measureToPlayIndex = AppState.currentMeasure;
        }

        const currentMeasureElement = measures[measureToPlayIndex];
        if (currentMeasureElement) {
            Array.from(measures).forEach((m, idx) => m.classList.toggle('active', idx === measureToPlayIndex));

            const isSplitMeasure = currentMeasureElement.dataset.isSplit === 'true';
            const is44Time = timeSignatureNum === 4;
            const numDisplayedBeats = beatsUI.length;

            let activePartIndex = 0;
            let playChordOnThisBeat = AppState.currentBeat === 0;
            if (is44Time && isSplitMeasure && numDisplayedBeats === 8) {
                activePartIndex = (AppState.currentBeat < 4) ? 0 : 1;
                playChordOnThisBeat = (AppState.currentBeat === 0 || AppState.currentBeat === 4);
            }

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
                    if (AppState.guideTonesActive) _highlightGuideTones(activeMeasurePart);

                    const beatDurationSec = 60 / AppState.tempo;
                    let chordPlayDurationSec = beatDurationSec * (timeSignatureNum === 4 && numDisplayedBeats === 8 ? 4 : timeSignatureNum) ;
                    if (is44Time && isSplitMeasure && numDisplayedBeats === 8) {
                         chordPlayDurationSec = beatDurationSec * 2;
                    }
                    await playChord(root, quality, AudioContextManager.context.currentTime, chordPlayDurationSec);
                }
            }
        }
    }

    AppState.currentBeat = (AppState.currentBeat + 1) % beatsUI.length;
    AppState.currentStylePatternBeat = (AppState.currentStylePatternBeat + 1) % activeStyle.beatsPerPattern;

    if (AppState.currentBeat === 0) {
        AppState.currentStyleBar = (AppState.currentStyleBar + 1) % (activeStyle.beatsPerPattern / beatsUI.length || 1);

        if (AppState.loopingActive && AppState.loopStartMeasure !== -1 && AppState.loopEndMeasure !== -1) {
            AppState.currentMeasure = (AppState.currentMeasure >= AppState.loopEndMeasure) ? AppState.loopStartMeasure : AppState.currentMeasure + 1;
        } else if (measures.length > 0) {
            AppState.currentMeasure = (AppState.currentMeasure + 1) % measures.length;
        }

        if (AppState.currentStylePatternBeat === 0) {
            AppState.currentStyleBar = 0;
        }
        updateNextChordDisplay();
    }
}

export async function startPlayback() {
    try {
        await AudioContextManager.ensureAudioContext();
        if (AppState.isPlaying) return;

        const timeSignatureNumerator = parseInt(UI.elements.timeSignature.value);
        let intervalMs = (60 / AppState.tempo) * 1000;

        if (timeSignatureNumerator === 4 && UI.elements.beatsContainer.querySelectorAll('.beat').length === 8) {
            intervalMs /= 2;
        }

        if (!AppState.intervalId) {
            AppState.currentBeat = 0;
            AppState.currentStylePatternBeat = 0;
            AppState.currentStyleBar = 0;
            AppState.currentMeasure = (AppState.loopingActive && AppState.loopStartMeasure !== -1) ? AppState.loopStartMeasure : 0;
        }

        await playBeat();
        clearInterval(AppState.intervalId);
        AppState.intervalId = setInterval(async () => { await playBeat(); }, intervalMs);

        AppState.updateState({ isPlaying: true });
        UI.elements.startStopButton.textContent = 'Stop';
        log("Playback started.");
    } catch (e) {
        console.error('Failed to start playback:', e);
        stopPlayback();
        alert("Error starting playback. Audio system might not be available.");
    }
}

export function stopPlayback() {
    clearInterval(AppState.intervalId);
    AppState.intervalId = null;
    AppState.updateState({ isPlaying: false });
    setPreviousPlayedVoicingNotesWithOctaves(null);

    UI.elements.beatsContainer.querySelectorAll('.beat.active').forEach(b => b.classList.remove('active'));
    UI.elements.measures.querySelectorAll('.measure.active').forEach(m => m.classList.remove('active'));
    UI.elements.measures.querySelectorAll('.measure-part.part-active').forEach(p => p.classList.remove('part-active'));

    if (AudioContextManager.currentChordGain && AudioContextManager.context) {
        try {
            const now = AudioContextManager.context.currentTime;
            if (AudioContextManager.currentChordGain.gain) {
                const currentGainValue = (typeof AudioContextManager.currentChordGain.gain.value === 'number' && isFinite(AudioContextManager.currentChordGain.gain.value))
                                         ? AudioContextManager.currentChordGain.gain.value
                                         : 0.001;
                AudioContextManager.currentChordGain.gain.setValueAtTime(currentGainValue, now);
                AudioContextManager.currentChordGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            }
        } catch (rampError) { console.warn("Gain ramp error on stop:", rampError.message); }
        finally { AudioContextManager.currentChordGain = null; }
    }
    if (UI.elements.nextChordDisplay) UI.elements.nextChordDisplay.textContent = "";
    UI.elements.startStopButton.textContent = 'Start';
    log("Playback stopped.");
}
