function log(message) {
    console.log(`[FretFlow Debug] ${message}`);
}

// Place updateLoadingStatus here:
function updateLoadingStatus(message) {
    let indicator = document.getElementById('loading-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'loading-indicator';
        document.body.appendChild(indicator);
    }
    indicator.textContent = message;
}      
// Musical Constants
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
const ENHARMONIC_MAP = {
    'C#': 'Db', 'Db': 'Db',
    'D#': 'Eb', 'Eb': 'Eb',
    'F#': 'Gb', 'Gb': 'Gb',
    'G#': 'Ab', 'Ab': 'Ab',
    'A#': 'Bb', 'Bb': 'Bb'
};

const FRETBOARD_FREQUENCIES = {
    'string6': [82.41, 87.31, 92.50, 98.00, 103.83, 110.00, 116.54, 123.47, 130.81, 138.59, 146.83, 155.56, 164.81],
    'string5': [110.00, 116.54, 123.47, 130.81, 138.59, 146.83, 155.56, 164.81, 174.61, 185.00, 196.00, 207.65, 220.00],
    'string4': [146.83, 155.56, 164.81, 174.61, 185.00, 196.00, 207.65, 220.00, 233.08, 246.94, 261.63, 277.18, 293.66],
    'string3': [196.00, 207.65, 220.00, 233.08, 246.94, 261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00],
    'string2': [246.94, 261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 415.30, 440.00, 466.16, 493.88],
    'string1': [329.63, 349.23, 369.99, 392.00, 415.30, 440.00, 466.16, 493.88, 523.25, 554.37, 587.33, 622.25, 659.25]
};

const SCALES = {
    // Basic Scales
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
    melodicMinor: [0, 2, 3, 5, 7, 9, 11],
    
    // Modes
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    locrian: [0, 1, 3, 5, 6, 8, 10],
    
    // Jazz Scales
    bebopDominant: [0, 2, 4, 5, 7, 9, 10, 11],
    bebopMajor: [0, 2, 4, 5, 7, 8, 9, 11],
    bebopDorian: [0, 2, 3, 4, 5, 7, 9, 10],
    bebopPhrygian: [0, 1, 2, 3, 5, 7, 8, 10], // Added Bebop Phrygian
    altered: [0, 1, 3, 4, 6, 8, 10],      // Super Locrian
    lydianDominant: [0, 2, 4, 6, 7, 9, 10],
    
    // Symmetric Scales
    diminishedWH: [0, 2, 3, 5, 6, 8, 9, 11],  // Diminished (Whole-Half)
    diminishedHW: [0, 1, 3, 4, 6, 7, 9, 10],  // Diminished (Half-Whole)
    wholeHalf: [0, 2, 4, 6, 8, 10],           // Whole Tone
    
    // Pentatonic Scales
    pentatonicMajor: [0, 2, 4, 7, 9],
    pentatonicMinor: [0, 3, 5, 7, 10],
    
    // Blues Scales
    blues: [0, 3, 5, 6, 7, 10],
    majorBlues: [0, 2, 3, 4, 7, 9],
    
    // Additional Modern Jazz Scales
    halfWhole: [0, 1, 3, 4, 6, 7, 9, 10],
    harmonicMajor: [0, 2, 4, 5, 7, 8, 11],
    doubleHarmonic: [0, 1, 4, 5, 7, 8, 11],

    'enigmatic': [0, 1, 4, 6, 8, 10, 11],
    'persian': [0, 1, 4, 5, 6, 8, 11],
    'arabic': [0, 2, 4, 5, 6, 8, 10],
    'japanese': [0, 2, 5, 7, 8],
    'egyptian': [0, 2, 5, 7, 10]
    
};

const TUNINGS = {
    standard: ['E', 'B', 'G', 'D', 'A', 'E'],  // Note the order change
    dropD: ['E', 'B', 'G', 'D', 'A', 'D'],
    openG: ['D', 'B', 'G', 'D', 'G', 'D'],
    DADGAD: ['D', 'A', 'G', 'D', 'A', 'D'],
    openE: ['E', 'B', 'E', 'Ab', 'B', 'E']
};

        
const DRUM_PATTERNS = {
    '2': { kick: [1, 0], snare: [0, 1], hihat: [1, 1] },
    '3': { kick: [1, 0, 0], snare: [0, 1, 0], hihat: [1, 1, 1] },
    '4': { kick: [1, 0, 0, 0, 1, 0, 0, 0], snare: [0, 0, 1, 0, 0, 0, 1, 0], hihat: [1, 1, 1, 1, 1, 1, 1, 1] },
    '6': { kick: [1, 0, 0, 1, 0, 0], snare: [0, 0, 1, 0, 0, 1], hihat: [1, 1, 1, 1, 1, 1] },
    '7': { kick: [1, 0, 0, 1, 0, 0, 0], snare: [0, 0, 1, 0, 0, 1, 0], hihat: [1, 1, 1, 1, 1, 1, 1] },
    '8': { kick: [1, 0, 0, 0, 1, 0, 0, 0], snare: [0, 0, 1, 0, 0, 0, 1, 0], hihat: [1, 1, 1, 1, 1, 1, 1, 1] },
    '12': { kick: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0], snare: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] }
};
const drumSoundSets = [
    {
        name: "Drums Drums",
        snare: "Snare.wav",
        hihat: "HiHat.wav",
        kick: "Kick.wav"
    },
    {
        name: "Makaya Drums",
        snare: "Snare2.wav",
        hihat: "HiHat2.wav",
        kick: "Kick2.wav"
    },
    {
        name: "Max Drums",
        kick: 'jazzkick.wav',
        snare: 'jazzsnare.wav',
        hihat: 'jazzhat.wav'
    }
];

