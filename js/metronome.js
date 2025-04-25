import { UI } from './ui-manager.js';
import { AudioContextManager } from './audio-context.js';
import { log } from './helpers.js';
import { AppState } from './app-state.js';

let intervalId = null;
let currentBeat = 0;

export function setupDrumKitSelect() {
    const soundType = UI.elements.soundType;
    if (!soundType) {
        log("Error: #sound-type element not found for drum kit selection");
        return;
    }

    const drumKits = [
        { value: 'default', label: 'Default Kit' },
        { value: 'makaya', label: 'Makaya Kit' },
        { value: 'phillyjoe', label: 'Philly Joe Kit' },
    ];

    soundType.innerHTML = drumKits.map(kit => `<option value="${kit.value}">${kit.label}</option>`).join('');
}

export function onMetronomeInstrumentChange() {
    const soundType = UI.elements.soundType;
    if (!soundType) {
        log("Error: #sound-type element not found for instrument change");
        return;
    }

    const drumKitMap = {
        'default': 0,
        'makaya': 1,
        'phillyjoe': 2,
    };

    const selectedKit = soundType.value;
    const kitIndex = drumKitMap[selectedKit] || 0;
    AudioContextManager.setDrumKit(kitIndex);

    const soundOptions = [
        { value: 'hihat', label: 'Hi-Hat' },
        { value: 'kick', label: 'Kick' },
        { value: 'snare', label: 'Snare' },
        { value: 'click', label: 'Click' },
        { value: 'woodblock', label: 'Woodblock' },
    ];

    soundType.innerHTML = soundOptions.map(option => `<option value="${option.value}">${option.label}</option>`).join('');
}

export function setupSoundTypeListener() {
    const soundType = UI.elements.soundType;
    if (soundType) {
        soundType.addEventListener('change', onMetronomeInstrumentChange);
    } else {
        log("Error: #sound-type element not found for sound type listener");
    }
}

export function startMetronome(tempo) {
    if (intervalId) return;

    const intervalMs = (60 / tempo) * 1000;
    currentBeat = 0;

    intervalId = setInterval(() => {
        playMetronomeSound();
        updateBeatDisplay(currentBeat);
        currentBeat = (currentBeat + 1) % getTotalBeats();
        AppState.updateState({ currentBeat });
    }, intervalMs);

    AppState.updateState({ isPlaying: true, tempo });
}

export function stopMetronome() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    currentBeat = 0;
    updateBeatDisplay(currentBeat);
    AppState.updateState({ isPlaying: false, currentBeat: 0 });
}

export function getTotalBeats() {
    return 4; // Assuming 4/4 time signature
}

export function updateBeatDisplay(currentBeat) {
    const beatElements = document.querySelectorAll('#beats-container .beat');
    if (!beatElements.length) {
        log("Error: #beats-container or .beat elements not found for beat display");
        return;
    }
    beatElements.forEach((beat, index) => {
        beat.classList.toggle('active', index === currentBeat);
    });
}

export function createBeats() {
    const beatsContainer = document.getElementById('beats-container');
    if (!beatsContainer) {
        log("Error: #beats-container element not found for creating beats");
        return;
    }

    beatsContainer.innerHTML = '';
    const totalBeats = getTotalBeats();
    for (let i = 0; i < totalBeats; i++) {
        const beat = document.createElement('div');
        beat.className = 'beat';
        beatsContainer.appendChild(beat);
    }
}

export function playMetronomeSound() {
    const soundType = UI.elements.soundType?.value || 'hihat';
    const volume = getMetronomeVolume();
    const enableReverb = false; // Adjust as needed
    AudioContextManager.playDrumSample(soundType, volume, enableReverb);
}

export function getMetronomeVolume() {
    const metronomeVolume = UI.elements.metronomeVolume;
    if (!metronomeVolume) {
        log("Error: #metronome-volume element not found, defaulting to 1.0");
        return 1.0;
    }
    return parseFloat(metronomeVolume.value) || 1.0;
}
