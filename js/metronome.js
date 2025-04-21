// js/components/metronome.js
import { DRUM_PATTERNS, DRUM_SOUND_SETS } from '../utils/constants.js';
import { AudioContextManager } from '../core/audio-context.js';
import { AppState } from '../core/app-state.js';
import { UI } from '../core/ui-manager.js';
import { log } from '../utils/helpers.js';

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
    let adjustedVolume