let currentDrumSetIndex = 0;
const progressions = {
    "I V7": { defaultKey: "C", progression: ["I", "V7"] },
    "jazz_blues": { defaultKey: "Bb", progression: ["I7", "IV7", "I7", "I7", "IV7", "IV7", "I7", "VI7", "IIm7", "V7", "I7", "V7"] },
    "minor_blues": { defaultKey: "Am", progression: ["im7", "ivm7", "im7", "im7", "ivm7", "ivm7", "im7", "im7", "V7", "V7", "im7", "V7"] },
    "rhythm_changes": { defaultKey: "Bb", progression: ["I6", "vim7", "iim7", "V7", "I6", "vim7", "iim7", "V7", "I6", "IV7", "I6", "I6", "iim7", "V7", "I6", "V7"] },
    "2_5_1": { defaultKey: "C", progression: ["iim7", "V7", "Imaj7", "Imaj7"] },
    "6_2_5_1": { defaultKey: "C", progression: ["vim7", "iim7", "V7", "Imaj7", "Imaj7"] },
    "minor_2_5_1": { defaultKey: "Am", progression: ["iim7b5", "V7b9", "im7", "im7"] },
    "dark_eyes": { defaultKey: "Dm", progression: ["V7", "V7", "im7", "im7", "V7", "V7", "VI6", "VI6", "ivm6", "ivm6", "im7", "im7", "V7", "V7", "im7", "im7"] },    
    "ill_see_you_in_my_dreams": { defaultKey: "F", progression: ["IV6", "IV6", "ivm6", "ivm6", "Imaj7", "VII7", "Imaj7", "Imaj7", "VI7", "VI7", "VI7", "VI7", "II7", "II7", "iim7", "V7", "Imaj7"] },
    "rose_room": {defaultKey: "Ab", progression: ["II7", "V7", "I6", "I7", "IV6", "ivm7", "bVII7", "I6", "VI7", "V7", "V7", "II7", "V7", "I6", "I7", "IV6", "ivm7", "bVII7", "I6", "VI7", "IV7", "V7", "I6", "VI7"] },
    "black_orpheus": { defaultKey: "Am", progression: ["im7", "iim7b5", "V7b9", "im7", "ivm7", "VII7", "bIIImaj7", "bVImaj7", "iim7b5", "V7b9", "im7", "iim7b5", "V7b9", "im7", "ivm7", "VII7"] },
    "all_the_things_you_are": { defaultKey: "Ab", progression: ["vim7", "iim7", "V7", "Imaj7", "IVmaj7", "iiim7", "VI7", "IImaj7", "iim7", "vm7", "I7", "IVmaj7", "Imaj7", "iim7", "V7", "Imaj7", "iim7", "V7", "Imaj7", "iim7", "vm7", "I7", "IVmaj7", "Imaj7"] },
    "all_of_me": { defaultKey: "C", progression: ["Imaj7", "III7", "VI7", "iim7", "III7", "vim7", "II7", "iim7", "V7", "Imaj7", "III7", "VI7", "iim7", "IV", "iv", "Imaj7", "V7"] },
    "stella_by_starlight": { defaultKey: "Bb", progression: ["iim7b5", "V7b9", "im7", "IV7", "vm7", "I7", "IVmaj7", "bVIImaj7", "iiim7b5", "VI7b9", "iim7", "V7", "im7", "IV7", "IVmaj7", "V7"] },
    "autumn_leaves": { defaultKey: "Em", progression: ["ivm7", "VII7", "bIIImaj7", "bVImaj7", "iim7b5", "V7b9", "im7", "im7"] },
    "summertime": { defaultKey: "Am", progression: ["im7", "V7", "im7", "V7", "im7", "V7", "im7", "V7", "iv7", "im7", "V7", "im7", "iv7", "im7", "V7", "im7"] },
    "girl_from_ipanema": { defaultKey: "F", progression: ["Imaj7", "II7", "iim7", "V7", "Imaj7", "II7", "iim7", "V7", "Imaj7", "bII7", "IV#maj7", "vim7", "iim7", "V7", "Imaj7", "vim7", "iim7", "V7"] },
    "coltrane_changes": { defaultKey: "C", progression: ["Imaj7", "bIII7", "bVImaj7", "VII7", "IIImaj7", "V7", "Imaj7", "bIII7", "bVImaj7", "VII7", "IIImaj7", "V7"] },
    "bird_blues": { defaultKey: "F", progression: ["I7", "IV7", "I7", "vim7", "iim7", "V7", "IV7", "ivm7", "I7", "vim7", "iim7", "V7"] },
    "just_friends": { defaultKey: "G", progression: ["Imaj7", "VI7", "iim7", "V7", "Imaj7", "VI7", "iim7", "V7", "iim7", "V7", "Imaj7", "VI7", "iim7", "V7", "Imaj7", "VI7"] },
    "blue_bossa": { defaultKey: "Cm", progression: ["im7", "im7", "bVII7", "bVII7", "im7", "im7", "ivm7", "bVII7", "im7", "V7", "im7", "im7"] },
    "on_green_dolphin_street": { defaultKey: "C", progression: ["Imaj7", "bIII7", "bVImaj7", "iim7", "V7", "Imaj7", "bIII7", "bVImaj7", "iim7", "V7", "Imaj7"] },
    "solar": { defaultKey: "C", progression: ["im7", "im7", "bIIImaj7", "bIIImaj7", "bVImaj7", "bVImaj7", "bII7", "bII7", "im7", "im7"] },
    "misty": { defaultKey: "Eb", progression: ["Imaj7", "I7", "IVmaj7", "ivm7", "Imaj7", "V7", "Imaj7", "vim7", "iim7", "V7", "Imaj7"] },
    "days_of_wine_and_roses": { defaultKey: "F", progression: ["Imaj7", "vim7", "iim7", "V7", "Imaj7", "vim7", "iim7", "V7", "Imaj7", "vim7", "iim7", "V7", "Imaj7"] },
    "cherokee": { defaultKey: "Bb", progression: ["Imaj7", "Imaj7", "iim7", "V7", "Imaj7", "Imaj7", "iim7", "V7","bVI7", "bVI7", "V7", "V7", "Imaj7", "Imaj7", "iim7", "V7"] },
    "caravan": { defaultKey: "Eb", progression: ["im7", "IV7", "im7", "IV7", "im7", "IV7", "im7", "IV7", "bVII7", "bVII7", "Imaj7", "Imaj7", "V7", "V7", "im7", "im7"] },
    "nows_the_time": { defaultKey: "F", progression: ["I7", "I7", "I7", "I7", "IV7", "IV7", "I7", "I7", "V7", "IV7", "I7", "I7"] },
    "tenor_madness": { defaultKey: "Bb", progression: ["I7", "I7", "I7", "I7", "IV7", "IV7", "I7", "I7", "iim7", "V7", "I7", "I7"] }
};        
const scaleDegrees = {
    major: {
        // Basic triads (uppercase = major, lowercase = minor)
        'I': 0, 'II': 2, 'III': 4, 'IV': 5, 'V': 7, 'VI': 9, 'VII': 11,
        'i': 0, 'ii': 2, 'iii': 4, 'iv': 5, 'v': 7, 'vi': 9, 'vii': 11,
        
        // Seventh chords
        'I7': 0, 'II7': 2, 'III7': 4, 'IV7': 5, 'V7': 7, 'VI7': 9, 'VII7': 11,
        'i7': 0, 'ii7': 2, 'iii7': 4, 'iv7': 5, 'v7': 7, 'vi7': 9, 'vii7': 11,
        'Im7': 0, 'IIm7': 2, 'IIIm7': 4, 'IVm7': 5, 'Vm7': 7, 'VIm7': 9, 'VIIm7': 11,
        'Imaj7': 0, 'IImaj7': 2, 'IIImaj7': 4, 'IVmaj7': 5, 'Vmaj7': 7, 'VImaj7': 9, 'VIImaj7': 11,
        
        // Extended and altered chords
        'I9': 0, 'II9': 2, 'III9': 4, 'IV9': 5, 'V9': 7, 'VI9': 9, 'VII9': 11,
        'I13': 0, 'II13': 2, 'III13': 4, 'IV13': 5, 'V13': 7, 'VI13': 9, 'VII13': 11,
        'V7b9': 7, 'V7#9': 7, 'V7b13': 7, 'V7#11': 7,
        
        // Diminished and half-diminished
        'vii°': 11, 'ii°': 2, 'iii°': 4,
        'vii∅7': 11, 'ii∅7': 2, 'iii∅7': 4,
        
        // Flat/borrowed chords
        'bII': 1, 'bIII': 3, 'bV': 6, 'bVI': 8, 'bVII': 10,
        'bII7': 1, 'bIII7': 3, 'bV7': 6, 'bVI7': 8, 'bVII7': 10,
        'bIImaj7': 1, 'bIIImaj7': 3, 'bVmaj7': 6, 'bVImaj7': 8, 'bVIImaj7': 10
    },
    minor: {
        // Basic triads
        'i': 0, 'ii': 2, 'III': 3, 'iv': 5, 'v': 7, 'VI': 8, 'VII': 10,
        'i°': 0, 'ii°': 2, 'III+': 3, 'iv°': 5, 'v°': 7, 'VI+': 8, 'vii°': 11,
        
        // Seventh chords
        'i7': 0, 'ii7': 2, 'III7': 3, 'iv7': 5, 'v7': 7, 'VI7': 8, 'VII7': 10,
        'im7': 0, 'iim7': 2, 'IIIm7': 3, 'ivm7': 5, 'vm7': 7, 'VIm7': 8, 'VIIm7': 10,
        'imaj7': 0, 'iimaj7': 2, 'IIImaj7': 3, 'ivmaj7': 5, 'vmaj7': 7, 'VImaj7': 8, 'VIImaj7': 10,
        
        // Half-diminished and diminished sevenths
        'iø7': 0, 'iiø7': 2, 'IIIø7': 3, 'ivø7': 5, 'vø7': 7, 'VIø7': 8, 'VIIø7': 10,
        'i°7': 0, 'ii°7': 2, 'III°7': 3, 'iv°7': 5, 'v°7': 7, 'VI°7': 8, 'VII°7': 10,
        'iim7b5': 2, 'iiim7b5': 4, 'vim7b5': 9,
        
        // Extended and altered chords
        'i9': 0, 'ii9': 2, 'III9': 3, 'iv9': 5, 'v9': 7, 'VI9': 8, 'VII9': 10,
        'i13': 0, 'ii13': 2, 'III13': 3, 'iv13': 5, 'v13': 7, 'VI13': 8, 'VII13': 10,
        'V7b9': 7, 'V7#9': 7, 'V7b13': 7, 'V7#11': 7,
        
        // Borrowed/modal interchange chords
        'bII': 1, 'bIII': 3, 'bIV': 4, 'bV': 6, 'bVI': 8, 'bVII': 10,
        'bII7': 1, 'bIII7': 3, 'bIV7': 4, 'bV7': 6, 'bVI7': 8, 'bVII7': 10,
        'bIImaj7': 1, 'bIIImaj7': 3, 'bIVmaj7': 4, 'bVmaj7': 6, 'bVImaj7': 8, 'bVIImaj7': 10,
        
        // Common secondary dominants
        'V7/III': 7, 'V7/iv': 7, 'V7/v': 7, 'V7/VI': 7, 'V7/VII': 7,
        'V7/bIII': 7, 'V7/bVI': 7, 'V7/bVII': 7
    }
};   
// State Management
const AppState = {
    isPlaying: false,
    currentBeat: 0,
    currentMeasure: 0,
    tempo: 120,
    audioInitialized: false,
    darkMode: false,
    listeners: [],
    updateState(newState) {
        Object.assign(this, newState);
        this.notifyListeners();
    },
    addListener(callback) {
        this.listeners.push(callback);
    },
    notifyListeners() {
        this.listeners.forEach(callback => callback(this));
    }
};

