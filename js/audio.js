// js/audio.js
import { AppState, updateLoadingStatus } from './state.js';
import { OCTAVES_FOR_SAMPLES, ALL_NOTES_FOR_SAMPLES, FILE_FORMAT, PLAYBACK_OCTAVES, SAMPLE_NOTE_MAP } from './constants.js';
import { log, standardizeNoteNameForSamples } from './utils.js'; // Removed getMidiNoteNumber if not used here

export const AudioContextManager = {
    context: null,
    soundBuffers: {}, // For metronome sounds
    pianoSampleBuffers: {}, // For piano chord/note playback
    reverbNode: null,
    samplesLoaded: false,
    reverbAmount: 0.2, // Default reverb amount
    currentChordGain: null, // To manage fading out previous chords
    secondaryLoadStarted: false,
    reverbNodeConnected: false,

    async initialize() {
        if (this.context && this.context.state !== 'closed') {
            return this.context;
        }
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            log("AudioContext created/resumed.");
            updateLoadingStatus("Loading essential sounds...", true);

            await this.loadInitialSounds();
            AppState.audioInitialized = true;
            log("AudioContextManager initial sounds loaded.");

            await this.setupReverb();

            if (this.context.state === 'suspended') {
                await this.context.resume();
                log("AudioContext resumed from suspended state.");
            }
            setTimeout(() => this.loadSecondarySounds(), 100);

        } catch (error) {
            console.error("Error initializing AudioContextManager:", error);
            alert("Failed to initialize audio. Please ensure your browser supports Web Audio API and allow autoplay if prompted.");
            AppState.audioInitialized = false;
            throw error;
        }
        return this.context;
    },

    async ensureAudioContext() {
        if (!this.context || this.context.state === 'suspended') {
            return await this.initialize();
        }
        if (this.context.state === 'closed') {
            console.warn("AudioContext was closed, attempting to re-initialize.");
            return await this.initialize();
        }
        return this.context;
    },

    async loadInitialSounds() {
        try {
            const response = await fetch('drumsamples/Click.wav'); // Path relative to index.html
            if (!response.ok) throw new Error(`HTTP error ${response.status} for Click.wav`);
            const arrayBuffer = await response.arrayBuffer();
            this.soundBuffers['click'] = await this.context.decodeAudioData(arrayBuffer);
            log("Successfully loaded Click.wav");
        } catch (e) {
            console.error("Failed to load Click.wav:", e);
            this.soundBuffers['click'] = await this.createDrumSound('click');
            log("Using synthetic fallback for click sound.");
        }

        await this.loadPianoSamplesSpecific(PLAYBACK_OCTAVES);
        this.samplesLoaded = Object.keys(this.pianoSampleBuffers).length > 0;
        if (this.samplesLoaded) {
            log(`Initial piano samples (Octaves ${PLAYBACK_OCTAVES.join(',')}) loaded.`);
        } else {
            console.warn(`Initial piano samples (Octaves ${PLAYBACK_OCTAVES.join(',')}) failed to load any samples.`);
        }
    },

    async loadSecondarySounds() {
        if (this.secondaryLoadStarted) return;
        this.secondaryLoadStarted = true;
        log("Starting secondary background sound loading...");
        updateLoadingStatus("Loading additional sounds...", true);

        const loadPromises = [];
        // Filenames are now direct paths from the root (where index.html is)
        const soundsToLoad = {
            'woodblock': 'drumsamples/woodblock.wav',
            'hihat': 'drumsamples/HiHat.wav',
            'kick': 'drumsamples/Kick.wav',
            'snare': 'drumsamples/Snare.wav'
            // Add other specific drum set samples from constants.js if they need preloading
            // e.g. from drumSoundSets:
            // 'snare2': 'drumsamples/Snare2.wav',
            // 'hihat2': 'drumsamples/HiHat2.wav',
            // 'kick2': 'drumsamples/Kick2.wav',
            // 'jazzkick': 'drumsamples/jazzkick.wav',
            // 'jazzsnare': 'drumsamples/jazzsnare.wav',
            // 'jazzhat': 'drumsamples/jazzhat.wav'
        };

        for (let [type, filename] of Object.entries(soundsToLoad)) {
            if (!this.soundBuffers[type]) {
                loadPromises.push(this.loadSingleSound(type, filename));
            }
        }

        const remainingOctaves = OCTAVES_FOR_SAMPLES.filter(o => !PLAYBACK_OCTAVES.includes(o));
        if (remainingOctaves.length > 0) {
            loadPromises.push(this.loadPianoSamplesSpecific(remainingOctaves));
        }

        await Promise.allSettled(loadPromises);
        log("Secondary background sound loading complete.");
        updateLoadingStatus("All sounds loaded.", true);
        setTimeout(() => updateLoadingStatus("", false), 1500);
    },

    async loadSingleSound(type, filename) {
        try {
            const response = await fetch(filename); // filename is already like "drumsamples/HiHat.wav"
            if (!response.ok) throw new Error(`HTTP error ${response.status} for ${filename}`);
            const arrayBuffer = await response.arrayBuffer();
            this.soundBuffers[type] = await this.context.decodeAudioData(arrayBuffer);
            log(`Successfully loaded secondary sound: ${filename}`);
        } catch (e) {
            console.error(`Failed to load secondary sound ${filename}:`, e);
            this.soundBuffers[type] = await this.createDrumSound(type);
            log(`Using synthetic fallback for secondary sound: ${type}`);
        }
    },

    async loadPianoSamplesSpecific(octavesToLoad) {
        let loadedCount = 0;
        const promises = [];
        for (const note of ALL_NOTES_FOR_SAMPLES) {
            for (const octave of octavesToLoad) {
                if (!OCTAVES_FOR_SAMPLES.includes(octave)) continue;
                const sampleKey = `${note}${octave}`;
                if (this.pianoSampleBuffers[sampleKey]) continue;

                const filename = `pianosamples/${note}${octave}.${FILE_FORMAT}`; // Path relative to index.html
                promises.push(
                    fetch(filename)
                        .then(response => {
                            if (!response.ok) return Promise.reject(new Error(`HTTP error ${response.status} for ${filename}`));
                            return response.arrayBuffer();
                        })
                        .then(arrayBuffer => this.context.decodeAudioData(arrayBuffer))
                        .then(buffer => {
                            this.pianoSampleBuffers[sampleKey] = buffer;
                            loadedCount++;
                        })
                        .catch(error => { /* console.warn(`Failed to load piano sample: ${filename}`, error.message); */ })
                );
            }
        }
        await Promise.allSettled(promises);
        if (loadedCount > 0) {
            log(`Loaded ${loadedCount} new piano samples for octaves: [${octavesToLoad.join(', ')}]`);
        }
        this.samplesLoaded = Object.keys(this.pianoSampleBuffers).length > 0;
    },

    async createDrumSound(type) {
        if (!this.context) {
            console.warn("AudioContext not available for createDrumSound, attempting init.");
            await this.ensureAudioContext();
            if (!this.context) {
                console.error("AudioContext could not be initialized for createDrumSound.");
                return new AudioBuffer({ length: 1, sampleRate: 44100 });
            }
        }
        const sampleRate = this.context.sampleRate;
        const duration = type === 'hihat' ? 0.05 : 0.2;
        const buffer = this.context.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        let x;
        switch (type) {
            case 'click':
                for (let i = 0; i < data.length; i++) data[i] = Math.sin(i * 0.05) * Math.exp(-i * 0.01);
                break;
            case 'hihat':
                for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.01));
                break;
            case 'kick':
                for (let i = 0; i < data.length; i++) {
                    x = i / sampleRate;
                    data[i] = Math.sin(2 * Math.PI * 100 * Math.exp(-x * 5) * x) * Math.exp(-x * 10) * 2;
                }
                break;
            case 'snare':
                for (let i = 0; i < data.length; i++) {
                    x = i / sampleRate;
                    data[i] = ((Math.random() * 2 - 1) + Math.sin(2 * Math.PI * 200 * x)) * Math.exp(-x * 10) * 1.5;
                }
                break;
            case 'woodblock':
                for (let i = 0; i < data.length; i++) {
                    x = i / sampleRate;
                    data[i] = Math.sin(2 * Math.PI * 800 * x) * Math.exp(-x * 20);
                }
                break;
            default:
                for (let i = 0; i < data.length; i++) data[i] = Math.sin(i * 0.05) * Math.exp(-i * 0.01);
        }
        return buffer;
    },

    async setupReverb() {
        if (!this.context) return;
        if (!this.reverbNode) {
            try {
                this.reverbNode = this.context.createConvolver();
                const sampleRate = this.context.sampleRate;
                const length = sampleRate * 2.5;
                const impulse = this.context.createBuffer(2, length, sampleRate);
                for (let channel = 0; channel < 2; channel++) {
                    const channelData = impulse.getChannelData(channel);
                    for (let i = 0; i < length; i++) {
                        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
                    }
                }
                this.reverbNode.buffer = impulse;
                log("Reverb node created with synthetic impulse response.");

                if (this.context.destination && !this.reverbNodeConnected) {
                    this.reverbNode.connect(this.context.destination);
                    this.reverbNodeConnected = true;
                    log("Reverb node connected to destination.");
                }
            } catch (e) {
                console.error("Failed to create reverb node:", e);
                this.reverbNode = null;
            }
        }
    }
};

