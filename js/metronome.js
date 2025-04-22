// js/metronome.js
import { AudioContextManager } from '../core/audio-context.js';
import { UI } from '../core/ui-manager.js';
import { AppState } from './app-state.js';
import { drumSoundSets } from '../utils/constants.js';
import { log } from '../utils/helpers.js';

// Changed to export the variable
let currentDrumSetIndex = 0;

export function createBeats() {
    const container = document.querySelector('.beats-container');
    container.innerHTML = '';

    const timeSignature = parseInt(UI.elements.timeSignature.value);
    const soundType = UI.elements.soundType.value;

    let totalBeats = timeSignature === 4 ? 8 : timeSignature; // 8 beats for 4/4 time (eighth notes)

    const beatConfigs = {
        4: { 
            strongBeats: [0, 4], 
            drumSounds: { 
                0: { sound: ['kick', 'hihat'], volume: '1', color: '#1F618D' },
                2: { sound: ['snare', 'hihat'], volume: '1', color: '#4CAF50' },
                4: { sound: ['kick', 'hihat'], volume: '1', color: '#1F618D' },
                6: { sound: ['snare', 'hihat'], volume: '1', color: '#4CAF50' }
            }
        },
        3: { strongBeats: [0, 3, 6] },
        6: { strongBeats: [0, 3] },
        7: { strongBeats: [0, 4] },
        8: { strongBeats: [0, 4] },
        12: {
            strongBeats: [0, 4, 6, 10],
            drumSounds: { 0: 'kick', 4: 'snare', 6: 'kick', 10: 'snare' }
        }
    };

    const config = beatConfigs[timeSignature] || { strongBeats: [0] };

    for (let i = 0; i < totalBeats; i++) {
        const beat = document.createElement('div');
        beat.className = 'beat';
        beat.dataset.beat = i;

        if (timeSignature === 4) {
            const isQuarterNote = i % 2 === 0;
            beat.textContent = `${Math.floor(i / 2 + 1)}${isQuarterNote ? '' : '&'}`;

            if (soundType === 'drums') {
                // Set default hi-hat for all beats
                let volume = '0.7';
                let sound = 'hihat';
                let color = '#9E9E9E';

                // Check if this beat should also have kick or snare
                const drumConfig = config.drumSounds[i];
                if (drumConfig) {
                    sound = drumConfig.sound;  // This will be an array ['kick', 'hihat'] or ['snare', 'hihat']
                    volume = drumConfig.volume;
                    color = drumConfig.color;
                }

                beat.dataset.baseVolume = volume;
                beat.dataset.volume = volume;
                beat.dataset.sound = Array.isArray(sound) ? sound.join(',') : sound;
                beat.style.backgroundColor = color;
            } else {
                // For click and woodblock, only play on quarter notes
                if (isQuarterNote) {
                    beat.dataset.sound = soundType;
                    beat.dataset.baseVolume = i === 0 ? '1' : '0.3';
                    beat.dataset.volume = i === 0 ? '1' : '0.3';
                    beat.style.backgroundColor = i === 0 ? '#1F618D' : '#4CAF50';
                } else {
                    beat.dataset.sound = 'silent';
                    beat.dataset.baseVolume = '0';
                    beat.dataset.volume = '0';
                    beat.style.backgroundColor = '#9E9E9E';
                }
            }
        } else {
            beat.textContent = i + 1;
            const isStrong = config.strongBeats.includes(i);

            if (soundType === 'drums') {
                beat.dataset.sound = isStrong ? 'kick' : 'hihat';
                beat.dataset.baseVolume = '1';
                beat.dataset.volume = '1';
                beat.style.backgroundColor = isStrong ? '#1F618D' : '#9E9E9E';
            } else {
                beat.dataset.sound = soundType;
                beat.dataset.baseVolume = isStrong ? '1' : '0.3';
                beat.dataset.volume = isStrong ? '1' : '0.3';
                beat.style.backgroundColor = isStrong ? '#1F618D' : '#4CAF50';
            }
        }

        beat.addEventListener('click', () => toggleBeatState(beat, timeSignature, soundType));
        container.appendChild(beat);
    }
}

export function toggleBeatState(beat, timeSignature, soundType) {
    const isEighth = timeSignature === 4 && parseInt(beat.dataset.beat) % 2 === 1;
    const states = soundType === 'drums' && timeSignature === 4 ? (
        isEighth ? [
            { volume: '1', sound: 'hihat', color: '#9E9E9E' },
            { volume: '1', sound: 'kick', color: '#1F618D' },
            { volume: '1', sound: 'snare', color: '#4CAF50' },
            { volume: '0', sound: 'silent', color: '#6666' }
        ] : [
            { volume: '1', sound: 'kick', color: '#1F618D' },
            { volume: '1', sound: 'snare', color: '#4CAF50' },
            { volume: '1', sound: 'hihat', color: '#9E9E9E' },
            { volume: '0', sound: 'silent', color: '#6666' }
        ]
    ) : [
        { volume: '1', sound: 'default', color: '#1F618D' },
        { volume: '0.3', sound: 'default', color: '#4CAF50' },
        { volume: '0', sound: 'default', color: '#9E9E9E' }
    ];
    
    const currentIndex = states.findIndex(state =>
        state.volume === beat.dataset.volume && state.sound === beat.dataset.sound
    );
    
    const nextState = states[(currentIndex + 1) % states.length];
    beat.dataset.volume = nextState.volume;
    beat.dataset.sound = nextState.sound;
    beat.style.backgroundColor = nextState.color;
}