// UI Management
const UI = {
    elements: {
        chordFretboard: document.getElementById('chord-fretboard'),
        measures: document.getElementById('measures'),
        tempoDisplay: document.getElementById('tempo-display'),
        startStopButton: document.getElementById('start-stop'),
        progressionSelect: document.getElementById('progression-select'),
        keySelect: document.getElementById('keySelect'),
        scaleDisplay: document.getElementById('scale-display'),
        chordTuning: document.getElementById('chord-tuning'),
        timeSignature: document.getElementById('time-signature'),
        soundType: document.getElementById('sound-type'),
        metronomeVolume: document.getElementById('metronome-volume'),
        tempo: document.getElementById('tempo'),
        tapTempo: document.getElementById('tap-tempo'),
        chordFretboardVolume: document.getElementById('chord-fretboard-volume'),
        chordVolume: document.getElementById('chord-volume'),
        chordsEnabled: document.getElementById('chordsEnabled'),
        fretboardVolume: document.getElementById('fretboard-volume'),
        fretboardsGrid: document.querySelector('.fretboards-grid'),
        darkModeToggle: document.getElementById('dark-mode-toggle'),
        accentIntensity: document.getElementById('accent-intensity')
    },
    init() {
        Object.entries(this.elements).forEach(([key, el]) => {
            if (!el) console.warn(`Missing DOM element: ${key}`);
        });
    }
};

// AudioContextManager Object
const AudioContextManager = {
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
}; // Properly close AudioContextManager

// Music Theory Utilities
function getChordNotes(root, quality) {
    // Use uppercase NOTES to match fretboard logic
    const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const standardizeNoteName = (note) => {
        if (!note) return null;
        const normalized = note.toLowerCase().replace('♯', '#').replace('♭', 'b');
        const enharmonicMap = {
            'cb': 'B', 'db': 'C#', 'eb': 'D#', 'fb': 'E', 'gb': 'F#',
            'ab': 'G#', 'bb': 'A#', 'e#': 'F', 'b#': 'C', 'c##': 'D',
            'd##': 'E', 'f##': 'G', 'g##': 'A', 'a##': 'B'
        };
        const baseNote = enharmonicMap[normalized] || normalized.toUpperCase();
        return NOTES.includes(baseNote) ? baseNote : null;
    };

    const CHORD_INTERVALS = {
        'major': [0, 4, 7],
        'minor': [0, 3, 7],
        'dim': [0, 3, 6],
        'aug': [0, 4, 8],
        '6': [0, 4, 7, 9],
        'min6': [0, 3, 7, 9],
        '7': [0, 4, 7, 10],
        'dom7': [0, 4, 7, 10], // Alias for dominant 7
        'maj7': [0, 4, 7, 11],
        'min7': [0, 3, 7, 10],
        'dim7': [0, 3, 6, 9],
        'min7b5': [0, 3, 6, 10],
        'sus2': [0, 2, 7],
        'sus4': [0, 5, 7],
        'add9': [0, 4, 7, 14]
    };

    const standardizedRoot = standardizeNoteName(root);
    if (!standardizedRoot) {
        console.error(`Invalid root note: ${root}`);
        return [];
    }

    const normalizedQuality = quality ? quality.toLowerCase().replace('m7', 'min7') : 'major';
    const intervals = CHORD_INTERVALS[normalizedQuality] || CHORD_INTERVALS['major'];
    if (!intervals) {
        console.error(`Invalid chord quality: ${quality}`);
        return [];
    }

    const rootIndex = NOTES.indexOf(standardizedRoot);
    const chordNotes = intervals.map(interval => {
        const noteIndex = (rootIndex + interval) % 12;
        return NOTES[noteIndex];
    });

    return chordNotes;
}

async function playChord(root, quality, startTime = 0, duration = 1, isSecondHalf = false, voicingType = null) {
    try {
        await AudioContextManager.ensureAudioContext();
        let chordNotes = getChordNotes(root, quality);
        if (!chordNotes.length) {
            console.error(`No valid notes found for chord: ${root} ${quality}`);
            return;
        }

        // If this is the second half (beat 3), randomize voicing
        if (isSecondHalf && voicingType) {
            chordNotes = getDropVoicing(chordNotes, voicingType);
        }

        const chordVolume = parseFloat(UI.elements.chordVolume.value) || 0.75;
        if (!UI.elements.chordsEnabled.classList.contains('active')) {
            console.warn("Chords are disabled. Skipping chord playback.");
            return;
        }

        chordNotes.forEach((note, i) => {
            // Always root in the bass (octave 3), others in octave 4
            const octave = i === 0 ? 3 : 4;
            const sampleKey = `${note.toLowerCase().replace('b', '#')}${octave}`;
            const buffer = AudioContextManager.pianoSamples[sampleKey];
            if (!buffer) {
                console.error(`No sample found for note: ${sampleKey}`);
                return;
            }
            const source = AudioContextManager.context.createBufferSource();
            source.buffer = buffer;
            const gainNode = AudioContextManager.context.createGain();
            gainNode.gain.value = chordVolume;
            source.connect(gainNode);
            if (AudioContextManager.reverbNode) {
                const reverbGain = AudioContextManager.context.createGain();
                reverbGain.gain.value = 0.1;
                source.connect(reverbGain);
                reverbGain.connect(AudioContextManager.reverbNode);
            }
            gainNode.connect(AudioContextManager.context.destination);
            source.start(startTime);
            source.stop(startTime + duration);
        });

        console.log(`Playing chord: ${root} ${quality} ${isSecondHalf && voicingType ? '(' + voicingType + ')' : ''}`);
    } catch (error) {
        console.error(`Error playing chord: ${root} ${quality}`, error);
    }
}