export async function ensureAudioInitializedUserInteraction() {
    if (!AppState.audioInitialized) {
        try {
            await AudioContextManager.initialize();
            log("Audio context initialized on user interaction.");
        } catch (e) {
            console.error('Audio initialization failed on user interaction:', e);
        }
    }
}

export function playNote(noteNameWithOctave, volume = 0.5, duration = 500) {
    if (!AudioContextManager.context || !AudioContextManager.samplesLoaded || !noteNameWithOctave) {
        return;
    }
    const match = noteNameWithOctave.match(/^([A-G][#bs]?)(\d)$/i);
    if (!match) {
        console.warn(`Invalid note format for playback: ${noteNameWithOctave}`);
        return;
    }
    let [, pitchClass, octaveStr] = match;
    const samplePitchClass = standardizeNoteNameForSamples(pitchClass);
    const octave = Math.max(OCTAVES_FOR_SAMPLES[0], Math.min(OCTAVES_FOR_SAMPLES[OCTAVES_FOR_SAMPLES.length - 1], parseInt(octaveStr)));

    const sampleKey = `${samplePitchClass}${octave}`;
    const buffer = AudioContextManager.pianoSampleBuffers[sampleKey];

    if (!buffer) {
        return;
    }

    try {
        const source = AudioContextManager.context.createBufferSource();
        source.buffer = buffer;
        const gainNode = AudioContextManager.context.createGain();
        gainNode.gain.setValueAtTime(volume, AudioContextManager.context.currentTime);
        source.connect(gainNode);
        gainNode.connect(AudioContextManager.context.destination);
        source.start(AudioContextManager.context.currentTime);
        if (duration > 0) {
            source.stop(AudioContextManager.context.currentTime + duration / 1000);
        }
    } catch (e) {
        console.error('Error playing note:', e);
    }
}