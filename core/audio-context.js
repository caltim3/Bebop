import { log, updateLoadingStatus } from '../utils/helpers.js';
import { AppState } from '../js/app-state.js';

export const AudioContextManager = {
    context: null,
    pianoSamples: {},
    drumKits: [],
    currentDrumKitIndex: 0,
    reverbNode: null,
    isInitialized: false,

    async initialize() {
        if (this.isInitialized) return;
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        await this.loadDrumKits();
        await this.loadPianoSamples();
        await this.setupReverb();
        this.isInitialized = true;
        AppState.updateState({ audioInitialized: true });
        updateLoadingStatus("Audio context initialized");
    },

    async ensureAudioContext() {
        if (!this.context) {
            await this.initialize();
        }
        if (this.context.state === 'suspended') {
            await this.context.resume();
        }
        return this.context;
    },

    async loadDrumKits() {
        const drumKitFiles = [
            {
                name: "default",
                samples: {
                    'hihat': 'HiHat.wav',
                    'kick': 'Kick.wav',
                    'snare': 'Snare.wav',
                    'click': 'Click.wav',
                    'woodblock': 'woodblock.wav'
                }
            },
            {
                name: "makaya",
                samples: {
                    'hihat': 'HiHat2.wav',
                    'kick': 'Kick2.wav',
                    'snare': 'Snare2.wav',
                    'click': 'Click.wav',
                    'woodblock': 'woodblock.wav'
                }
            },
            {
                name: "philly joe",
                samples: {
                    'hihat': 'jazzhat.wav',
                    'kick': 'jazzkick.wav',
                    'snare': 'jazzsnare.wav',
                    'click': 'Click.wav',
                    'woodblock': 'woodblock.wav'
                }
            }
        ];

        this.drumKits = await Promise.all(drumKitFiles.map(async (kit) => {
            const loadedSamples = {};
            for (const [type, file] of Object.entries(kit.samples)) {
                try {
                    const response = await fetch(`${file}`)
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const arrayBuffer = await response.arrayBuffer();
                    loadedSamples[type] = await this.context.decodeAudioData(arrayBuffer);
                    log(`Successfully loaded drum sample for ${kit.name} - ${type}: ${file}`);
                } catch (error) {
                    log(`Failed to load drum sample for ${kit.name} - ${type}: ${file} - ${error}`);
                    loadedSamples[type] = this.createDrumSound(type);
                }
            }
            return { name: kit.name, samples: loadedSamples };
        }));

        this.setDrumKit(this.currentDrumKitIndex);
        log("Drum kits loaded");
    },

    setDrumKit(index) {
        this.currentDrumKitIndex = index;
        log(`Set drum kit to: ${this.drumKits[index].name} (index ${index})`);
    },

    getCurrentDrumKit() {
        return this.drumKits[this.currentDrumKitIndex] || this.drumKits[0];
    },

    playDrumSample(type, volume = 1, enableReverb = false) {
        const kit = this.getCurrentDrumKit();
        log(`Playing drum sample - Kit: ${kit.name}, Type: ${type}`);
        const buffer = kit.samples[type] || this.createDrumSound(type);
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        const gainNode = this.context.createGain();
        gainNode.gain.value = volume;

        if (enableReverb && this.reverbNode) {
            source.connect(gainNode).connect(this.reverbNode).connect(this.context.destination);
        } else {
            source.connect(gainNode).connect(this.context.destination);
        }

        source.start();
    },

    async loadPianoSamples() {
        this.pianoSamples = {};
        const notes = ['c', 'cs', 'd', 'ds', 'e', 'f', 'fs', 'g', 'gs', 'a', 'as', 'b'];
        for (let octave = 2; octave <= 5; octave++) {
            for (const note of notes) {
                const sampleName = `${note}${octave}.wav`;
                try {
                    const response = await fetch(`${sampleName}`)
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const arrayBuffer = await response.arrayBuffer();
                    this.pianoSamples[`${note}${octave}`] = await this.context.decodeAudioData(arrayBuffer);
                    log(`Loaded piano sample: ${sampleName}`);
                } catch (error) {
                    log(`Failed to load piano sample ${sampleName}: ${error}`);
                }
            }
        }
        updateLoadingStatus("Piano samples loaded");
    },

    async setupReverb() {
        this.reverbNode = null;
        try {
        const response = await fetch('ir_sweep.wav');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            this.reverbNode = this.context.createConvolver();
            this.reverbNode.buffer = await this.context.decodeAudioData(arrayBuffer);
            this.reverbNode.connect(this.context.destination);
            log("Reverb setup complete");
        } catch (error) {
            log(`Failed to load reverb impulse response (ir_sweep.wav): ${error}. Proceeding without reverb.`);
        }
    },

    createDrumSound(type) {
        const bufferSize = this.context.sampleRate * 0.5;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);

        if (type === 'click' || type === 'woodblock') {
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.context.sampleRate * 0.01));
            }
        } else if (type === 'kick') {
            for (let i = 0; i < bufferSize; i++) {
                const t = i / this.context.sampleRate;
                data[i] = Math.sin(2 * Math.PI * (60 - t * 50) * t) * Math.exp(-t * 10);
            }
        } else if (type === 'snare') {
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.context.sampleRate * 0.02));
            }
        } else if (type === 'hihat') {
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.context.sampleRate * 0.005));
            }
        }

        return buffer;
    },

    async playChord(noteNames, duration = 1, velocity = 0.5) {
        await this.ensureAudioContext();
        noteNames.forEach(note => {
            const noteMatch = note.match(/([A-Ga-g][b#]?)(\d+)/);
            if (!noteMatch) return;

            let [, noteName, octave] = noteMatch; // Renamed 'note' to 'noteName'
            noteName = noteName.toLowerCase().replace('#', 's'); // Use 'noteName'

            const sampleKey = `${noteName}${octave}`;
            const buffer = this.pianoSamples[sampleKey];
            if (!buffer) {
                log(`No piano sample for ${sampleKey}`);
                return;
            }

            const source = this.context.createBufferSource();
            source.buffer = buffer;
            const gainNode = this.context.createGain();
            gainNode.gain.value = velocity;
            source.connect(gainNode);
            if (this.reverbNode) {
                gainNode.connect(this.reverbNode);
            }
            gainNode.connect(this.context.destination);
            source.start();
            source.stop(this.context.currentTime + duration);
        });
    }
};
