import { UI } from '../core/ui-manager.js';
import { AudioContextManager } from '../core/audio-context.js';
import { log } from '../utils/helpers.js';

// Drum kit definitions
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
            'click': 'Click.wav',
            'woodblock': 'Woodblock.wav'
        }
    },
    {
        name: "philly joe",
        samples: {
            'hihat': 'jazzhat.wav',
            'kick': 'jazzkick.wav',
            'snare': 'jazzsnare.wav',
            'click': 'Click.wav',
            'woodblock': 'Woodblock.wav'
        }
    }
];

// --- Drum Kit Select Dropdown Logic ---
export function setupDrumKitSelect() {
    const select = document.getElementById("drum-kit-select");
    if (!select) return;
    // Set initial value
    select.value = currentDrumSetIndex;
    // Show/hide based on instrument
    select.style.display = UI.elements.soundType.value === "drums" ? "inline-block" : "none";
    // Change event
    select.onchange = (e) => {
        currentDrumSetIndex = parseInt(e.target.value, 10);
        if (AudioContextManager) AudioContextManager.currentDrumKitIndex = currentDrumSetIndex;
        log(`[Metronome] Drum kit changed to: ${drumKits[currentDrumSetIndex].name}`);
    };
}
// Add this after defining setupDrumKitSelect()
function setupSoundTypeListener() {
  const soundTypeSelect = document.getElementById("sound-type");
  soundTypeSelect.addEventListener("change", () => {
    const isDrumsSelected = soundTypeSelect.value === "drums";
    const drumSelect = document.getElementById("drum-kit-select");
    drumSelect.style.display = isDrumsSelected ? "inline-block" : "none";
    setupDrumKitSelect(); // Re-initialize drum kit select
  });
}

// Call this after initializing UI elements
setupSoundTypeListener();
// --- Beat Creation ---
export function createBeats() {
    const container = document.querySelector('.beats-container');
    container.innerHTML = '';

    const timeSignature = parseInt(UI.elements.timeSignature.value);
    const soundType = UI.elements.soundType.value || 'click';
    let totalBeats = timeSignature === 4 ? 8 : timeSignature;

    // Classic 4/4 pop/rock pattern
    const drumSounds = {
      0: { sound: ['kick', 'hihat'], volume: '1', color: '#1F618D' }, // Beat 1
      1: { sound: ['hihat'], volume: '0.7', color: '#9E9E9E' },       // 1&
      2: { sound: ['snare', 'hihat'], volume: '1', color: '#4CAF50' }, // Beat 2
      3: { sound: ['hihat'], volume: '0.7', color: '#9E9E9E' },       // 2&
      4: { sound: ['kick', 'hihat'], volume: '1', color: '#1F618D' }, // Beat 3
      5: { sound: ['hihat'], volume: '0.7', color: '#9E9E9E' },       // 3&
      6: { sound: ['snare', 'hihat'], volume: '1', color: '#4CAF50' }, // Beat 4
      7: { sound: ['hihat'], volume: '0.7', color: '#9E9E9E' }        // 4&
    };

    for (let i = 0; i < totalBeats; i++) {
        const beat = document.createElement('div');
        beat.className = 'beat';
        beat.dataset.beat = i;

        if (timeSignature === 4 && soundType === 'drums') {
            const config = drumSounds[i] || { sound: ['hihat'], volume: '0.7', color: '#9E9E9E' };
            beat.textContent = `${Math.floor(i / 2 + 1)}${i % 2 === 0 ? '' : '&'}`;
            beat.dataset.baseVolume = config.volume;
            beat.dataset.volume = config.volume;
            beat.dataset.sound = Array.isArray(config.sound) ? config.sound.join(',') : config.sound;
            beat.style.backgroundColor = config.color;
        } else if (soundType === 'drums') {
            // Fallback for other time signatures: strong beats = kick, others = hihat
            const isStrong = i % timeSignature === 0;
            beat.textContent = i + 1;
            beat.dataset.sound = isStrong ? 'kick' : 'hihat';
            beat.dataset.baseVolume = isStrong ? '1' : '0.7';
            beat.dataset.volume = isStrong ? '1' : '0.7';
            beat.style.backgroundColor = isStrong ? '#1F618D' : '#9E9E9E';
        } else {
            // Click/woodblock
            const isQuarterNote = timeSignature === 4 ? i % 2 === 0 : true;
            beat.textContent = timeSignature === 4 ? `${Math.floor(i / 2 + 1)}${isQuarterNote ? '' : '&'}` : i + 1;
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

        beat.addEventListener('click', () => toggleBeatState(beat, timeSignature, soundType));
        container.appendChild(beat);
    }

    // --- Drum Kit Select Dropdown Logic ---
    setupDrumKitSelect();
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
    if (!AudioContextManager.context || !AudioContextManager.samplesLoaded) {
        console.warn('[Metronome] AudioContext or samples not initialized');
        return;
    }

    const metronomeVolumeControl = document.getElementById('metronome-volume');
    const metronomeVolume = metronomeVolumeControl ? parseFloat(metronomeVolumeControl.value) || 1 : 1;
    const combinedVolume = baseVolume * metronomeVolume;
    if (combinedVolume <= 0) return;

    const soundType = UI.elements.soundType?.value || 'click';
    const kitIndex = typeof AudioContextManager.currentDrumKitIndex === "number"
        ? AudioContextManager.currentDrumKitIndex
        : currentDrumSetIndex;
    const beatElement = document.querySelector(`.beat[data-beat="${window.AppState?.currentBeat ?? 0}"]`);
    if (!beatElement) return;

    let drumSounds = beatElement.dataset.sound ? beatElement.dataset.sound.split(',') : [drumSound];
    const baseVolumeValue = parseFloat(beatElement.dataset.baseVolume) || 0;
    const isAccent = baseVolumeValue >= 1 && ['kick', 'snare'].includes(drumSounds[0]);
    const accentBoost = parseFloat(UI.elements.accentIntensity?.value || 1);
    let adjustedVolume = isAccent ? Math.min(combinedVolume * accentBoost, 0.7) : Math.min(combinedVolume, 0.7);

    for (let soundKey of drumSounds) {
        soundKey = soundKey.trim();
        if (soundKey === 'silent') continue;

        // Dynamically map the soundKey to the correct sample name
        const mappedType = drumKits[kitIndex]?.samples[soundKey] || soundKey;

        AudioContextManager.playDrumSample(mappedType, adjustedVolume);
    }
}
export function onMetronomeInstrumentChange(selectedInstrument) {
    setupDrumKitSelect();
}

// Import AppState at the end to avoid circular dependencies
import { AppState } from './app-state.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize listeners and setup functions
  setupSoundTypeListener();
  setupDrumKitSelect();
});
