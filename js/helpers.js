// Fix imports to use relative paths
import { AudioContextManager } from './audio-context.js';

export function log(message) {
    console.log(`[FretFlow Debug] ${message}`);
}

export function updateLoadingStatus(message) {
    let indicator = document.getElementById('loading-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'loading-indicator';
        document.body.appendChild(indicator);
    }
    indicator.textContent = message;
}

export async function ensureAudioInitialized() {
    if (!AudioContextManager.context || AudioContextManager.context.state === 'suspended') {
        try {
            await AudioContextManager.initialize();
            if (AudioContextManager.context.state === 'suspended') {
                await AudioContextManager.context.resume();
            }
        } catch (error) {
            console.error('Audio initialization failed:', error);
            alert('Please click anywhere on the page to enable audio playback');
            throw error;
        }
    }
}

export function isMinorKeyName(key) {
    return key && (key.endsWith('m') || key.endsWith('min'));
}

export function flattenNote(note) {
    const sharpToFlat = {
        'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb'
    };
    return sharpToFlat[note] || note;
}