async function ensureAudioInitialized() {
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
       
        
function isMinorKeyName(key) {
    return key && (key.endsWith('m') || key.endsWith('min'));
}

      
 
// Helper function for flat notes
function flattenNote(note) {
    const sharpToFlat = {
        'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb'
    };
    return sharpToFlat[note] || note;
}

function getQualityValue(quality) {
    const qualityMap = {
        '': 'major',
        'm': 'minor',
        '7': 'dom7',
        'dom7': 'dom7',  // Add explicit mapping
        'maj7': 'maj7',
        'm7': 'min7',
        'min7': 'min7',
        'dim': 'dim',
        'min7b5': 'min7b5'
    };
    return qualityMap[quality] || 'major';
}
        
function suggestScaleForQuality(quality) {
    const scaleMap = {
        '': 'major',
        'maj7': 'major',
        'maj9': 'major',
        'maj13': 'major',
        'maj7#11': 'lydian',
        'm': 'dorian',
        'm7': 'dorian',
        'm9': 'dorian',
        'm11': 'dorian',
        'm13': 'dorian',
        'dom7': 'mixolydian',    // Ensure this mapping exists
        '7': 'mixolydian',       // Add this explicit mapping
        '9': 'mixolydian',
        '13': 'mixolydian',
        '7b9': 'bebopPhrygian',
        '7#9': 'mixolydian',
        '7#11': 'lydian',
        '7b13': 'mixolydian',
        '7#5': 'wholeHalf',
        '7b5': 'mixolydian',
        'dim7': 'diminished',
        'dim': 'diminished',
        'm7b5': 'locrian',
        'aug7': 'wholeHalf',
        'aug': 'wholeHalf',
        '6': 'major',
        'm6': 'melodicMinor',
        'sus4': 'mixolydian',
        'sus2': 'mixolydian',
        'add9': 'major',
        '7sus4': 'mixolydian',
        'minMaj7': 'melodicMinor',
        '7alt': 'altered'
    };
    return scaleMap[quality] || 'major';
}

function getCompatibleScales(chord, quality) {
    const scaleChoices = {
        'major': ['major', 'lydian', 'mixolydian'],
        'minor': ['dorian', 'phrygian', 'aeolian'],
        'dominant': ['mixolydian', 'lydianDominant', 'altered', 'bebopDominant'],
        'halfDiminished': ['locrian', 'locrian#2'],
        'diminished': ['diminishedWH', 'diminishedHW'],
        'altered': ['altered', 'diminishedWH']
    };
    // Example return (customize as needed)
    return scaleChoices[quality] || [];
}
        
async function playMetronomeSound(baseVolume) {
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
    let adjustedVolume = combinedVolume;
    if (isAccent) {
        adjustedVolume = Math.min(combinedVolume * accentBoost, 1); // cap at 1.0
    }

    // Process each sound in the drum pattern
    for (let soundKey of drumSounds) {
        soundKey = soundKey.trim();

        // Skip if it's a silent beat
        if (soundKey === 'silent') continue;

        // Get the current drum set if using drums
        const currentSet = drumSoundSets[currentDrumSetIndex];

        // Determine which sound buffer to use
        let buffer;
        if (soundType === 'drums' && soundKey !== 'default') {
            // Map drum sounds to current set's samples
            let sampleFile;
            switch(soundKey) {
                case 'kick': sampleFile = currentSet.kick; break;
                case 'snare': sampleFile = currentSet.snare; break;
                case 'hihat': sampleFile = currentSet.hihat; break;
                default: sampleFile = null;
            }

            if (sampleFile) {
                try {
                    // Try to load the current set's sample
                    const response = await fetch(`./${sampleFile}`);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const arrayBuffer = await response.arrayBuffer();
                    buffer = await AudioContextManager.context.decodeAudioData(arrayBuffer);
                } catch (error) {
                    console.error(`Failed to load drum sample: ${sampleFile}`, error);
                    // Fall back to default drum sounds if loading fails
                    buffer = AudioContextManager.soundBuffers[soundKey];
                }
            }
        } else {
            // Use click or woodblock sounds
            buffer = AudioContextManager.soundBuffers[soundType] || AudioContextManager.soundBuffers['click'];
        }

        if (!buffer) continue;

        // Create and configure audio nodes
        const source = AudioContextManager.context.createBufferSource();
        source.buffer = buffer;

        const gainNode = AudioContextManager.context.createGain();

        // Adjust volume based on sound type and context
        let finalVolume = adjustedVolume;
        if (soundType === 'drums') {
            // Reduce hi-hat volume when playing with other sounds
            if (soundKey === 'hihat' && drumSounds.length > 1) {
                finalVolume *= 0.5;
            }
            // Adjust kick and snare volumes
            else if (soundKey === 'kick') {
                finalVolume *= 1.2; // Slightly boost kick
            }
            else if (soundKey === 'snare') {
                finalVolume *= 1.1; // Slightly boost snare
            }
        }

        // Ensure volume doesn't exceed 1.0
        finalVolume = Math.min(finalVolume, 1.0);
        gainNode.gain.value = finalVolume;

        // Connect the audio nodes
        source.connect(gainNode);
        gainNode.connect(AudioContextManager.context.destination);

        // Add slight reverb for drums
        if (soundType === 'drums' && AudioContextManager.reverbNode) {
            const reverbGain = AudioContextManager.context.createGain();
            reverbGain.gain.value = 0.1; // Subtle reverb
            source.connect(reverbGain);
            reverbGain.connect(AudioContextManager.reverbNode);
        }

        // Start the sound
        try {
            source.start(0);
        } catch (error) {
            console.error('Error playing metronome sound:', error);
        }
    }
}
        
function onMetronomeInstrumentChange(selectedInstrument) {
  if (selectedInstrument === "drums") {
    document.getElementById("drumSetToggleBtn").style.display = "inline-block";
  } else {
    document.getElementById("drumSetToggleBtn").style.display = "none";
  }
}

async function playDrumSample(type) {
    if (!AudioContextManager.context) {
        console.error("AudioContext is not initialized.");
        return;
    }

    const set = drumSoundSets[currentDrumSetIndex];
    let sampleFile;

    // Map the type to the current set's sample file
    switch (type) {
        case 'snare':
            sampleFile = set.snare;
            break;
        case 'hihat':
            sampleFile = set.hihat;
            break;
        case 'kick':
            sampleFile = set.kick;
            break;
        default:
            console.error(`Invalid drum type: ${type}`);
            return;
    }

    try {
        // Attempt to load the drum sample
        const response = await fetch(`./${sampleFile}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = await AudioContextManager.context.decodeAudioData(arrayBuffer);

        // Play the loaded sample
        playBuffer(buffer, type);
    } catch (error) {
        console.error(`Failed to load drum sample: ${sampleFile}`, error);

        // Fallback to default drum sounds or synthetic sound
        try {
            const fallbackBuffer = AudioContextManager.soundBuffers[type] || await AudioContextManager.createDrumSound(type);
            playBuffer(fallbackBuffer, type);
        } catch (fallbackError) {
            console.error(`Failed to play fallback sound for type: ${type}`, fallbackError);
        }
    }
}

function playBuffer(buffer, type) {
    const source = AudioContextManager.context.createBufferSource();
    source.buffer = buffer;

    const gainNode = AudioContextManager.context.createGain();
    const metronomeVolume = parseFloat(UI.elements.metronomeVolume.value) || 0.5;

    // Adjust volume based on drum type
    let finalVolume = metronomeVolume;
    if (type === 'kick') {
        finalVolume *= 1.2; // Slightly boost kick
    } else if (type === 'snare') {
        finalVolume *= 1.1; // Slightly boost snare
    } else if (type === 'hihat') {
        finalVolume *= 0.8; // Slightly reduce hi-hat
    }

    // Ensure volume doesn't exceed 1.0
    finalVolume = Math.min(finalVolume, 1.0);
    gainNode.gain.value = finalVolume;

    // Connect nodes
    source.connect(gainNode);
    gainNode.connect(AudioContextManager.context.destination);

    // Add subtle reverb for depth
    if (AudioContextManager.reverbNode) {
        const reverbGain = AudioContextManager.context.createGain();
        reverbGain.gain.value = 0.1; // Subtle reverb
        source.connect(reverbGain);
        reverbGain.connect(AudioContextManager.reverbNode);
    }

    // Start playback
    source.start(0);
}

function getDropVoicing(notes, type) {
    // notes: array of note names, e.g. ["C", "E", "G", "B"]
    // type: "drop2", "drop3", "drop2and4"
    let root = notes[0];
    let upper = notes.slice(1);

    function lowerOctave(note, octave) {
        // e.g., "E", 4 -> "E3"
        return note + (octave - 1);
    }

    // We'll assign octaves later, just shuffle the order here
    switch(type) {
        case "drop2":
            if (upper.length >= 2) {
                // Move 2nd highest down
                let idx = upper.length - 2;
                let note = upper.splice(idx, 1)[0];
                upper.unshift(note); // Will assign lower octave later
            }
            break;
        case "drop3":
            if (upper.length >= 3) {
                let idx = upper.length - 3;
                let note = upper.splice(idx, 1)[0];
                upper.unshift(note);
            }
            break;
        case "drop2and4":
            if (upper.length >= 4) {
                let idx2 = upper.length - 2;
                let idx4 = upper.length - 4;
                let note2 = upper.splice(idx2, 1)[0];
                let note4 = upper.splice(idx4, 1)[0];
                upper.unshift(note4, note2);
            }
            break;
        default:
            break;
    }
    return [root, ...upper];
}

function playChordWithInversion(notes, measureStart, playSample) {
    // Play root position on beat 1
    notes.forEach(note => playSample(note, measureStart));

    // On beat 3, play a random drop voicing
    const dropTypes = ["drop2", "drop3", "drop2and4"];
    const randomDrop = dropTypes[Math.floor(Math.random() * dropTypes.length)];
    const dropVoicing = getDropVoicing(notes, randomDrop);

    dropVoicing.forEach(note => playSample(note, measureStart + 2)); // beat 3
}
        
function createFretboard(container, tuning) {
    container.innerHTML = '';

    // Create fret lines and fret numbers
    for (let i = 0; i <= 12; i++) {
        const fretLine = document.createElement('div');
        fretLine.className = 'fret-line';
        fretLine.style.left = `${(i / 12) * 100}%`;
        container.appendChild(fretLine);

        if (i > 0) { // Add fret numbers for frets 1-12
            const fretNumber = document.createElement('div');
            fretNumber.className = 'fret-number';
            fretNumber.textContent = i;
            fretNumber.style.left = `${((i - 0.5) / 12) * 100}%`;
            container.appendChild(fretNumber);
        }
    }

    // Create string lines
    for (let i = 0; i < 6; i++) {
        const stringLine = document.createElement('div');
        stringLine.className = 'string-line';
        stringLine.style.top = `${(i / 5) * 100}%`;
        container.appendChild(stringLine);
    }

    // Add fret markers (dots)
    const markerPositions = [3, 5, 7, 9, 12]; // Frets with markers
    markerPositions.forEach(position => {
        const marker = document.createElement('div');
        marker.className = 'fret-marker';
        marker.style.left = `${((position - 0.5) / 12) * 100}%`;

        if (position === 12) {
            // Double markers at the 12th fret
            const topMarker = marker.cloneNode(true);
            topMarker.style.top = '25%';
            container.appendChild(topMarker);

            const bottomMarker = marker.cloneNode(true);
            bottomMarker.style.top = '75%';
            container.appendChild(bottomMarker);
        } else {
            // Single marker
            marker.style.top = '50%';
            container.appendChild(marker);
        }
    });
}
        
function updateFretboardNotes(container, rootNote, scale, tuning) {
    if (!(container instanceof HTMLElement)) {
        console.error('Invalid container element');
        return;
    }
    if (!NOTES.includes(standardizeNoteName(rootNote))) {
        console.error(`Invalid root note: ${rootNote}`);
        return;
    }
    if (!SCALES[scale]) {
        console.error(`Invalid scale: ${scale}`);
        return;
    }
    if (!Array.isArray(tuning) || tuning.length !== 6) {
        console.error('Invalid tuning');
        return;
    }
    container.querySelectorAll('.note').forEach(note => note.remove());
    if (container.id === 'chord-fretboard') {
        const measures = UI.elements.measures.children;
        if (measures.length > 0 && AppState.currentMeasure < measures.length) {
            const currentMeasureElement = measures[AppState.currentMeasure];
            const chordRoot = currentMeasureElement.querySelector('.chord-controls .root-note')?.value;
            const chordQuality = currentMeasureElement.querySelector('.chord-controls .chord-quality')?.value;
            const scaleRoot = currentMeasureElement.querySelector('.scale-controls .second-key')?.value;
            const scaleType = currentMeasureElement.querySelector('.scale-controls .scale-select')?.value;
            if (chordRoot && chordQuality && scaleRoot && scaleType) {
                let displayQuality = chordQuality;
                switch (chordQuality) {
                    case 'dom7': displayQuality = '7'; break;
                    case 'maj7': displayQuality = 'Maj7'; break;
                    case 'min7': displayQuality = 'm7'; break;
                    case 'min7b5': displayQuality = 'm7b5'; break;
                    case 'minor': displayQuality = 'm'; break;
                }
                let displayScale = scaleType.charAt(0).toUpperCase() + scaleType.slice(1);
                displayScale = displayScale.replace(/([A-Z])/g, ' $1').trim();
                UI.elements.scaleDisplay.textContent = `${scaleRoot} ${displayScale} over ${chordRoot} ${displayQuality}`;
            }
        }
    }
    const scaleIntervals = SCALES[scale];
    const standardizedRoot = standardizeNoteName(rootNote);
    const rootIndex = NOTES.indexOf(standardizedRoot);
    const scaleNotes = scaleIntervals.map(interval => {
        const noteIndex = (rootIndex + interval) % 12;
        return NOTES[noteIndex];
    });
    for (let string = 0; string < 6; string++) {
        const openNote = tuning[string];
        const openNoteIndex = NOTES.indexOf(openNote);
        for (let fret = 0; fret <= 12; fret++) {
            const noteIndex = (openNoteIndex + fret) % 12;
            const currentNote = NOTES[noteIndex];
            if (scaleNotes.includes(currentNote)) {
                const noteElement = document.createElement('div');
                noteElement.className = 'note';
                noteElement.textContent = currentNote;
                const fretOffset = fret === 0 ? 0 : ((fret - 0.5) / 12) * 100;
                noteElement.style.left = `${fretOffset}%`;
                noteElement.style.top = `${(string / 5) * 100}%`;
                const degree = scaleNotes.indexOf(currentNote);
                if (currentNote === standardizedRoot) {
                    noteElement.style.backgroundColor = '#BD2031';
                } else if ([2, 4, 6].includes(degree)) {
                    noteElement.style.backgroundColor = '#006400';
                } else {
                    noteElement.style.backgroundColor = '#4CAF50';
                }
                noteElement.addEventListener('click', async () => {
                    try {
                        await AudioContextManager.ensureAudioContext();
                        const noteName = currentNote.toLowerCase().replace('b', '#');
                        const octave = 3; // Default to octave 3 for fretboard clicks
                        const sampleKey = `${noteName}${octave}`;
                        const buffer = AudioContextManager.pianoSamples[sampleKey];
                        if (!buffer) {
                            console.error(`No sample for ${sampleKey}`);
                            return;
                        }
                        const source = AudioContextManager.context.createBufferSource();
                        source.buffer = buffer;
                        const gainNode = AudioContextManager.context.createGain();
                        const volume = parseFloat(UI.elements.chordFretboardVolume.value) || 0.3;
                        gainNode.gain.value = volume;
                        source.connect(gainNode);
                        gainNode.connect(AudioContextManager.context.destination);
                        source.start(0);
                        noteElement.style.transform = 'translate(-50%, -50%) scale(1.2)';
                        setTimeout(() => {
                            noteElement.style.transform = 'translate(-50%, -50%) scale(1)';
                        }, 100);
                    } catch (error) {
                        console.error('Error playing note:', error);
                    }
                });
                noteElement.addEventListener('mouseenter', () => {
                    noteElement.style.transform = 'translate(-50%, -50%) scale(1.1)';
                });
                noteElement.addEventListener('mouseleave', () => {
                    noteElement.style.transform = 'translate(-50%, -50%) scale(1)';
                });
                container.appendChild(noteElement);
            }
        }
    }
}
        
function createBeats() {
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
        
function toggleBeatState(beat, timeSignature, soundType) {
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

async function playBeat() {
    const beats = document.querySelectorAll('.beat');
    beats.forEach(beat => beat.classList.remove('active'));
    const currentBeatElement = beats[AppState.currentBeat];
    if (currentBeatElement) {
        currentBeatElement.classList.add('active');
        const volume = parseFloat(currentBeatElement.dataset.volume) || 0;
        await playMetronomeSound(volume);
    }
    const measures = UI.elements.measures.children;
    const timeSignature = parseInt(UI.elements.timeSignature.value);
    if (measures.length > 0) {
        const currentMeasureElement = measures[AppState.currentMeasure];
        if (currentMeasureElement) {
            const root = currentMeasureElement.querySelector('.chord-controls .root-note')?.value;
            const quality = currentMeasureElement.querySelector('.chord-controls .chord-quality')?.value;
            const scaleRoot = currentMeasureElement.querySelector('.scale-controls .second-key')?.value;
            const scaleType = currentMeasureElement.querySelector('.scale-controls .scale-select')?.value;
            if (root && quality && scaleRoot && scaleType) {
                const chordTuning = TUNINGS[UI.elements.chordTuning.value];
                updateFretboardNotes(UI.elements.chordFretboard, scaleRoot, scaleType, chordTuning);
                const beatDuration = 60 / AppState.tempo;
               if (timeSignature === 4) {
                if (AppState.currentBeat === 0) {
                    // Beat 1: root position
                    playChord(root, quality, AudioContextManager.context.currentTime, beatDuration * 2, false, null);
                } else if (AppState.currentBeat === 4) {
                    // Beat 3: random drop voicing
                    const dropTypes = ["drop2", "drop3", "drop2and4"];
                    const randomDrop = dropTypes[Math.floor(Math.random() * dropTypes.length)];
                    playChord(root, quality, AudioContextManager.context.currentTime, beatDuration * 2, true, randomDrop);
                }
            }
        }
    }
    if (measures.length > 0) {
        Array.from(measures).forEach((measure, index) => {
            measure.classList.toggle('active', index === AppState.currentMeasure);
        });
    }
    const totalBeats = timeSignature === 4 ? 8 : timeSignature;
    AppState.currentBeat = (AppState.currentBeat + 1) % totalBeats;
    if (AppState.currentBeat === 0 && measures.length > 0) {
        AppState.currentMeasure = (AppState.currentMeasure + 1) % measures.length;
    }
    AppState.updateState({ currentBeat: AppState.currentBeat, currentMeasure: AppState.currentMeasure });
}

async function startPlayback() {
    try {
        await ensureAudioInitialized();
        
        if (AppState.isPlaying) return;
        
        const timeSignature = parseInt(UI.elements.timeSignature.value);
        const measures = UI.elements.measures.children;
        
        if (measures.length === 0) {
            console.warn('No measures defined. Please add at least one measure.');
            return;
        }
        
        let interval = (60 / AppState.tempo) * 1000;
        if (timeSignature === 4) {
            interval = interval / 2;
        }
        
        AppState.updateState({ currentBeat: 0, currentMeasure: 0 });
        clearInterval(AppState.intervalId);
        
        const currentMeasureElement = measures[AppState.currentMeasure];
        if (currentMeasureElement) {
            const root = currentMeasureElement.querySelector('.chord-controls .root-note')?.value;
            const quality = currentMeasureElement.querySelector('.chord-controls .chord-quality')?.value;
            const scaleRoot = currentMeasureElement.querySelector('.scale-controls .second-key')?.value;
            const scaleType = currentMeasureElement.querySelector('.scale-controls .scale-select')?.value;
            
            if (root && quality && scaleRoot && scaleType) {
                const chordTuning = TUNINGS[UI.elements.chordTuning.value];
                updateFretboardNotes(UI.elements.chordFretboard, scaleRoot, scaleType, chordTuning);
                
                try {
                    await playChord(root, quality);
                } catch (error) {
                    console.error('Failed to play initial chord:', error);
                }
            }
        }
        
        AppState.intervalId = setInterval(playBeat, interval);
        AppState.updateState({ isPlaying: true });
        UI.elements.startStopButton.textContent = 'Stop';
        log("Playback started");
        
    } catch (error) {
        console.error('Failed to start playback:', error);
        alert('Please try clicking the start button again');
        stopPlayback(); // Ensure everything is reset if playback fails
        UI.elements.startStopButton.textContent = 'Start';
    }
}

function stopPlayback() {
    clearInterval(AppState.intervalId);
    AppState.intervalId = null;
    AppState.updateState({ isPlaying: false, currentBeat: 0, currentMeasure: 0 });
    const beats = document.querySelectorAll('.beat');
    beats.forEach(beat => beat.classList.remove('active'));
    const measures = UI.elements.measures.children;
    Array.from(measures).forEach(measure => measure.classList.remove('active'));
    if (AudioContextManager.currentChordGain) {
        AudioContextManager.currentChordGain.gain.setValueAtTime(AudioContextManager.currentChordGain.gain.value, AudioContextManager.context.currentTime);
        AudioContextManager.currentChordGain.gain.exponentialRampToValueAtTime(0.001, AudioContextManager.context.currentTime + 0.1);
        AudioContextManager.currentChordGain = null;
    }
    UI.elements.startStopButton.textContent = 'Start';
    log("Playback stopped");
}

function getChordFromFunction(chordFunction, key) {
    // Determine if the key is minor
    const isMinor = isMinorKeyName(key);
    // Remove 'm' or 'min' from key to get the root
    const keyRoot = key.replace(/m(in)?$/, '');
    // Use your NOTES array for chromatic scale
    const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    // Standardize key name (handle flats)
    let keyIndex = NOTES.indexOf(keyRoot);
    if (keyIndex === -1) {
        // Try enharmonic equivalents
        const enharmonic = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
        keyIndex = NOTES.indexOf(enharmonic[keyRoot] || keyRoot);
    }
    if (keyIndex === -1) keyIndex = 0; // Default to C if not found

    // Choose the correct scaleDegrees mapping
    const degreeMap = isMinor ? scaleDegrees.minor : scaleDegrees.major;

    // Try to find the degree and quality
    let degree = null;
    let quality = '';
    // Try to match the full chordFunction (e.g., "iim7b5")
    if (degreeMap[chordFunction]) {
        degree = degreeMap[chordFunction];
        // Extract quality (e.g., "m7b5" from "iim7b5")
        quality = chordFunction.replace(/^[b#]?[ivIV]+/, '');
    } else {
        // Try to match the root (e.g., "ii" from "iim7b5")
        const match = chordFunction.match(/^([b#]?[ivIV]+)(.*)$/);
        if (match) {
            const roman = match[1];
            quality = match[2] || '';
            if (degreeMap[roman]) {
                degree = degreeMap[roman];
            }
        }
    }
    if (degree === null) {
        // Fallback: just return the function as-is
        return chordFunction;
    }
    // Calculate the note index
    let noteIndex = (keyIndex + degree) % 12;
    let note = NOTES[noteIndex];
    return note + quality;
}

 function parseChord(chord) {
            if (!chord) return ['C', 'maj'];
        
            // Updated regex to catch more qualities, including dom7, m7b5, and alt chords
            const regex = /^([A-Ga-g][b#]?)(maj7|m7b5|min7|m7|maj|min|dim7|dim|aug|sus2|sus4|add9|7b9|7#9|7b13|7#11|7|6|9|11|13|°|ø)?$/;
            const match = chord.match(regex);
        
            if (!match) {
                console.warn(`Unable to parse chord: ${chord}`);
                return [standardizeNoteName(chord), 'maj'];
            }
        
            let [, root, quality] = match;
            root = standardizeNoteName(root);
        
            if (!quality) quality = 'maj';
        
            switch (quality.toLowerCase()) {
                case 'min':
                case 'm':
                    quality = 'min';
                    break;
                case 'min7':
                case 'm7':
                    quality = 'min7';
                    break;
                case 'maj7':
                case 'maj':
                    quality = 'maj7';
                    break;
                case 'dim7':
                case '°':
                    quality = 'dim7';
                    break;
                case 'ø':
                case 'm7b5':
                    quality = 'm7b5';
                    break;
                case '7':
                    quality = '7';
                    break;
                default:
                    break; // leave as-is (e.g., add9, 9, 13, etc.)
            }
        
            return [root, quality];
        }
    
        function standardizeNoteName(note) {
            if (!note) return 'C';
            const match = note.match(/^([A-G])([b#])?(\d)?$/);
            if (!match) return note.toUpperCase();
            let [, letter, accidental, octave] = match;
            letter = letter.toUpperCase();
            const CHROMATIC = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
            if (accidental === 'b') {
                const index = CHROMATIC.indexOf(letter);
                return CHROMATIC[(index - 1 + 12) % 12];
            } else if (accidental === '#') {
                const index = CHROMATIC.indexOf(letter);
                return CHROMATIC[(index + 1) % 12];
            }
            return letter;
        }

        function createKeyOptions(selected = 'C') {
            return NOTES.map(note =>
                `<option value="${note}"${note === selected ? ' selected' : ''}>${note}</option>`
            ).join('');
        }

        function createQualityOptions(selected = 'major') {
            const qualities = [
                { value: 'major', label: 'Major' },
                { value: 'minor', label: 'Minor' },
                { value: 'dom7', label: '7' },
                { value: 'maj7', label: 'Maj7' },
                { value: 'min7', label: 'Min7' },
                { value: 'min7b5', label: 'Min7b5 (Half Diminished)' }
            ];
            return qualities.map(q =>
                `<option value="${q.value}"${q.value === selected ? ' selected' : ''}>${q.label}</option>`
            ).join('');
        }

        function createScaleOptions(selected = 'major') {
            return Object.keys(SCALES).map(scale =>
                `<option value="${scale}"${scale === selected ? ' selected' : ''}>${scale.charAt(0).toUpperCase() + scale.slice(1)}</option>`
            ).join('');
        }
// Chord Progression Management
function loadProgression(progressionName, overrideKey = null) {
    if (!progressionName || !progressions[progressionName]) {
        console.error(`Invalid progression name: ${progressionName}`);
        return;
    }

    const progression = progressions[progressionName];
    const selectedKey = overrideKey || progression.defaultKey || "C";
    UI.elements.keySelect.value = selectedKey;

    UI.elements.measures.innerHTML = '';

    progression.progression.forEach((chordFunction, index) => {
        const chord = getChordFromFunction(chordFunction, selectedKey);
        const [root, quality] = parseChord(chord);
        
        // Get the proper quality value and suggested scale
        const qualityValue = getQualityValue(quality);
        const suggestedScale = suggestScaleForQuality(qualityValue);

        const measure = document.createElement('div');
        measure.className = 'measure';
        measure.draggable = true;
        measure.innerHTML = `
            <span class="measure-number">${index + 1}</span>
            <div class="chord-controls">
                <select class="root-note">${createKeyOptions(root)}</select>
                <select class="chord-quality">${createQualityOptions(qualityValue)}</select>
            </div>
            <div class="scale-controls">
                <select class="second-key">${createKeyOptions(root)}</select>
                <select class="scale-select">${createScaleOptions(suggestedScale)}</select>
            </div>
        `;

        UI.elements.measures.appendChild(measure);
        
        // Explicitly set the correct scale based on chord quality
        const scaleSelect = measure.querySelector('.scale-select');
        if (quality === '7' || quality === 'dom7') {
            scaleSelect.value = 'mixolydian';
        } else if (quality === 'min7' || quality === 'm7') {
            scaleSelect.value = 'dorian';
        } else if (quality === 'maj7') {
            scaleSelect.value = 'major';
        } else if (quality === 'min7b5') {
            scaleSelect.value = 'locrian';
        } else if (quality === 'm' || quality === 'minor') {
            scaleSelect.value = 'minor';
        }
    });

    updateMeasureNumbers();
    addFirstChordListener();

    // Update the fretboard with the first measure's scale
    const firstMeasure = UI.elements.measures.firstElementChild;
    if (firstMeasure) {
        const scaleRoot = firstMeasure.querySelector('.second-key').value;
        const scaleType = firstMeasure.querySelector('.scale-select').value;
        const tuning = TUNINGS[UI.elements.chordTuning.value];
        updateFretboardNotes(UI.elements.chordFretboard, scaleRoot, scaleType, tuning);
    }

    log(`Loaded progression "${progressionName}" in key: ${selectedKey}`);
}

function updateProgressionKey(newKey) {
    const selectedProgression = UI.elements.progressionSelect.value;
    if (!selectedProgression) return;
    const progression = progressions[selectedProgression];
    if (!progression) return;
    Array.from(UI.elements.measures.children).forEach((measure, index) => {
        const chordFunc = progression.progression[index];
        if (!chordFunc) return;
        const chord = getChordFromFunction(newKey, chordFunc);
        const [root, quality] = parseChord(chord);
        const rootSelect = measure.querySelector('.root-note');
        const qualitySelect = measure.querySelector('.chord-quality');
        const secondKeySelect = measure.querySelector('.second-key');
        const scaleSelect = measure.querySelector('.scale-select');
        if (rootSelect) rootSelect.value = standardizeNoteName(root);
        if (qualitySelect) qualitySelect.value = getQualityValue(quality);
        if (secondKeySelect) secondKeySelect.value = standardizeNoteName(root);
        if (scaleSelect) scaleSelect.value = suggestScaleForQuality(getQualityValue(quality));
    });
    const firstMeasure = UI.elements.measures.firstElementChild;
    if (firstMeasure) {
        const scaleRoot = firstMeasure.querySelector('.second-key').value;
        const scaleType = firstMeasure.querySelector('.scale-select').value;
        const tuning = TUNINGS[UI.elements.chordTuning.value];
        updateFretboardNotes(UI.elements.chordFretboard, scaleRoot, scaleType, tuning);
    }
    log(`Progression updated to key: ${newKey}`);
}

function addMeasure(chord = 'C', quality = 'major', scaleRoot = 'C', scaleType = 'major') {
        const measure = document.createElement('div');
        measure.className = 'measure';
        measure.draggable = true;
        const measureCount = UI.elements.measures.children.length + 1;
        measure.innerHTML = `
        <span class="measure-number">${measureCount}</span>
        <div class="chord-controls">
        <select class="root-note">${createKeyOptions(chord)}</select>
        <select class="chord-quality">${createQualityOptions(quality)}</select>
        </div>
        <div class="scale-controls">
        <select class="second-key">${createKeyOptions(scaleRoot)}</select>
        <select class="scale-select">${createScaleOptions(scaleType)}</select>
        </div>
        `;
        UI.elements.measures.appendChild(measure); // Actually add the measure to the DOM
    }

function removeMeasure() {
    const measures = UI.elements.measures.children;
    if (measures.length > 0) {
        measures[measures.length - 1].remove();
        updateMeasureNumbers();
        log(`Removed last measure`);
    }
}

function updateMeasureNumbers() {
    Array.from(UI.elements.measures.children).forEach((measure, index) => {
        const number = measure.querySelector('.measure-number');
        if (number) number.textContent = index + 1;
    });
}

function initializeFretFlow() {
    const fretboardsGrid = UI.elements.fretboardsGrid;
    const scales = ['major', 'minor', 'dorian', 'mixolydian'];
    const tuning = TUNINGS[UI.elements.chordTuning.value];
    fretboardsGrid.innerHTML = '';
    
    scales.forEach((scale, index) => {
        const container = document.createElement('div');
        container.className = 'fretboard-container';
        container.innerHTML = `
            <div class="scale-display">${UI.elements.keySelect.value} ${scale.charAt(0).toUpperCase() + scale.slice(1)}</div>
            <div class="controls">
                <select class="tuning-select" id="fretflow-tuning-${index}" aria-label="Select guitar tuning">
                    <option value="standard">Standard (EADGBE)</option>
                    <option value="dropD">Drop D (DADGBE)</option>
                    <option value="openG">Open G (DGDGBD)</option>
                    <option value="DADGAD">DADGAD</option>
                    <option value="openE">Open E (EBEG#BE)</option>
                </select>
            </div>
            <div id="fretflow-fretboard-${index}" class="fretboard"></div>
        `;
        fretboardsGrid.appendChild(container);
        
        const fretboard = container.querySelector(`#fretflow-fretboard-${index}`);
        createFretboard(fretboard, tuning);
        updateFretboardNotes(fretboard, UI.elements.keySelect.value, scale, tuning);
        
        // Add tuning change handler
        const tuningSelect = container.querySelector(`#fretflow-tuning-${index}`);
        tuningSelect.addEventListener('change', () => {
            const newTuning = TUNINGS[tuningSelect.value];
            createFretboard(fretboard, newTuning);
            updateFretboardNotes(fretboard, UI.elements.keySelect.value, scale, newTuning);
            
            // Reattach note click handlers
            const updatedNotes = fretboard.getElementsByClassName('note');
            Array.from(updatedNotes).forEach(note => {
                note.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const noteName = this.dataset.note;
                    if (noteName) {
                        const fretboardVolume = parseFloat(UI.elements.fretboardVolume.value) || 1.0;
                        playNote(noteName, fretboardVolume, 500);
                        log(`Playing note: ${noteName}`);
                    }
                }); 
            });
        });
    });
    
    log("FretFlow initialized");
}

