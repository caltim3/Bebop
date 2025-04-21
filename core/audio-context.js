import { log, updateLoadingStatus } from '../utils/helpers.js';

// AudioContextManager Object
export const AudioContextManager = {
    context: null,
    soundBuffers: {}, // For drum sounds (click, hihat, etc.)
    pianoSamples: {}, // Replaces pianoSampleBuffers for WAVs
    reverbNode: null,
    samplesLoaded: false,
    currentChordGain: null,
    async initialize() {
        if (!this.context) {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            await this.loadSounds();
            await this.loadPianoSamples();
            await this.setupReverb();
        }
        if (this.context.state === 'suspended') {
            await this.context.resume();
        }
        AppState.updateState({ audioInitialized: true });
        this.samplesLoaded = true; // Update flag
        return this.context;
    },
    async ensureAudioContext() {
        return await this.initialize();
    },
    async loadSounds() {
        const soundFiles = {
            'click': 'Click.wav',
            'hihat': 'HiHat.wav',
            'kick': 'Kick.wav',
            'snare': 'Snare.wav',
            'woodblock': 'woodblock.wav',
            'hihat2': 'HiHat2.wav',
            'kick2': 'Kick2.wav',
            'snare2': 'Snare2.wav',
            'jazzkick': 'jazzkick.wav',
            'jazzsnare': 'jazzsnare.wav',
            'jazzhat': 'jazzhat.wav'
        };
        for (let [type, filename] of Object.entries(soundFiles)) {
            try {
                const response = await fetch(`./${filename}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const arrayBuffer = await response.arrayBuffer();
                this.soundBuffers[type] = await this.context.decodeAudioData(arrayBuffer);
                log(`Loaded ${type} sound from ${filename}`);
            } catch (error) {
                console.error(`Failed to load ${filename}:`, error);
                this.soundBuffers[type] = await this.createDrumSound(type);
                log(`Using fallback synthetic sound for ${type}`);
            }
        }
        updateLoadingStatus("Drum sounds loaded");
    },
    
    async loadPianoSamples() {
        const octaves = [2, 3, 4, 5];
        const notes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
        for (const octave of octaves) {
            for (const note of notes) {
                const sampleName = `${note}${octave}.wav`; // e.g., 'c#3.wav'
                try {
                    const response = await fetch(`./${sampleName}`);
                    if (!response.ok) throw new Error(`Failed to load ${sampleName}`);
                    const arrayBuffer = await response.arrayBuffer();
                    this.pianoSamples[`${note}${octave}`] = await this.context.decodeAudioData(arrayBuffer);
                    log(`Loaded ${sampleName}`);
                } catch (error) {
                    console.error(`Error loading ${sampleName}:`, error);
                }
            }
        }
        updateLoadingStatus("Piano samples loaded");
    },
    
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
        this.reverbNode.connect(this.context.destination);
    },
    
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
            case 'click':
                for (let i = 0; i < data.length; i++) {
                    data[i] = Math.sin(i * 0.05) * Math.exp(-i * 0.01);
                }
                break;
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
            case 'woodblock':
                for (let i = 0; i < data.length; i++) {
                    const t = i / sampleRate;
                    data[i] = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 20);
                }
                break;
            default:
                for (let i = 0; i < data.length; i++) {
                    data[i] = Math.random() * 2 - 1; // Fallback noise
                }
                break;
        }
        return buffer;
    }
};

export default AudioContextManager;
