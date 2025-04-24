import { UI } from '../core/ui-manager.js';
import { AudioContextManager } from '../core/audio-context.js';
import { log } from '../utils/helpers.js';
import { AppState } from './app-state.js';

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

// Metronome state
let metronomeInterval = null;
let currentBeat = 0;

// --- Drum Kit Select Dropdown Logic ---
export function setupDrumKitSelect() {
    const select = document.getElementById("drum-kit-select");
    if (!select) return;
    
    // Safely get soundType value
    const soundTypeValue = UI.elements.soundType?.value || 'click';
    
    select.value = currentDrumSetIndex;
    select.style.display = soundTypeValue === "drums" ? "inline-block" : "none";
    select.onchange = (e) => {
        currentDrumSetIndex = parseInt(e.target.value, 10);
        AudioContextManager.currentDrumKitIndex = currentDrumSetIndex;
        log(`[Metronome] Drum kit changed to: ${drumKits[currentDrumSetIndex].name}`);
    };
}

export function onMetronomeInstrumentChange() {
    const soundType = UI.elements.soundType.value;
    const drumSelect = document.getElementById("drum-kit-select");
    drumSelect.style.display = soundType === "drums" ? "inline-block" : "none";
    setupDrumKitSelect();
}

function setupSoundTypeListener() {
    const soundTypeSelect = document.getElementById("sound-type");
    soundTypeSelect.addEventListener("change", () => {
        onMetronomeInstrumentChange();
        createBeats(); // Rebuild beats when sound type changes
    });
}

// --- Metronome Control Functions ---
export function startMetronome(tempo) {
    if (metronomeInterval) return;
    const beatDuration = 60000 / tempo;
    metronomeInterval = setInterval(() => {
        currentBeat = (currentBeat + 1) % getTotalBeats();
        updateBeatDisplay(currentBeat);
        playMetronomeSound();
    }, beatDuration);
}

export function stopMetronome() {
    if (metronomeInterval) {
        clearInterval(metronomeInterval);
        metronomeInterval = null;
        currentBeat = 0;
        updateBeatDisplay(0);
    }
}

function getTotalBeats() {
    const timeSignature = parseInt(UI.elements.timeSignature.value) || 4;
    return timeSignature === 4 ? 8 : timeSignature;
}

function updateBeatDisplay(currentBeat) {
    const beats = document.querySelectorAll('.beats-container .beat');
    beats.forEach(beat => beat.classList.remove('active'));
    if (currentBeat < beats.length) {
        beats[currentBeat].classList.add('active');
    }
}

// --- Beat Creation ---
export function createBeats() {
    const container = document.querySelector('.beats-container');
    container.innerHTML = '';
    
    const timeSignature = parseInt(UI.elements.timeSignature.value);
    const soundType = UI.elements.soundType.value || 'click';
    const totalBeats = timeSignature === 4 ? 8 : timeSignature;

    const drumSounds = {
        0: { sound: ['kick', 'hihat'], volume: '1', color: '#1F618D' },
        1: { sound: ['hihat'], volume: '0.7', color: '#9E9E9E' },
        2: { sound: ['snare', 'hihat'], volume: '1', color: '#4CAF50' },
        3: { sound: ['hihat'], volume: '0.7', color: '#9E9E9E' },
        4: { sound: ['kick', 'hihat'], volume: '1', color: '#1F618D' },
        5: { sound: ['hihat'], volume: '0.7', color: '#9E9E9E' },
        6: { sound: ['snare', 'hihat'], volume: '1', color: '#4CAF50' },
        7: { sound: ['hihat'], volume: '0.7', color: '#9E9E9E' }
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
        } else {
            // ... (existing logic remains the same)
        }

        beat.addEventListener('click', () => toggleBeatState(beat, timeSignature, soundType));
        container.appendChild(beat);
    }
}

// --- Sound Playback ---
export function playMetronomeSound() {
    const timeSignature = parseInt(UI.elements.timeSignature.value) || 4;
    const beatElement = document.querySelector(`.beat[data-beat="${currentBeat}"]`);
    if (!beatElement) return;

    const baseVolume = parseFloat(beatElement.dataset.baseVolume) || 0;
    const drumSound = beatElement.dataset.sound || 'hihat';
    const metronomeVolume = getMetronomeVolume();

    if (baseVolume * metronomeVolume <= 0) return;

    const soundKeys = drumSound.split(',').map(s => s.trim());
    for (const soundKey of soundKeys) {
        AudioContextManager.playDrumSample(soundKey, baseVolume * metronomeVolume, false);
    }
}

function getMetronomeVolume() {
    const volumeControl = document.getElementById('metronome-volume');
    return volumeControl ? parseFloat(volumeControl.value) || 1 : 1;
}

document.addEventListener('DOMContentLoaded', () => {
    setupSoundTypeListener();
    setupDrumKitSelect();

    // Safely get elements
    const startStopButton = document.getElementById('start-stop');
    const tempoInput = document.getElementById('tempo-slider');

    if (startStopButton && tempoInput) {
        startStopButton.addEventListener('click', () => {
            const isRunning = startStopButton.textContent === 'Stop';
            const tempo = parseInt(tempoInput.value) || 120;
            if (isRunning) {
                stopMetronome();
                startStopButton.textContent = 'Start';
            } else {
                startMetronome(tempo);
                startStopButton.textContent = 'Stop';
            }
        });
    } else {
        console.error("Missing metronome control elements!");  //<- line 194
    }
});
