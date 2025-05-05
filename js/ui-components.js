// ui-components.js - Extracted from index (19.2).html

// Create UI Components object to hold all UI-related functions
const UIComponents = {
    createNoteOptions: function(selected = 'C') {
        return NOTES.map(note =>
            `<option value="${note}"${note === selected ? ' selected' : ''}>${note}</option>`
        ).join('');
    },

    createQualityOptions: function(selected = 'major') {
        const qualities = [
            { value: 'maj7', label: 'Maj7' },
            { value: 'dom7', label: '7' },
            { value: 'min7', label: 'Min7' },
            { value: 'min7b5', label: 'Min7b5' },
            { value: '6', label: '6' },
            { value: 'm6', label: 'Min6' },
            { value: 'maj', label: 'Major' },
            { value: 'min', label: 'Minor' }
        ];

        return qualities.map(q =>
            `<option value="${q.value}"${q.value === selected ? ' selected' : ''}>${q.label}</option>`
        ).join('');
    },

    createScaleOptions: function(selected = 'major') {
        return Object.keys(SCALES).map(scale =>
            `<option value="${scale}"${scale === selected ? ' selected' : ''}>${scale.charAt(0).toUpperCase() + scale.slice(1)}</option>`
        ).join('');
    },
           
    // Audio Playback
    playNote: function(noteName, volume = 1.0, duration = 1000) {
        if (!AudioEngine.context || !noteName) return;

        const fretboardVolumeControl = document.getElementById('chord-fretboard-volume');
        const fretboardVolume = parseFloat(fretboardVolumeControl?.value ?? 1);
        const finalVolume = volume * fretboardVolume;

        if (finalVolume <= 0) return;

        // Extract the pitch class and octave from the note name
        const match = noteName.match(/^([A-G][b#]?)(\d)$/);
        if (!match) {
            console.warn(`Invalid note format: ${noteName}`);
            return;
        }

        let [, rawNote, octaveStr] = match;
        const baseNote = standardizeNoteName(rawNote).replace('m', '');
        const mappedNote = SAMPLE_NOTE_MAP[baseNote] || baseNote.toLowerCase();
        const octave = Math.max(2, Math.min(6, parseInt(octaveStr)));

        // Try different formats of the sample name
        const sampleFormats = [
            `${mappedNote}${octave}v12`,  // With velocity
            `${mappedNote}${octave}`,     // Without velocity
            `${mappedNote.toLowerCase()}${octave}v12`, // Lowercase with velocity
            `${mappedNote.toLowerCase()}${octave}`     // Lowercase without velocity
        ];

        let buffer = null;
        for (const sampleName of sampleFormats) {
            buffer = AudioEngine.pianoSampleBuffers[sampleName];
            if (buffer) {
                console.log(`Found piano sample for ${sampleName}`);
                break;
            }
        }

        if (!buffer) {
            console.warn(`No piano sample found for ${noteName} (tried ${sampleFormats.join(', ')})`);
            
            // Create a simple tone as fallback
            const sampleRate = AudioEngine.context.sampleRate;
            buffer = AudioEngine.context.createBuffer(1, sampleRate * 1.0, sampleRate);
            const data = buffer.getChannelData(0);
            
            // Calculate frequency based on note and octave
            const noteToIndex = {
                'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 
                'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 
                'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
            };
            
            const noteIndex = noteToIndex[baseNote] || 0;
            const baseFreq = 440; // A4 = 440Hz
            const semitoneRatio = Math.pow(2, 1/12);
            // Calculate semitones from A4
            const semitones = (octave - 4) * 12 + (noteIndex - 9); // 9 is A
            const freq = baseFreq * Math.pow(semitoneRatio, semitones);
            
            // Generate a simple sine wave with decay
            for (let i = 0; i < data.length; i++) {
                const t = i / sampleRate;
                data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 5);
            }
            
            console.log(`Created fallback tone for ${noteName} at ${freq.toFixed(2)}Hz`);
        }

        try {
            const source = AudioEngine.context.createBufferSource();
            source.buffer = buffer;

            const gainNode = AudioEngine.context.createGain();
            gainNode.gain.value = finalVolume;

            source.connect(gainNode);
            gainNode.connect(AudioEngine.context.destination);

            source.start(0);
            setTimeout(() => {
                try {
                    source.stop();
                } catch (e) {
                    // No-op on already stopped source
                }
            }, duration);
        } catch (error) {
            console.error('Error playing note:', error);
        }
    },

    playChord: async function(root, quality, startTime = AudioEngine.context.currentTime, duration = 2, isContinuation = false) {
        await ensureAudioInitialized();
        if (!AudioEngine.samplesLoaded || !UI.elements.chordsEnabled.classList.contains('active')) return;

        const chordNotes = this.getChordNotes(root, quality);
        const chordVolume = parseFloat(UI.elements.chordVolume.value);
        if (chordVolume <= 0) return;

        // Create gain node for this chord
        const gainNode = AudioEngine.context.createGain();
        gainNode.gain.value = chordVolume;
        gainNode.connect(AudioEngine.context.destination);

        // Handle previous chord fadeout
        if (!isContinuation && AudioEngine.currentChordGain) {
            AudioEngine.currentChordGain.gain.setValueAtTime(
                AudioEngine.currentChordGain.gain.value, 
                startTime
            );
            AudioEngine.currentChordGain.gain.exponentialRampToValueAtTime(
                0.001, 
                startTime + 0.05
            );
        }

        AudioEngine.currentChordGain = gainNode;

        // Generate random inversion (0 to length-1)
        const inversion = Math.floor(Math.random() * chordNotes.length);
        
        // Create voicing with random inversion
        let voicing = [...chordNotes];
        for (let i = 0; i < inversion; i++) {
            const note = voicing.shift();
            voicing.push(note);
        }

        // Additional voice leading for continuation
        if (isContinuation) {
            const rootNote = voicing.shift();
            voicing.push(rootNote);
        }

        // Play each note with slight timing and velocity variations
        voicing.forEach((note, index) => {
            // Determine octave based on position and inversion
            let octave;
            if (isContinuation) {
                octave = index === voicing.length - 1 ? 4 : 3;
            } else {
                // Adjust octave based on position in the chord and inversion
                const positionInChord = (index + inversion) % voicing.length;
                octave = positionInChord === 0 ? 3 : (positionInChord < 3 ? 3 : 4);
            }

            const sampleNote = MusicTheory.standardizeNoteNameForSamples(note);
            const sampleKey = `${sampleNote}${octave}`;
            
            const buffer = AudioEngine.pianoSampleBuffers[sampleKey];
            if (!buffer) {
                console.warn(`No sample found for ${sampleKey}`);
                return;
            }

            const source = AudioEngine.context.createBufferSource();
            source.buffer = buffer;
            
            // Create individual gain node for note velocity variation
            const noteGain = AudioEngine.context.createGain();
            const velocityVariation = 0.85 + (Math.random() * 0.3); // Velocity varies between 85% and 115%
            noteGain.gain.value = velocityVariation;
            
            source.connect(noteGain);
            noteGain.connect(gainNode);

            // Add reverb
            const reverbGain = AudioEngine.context.createGain();
            reverbGain.gain.value = 0.2;
            source.connect(reverbGain);
            reverbGain.connect(AudioEngine.reverbNode);

            // Humanize timing with slightly larger variation range
            const timeVariation = Math.random() * 0.03; // Increased from 0.02 to 0.03
            source.start(startTime + timeVariation);
            source.stop(startTime + duration);
        });
    },
    
    getChordNotes: function(root, quality) {
        // Enhanced chord intervals with more voicings
        const CHORD_INTERVALS = {
            'maj': [0, 4, 7],
            'min': [0, 3, 7],
            'dim': [0, 3, 6],
            'aug': [0, 4, 8],
            'sus4': [0, 5, 7],
            'sus2': [0, 2, 7],
            'maj7': [0, 4, 7, 11],
            'dom7': [0, 4, 7, 10],
            'min7': [0, 3, 7, 10],
            'dim7': [0, 3, 6, 9],
            'm7b5': [0, 3, 6, 10],
            'aug7': [0, 4, 8, 10],
            'maj9': [0, 4, 7, 11, 14],
            'dom9': [0, 4, 7, 10, 14],
            'min9': [0, 3, 7, 10, 14],
            'maj7#11': [0, 4, 7, 11, 18],
            'dom7b9': [0, 4, 7, 10, 13],
            'dom7#9': [0, 4, 7, 10, 15],
            'dom7b13': [0, 4, 7, 10, 20],
            'min11': [0, 3, 7, 10, 14, 17]
        };

        // Get base intervals
        let intervals = CHORD_INTERVALS[quality] || CHORD_INTERVALS['maj'];

        // Generate notes
        const rootIndex = NOTES.indexOf(standardizeNoteName(root));
        if (rootIndex === -1) {
            console.error(`Invalid root note: ${root}`);
            return [root];
        }

        // Generate voicings with proper voice leading
        const voicing = intervals.map(interval => {
            const noteIndex = (rootIndex + interval) % 12;
            return NOTES[noteIndex];
        });

        // Add optional extensions based on quality
        if (quality.includes('13')) {
            voicing.push(NOTES[(rootIndex + 21) % 12]); // Add 13th
        }

        return voicing;
    },
            
    playMetronomeSound: async function(baseVolume) {
        if (!AudioEngine.context) return;

        // Get the metronome volume slider value and combine it with base volume
        const metronomeVolumeControl = document.getElementById('metronome-volume');
        const metronomeVolume = parseFloat(metronomeVolumeControl.value);
        const combinedVolume = baseVolume * metronomeVolume;

        if (combinedVolume <= 0) return;

        const soundType = UI.elements.soundType.value;
        const beatElement = document.querySelector(`.beat[data-beat="${AppState.currentBeat}"]`);

        if (!beatElement) return;

        const drumSounds = beatElement.dataset.sound.split(',');
        const baseVolumeValue = parseFloat(beatElement.dataset.baseVolume) || 0;
        const isAccent = baseVolumeValue >= 1 && ['kick', 'snare'].includes(drumSounds[0]);
        const accentBoost = parseFloat(UI.elements.accentIntensity?.value || 1);

        // Apply accent boost if applicable
        let adjustedVolume = combinedVolume;
        if (isAccent) {
            adjustedVolume = Math.min(combinedVolume * accentBoost, 1); // cap at 1.0
        }

        // Process each sound in the drum pattern
        for (let soundKey of drumSounds) {
            soundKey = soundKey.trim();

            // Skip if it's a silent beat
            if (soundKey === 'silent') continue;

            // Get the current drum set if using drums
            const currentSet = drumSoundSets[currentDrumSetIndex];

            // Determine which sound buffer to use
            let buffer;
            if (soundType === 'drums' && soundKey !== 'default') {
                // Map drum sounds to current set's samples
                let sampleFile;
                switch(soundKey) {
                    case 'kick': sampleFile = currentSet.kick; break;
                    case 'snare': sampleFile = currentSet.snare; break;
                    case 'hihat': sampleFile = currentSet.hihat; break;
                    default: sampleFile = null;
                }

                if (sampleFile) {
                    try {
                        // Try to load the current set's sample
                        const response = await fetch(`./${sampleFile}`);
                        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                        const arrayBuffer = await response.arrayBuffer();
                        buffer = await AudioEngine.context.decodeAudioData(arrayBuffer);
                    } catch (error) {
                        console.error(`Failed to load drum sample: ${sampleFile}`, error);
                        // Fall back to default drum sounds if loading fails
                        buffer = AudioEngine.soundBuffers[soundKey];
                    }
                }
            } else {
                // Use click or woodblock sounds
                buffer = AudioEngine.soundBuffers[soundType] || AudioEngine.soundBuffers['click'];
            }

            if (!buffer) continue;

            // Create and configure audio nodes
            const source = AudioEngine.context.createBufferSource();
            source.buffer = buffer;

            const gainNode = AudioEngine.context.createGain();

            // Adjust volume based on sound type and context
            let finalVolume = adjustedVolume;
            if (soundType === 'drums') {
                // Reduce hi-hat volume when playing with other sounds
                if (soundKey === 'hihat' && drumSounds.length > 1) {
                    finalVolume *= 0.5;
                }
                // Adjust kick and snare volumes
                else if (soundKey === 'kick') {
                    finalVolume *= 1.2; // Slightly boost kick
                }
                else if (soundKey === 'snare') {
                    finalVolume *= 1.1; // Slightly boost snare
                }
            }

            // Ensure volume doesn't exceed 1.0
            finalVolume = Math.min(finalVolume, 1.0);
            gainNode.gain.value = finalVolume;

            // Connect the audio nodes
            source.connect(gainNode);
            gainNode.connect(AudioEngine.context.destination);

            // Add slight reverb for drums
            if (soundType === 'drums' && AudioEngine.reverbNode) {
                const reverbGain = AudioEngine.context.createGain();
                reverbGain.gain.value = 0.1; // Subtle reverb
                source.connect(reverbGain);
                reverbGain.connect(AudioEngine.reverbNode);
            }

            // Start the sound
            try {
                source.start(0);
            } catch (error) {
                console.error('Error playing metronome sound:', error);
            }
        }
    },
    
    onMetronomeInstrumentChange: function(selectedInstrument) {
        if (selectedInstrument === "drums") {
            document.getElementById("drumSetToggleBtn").style.display = "inline-block";
        } else {
            document.getElementById("drumSetToggleBtn").style.display = "none";
        }
    },

    playDrumSample: async function(type) {
        if (!AudioEngine.context) return;
        
        const set = drumSoundSets[currentDrumSetIndex];
        let sampleFile;
        
        // Map the type to the current set's sample file
        switch(type) {
            case 'snare': sampleFile = set.snare; break;
            case 'hihat': sampleFile = set.hihat; break;
            case 'kick': sampleFile = set.kick; break;
            default: sampleFile = null;
        }
        
        try {
            let buffer;
            // Try to load the current set's sample
            const response = await fetch(`./${sampleFile}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            buffer = await AudioEngine.context.decodeAudioData(arrayBuffer);
            
            const source = AudioEngine.context.createBufferSource();
            source.buffer = buffer;
            
            const gainNode = AudioEngine.context.createGain();
            // Get the metronome volume
            const metronomeVolume = parseFloat(UI.elements.metronomeVolume.value);
            
            // Apply sound-specific volume adjustments
            let finalVolume = metronomeVolume;
            if (type === 'kick') {
                finalVolume *= 1.2; // Slightly boost kick
            } else if (type === 'snare') {
                finalVolume *= 1.1; // Slightly boost snare
            } else if (type === 'hihat') {
                finalVolume *= 0.8; // Slightly reduce hihat
            }
            
            // Ensure volume doesn't exceed 1.0
            finalVolume = Math.min(finalVolume, 1.0);
            gainNode.gain.value = finalVolume;
            
            source.connect(gainNode);
            gainNode.connect(AudioEngine.context.destination);
            
            // Add slight reverb for more depth
            if (AudioEngine.reverbNode) {
                const reverbGain = AudioEngine.context.createGain();
                reverbGain.gain.value = 0.1; // Subtle reverb
                source.connect(reverbGain);
                reverbGain.connect(AudioEngine.reverbNode);
            }
            
            source.start(0);
        } catch (error) {
            console.error(`Failed to play drum sample: ${type}`, error);
            try {
                // Fall back to default drum sounds if loading fails
                const fallbackBuffer = AudioEngine.soundBuffers[type] || 
                    await AudioEngine.createDrumSound(type);
                const source = AudioEngine.context.createBufferSource();
                source.buffer = fallbackBuffer;
                
                const gainNode = AudioEngine.context.createGain();
                gainNode.gain.value = parseFloat(UI.elements.metronomeVolume.value);
                
                source.connect(gainNode);
                gainNode.connect(AudioEngine.context.destination);
                
                source.start(0);
            } catch (fallbackError) {
                console.error('Failed to play fallback sound:', fallbackError);
            }
        }
    }
};

// Make UIComponents globally accessible
window.UIComponents = UIComponents;

// Expose individual functions for backward compatibility
window.createNoteOptions = UIComponents.createNoteOptions.bind(UIComponents);
window.createQualityOptions = UIComponents.createQualityOptions.bind(UIComponents);
window.createScaleOptions = UIComponents.createScaleOptions.bind(UIComponents);
window.playNote = UIComponents.playNote.bind(UIComponents);
window.playChord = UIComponents.playChord.bind(UIComponents);
window.getChordNotes = UIComponents.getChordNotes.bind(UIComponents);
window.playMetronomeSound = UIComponents.playMetronomeSound.bind(UIComponents);
window.onMetronomeInstrumentChange = UIComponents.onMetronomeInstrumentChange.bind(UIComponents);
window.playDrumSample = UIComponents.playDrumSample.bind(UIComponents);