// Event Listeners
function addFirstChordListener() {
    const firstMeasure = UI.elements.measures.firstElementChild;
    if (firstMeasure) {
        const scaleRoot = firstMeasure.querySelector('.second-key');
        const scaleType = firstMeasure.querySelector('.scale-select');
        const updateFretboard = () => {
            const tuning = TUNINGS[UI.elements.chordTuning.value];
            updateFretboardNotes(UI.elements.chordFretboard, scaleRoot.value, scaleType.value, tuning);
        };
        scaleRoot.addEventListener('change', updateFretboard);
        scaleType.addEventListener('change', updateFretboard);
    }
}

function setupEventListeners() {
    document.addEventListener('click', async () => {
        try {
            await ensureAudioInitialized();
        } catch (error) {
            console.error('Failed to initialize audio on click:', error);
        }
    }, { once: true });
    
    UI.elements.startStopButton.addEventListener('click', () => {
        if (AppState.isPlaying) {
            stopPlayback();
        } else {
            startPlayback();
        }
    });

    // Modified dark mode toggle with three modes
    let colorMode = 0; // 0 = light, 1 = dark-mode-1, 2 = dark-mode-2, 3 = dark-mode-3
    UI.elements.darkModeToggle.addEventListener('click', () => {
        colorMode = (colorMode + 1) % 4; // Cycle through 0, 1, 2, 3
        
        // Remove all mode classes first
        document.body.classList.remove('dark-mode', 'dark-mode-2', 'dark-mode-3');
        UI.elements.darkModeToggle.classList.remove('active', 'active-2', 'active-3');
        
        // Apply appropriate mode
        switch(colorMode) {
            case 1: // First dark mode (green)
                document.body.classList.add('dark-mode');
                UI.elements.darkModeToggle.classList.add('active');
                log('Dark mode 1 enabled');
                break;
            case 2: // Second dark mode (blue)
                document.body.classList.add('dark-mode-2');
                UI.elements.darkModeToggle.classList.add('active-2');
                log('Dark mode 2 enabled');
                break;
            case 3: // Third dark mode (earthy)
                document.body.classList.add('dark-mode-3');
                UI.elements.darkModeToggle.classList.add('active-3');
                log('Dark mode 3 enabled');
                break;
            default: // Light mode
                log('Light mode enabled');
                break;
        }
    });

    // Chords enabled button toggle
    const chordsButton = UI.elements.chordsEnabled;
    let chordsEnabled = true;
    chordsButton.addEventListener('click', () => {
        chordsEnabled = !chordsEnabled;
        chordsButton.textContent = chordsEnabled ? 'Chords Enabled' : 'Chords Disabled';
        chordsButton.classList.toggle('active', chordsEnabled);
        log(`Chords ${chordsEnabled ? 'enabled' : 'disabled'}`);
    });

    UI.elements.tempo.addEventListener('input', () => {
        AppState.tempo = parseInt(UI.elements.tempo.value);
        UI.elements.tempoDisplay.textContent = `${AppState.tempo} BPM`;
        if (AppState.isPlaying) {
            stopPlayback();
            startPlayback();
        }
    });

    UI.elements.timeSignature.addEventListener('change', () => {
        createBeats();
        if (AppState.isPlaying) {
            stopPlayback();
            startPlayback();
        }
    });

    UI.elements.soundType.addEventListener('change', createBeats);

    UI.elements.metronomeVolume.addEventListener('input', () => {
        const volume = parseFloat(UI.elements.metronomeVolume.value);
        log(`Metronome volume set to ${volume}`);
    });

    UI.elements.progressionSelect.addEventListener('change', () => {
        loadProgression(UI.elements.progressionSelect.value);
    });

    UI.elements.keySelect.addEventListener('change', () => {
        updateProgressionKey(UI.elements.keySelect.value);
        initializeFretFlow();
    });

    UI.elements.chordTuning.addEventListener('change', () => {
        const tuning = TUNINGS[UI.elements.chordTuning.value];
        const firstMeasure = UI.elements.measures.firstElementChild;
        if (firstMeasure) {
            const scaleRoot = firstMeasure.querySelector('.second-key').value;
            const scaleType = firstMeasure.querySelector('.scale-select').value;
            updateFretboardNotes(UI.elements.chordFretboard, scaleRoot, scaleType, tuning);
        }
        initializeFretFlow();
    });

    UI.elements.tapTempo.addEventListener('click', () => {
        const now = Date.now();
        if (!AppState.lastTap) AppState.lastTap = now;
        const interval = now - AppState.lastTap;
        if (interval < 2000) {
            const bpm = Math.round(60000 / interval);
            AppState.tempo = Math.max(40, Math.min(220, bpm));
            UI.elements.tempo.value = AppState.tempo;
            UI.elements.tempoDisplay.textContent = `${AppState.tempo} BPM`;
            if (AppState.isPlaying) {
                stopPlayback();
                startPlayback();
            }
        }
        AppState.lastTap = now;
    });

    // Add this to the setupEventListeners function
UI.elements.soundType.addEventListener('change', (e) => {
    createBeats();
    onMetronomeInstrumentChange(e.target.value);
});

// Add the drum set toggle button event listener
document.getElementById('drumSetToggleBtn').addEventListener('click', () => {
    currentDrumSetIndex = (currentDrumSetIndex + 1) % drumSoundSets.length;
    document.getElementById('drumSetToggleBtn').textContent = `Drum Set ${currentDrumSetIndex + 1}`;
    log(`Switched to drum set ${currentDrumSetIndex + 1}`);
});

// Initially hide the drum set toggle button if drums aren't selected
onMetronomeInstrumentChange(UI.elements.soundType.value);
    
    UI.elements.chordFretboardVolume.addEventListener('input', () => {
        log(`Chord fretboard volume set to ${UI.elements.chordFretboardVolume.value}`);
    });

    UI.elements.chordVolume.addEventListener('input', () => {
        log(`Chord volume set to ${UI.elements.chordVolume.value}`);
    });

    UI.elements.fretboardVolume.addEventListener('input', () => {
        log(`Fretboard volume set to ${UI.elements.fretboardVolume.value}`);
    });

    UI.elements.measures.addEventListener('change', (e) => {
        if (e.target.classList.contains('root-note') || e.target.classList.contains('chord-quality')) {
            const measure = e.target.closest('.measure');
            const root = measure.querySelector('.root-note').value;
            const quality = measure.querySelector('.chord-quality').value;
            const secondKeySelect = measure.querySelector('.second-key');
            const scaleSelect = measure.querySelector('.scale-select');
            secondKeySelect.value = root;
            scaleSelect.value = suggestScaleForQuality(quality);
            if (measure === UI.elements.measures.firstElementChild) {
                const tuning = TUNINGS[UI.elements.chordTuning.value];
                updateFretboardNotes(UI.elements.chordFretboard, root, scaleSelect.value, tuning);
            }
            log(`Updated chord in measure to ${root} ${quality}`);
        }
    });

    log("Event listeners set up");
}

// Initialization
async function initializeApp() {
    UI.init();
    createBeats();
    createFretboard(UI.elements.chordFretboard, TUNINGS.standard);
    loadProgression(UI.elements.progressionSelect.value);
    initializeFretFlow();
    setupEventListeners();
    updateLoadingStatus("Application initialized");
    setTimeout(() => {
        const indicator = document.getElementById('loading-indicator');
        if (indicator) indicator.remove();
    }, 1000);
    log("Application initialized");
}

// Start the app
document.addEventListener('DOMContentLoaded', () => {
        initializeApp().catch(error => {
            console.error("Initialization failed:", error);
            updateLoadingStatus("Initialization failed");
        });
    });
