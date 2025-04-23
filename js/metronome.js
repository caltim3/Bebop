// js/metronome.js
import { UI } from '../core/ui-manager.js';
import { AudioContextManager } from '../core/audio-context.js';
import { DRUM_PATTERNS } from '../utils/constants.js';
import { log } from '../utils/helpers.js';

// These are only for UI display and mapping, not for playback
export let currentDrumSetIndex = 0;
const drumKits = [
    {
        name: "default",
        samples: {
            'hihat': 'HiHat.wav',
            'kick': 'Kick.wav',
            'snare': 'Snare.wav',
            'click': 'Click.wav',
            'woodblock': 'Woodblock.wav'
        }
    },
    {
        name: "makaya",
        samples: {
            'hihat': 'HiHat2.wav',
            'kick': 'Kick2.wav',
            'snare': 'Snare2.wav',
            'click': 'Click.wav',         // fallback to default click
            'woodblock': 'Woodblock.wav'  // fallback to default woodblock
        }
    },
    {
        name: "philly joe",
        samples: {
            'hihat': 'jazzhat.wav',
            'kick': 'jazzkick.wav',
            'snare': 'jazzsnare.wav',
            'click': 'Click.wav',         // fallback to default click
            'woodblock': 'Woodblock.wav'  // fallback to default woodblock
        }
    }
];

export function createBeats() {
    const container = document.querySelector('.beats-container');
    container.innerHTML = '';

    const timeSignature = parseInt(UI.elements.timeSignature.value);
    // Default to 'click' if not set
    const soundType = UI.elements.soundType.value || 'click';

    let totalBeats = timeSignature === 4 ? 8 : timeSignature; // 8 beats for 4/4 time (eighth notes)

    const beatConfigs = {
        4: {
            drumSounds: {
                0: { sound: ['kick', 'hihat'], volume: '1', color: '#1F618D' },
                2: { sound: ['hihat'], volume: '0.7', color: '#9E9E9E' },
                4: { sound: ['snare', 'hihat'], volume: '1', color: '#4CAF50' },
                6: { sound: ['hihat'], volume: '0.7', color: '#9E9E9E' }
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
                // Classic pattern: 0=kick+hihat, 2=hihat, 4=snare+hihat, 6=hihat
                let volume = '0.7';
                let sound = 'hihat';
                let color = '#9E9E9E';

                const drumConfig = config.drumSounds[i];
                if (drumConfig) {
                    sound = drumConfig.sound;
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
            const isStrong = config.strongBeats && config.strongBeats.includes(i);

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
        { volume: '1', sound: soundType, color: '#1F618D' },
        { volume: '0.3', sound: soundType, color: '#4CAF50' },
        { volume: '0', sound: 'silent', color: '#9E9E9E' }
    ];

    const currentIndex = states.findIndex(state =>
        state.volume === beat.dataset.volume && state.sound === beat.dataset.sound
    );

    const nextState = states[(currentIndex + 1) % states.length];
    beat.dataset.volume = nextState.volume;
    beat.dataset.sound = nextState.sound;
    beat.style.backgroundColor = nextState.color;
}

export function playMetronomeSound(baseVolume, drumSound = 'hihat') {
    // Ensure audio context and samples are loaded
    if (!AudioContextManager.context || !AudioContextManager.samplesLoaded) {
        console.warn('[Metronome] AudioContext or samples not initialized');
        return;
    }

    // Get the metronome volume slider value and combine it with base volume
    const metronomeVolumeControl = document.getElementById('metronome-volume');
    const metronomeVolume = metronomeVolumeControl ? parseFloat(metronomeVolumeControl.value) || 1 : 1;
    const combinedVolume = baseVolume * metronomeVolume;
    if (combinedVolume <= 0) return;

    // Default to 'click' if not set
    const soundType = UI.elements.soundType?.value || 'click';
    const kitIndex = AudioContextManager.currentDrumKitIndex || 0;
    const beatElement = document.querySelector(`.beat[data-beat="${AppState.currentBeat}"]`);
    if (!beatElement) return;

    let drumSounds = beatElement.dataset.sound ? beatElement.dataset.sound.split(',') : [drumSound];
    const baseVolumeValue = parseFloat(beatElement.dataset.baseVolume) || 0;
    const isAccent = baseVolumeValue >= 1 && ['kick', 'snare'].includes(drumSounds[0]);
    const accentBoost = parseFloat(UI.elements.accentIntensity?.value || 1);
    let adjustedVolume = isAccent ? Math.min(combinedVolume * accentBoost, 0.7) : Math.min(combinedVolume, 0.7);

    for (let soundKey of drumSounds) {
        soundKey = soundKey.trim();
        if (soundKey === 'silent') continue;

        let mappedType = soundKey;

        if (soundType === 'click' || soundType === 'woodblock') {
            mappedType = soundType; // always play Click.wav or Woodblock.wav
        } else if (soundType === 'drums') {
            // Map to current kit
            if (kitIndex === 1) { // Makaya
                if (soundKey === 'kick') mappedType = 'kick2';
                else if (soundKey === 'snare') mappedType = 'snare2';
                else if (soundKey === 'hihat') mappedType = 'hihat2';
            } else if (kitIndex === 2) { // Philly Joe
                if (soundKey === 'kick') mappedType = 'jazzkick';
                else if (soundKey === 'snare') mappedType = 'jazzsnare';
                else if (soundKey === 'hihat') mappedType = 'jazzhat';
            }
            // else default kit: mappedType = soundKey
        }

        AudioContextManager.playDrumSample(mappedType, adjustedVolume);
    }
}

export function onMetronomeInstrumentChange(selectedInstrument) {
    const btn = document.getElementById("drumSetToggleBtn");
    if (btn) btn.style.display = selectedInstrument === "drums" ? "inline-block" : "none";
}

// Import AppState at the end to avoid circular dependencies
import { AppState } from './app-state.js';