export async function playMetronomeSound(baseVolume) {
    if (!AudioContextManager.context) return;

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
                    buffer = await AudioContextManager.context.decodeAudioData(arrayBuffer);
                } catch (error) {
                    console.error(`Failed to load drum sample: ${sampleFile}`, error);
                    // Fall back to default drum sounds if loading fails
                    buffer = AudioContextManager.soundBuffers[soundKey];
                }
            }
        } else {
            // Use click or woodblock sounds
            buffer = AudioContextManager.soundBuffers[soundType] || AudioContextManager.soundBuffers['click'];
        }

        if (!buffer) continue;

        // Create and configure audio nodes
        const source = AudioContextManager.context.createBufferSource();
        source.buffer = buffer;

        const gainNode = AudioContextManager.context.createGain();

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
        gainNode.connect(AudioContextManager.context.destination);

        // Add slight reverb for drums
        if (soundType === 'drums' && AudioContextManager.reverbNode) {
            const reverbGain = AudioContextManager.context.createGain();
            reverbGain.gain.value = 0.1; // Subtle reverb
            source.connect(reverbGain);
            reverbGain.connect(AudioContextManager.reverbNode);
        }

        // Start the sound
        try {
            source.start(0);
        } catch (error) {
            console.error('Error playing metronome sound:', error);
        }
    }
}

export function onMetronomeInstrumentChange(selectedInstrument) {
    if (selectedInstrument === "drums") {
        document.getElementById("drumSetToggleBtn").style.display = "inline-block";
    } else {
        document.getElementById("drumSetToggleBtn").style.display = "none";
    }
}

// Added a function to change the drum set
export function changeDrumSet() {
    currentDrumSetIndex = (currentDrumSetIndex + 1) % drumSoundSets.length;
    return currentDrumSetIndex;
}

export async function playDrumSample(type) {
    if (!AudioContextManager.context) {
        console.error("AudioContext is not initialized.");
        return;
    }

    const set = drumSoundSets[currentDrumSetIndex];
    let sampleFile;

    // Map the type to the current set's sample file
    switch (type) {
        case 'snare':
            sampleFile = set.snare;
            break;
        case 'hihat':
            sampleFile = set.hihat;
            break;
        case 'kick':
            sampleFile = set.kick;
            break;
        default:
            console.error(`Invalid drum type: ${type}`);
            return;
    }

    try {
        // Attempt to load the drum sample
        const response = await fetch(`./${sampleFile}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = await AudioContextManager.context.decodeAudioData(arrayBuffer);

        // Play the loaded sample
        playBuffer(buffer, type);
    } catch (error) {
        console.error(`Failed to load drum sample: ${sampleFile}`, error);

        // Fallback to default drum sounds or synthetic sound
        try {
            const fallbackBuffer = AudioContextManager.soundBuffers[type] || await AudioContextManager.createDrumSound(type);
            playBuffer(fallbackBuffer, type);
        } catch (fallbackError) {
            console.error(`Failed to play fallback sound for type: ${type}`, fallbackError);
        }
    }
}

function playBuffer(buffer, type) {
    const source = AudioContextManager.context.createBufferSource();
    source.buffer = buffer;

    const gainNode = AudioContextManager.context.createGain();
    const metronomeVolume = parseFloat(UI.elements.metronomeVolume.value) || 0.5;

    // Adjust volume based on drum type
    let finalVolume = metronomeVolume;
    if (type === 'kick') {
        finalVolume *= 1.2; // Slightly boost kick
    } else if (type === 'snare') {
        finalVolume *= 1.1; // Slightly boost snare
    } else if (type === 'hihat') {
        finalVolume *= 0.8; // Slightly reduce hi-hat
    }

    // Ensure volume doesn't exceed 1.0
    finalVolume = Math.min(finalVolume, 1.0);
    gainNode.gain.value = finalVolume;

    // Connect nodes
    source.connect(gainNode);
    gainNode.connect(AudioContextManager.context.destination);

    // Add subtle reverb for depth
    if (AudioContextManager.reverbNode) {
        const reverbGain = AudioContextManager.context.createGain();
        reverbGain.gain.value = 0.1; // Subtle reverb
        source.connect(reverbGain);
        reverbGain.connect(AudioContextManager.reverbNode);
    }

    // Start playback
    source.start(0);
}
