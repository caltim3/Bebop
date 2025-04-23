// core/audio-context.js
import { log, updateLoadingStatus } from '../utils/helpers.js';
import { AppState } from '../js/app-state.js';

// --- Drum Kit Definitions ---
const drumKits = [
    {
        name: "default",
        samples: {
            'hihat': 'HiHat.wav',
            'kick': 'Kick.wav',
            'snare': 'Snare.wav'
        }
    },
    {
        name: "makaya",
        samples: {
            'hihat2': 'HiHat2.wav',
            'kick2': 'Kick2.wav',
            'snare2': 'Snare2.wav'
        }
    },
    {
        name: "philly joe",
        samples: {
            'jazzkick': 'jazzkick.wav',
            'jazzsnare': 'jazzsnare.wav',
            'jazzhat': 'jazzhat.wav'
        }
    }
];

export const AudioContextManager = {
    context: null,
    drumKitBuffers: [{}, {}, {}], // One buffer object per kit
    currentDrumKitIndex: 0,
    pianoSamples: {},
    reverbNode: null,
    samplesLoaded: false,
    currentChordGain: null,

    async initialize() {
        if (!this.context) {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            console.log('[AudioContextManager] AudioContext created, state:', this.context.state);
            await this.loadDrumKits();
            await this.loadPianoSamples();
            await this.setupReverb();
        }
        if (this.context.state === 'suspended') {
            await this.context.resume();
            console.log('[AudioContextManager] AudioContext resumed, state:', this.context.state);
        }
        AppState.updateState({ audioInitialized: true });
        this.samplesLoaded = true;
        return this.context;
    },

    async ensureAudioContext() {
        return await this.initialize();
    },

    // --- Drum Kit Loading ---
    loadDrumKits: async function() {
    for (let kitIndex = 0; kitIndex < drumKits.length; kitIndex++) {
        const kit = drumKits[kitIndex];
        for (let [type, filename] of Object.entries(kit.samples)) {
            try {
                const response = await fetch(`./${filename}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const arrayBuffer = await response.arrayBuffer();
                this.drumKitBuffers[kitIndex][type] = await this.context.decodeAudioData(arrayBuffer);
                log(`Loaded ${type} for kit ${kit.name} from ${filename}`);
            } catch (error) {
                console.error(`Failed to load ${filename}:`, error);
                this.drumKitBuffers[kitIndex][type] = await this.createDrumSound(type);
                log(`Using fallback synthetic sound for ${type} in kit ${kit.name}`);
            }
        }
    }
    updateLoadingStatus("All drum kits loaded");
},

// --- Drum Kit Switching ---
setDrumKit: function(index) {
    if (index >= 0 && index < drumKits.length) {
        this.currentDrumKitIndex = index;
        updateLoadingStatus(`Drum kit set to: ${drumKits[index].name}`);
    }
},
getCurrentDrumKit: function() {
    return drumKits[this.currentDrumKitIndex];
},

// --- Drum Playback (uses selected kit) ---
playDrumSample: function(type, volume = 1) {
    if (!this.context) {
        console.error('[AudioContextManager] AudioContext not initialized');
        return;
    }

    // Fallback: if type not found, use hihat
    let buffer = this.drumKitBuffers[this.currentDrumKitIndex][type];
    if (!buffer) {
        console.warn(`[AudioContextManager] No buffer found for drum type: ${type} in kit ${this.currentDrumKitIndex}, falling back to hihat`);
        buffer = this.drumKitBuffers[this.currentDrumKitIndex]['hihat'];
        if (!buffer) {
            console.error(`[AudioContextManager] No buffer found for fallback drum type: hihat in kit ${this.currentDrumKitIndex}`);
            return;
        }
    }

    try {
        const source = this.context.createBufferSource();
        source.buffer = buffer;

        // Dry path
        const dryGain = this.context.createGain();
        dryGain.gain.value = Math.min(volume, 1);
        source.connect(dryGain);
        dryGain.connect(this.context.destination);

        // Wet (reverb) path
        if (this.reverbNode) {
            const reverbGain = this.context.createGain();
            reverbGain.gain.value = 0.2;
            source.connect(this.reverbNode);

            // Connect reverbNode to reverbGain, then to destination (for this playback only)
            this.reverbNode.connect(reverbGain);
            reverbGain.connect(this.context.destination);

            // Disconnect after playback
            source.onended = () => {
                try { this.reverbNode.disconnect(reverbGain); } catch (e) {}
                try { reverbGain.disconnect(); } catch (e) {}
            };
        }

        source.start(0);
        log(`[AudioContextManager] Played drum sample: ${type} at volume ${volume}`);
    } catch (error) {
        console.error(`[AudioContextManager] Error playing drum sample ${type}:`, error);
    }
},

    // --- Piano Sample Loading ---
loadPianoSamples: async function() {
    const octaves = [2, 3, 4, 5];
    const notes = ['c', 'cs', 'd', 'ds', 'e', 'f', 'fs', 'g', 'gs', 'a', 'as', 'b'];

    for (const octave of octaves) {
        for (const note of notes) {
            const sampleName = `${note}${octave}.wav`;
            try {
                const response = await fetch(`./${sampleName}`);
                if (!response.ok) throw new Error(`Failed to load ${sampleName}`);
                const arrayBuffer = await response.arrayBuffer();
                const sampleKey = `${note}${octave}`;
                this.pianoSamples[sampleKey] = await this.context.decodeAudioData(arrayBuffer);
                log(`Loaded ${sampleName} as key ${sampleKey}`);
            } catch (error) {
                console.error(`Error loading ${sampleName}:`, error);
            }
        }
    }
    updateLoadingStatus("Piano samples loaded");
},
    // --- Reverb Setup ---
    async setupReverb() {
        this.reverbNode = this.context.createConvolver();
        const sampleRate = this.context.sampleRate;
        const length = sampleRate * 2.5;
        const impulse = this.context.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
        }

        this.reverbNode.buffer = impulse;
        // Do not connect reverbNode directly to destination; connect in playback methods
    },

    // --- Fallback Drum Sound Synthesis ---
    async createDrumSound(type) {
        const sampleRate = this.context.sampleRate;
        const duration = type.includes('hihat') ? 0.05 : 0.2;
        const buffer = this.context.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        let effectiveType = type;
        if (type === 'hihat2' || type === 'jazzhat') effectiveType = 'hihat';
        if (type === 'kick2' || type === 'jazzkick') effectiveType = 'kick';
        if (type === 'snare2' || type === 'jazzsnare') effectiveType = 'snare';

        switch (effectiveType) {
            case 'hihat':
                for (let i = 0; i < data.length; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.01));
                }
                break;
            case 'kick':
                for (let i = 0; i < data.length; i++) {
                    const t = i / sampleRate;
                    data[i] = Math.sin(2 * Math.PI * 100 * t) * Math.exp(-t * 10) * 2;
                }
                break;
            case 'snare':
                for (let i = 0; i < data.length; i++) {
                    const t = i / sampleRate;
                    data[i] = ((Math.random() * 2 - 1) + Math.sin(2 * Math.PI * 200 * t)) * Math.exp(-t * 10) * 2;
                }
                break;
            default:
                for (let i = 0; i < data.length; i++) {
                    data[i] = Math.random() * 2 - 1; // Fallback noise
                }
                break;
        }

        return buffer;
    },

    // --- Piano Chord Playback (with gain, reverb, and smooth transitions) ---
    playChord(noteNames, duration = 1.5, velocity = 1) {
        if (!this.context) {
            console.error('[AudioContextManager] AudioContext not initialized');
            return;
        }

        // Fade out previous chord
        if (this.currentChordGain) {
            try {
                this.currentChordGain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.1);
            } catch (e) {}
        }

        const chordGain = this.context.createGain();
        chordGain.gain.value = velocity || 1.0;
        chordGain.connect(this.context.destination);

        // Wet (reverb) path
        let reverbGain = null;
        if (this.reverbNode) {
            reverbGain = this.context.createGain();
            reverbGain.gain.value = 0.25;
            this.reverbNode.connect(reverbGain);
            reverbGain.connect(this.context.destination);
        }

        noteNames.forEach(note => {
            const buffer = this.pianoSamples[note];
            if (!buffer) {
                console.warn(`[AudioContextManager] No buffer for note: ${note}`);
                return;
            }
            const source = this.context.createBufferSource();
            source.buffer = buffer;
            source.connect(chordGain);
            if (this.reverbNode) source.connect(this.reverbNode);
            source.start();
            source.stop(this.context.currentTime + duration);

            // Disconnect reverb after playback
            if (this.reverbNode && reverbGain) {
                source.onended = () => {
                    try { this.reverbNode.disconnect(reverbGain); } catch (e) {}
                    try { reverbGain.disconnect(); } catch (e) {}
                };
            }
        });

        this.currentChordGain = chordGain;
        setTimeout(() => {
            try { chordGain.disconnect(); } catch (e) {}
            if (reverbGain) try { reverbGain.disconnect(); } catch (e) {}
        }, duration * 1000 + 200);
    }
};
