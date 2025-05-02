// Utility Functions
function log(message) {
    console.log(`[FretFlow Debug] ${message}`);
}

function updateLoadingStatus(message) {
    let indicator = document.getElementById('loading-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'loading-indicator';
        document.body.appendChild(indicator);
    }
    indicator.textContent = message;
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Musical Constants
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
const ALL_NOTES = [
  'a', 'as', 'b', 'c', 'cs', 'd', 'ds', 'e', 'f', 'fs', 'g', 'gs'
];
const OCTAVES = [2, 3, 4, 5];
const FILE_FORMAT = 'wav';

function getSampleFileName(note, octave) {
  return `${note}${octave}.${FILE_FORMAT}`;
}
        
const allSampleFiles = [];
for (const note of ALL_NOTES) {
  for (const octave of OCTAVES) {
    allSampleFiles.push(getSampleFileName(note, octave));
  }
}
        
const PIANO_CONFIG = {
  notes: ALL_NOTES,
  octaves: OCTAVES,
  velocities: [12],
  fileFormat: FILE_FORMAT
};
        
const ENHARMONIC_MAP = {
    'C#': 'Db', 'Db': 'Db',
    'D#': 'Eb', 'Eb': 'Eb',
    'F#': 'Gb', 'Gb': 'Gb',
    'G#': 'Ab', 'Ab': 'Ab',
    'A#': 'Bb', 'Bb': 'Bb'
};
const SAMPLE_NOTE_MAP = {
    'C': 'c',
    'C#': 'cs',
    'Db': 'cs',
    'D': 'd',
    'D#': 'ds',
    'Eb': 'ds',
    'E': 'e',
    'F': 'f',
    'F#': 'fs',
    'Gb': 'fs',
    'G': 'g',
    'G#': 'gs',
    'Ab': 'gs',
    'A': 'a',
    'A#': 'as',
    'Bb': 'as',
    'B': 'b'
};        
const PIANO_NOTES = {
    'A2': 110.00, 'As2': 116.54, 'B2': 123.47,
    'C3': 130.81, 'Cs3': 138.59, 'D3': 146.83, 'Ds3': 155.56, 'E3': 164.81, 'F3': 174.61,
    'Fs3': 185.00, 'G3': 196.00, 'Gs3': 207.65, 'A3': 220.00, 'As3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'Cs4': 277.18, 'D4': 293.66, 'Ds4': 311.13, 'E4': 329.63
};

const FRETBOARD_FREQUENCIES = {
    'string6': [82.41, 87.31, 92.50, 98.00, 103.83, 110.00, 116.54, 123.47, 130.81, 138.59, 146.83, 155.56, 164.81],
    'string5': [110.00, 116.54, 123.47, 130.81, 138.59, 146.83, 155.56, 164.81, 174.61, 185.00, 196.00, 207.65, 220.00],
    'string4': [146.83, 155.56, 164.81, 174.61, 185.00, 196.00, 207.65, 220.00, 233.08, 246.94, 261.63, 277.18, 293.66],
    'string3': [196.00, 207.65, 220.00, 233.08, 246.94, 261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00],
    'string2': [246.94, 261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 415.30, 440.00, 466.16, 493.88],
    'string1': [329.63, 349.23, 369.99, 392.00, 415.30, 440.00, 466.16, 493.88, 523.25, 554.37, 587.33, 622.25, 659.25]
};

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
    
    bebopDominant: [0, 2, 4, 5, 7, 9, 10, 11],
    bebopMajor: [0, 2, 4, 5, 7, 8, 9, 11],
    bebopDorian: [0, 2, 3, 4, 5, 7, 9, 10],
    bebopPhrygian: [0, 1, 2, 3, 5, 7, 8, 10], // Added Bebop Phrygian
    altered: [0, 1, 3, 4, 6, 8, 10],      // Super Locrian
    lydianDominant: [0, 2, 4, 6, 7, 9, 10],
    
    diminishedWH: [0, 2, 3, 5, 6, 8, 9, 11],  // Diminished (Whole-Half)
    diminishedHW: [0, 1, 3, 4, 6, 7, 9, 10],  // Diminished (Half-Whole)
    wholeHalf: [0, 2, 4, 6, 8, 10],           // Whole Tone
    
    pentatonicMajor: [0, 2, 4, 7, 9],
    pentatonicMinor: [0, 3, 5, 7, 10],
    
    blues: [0, 3, 5, 6, 7, 10],
    majorBlues: [0, 2, 3, 4, 7, 9],
    
    altered: [0, 1, 3, 4, 6, 8, 10],
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

        
    '2': { kick: [1, 0], snare: [0, 1], hihat: [1, 1] },
    '3': { kick: [1, 0, 0], snare: [0, 1, 0], hihat: [1, 1, 1] },
    '4': { kick: [1, 0, 0, 0, 1, 0, 0, 0], snare: [0, 0, 1, 0, 0, 0, 1, 0], hihat: [1, 1, 1, 1, 1, 1, 1, 1] },
    '6': { kick: [1, 0, 0, 1, 0, 0], snare: [0, 0, 1, 0, 0, 1], hihat: [1, 1, 1, 1, 1, 1] },
    '7': { kick: [1, 0, 0, 1, 0, 0, 0], snare: [0, 0, 1, 0, 0, 1, 0], hihat: [1, 1, 1, 1, 1, 1, 1] },
    '8': { kick: [1, 0, 0, 0, 1, 0, 0, 0], snare: [0, 0, 1, 0, 0, 0, 1, 0], hihat: [1, 1, 1, 1, 1, 1, 1, 1] },
    '12': { kick: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0], snare: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] }
};
    let currentDrumSetIndex = 0;
    {
        name: "Drums",
        snare: "Snare.wav",
        hihat: "HiHat.wav",
        kick: "Kick.wav"
    },
    {
        name: "Makaya",
        snare: "Snare2.wav",
        hihat: "HiHat2.wav",
        kick: "Kick2.wav"
    },
    {
        name: "PhillyJoe",
        kick: 'jazzkick.wav',
        snare: 'jazzsnare.wav',
        hihat: 'jazzhat.wav'
    }
];

    "I V7": { defaultKey: "C", progression: ["Imaj7", "V7"] }, // Good as is
    "jazz_blues": { defaultKey: "Bb", progression: ["I7", "IV7", "I7", "I7", "IV7", "IV7", "I7", "VI7", "iim7", "V7", "I7", "V7"] }, // Good as is
    "minor_blues": { defaultKey: "Am", progression: ["im7", "ivm7", "im7", "im7", "ivm7", "ivm7", "im7", "im7", "V7", "V7", "im7", "V7"] }, // Good as is
    "rhythm_changes": { 
        defaultKey: "Bb", 
        progression: ["Imaj6", "vim7", "iim7", "V7", "Imaj6", "vim7", "iim7", "V7", "Imaj6", "IV7", "Imaj6", "Imaj6", "iim7", "V7", "Imaj6", "V7"]
    },
    "2_5_1": { defaultKey: "C", progression: ["iim7", "V7", "Imaj7", "Imaj7"] }, // Good as is
    "6_2_5_1": { defaultKey: "C", progression: ["vim7", "iim7", "V7", "Imaj7", "Imaj7"] }, // Good as is
    "minor_2_5_1": { defaultKey: "Am", progression: ["iim7b5", "V7b9", "im7", "im7"] }, // Good as is
    "dark_eyes": { 
        defaultKey: "Dm", 
        progression: ["V7", "V7", "im7", "im7", "V7", "V7", "VImaj6", "VImaj6", "ivm6", "ivm6", "im7", "im7", "V7", "V7", "im7", "im7"]
    },
    
    "ill_see_you_in_my_dreams": { 
        defaultKey: "F", 
        progression: ["IVmaj6", "IVmaj6", "ivm6", "ivm6", "Imaj7", "VII7", "Imaj7", "Imaj7", "VI7", "VI7", "VI7", "VI7", "II7", "II7", "iim7", "V7", "Imaj7"]
    },
    
    "rose_room": {
        defaultKey: "Ab", 
        progression: ["II7", "V7", "Imaj6", "I7", "IVmaj6", "ivm7", "bVII7", "Imaj6", "VI7", "V7", "V7", "II7", "V7", "Imaj6", "I7", "IVmaj6", "ivm7", "bVII7", "Imaj6", "VI7", "IV7", "V7", "Imaj6", "VI7"]
    },

    "black_orpheus": { defaultKey: "Am", progression: ["im7", "iim7b5", "V7b9", "im7", "ivm7", "VII7", "bIIImaj7", "bVImaj7", "iim7b5", "V7b9", "im7", "iim7b5", "V7b9", "im7", "ivm7", "VII7"] },
    "all_the_things_you_are": { defaultKey: "Ab", progression: ["vim7", "iim7", "V7", "Imaj7", "IVmaj7", "iiim7", "VI7", "IImaj7", "iim7", "vm7", "I7", "IVmaj7", "Imaj7", "iim7", "V7", "Imaj7", "iim7", "V7", "Imaj7", "iim7", "vm7", "I7", "IVmaj7", "Imaj7"] },
    "all_of_me": { defaultKey: "C", progression: ["Imaj7", "III7", "VI7", "iim7", "III7", "vim7", "II7", "iim7", "V7", "Imaj7", "III7", "VI7", "iim7", "IVmaj7", "ivm7", "Imaj7", "V7"] },
    "stella_by_starlight": { defaultKey: "Bb", progression: ["iim7b5", "V7b9", "im7", "IV7", "vm7", "I7", "IVmaj7", "bVIImaj7", "biiim7b5", "VI7b9", "iim7", "V7", "im7", "IV7", "IVmaj7", "V7"] },
    "autumn_leaves": { defaultKey: "Em", progression: ["ivm7", "VII7", "bIIImaj7", "bVImaj7", "iim7b5", "V7b9", "im7", "im7"] },
    "summertime": { defaultKey: "Am", progression: ["im7", "V7", "im7", "V7", "im7", "V7", "im7", "V7", "iv7", "im7", "V7", "im7", "iv7", "im7", "V7", "im7"] },
    "girl_from_ipanema": { defaultKey: "F", progression: ["Imaj7", "II7", "iim7", "V7", "Imaj7", "II7", "iim7", "V7", "Imaj7", "bII7", "#IVmaj7", "vim7", "iim7", "V7", "Imaj7", "vim7", "iim7", "V7"] },
    "coltrane_changes": { defaultKey: "C", progression: ["Imaj7", "bIII7", "bVImaj7", "VII7", "IIImaj7", "V7", "Imaj7", "bIII7", "bVImaj7", "VII7", "IIImaj7", "V7"] },
    "bird_blues": { defaultKey: "F", progression: ["I7", "IV7", "I7", "vim7", "iim7", "V7", "IV7", "ivm7", "I7", "vim7", "iim7", "V7"] },
    "just_friends": { defaultKey: "G", progression: ["Imaj7", "VI7", "iim7", "V7", "Imaj7", "VI7", "iim7", "V7", "iim7", "V7", "Imaj7", "VI7", "iim7", "V7", "Imaj7", "VI7"] },
    "blue_bossa": { defaultKey: "Cm", progression: ["im7", "im7", "bVII7", "bVII7", "im7", "im7", "ivm7", "bVII7", "im7", "V7", "im7", "im7"] },
    "on_green_dolphin_street": { defaultKey: "C", progression: ["Imaj7", "bIII7", "bVImaj7", "iim7", "V7", "Imaj7", "bIII7", "bVImaj7", "iim7", "V7", "Imaj7"] },
    "solar": { defaultKey: "C", progression: ["im7", "im7", "bIIImaj7", "bIIImaj7", "bVImaj7", "bVImaj7", "bII7", "bII7", "im7", "im7"] },
    "misty": { defaultKey: "Eb", progression: ["Imaj7", "I7", "IVmaj7", "ivm7", "Imaj7", "V7", "Imaj7", "vim7", "iim7", "V7", "Imaj7"] },
    "days_of_wine_and_roses": { defaultKey: "F", progression: ["Imaj7", "vim7", "iim7", "V7", "Imaj7", "vim7", "iim7", "V7", "Imaj7", "vim7", "iim7", "V7", "Imaj7"] },
    "cherokee": { defaultKey: "Bb", progression: ["Imaj7", "Imaj7", "iim7", "V7", "Imaj7", "Imaj7", "iim7", "V7","bVI7", "bVI7", "V7", "V7", "Imaj7", "Imaj7", "iim7", "V7"] },
    "caravan": { defaultKey: "Eb", progression: ["im7", "IV7b5", "im7", "IV7b5", "im7", "IV7b5", "im7", "IV7b5", "bVII7", "bVII7", "Imaj7", "Imaj7", "V7", "V7", "im7", "im7"] },
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
        keySelect: document.getElementById('keySelect'),
        scaleDisplay: document.getElementById('scale-display'),
        chordTuning: document.getElementById('chord-tuning'),
        timeSignature: document.getElementById('time-signature'),
        soundType: document.getElementById('sound-type'),
        metronomeVolume: document.getElementById('metronome-volume'),
        chordFretboardVolume: document.getElementById('chord-fretboard-volume'),
        chordVolume: document.getElementById('chord-volume'),
        chordsEnabled: document.getElementById('chordsEnabled'),
        fretboardVolume: document.getElementById('fretboard-volume'),
        fretboardsGrid: document.querySelector('.fretboards-grid'),
        darkModeToggle: document.getElementById('dark-mode-toggle'),
    },
    init() {
        Object.entries(this.elements).forEach(([key, el]) => {
            if (!el) console.warn(`Missing DOM element: ${key}`);
        });
    }
};
function initializeScaleSelects() {
    // Get all scale options
        const displayName = scale
            .replace(/([A-Z])/g, ' $1') // Add space before capital letters
            .toLowerCase()
            .replace(/\b\w/g, c => c.toUpperCase()); // Capitalize first letter of each word
        return `<option value="${scale}">${displayName}</option>`;
    }).join('');

    // Update FretFlow scale select
    const fretflowScale = document.getElementById('fretflow-scale');
    if (fretflowScale) {
        fretflowScale.innerHTML = scaleOptions;
    }

    // Update all measure scale selects
        select.innerHTML = scaleOptions;
    });
}
        
// Audio Management
const AudioContextManager = {
    context: null,
    soundBuffers: {},
    reverbNode: null,
    samplesLoaded: false,
    currentChordGain: null,

    initialize: async function() {
        if (!this.context) {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            await this.loadSounds();
        }
        if (this.context.state === 'suspended') {
            await this.context.resume();
        }
        AppState.updateState({ audioInitialized: true });
        return this.context;
    },

    ensureAudioContext: async function() {
        return await this.initialize();
    },
    
    loadSounds: async function() {
        const soundFiles = {
            'click': 'Click.wav',
            'hihat': 'HiHat.wav',
            'kick': 'Kick.wav',
            'snare': 'Snare.wav',
            'woodblock': 'woodblock.wav'
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
                log(`Using fallback synthetic sound for ${type}`);
            }
        }
        updateLoadingStatus("Drum sounds loaded");
    },
    
        const sampleRate = this.context.sampleRate;
        const duration = type === 'hihat' ? 0.05 : 0.2;
        const buffer = this.context.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        switch (type) {
            case 'click':
                for (let i = 0; i < data.length; i++) data[i] = Math.sin(i * 0.05) * Math.exp(-i * 0.01);
                break;
            case 'hihat':
                for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.01));
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
        }
        return buffer;
    },
    
        // Use the new ALL_NOTES and OCTAVES arrays

        for (const note of ALL_NOTES) {
            for (const octave of OCTAVES) {
                const fileName = getSampleFileName(note, octave); // e.g., 'ds4.wav'
                const key = `${note}${octave}`; // e.g., 'ds4'
                try {
                    const response = await fetch(fileName);
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
                } catch (e) {
                    console.error(`Failed to load sample: ${fileName}`, e);
                }
            }
        }
        this.samplesLoaded = true;
    },
    
        if (!this.reverbNode) {
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
        }
    }
};
        
async function ensureAudioInitialized() {
    try {
        if (!AudioContextManager.context || AudioContextManager.context.state === 'suspended') {
            await AudioContextManager.initialize();
            if (AudioContextManager.context.state === 'suspended') {
                await AudioContextManager.context.resume();
            }
        }
    } catch (error) {
        console.error('Audio initialization failed:', error);
        alert('Audio playback requires user interaction. Please click anywhere on the page to enable audio.');
        throw error;
    }
}
// Music Theory Utilities

function getNoteFromScaleDegree(degree, key, scale) {
    // Use the sample file naming convention: lowercase, 's' for sharp, no flats
    const chromaticScale = ['c', 'cs', 'd', 'ds', 'e', 'f',
                            'fs', 'g', 'gs', 'a', 'as', 'b'];
    // Standardize the key to match the format
    const keyIndex = chromaticScale.indexOf(standardizeNoteNameForSamples(key));
    if (keyIndex === -1) return null; // safety check

    const noteIndex = (keyIndex + scale[degree]) % 12;
    return chromaticScale[noteIndex];
}

// Helper to convert input key names to sample format
function standardizeNoteNameForSamples(note) {
    // Accepts 'C', 'Db', 'D#', etc. and returns 'c', 'cs', etc.
    note = note.toLowerCase().replace('♯', '#').replace('♭', 'b');
    if (note.length === 2 && note[1] === 'b') {
        // Convert flats to equivalent sharps
        const flatToSharp = {
            'cb': 'b',
            'db': 'cs',
            'eb': 'ds',
            'fb': 'e',
            'gb': 'fs',
            'ab': 'gs',
            'bb': 'as'
        };
        return flatToSharp[note] || note[0];
    }
    if (note.length === 2 && note[1] === '#') {
        return note[0] + 's';
    }
    return note[0];
}
        
// Remove this duplicate function
function standardizeNoteName(note) {
  if (!note) return 'C';
  const match = note.match(/^([A-G])([b#])?(\d)?$/);
  if (!match) return note.toUpperCase();
  let [, letter, accidental, octave] = match;
  letter = letter.toUpperCase();
  const CHROMATIC = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  if (accidental === 'b') {
    const index = chromatic.indexOf(letter);
    return chromatic[(index - 1 + 12) % 12];
  } else if (accidental === '#') {
    const index = chromatic.indexOf(letter);
    return chromatic[(index + 1) % 12];
  }
  return letter;
}

// 1. Get the index of a note in the NOTES array
function getNoteIndex(note) {
    const standardizedNote = standardizeNoteName(note);
    return NOTES.indexOf(standardizedNote);
}

// 2. Find the direct sample key for a note and octave
function getSampleKey(note, octave) {
    const standardizedNote = standardizeNoteName(note);
    if (!ALL_NOTES.includes(standardizedNote)) {
        console.warn(`Note ${note} not found in sample set.`);
        return null;
    }
    if (!OCTAVES.includes(octave)) {
        console.warn(`Octave ${octave} not found in sample set.`);
        return null;
    }
    return `${standardizedNote}${octave}`;
}

// 3. Get all notes in a scale (returns sample-format note names)
function getScaleNotes(root, scaleName) {
    if (!root) return [];
    if (!scaleIntervals) return [];
    const chromaticScale = NOTES;
    let rootIndex = chromaticScale.indexOf(standardizeNoteName(root));
    if (rootIndex === -1) return [];
    return scaleIntervals.map(interval => {
        const noteIndex = (rootIndex + interval) % 12;
        return chromaticScale[noteIndex];
    });
}

// 4. Get the note at a specific fret (returns sample-format note name)
function getNoteAtFret(startNote, fretNumber) {
    const chromaticScale = NOTES;
    const startIndex = chromaticScale.indexOf(standardizeNoteName(startNote));
    if (startIndex === -1) return startNote;
    const noteIndex = (startIndex + fretNumber) % 12;
    return chromaticScale[noteIndex];
}

// 5. Get the sample key for a note/octave (no pitch shifting needed)
function getPitchShiftedNote(note, targetOctave = 3) {
    const standardizedNote = standardizeNoteName(note);
    if (!ALL_NOTES.includes(standardizedNote)) {
        console.warn(`Note ${note} not found in sample set.`);
        return { sampleKey: 'c3', semitoneDiff: 0 };
    }
    if (!OCTAVES.includes(targetOctave)) {
        console.warn(`Octave ${targetOctave} not found in sample set.`);
        return { sampleKey: 'c3', semitoneDiff: 0 };
    }
    return { sampleKey: `${standardizedNote}${targetOctave}`, semitoneDiff: 0 };
}

// 6. Minor key name check (unchanged)
function isMinorKeyName(key) {
    return key && (key.endsWith('m') || key.endsWith('min'));
}

    // Helper: get note from scale degree
    function getNoteFromScaleDegree(degree, key, scale, accidental = 0) {
        const chromatic = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
        let keyIndex = chromatic.findIndex(n => n.replace('b', '♭').replace('#', '♯') === key.replace('b', '♭').replace('#', '♯'));
        if (keyIndex === -1) keyIndex = 0;
        let noteIndex = (keyIndex + scale[degree] + accidental + 12) % 12;
        return chromatic[noteIndex];
    }

    // Helper: parse accidental (b, #, bb, x, etc.)
    function parseAccidental(str) {
        if (!str) return 0;
        return (str.match(/b/g) || []).length * -1 + (str.match(/#/g) || []).length;
    }

    const majorScale = [0, 2, 4, 5, 7, 9, 11];
    const minorScale = [0, 2, 3, 5, 7, 8, 10];

    // Key context
    const isMinorKey = key.toLowerCase().includes('m');
    const actualKey = isMinorKey ? key.replace('m', '') : key;
    const scale = isMinorKey ? minorScale : majorScale;

    // Handle empty or invalid input
    if (!chordFunction) return null;

    // Updated regex to handle maj6 and additional cases
    const secDomMatch = chordFunction.match(/^([b#]*[ivIV]+[#b]*)(maj7|maj6|m7b5|m6|6|°|ø|maj|m|M)?(7|9|11|13)?([b#]5|[b#]9|[b#]11|[b#]13)?(\([b#]5\)|\([b#]9\)|\([b#]11\)|\([b#]13\))?(?:\/([b#]*[ivIV]+[#b]*))?$/);

    if (!secDomMatch) return null;

    let [
        _,
        roman,
        quality = '',
        extension = '',
        alteration = '',
        parenthesizedAlteration = '',
        secRoman
    ] = secDomMatch;

    // Handle secondary dominants (e.g., V7/ii)
    if (secRoman) {
        const romanToNumber = {
            'I': 0, 'II': 1, 'III': 2, 'IV': 3, 'V': 4, 'VI': 5, 'VII': 6,
            'i': 0, 'ii': 1, 'iii': 2, 'iv': 3, 'v': 4, 'vi': 5, 'vii': 6
        };
        const secAccMatch = secRoman.match(/^([b#]*)([ivIV]+)([#b]*)$/);
        let secAcc = 0, secBase = secRoman;
        if (secAccMatch) {
            secAcc = parseAccidental(secAccMatch[1] + secAccMatch[3]);
            secBase = secAccMatch[2];
        }
        let secDegree = romanToNumber[secBase];
        if (secDegree === undefined) return null;
        let secRoot = getNoteFromScaleDegree(secDegree, actualKey, scale, secAcc);
        return secRoot + '7';
    }

    // Parse accidental for main roman
    const accMatch = roman.match(/^([b#]*)([ivIV]+)([#b]*)$/);
    let accidental = 0, baseRoman = roman;
    if (accMatch) {
        accidental = parseAccidental(accMatch[1] + accMatch[3]);
        baseRoman = accMatch[2];
    }

    const romanToNumber = {
        'I': 0, 'II': 1, 'III': 2, 'IV': 3, 'V': 4, 'VI': 5, 'VII': 6,
        'i': 0, 'ii': 1, 'iii': 2, 'iv': 3, 'v': 4, 'vi': 5, 'vii': 6
    };
    let degree = romanToNumber[baseRoman];
    if (degree === undefined) return null;

    const rootNote = getNoteFromScaleDegree(degree, actualKey, scale, accidental);
    if (!rootNote) return null;

    const isLowerCase = /^[iv]+$/.test(baseRoman);

    // Updated default qualities
    const majorDefaultQualities = ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'];
    const minorDefaultQualities = ['m7', 'm7b5', 'maj7', 'm7', '7', 'maj7', '7'];

    // Start with default quality
    let chordQuality = isMinorKey ? minorDefaultQualities[degree] : majorDefaultQualities[degree];

    // Improved quality handling
    if (quality) {
        if (quality === 'maj6' || quality === '6') chordQuality = isLowerCase ? 'm6' : 'maj6';
        else if (quality === '°') chordQuality = extension === '7' ? 'dim7' : 'dim';
        else if (quality === 'ø') chordQuality = 'm7b5';
        else if (quality === 'maj' || quality === 'M') chordQuality = extension === '7' ? 'maj7' : 'maj';
        else if (quality === 'm') chordQuality = extension === '7' ? 'm7' : 'm';
        else if (quality.includes('maj')) chordQuality = quality;
    }

    // Enhanced extension handling
    if (extension) {
        if (extension === '7') {
            if (degree === 4 && !isLowerCase) chordQuality = '7';
            else if (!quality) {
                if (isLowerCase) chordQuality = 'm7';
                else if (degree === 4) chordQuality = '7';
                else chordQuality = 'maj7';
            }
        } else if (['9', '11', '13'].includes(extension)) {
            if (!quality) {
                if (isLowerCase) chordQuality = 'm' + extension;
                else if (degree === 4) chordQuality = '7' + extension;
                else chordQuality = 'maj' + extension;
            }
        }
    }

    // Handle alterations
    let chordAlteration = '';
    if (alteration) chordAlteration += alteration.replace(/[()]/g, '');
    if (parenthesizedAlteration) chordAlteration += parenthesizedAlteration.replace(/[()]/g, '');

    return rootNote + chordQuality + chordAlteration;
}
        
    function parseChord(chord) {
    if (!chord) return ['C', 'maj'];

    // More inclusive regex for chord parsing
    const regex = /^([A-Ga-g][b#]?)(maj7|M7|maj|min7|m7|m7b5|min6|m6|min|m|dim7|dim|aug|sus2|sus4|add9|7b9|7#9|7b5|7#5|7alt|7|6|9|11|13|°|ø7|ø)?$/;
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
        case 'maj':
        case 'maj7':
        case 'mM7':
        case 'M':
        case 'M7':
            quality = 'maj7';
            break;
        case 'dim':
            quality = 'dim';
            break;
        case 'dim7':
        case '°':
            quality = 'dim7';
            break;
        case 'ø':
        case 'ø7':
        case 'm7b5':
            quality = 'm7b5';
            break;
        case 'dom7':
            quality = '7';
            break;
        case 'min6':
        case 'm6':
            quality = 'm6';
            break;
        default:
            // Leave add9, sus2, sus4, 7b9, etc. as-is
            break;
    }

    return [root, quality];
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
    '': 'maj7',
    'maj': 'maj7',
    'maj7': 'maj7',
    'M': 'maj7',
    'M7': 'maj7',
    '7': 'dom7',
    'dom7': 'dom7',
    'm': 'min7',
    'min': 'min7',
    'm7': 'min7',
    'min7': 'min7',
    'dim': 'min7b5',
    'dim7': 'dim7',
    'ø': 'min7b5',
    'ø7': 'min7b5',
    'm7b5': 'min7b5',
    '6': '6',
    'm6': 'm6',
    'min6': 'm6',
    '7b9': '7b9',
    '7#9': '7#9',
    '7b5': '7b5',
    '7#5': '7#5',
    '7alt': '7alt',
    'add9': 'add9',
    'sus2': 'sus2',
    'sus4': 'sus4'
};

    return qualityMap[quality] || 'maj7';
}
        
function suggestScaleForQuality(quality) {
    const scaleMap = {
        'maj7': 'major',      // Ionian
        'maj': 'major',       // Ionian
        '7': 'mixolydian',    // Mixolydian
        'dom7': 'mixolydian', // Mixolydian
        'min7': 'dorian',     // Dorian
        'm7': 'dorian',       // Dorian
        'min7b5': 'locrian',  // Locrian
        'min': 'minor',       // Natural minor
        'm': 'minor',         // Natural minor
        '6': 'major',         // Major
        'm6': 'minor',        // Minor
    };
    return scaleMap[quality] || 'major';
}

}

function updateChordProgression(measure) {
    const rootSelect = measure.querySelector('.root-note');
    const qualitySelect = measure.querySelector('.chord-quality');
    
    
    const root = rootSelect.value;
    const quality = qualitySelect.value;
    
    
    // Update scale options
        .map(scale => `<option value="${scale}">${scale}</option>`)
        .join('');
    
    // Set default scale
    
    // Update fretboard if this is the current measure
    if (measure === UI.elements.measures.children[AppState.currentMeasure]) {
        const tuning = TUNINGS[UI.elements.chordTuning.value];
        updateFretboardNotes(UI.elements.chordFretboard, root, scaleSelect.value, tuning);
    }
}

// DOM Utilities
function createKeyOptions(selected = 'C') {
    return NOTES.map(note =>
        `<option value="${note}"${note === selected ? ' selected' : ''}>${note}</option>`
    ).join('');
}

function createQualityOptions(selected = 'maj7') {
    const qualities = [
        { value: 'maj7', label: 'Maj7' },
        { value: '7', label: '7' },
        { value: 'min7', label: 'Min7' },
        { value: 'm7b5', label: 'm7b5 (Half-Dim)' },
        { value: 'dim7', label: 'Dim7' },
        { value: '6', label: '6' },
        { value: 'm6', label: 'm6' },
        { value: 'maj', label: 'Major' },
        { value: 'min', label: 'Minor' },
        { value: 'sus2', label: 'Sus2' },
        { value: 'sus4', label: 'Sus4' },
        { value: 'add9', label: 'Add9' },
        { value: '7b9', label: '7♭9' },
        { value: '7#9', label: '7♯9' },
        { value: '7b5', label: '7♭5' },
        { value: '7#5', label: '7♯5' },
        { value: '7alt', label: '7alt' }
    ];

    return qualities.map(q =>
        `<option value="${q.value}"${q.value === selected ? ' selected' : ''}>${q.label}</option>`
    ).join('');
}

function createScaleOptions(selected = 'major') {
        `<option value="${scale}"${scale === selected ? ' selected' : ''}>${scale.charAt(0).toUpperCase() + scale.slice(1)}</option>`
    ).join('');
}
       
// Audio Playback
function playNote(noteName, volume = 1.0, duration = 1000) {
    if (!AudioContextManager.context || !noteName) return;

    const fretboardVolumeControl = document.getElementById('fretboard-volume');
    const fretboardVolume = parseFloat(fretboardVolumeControl?.value ?? 1);
    const finalVolume = volume * fretboardVolume;

    if (finalVolume <= 0) return;

    // Extract the pitch class and octave from the note name
    const match = noteName.match(/^([A-G][b#]?)(\d)$/);
    if (!match) {
        console.warn(`Invalid note format: ${noteName}`);
        return;
    }

    let [, rawNote, octaveStr] = match;
    const baseNote = standardizeNoteName(rawNote).replace('m', '');
    const mappedNote = SAMPLE_NOTE_MAP[baseNote] || baseNote;
    const octave = Math.max(2, Math.min(6, parseInt(octaveStr)));

    const sampleName = `${mappedNote}${octave}v12`;

    if (!buffer) {
        console.warn(`No piano sample found for ${sampleName}`);
        return;
    }

    try {
        const source = AudioContextManager.context.createBufferSource();
        source.buffer = buffer;

        const gainNode = AudioContextManager.context.createGain();
        gainNode.gain.value = finalVolume;

        source.connect(gainNode);
        gainNode.connect(AudioContextManager.context.destination);

        source.start(0);
        setTimeout(() => {
            try {
                source.stop();
            } catch (e) {
                // No-op on already stopped source
            }
        }, duration);
    } catch (error) {
        console.error('Error playing note:', error);
    }
}


async function playChord(root, quality, startTime = AudioContextManager.context.currentTime, duration = 2, isContinuation = false) {
    await ensureAudioInitialized();
    if (!AudioContextManager.samplesLoaded) {
        console.warn('Piano samples not loaded yet');
        return;
    }
    if (!UI.elements.chordsEnabled.classList.contains('active')) return;

    // Get chord notes and log them for debugging
    const chordNotes = getChordNotes(root, quality);
    console.log('Playing chord:', root, quality, 'Notes:', chordNotes);

    const chordVolume = parseFloat(UI.elements.chordVolume.value);
    if (chordVolume <= 0) return;

    // Create a new gain node for this chord
    const gainNode = AudioContextManager.context.createGain();
    gainNode.gain.value = chordVolume;
    gainNode.connect(AudioContextManager.context.destination);

    // Handle previous chord
    if (!isContinuation && AudioContextManager.currentChordGain) {
        AudioContextManager.currentChordGain.gain.setValueAtTime(
            AudioContextManager.currentChordGain.gain.value, 
            startTime
        );
        AudioContextManager.currentChordGain.gain.exponentialRampToValueAtTime(
            0.001, 
            startTime + 0.05
        );
    }

    AudioContextManager.currentChordGain = gainNode;

    // Prepare notes for either root position or inversion
    let finalChordNotes = [...chordNotes];
    if (isContinuation) {
        // For inversion, move the root note up an octave
        const rootNote = finalChordNotes[0];
        finalChordNotes.shift(); // Remove root from beginning
        finalChordNotes.push(rootNote); // Add root to end
    }

    // Play each note in the chord
    finalChordNotes.forEach((note, index) => {
        // Determine octave based on position and inversion
        const octave = isContinuation ? 
            (index === finalChordNotes.length - 1 ? 4 : 3) : // In inversion, last note (root) goes up to octave 4
            (index === 0 ? 3 : (index < 3 ? 3 : 4)); // In root position, spread across octaves 3 and 4

        // Convert note name to sample format
        const sampleNote = standardizeNoteNameForSamples(note);
        if (!sampleNote) {
            console.error(`Invalid note: ${note}`);
            return;
        }

        const sampleKey = `${sampleNote}${octave}`;
        console.log(`Playing note: ${note} as ${sampleKey}`);

        // Get and play the buffer
        if (!buffer) {
            console.warn(`No sample found for ${sampleKey}`);
            return;
        }

        const source = AudioContextManager.context.createBufferSource();
        source.buffer = buffer;
        source.connect(gainNode);

        // Add reverb
        const reverbGain = AudioContextManager.context.createGain();
        reverbGain.gain.value = 0.2;
        source.connect(reverbGain);
        reverbGain.connect(AudioContextManager.reverbNode);

        // Add slight timing variation for more natural sound
        const timeVariation = Math.random() * 0.02;
        
        // Start and stop the note
        source.start(startTime + timeVariation);
        source.stop(startTime + duration);
    });
}
function getChordNotes(root, quality) {
    // Define chord intervals (semitones from root)
    const CHORD_INTERVALS = {
        'maj': [0, 4, 7],
        'min': [0, 3, 7],
        'minor': [0, 3, 7],
        'major': [0, 4, 7],
        'dim': [0, 3, 6],
        'aug': [0, 4, 8],
        '6': [0, 4, 7, 9],
        'm6': [0, 3, 7, 9],
        'min6': [0, 3, 7, 9],
        '7': [0, 4, 7, 10],
        'dom7': [0, 4, 7, 10],
        'maj7': [0, 4, 7, 11],
        'min7': [0, 3, 7, 10],
        'm7': [0, 3, 7, 10],
        'dim7': [0, 3, 6, 9],
        'm7b5': [0, 3, 6, 10],
        'min7b5': [0, 3, 6, 10],
        'sus2': [0, 2, 7],
        'sus4': [0, 5, 7],
        'add9': [0, 4, 7, 14]
    };

    function normalizeChordQuality(quality) {
    const map = {
        'maj': 'maj',
        'major': 'maj',
        'M': 'maj',
        'min': 'm',
        'minor': 'm',
        'm': 'm',
        'min6': 'm6',
        'min7': 'm7',
        'm7b5': 'm7b5',
        'ø7': 'm7b5',
        'dim': 'dim',
        'dim7': 'dim7',
        'dom7': '7',
        '7': '7',
        'maj7': 'maj7',
        'M7': 'maj7',
        'sus2': 'sus2',
        'sus4': 'sus4',
        'add9': 'add9',
        '': '', // fallback for no quality suffix
        // Altered chords
        '7b9': '7b9',
        '7#9': '7#9',
        '7b5': '7b5',
        '7#5': '7#5',
        '7alt': '7alt'
    };
    return map[quality] || quality; // fallback to raw if not in map
}

    
    // Handle sharps and flats in the root note
    let rootNote = root;
    if (root.includes('#')) {
        const baseNote = root.replace('#', '');
        const baseIndex = NOTES.indexOf(baseNote);
        rootNote = NOTES[(baseIndex + 1) % 12];
    } else if (root.includes('b')) {
        const baseNote = root.replace('b', '');
        const baseIndex = NOTES.indexOf(baseNote);
        rootNote = NOTES[(baseIndex + 11) % 12];
    }

    // Get the root note index
    const rootIndex = NOTES.indexOf(rootNote);
    
    if (rootIndex === -1) {
        console.error(`Invalid root note: ${root}`);
        return [root];
    }

    // Get the intervals for the specified quality
    const normalizedQuality = normalizeChordQuality(quality);
    const intervals = CHORD_INTERVALS[normalizedQuality] || CHORD_INTERVALS['maj'];


    // Generate the chord notes
    const chordNotes = intervals.map(interval => {
        const noteIndex = (rootIndex + interval) % 12;
        return NOTES[noteIndex];
    });

    console.log(`Generated chord notes for ${root} ${quality}:`, chordNotes);
    return chordNotes;
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
    if (!AudioContextManager.context) return;
    
    let sampleFile;
    
    // Map the type to the current set's sample file
    switch(type) {
    case 'snare': sampleFile = set.snare; break;
    case 'hihat': sampleFile = set.hihat; break;
    case 'kick': sampleFile = set.kick; break;
    default: sampleFile = null;
    }
    
    try {
        let buffer;
        // Try to load the current set's sample
        const response = await fetch(`./${sampleFile}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        buffer = await AudioContextManager.context.decodeAudioData(arrayBuffer);
        
        const source = AudioContextManager.context.createBufferSource();
        source.buffer = buffer;
        
        const gainNode = AudioContextManager.context.createGain();
        // Get the metronome volume
        const metronomeVolume = parseFloat(UI.elements.metronomeVolume.value);
        
        // Apply sound-specific volume adjustments
        let finalVolume = metronomeVolume;
        if (type === 'kick') {
            finalVolume *= 1.2; // Slightly boost kick
        } else if (type === 'snare') {
            finalVolume *= 1.1; // Slightly boost snare
        } else if (type === 'hihat') {
            finalVolume *= 0.8; // Slightly reduce hihat
        }
        
        // Ensure volume doesn't exceed 1.0
        finalVolume = Math.min(finalVolume, 1.0);
        gainNode.gain.value = finalVolume;
        
        source.connect(gainNode);
        gainNode.connect(AudioContextManager.context.destination);
        
        // Add slight reverb for more depth
        if (AudioContextManager.reverbNode) {
            const reverbGain = AudioContextManager.context.createGain();
            reverbGain.gain.value = 0.1; // Subtle reverb
            source.connect(reverbGain);
            reverbGain.connect(AudioContextManager.reverbNode);
        }
        
        source.start(0);
    } catch (error) {
        console.error(`Failed to play drum sample: ${type}`, error);
        try {
            // Fall back to default drum sounds if loading fails
            const fallbackBuffer = AudioContextManager.soundBuffers[type] || 
            const source = AudioContextManager.context.createBufferSource();
            source.buffer = fallbackBuffer;
            
            const gainNode = AudioContextManager.context.createGain();
            gainNode.gain.value = parseFloat(UI.elements.metronomeVolume.value);
            
            source.connect(gainNode);
            gainNode.connect(AudioContextManager.context.destination);
            
            source.start(0);
        } catch (fallbackError) {
            console.error('Failed to play fallback sound:', fallbackError);
        }
    }
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
    const standardizedRoot = standardizeNoteName(rootNote);
    const rootIndex = NOTES.indexOf(standardizedRoot);
    const scaleNotes = scaleIntervals.map(interval => {
        const noteIndex = (rootIndex + interval) % 12;
        return NOTES[noteIndex];
    });
    console.log(`[updateFretboardNotes] scaleNotes for ${rootNote} ${scale}: ${scaleNotes.join(',')}`);
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
                        let volume = parseFloat(currentBeatElement.dataset.baseVolume) || 0;
                        const isAccent = volume >= 1 && ['kick', 'snare'].includes(currentBeatElement.dataset.sound);
                        const accentBoost = parseFloat(UI.elements.accentIntensity?.value || 1);
                        if (isAccent) {
                            volume = Math.min(volume * accentBoost, 1); // cap at 1.0
                        }
                        await playNote(`string${6 - string}`, fret, volume);
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
    log(`Fretboard updated with ${rootNote} ${scale} scale`);
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
                        playChord(root, quality, AudioContextManager.context.currentTime, beatDuration * 2, false);
                    } else if (AppState.currentBeat === 4) {
                        playChord(root, quality, AudioContextManager.context.currentTime, beatDuration * 2, true);
                    }
                } else if (AppState.currentBeat === 0) {
                    playChord(root, quality, AudioContextManager.context.currentTime, beatDuration * 4, false);
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

// Chord Progression Management
function loadProgression(progressionName, overrideKey = null) {
        console.error(`Invalid progression name: ${progressionName}`);
        return;
    }

    const selectedKey = overrideKey || progression.defaultKey || "C";
    UI.elements.keySelect.value = selectedKey;

    // Clear existing measures
    UI.elements.measures.innerHTML = '';

    // Helper function to standardize chord quality mapping
    function standardizeQuality(rawQuality) {
        const qualityMap = {
            'maj7': 'maj7',
            'maj6': 'maj6',
            '7': 'dom7',
            'm7': 'min7',
            'm6': 'min6',
            'm7b5': 'min7b5',
            'dim7': 'dim7',
            'dim': 'dim',
            '°7': 'dim7',
            '°': 'dim',
            'ø': 'min7b5',
            '7b9': 'dom7b9',
            '7#9': 'dom7#9',
            '7b5': 'dom7b5',
            '7#5': 'dom7#5',
            '7#11': 'dom7#11',
            '9': 'dom9',
            '13': 'dom13',
            'maj9': 'maj9',
            'maj13': 'maj13',
            'm9': 'min9',
            'm13': 'min13'
        };
        return qualityMap[rawQuality] || 'maj7'; // Default to maj7 if unknown
    }

    progression.progression.forEach((chordFunction, index) => {
        try {
            // Parse chord from progression function
            if (!chordSymbol) {
                console.error(`Failed to parse chord function: ${chordFunction}`);
                return;
            }

            // Enhanced chord parsing
            const [root, ...qualityParts] = chordSymbol.split(/(?=[A-G])|(?=[maj|m|dim|aug|°|ø])/);
            const rawQuality = qualityParts.join('');
            const qualityValue = standardizeQuality(rawQuality);
            const suggestedScale = suggestScaleForQuality(qualityValue);

            // Create the visual measure block
            const measure = document.createElement('div');
            measure.className = 'measure';
            measure.draggable = true;
            measure.dataset.originalChord = chordSymbol; // Store original chord for reference
            measure.dataset.chordFunction = chordFunction; // Store chord function

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

            // Set dropdown values
            const rootSelect = measure.querySelector('.root-note');
            const qualitySelect = measure.querySelector('.chord-quality');
            const scaleRootSelect = measure.querySelector('.second-key');

            // Set values with validation
            if (rootSelect) rootSelect.value = root;
            if (qualitySelect) {
                if (qualitySelect.querySelector(`option[value="${qualityValue}"]`)) {
                    qualitySelect.value = qualityValue;
                } else {
                    console.warn(`Chord quality "${qualityValue}" not found in dropdown for chord ${chordSymbol}. Falling back to maj7.`);
                    qualitySelect.value = 'maj7';
                }
            }
            if (scaleRootSelect) scaleRootSelect.value = root;

            // Add event listeners
            measure.addEventListener('dragstart', dragStart);
            measure.addEventListener('dragover', dragOver);
            measure.addEventListener('drop', drop);
            measure.addEventListener('dragend', dragEnd);

            // Add change listeners for synchronization
            measure.querySelectorAll('select').forEach(select => {
                select.addEventListener('change', () => {
                    updateMeasureState(measure);
                });
            });

        } catch (error) {
            console.error(`Error processing chord ${chordFunction}:`, error);
        }
    });

    // Update UI state
    updateMeasureNumbers();
    addFirstChordListener();

    // Sync fretboard with first measure
    const firstMeasure = UI.elements.measures.firstElementChild;
    if (firstMeasure) {
        syncFretboardWithMeasure(firstMeasure);
    }

    log(`Loaded progression "${progressionName}" in key: ${selectedKey}`);
}

// Helper function to sync fretboard with measure
function syncFretboardWithMeasure(measure) {
    if (!measure) return;
    
    const scaleRoot = measure.querySelector('.second-key')?.value;
    const scaleType = measure.querySelector('.scale-select')?.value;
    const tuning = TUNINGS[UI.elements.chordTuning.value];
    
    if (scaleRoot && scaleType && tuning) {
        updateFretboardNotes(UI.elements.chordFretboard, scaleRoot, scaleType, tuning);
    }
}

// Helper function to update measure state
function updateMeasureState(measure) {
    const rootNote = measure.querySelector('.root-note').value;
    const quality = measure.querySelector('.chord-quality').value;
    const scaleRoot = measure.querySelector('.second-key').value;
    const scaleType = measure.querySelector('.scale-select').value;

    // Update chord symbol
    const chordSymbol = `${rootNote}${quality}`;
    measure.dataset.currentChord = chordSymbol;

    // Trigger any necessary UI updates
    if (measure === UI.elements.measures.firstElementChild) {
        syncFretboardWithMeasure(measure);
    }
}        
function updateProgressionKey(newKey) {
    const selectedProgression = UI.elements.progressionSelect.value;
    if (!selectedProgression) return;
    if (!progression) return;
    Array.from(UI.elements.measures.children).forEach((measure, index) => {
        const chordFunc = progression.progression[index];
        if (!chordFunc) return;
        const [root, quality] = parseChord(chord);
        const rootSelect = measure.querySelector('.root-note');
        const qualitySelect = measure.querySelector('.chord-quality');
        const secondKeySelect = measure.querySelector('.second-key');
        if (rootSelect) rootSelect.value = standardizeNoteName(root);
        if (qualitySelect) qualitySelect.value = getQualityValue(quality);
        if (secondKeySelect) secondKeySelect.value = standardizeNoteName(root);
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
    
        const selected = scale === scaleType ? 'selected' : '';
        return `<option value="${scale}" ${selected}>${scale}</option>`;
    }).join('');

    measure.innerHTML = `
        <span class="measure-number">${measureCount}</span>
        <div class="chord-controls">
            <select class="root-note">${createKeyOptions(chord)}</select>
            <select class="chord-quality">${createQualityOptions(quality)}</select>
        </div>
        <div class="scale-controls">
            <select class="second-key">${createKeyOptions(scaleRoot)}</select>
            <select class="scale-select">${scaleOptionsHtml}</select>
        </div>
    `;
    
    UI.elements.measures.appendChild(measure);
    
    // Add event listeners
    measure.addEventListener('dragstart', dragStart);
    measure.addEventListener('dragover', dragOver);
    measure.addEventListener('drop', drop);
    measure.addEventListener('dragend', dragEnd);
    
    // Add change listeners for controls
    const controls = measure.querySelectorAll('select');
    controls.forEach(control => {
        control.addEventListener('change', () => updateChordProgression(measure));
    });
    
    updateMeasureNumbers();
    log(`Added measure ${measureCount}`);
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

// Drag and Drop Handlers
function dragStart(e) {
    e.dataTransfer.setData('text/plain', Array.from(UI.elements.measures.children).indexOf(e.target));
    setTimeout(() => e.target.classList.add('dragging'), 0);
}

function dragOver(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const targetIndex = Array.from(UI.elements.measures.children).indexOf(e.target.closest('.measure'));
    if (draggedIndex === targetIndex || isNaN(draggedIndex) || isNaN(targetIndex)) return;
    const measures = Array.from(UI.elements.measures.children);
    const draggedMeasure = measures[draggedIndex];
    UI.elements.measures.insertBefore(draggedMeasure, targetIndex < draggedIndex ? measures[targetIndex] : measures[targetIndex + 1]);
    updateMeasureNumbers();
    log(`Moved measure from index ${draggedIndex} to ${targetIndex}`);
}

function dragEnd(e) {
    e.target.classList.remove('dragging');
}

function initializeFretFlow() {
    const fretboardsGrid = UI.elements.fretboardsGrid;
    fretboardsGrid.innerHTML = ''; // Clear existing content
    
    // Add CSS to make it a 2x2 grid
    fretboardsGrid.style.display = 'grid';
    fretboardsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    fretboardsGrid.style.gap = '20px';
    
    // Create 4 independent fretboard sections
    for (let i = 0; i < 4; i++) {
        const fretboardSection = document.createElement('div');
        fretboardSection.className = 'fretboard-section';
        
            .map(([scaleName, intervals]) => {
                // Capitalize first letter and format the scale name
                const displayName = scaleName
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
                return `<option value="${scaleName}">${displayName}</option>`;
            })
            .join('');
        
        // Create the HTML structure for each section
        fretboardSection.innerHTML = `
            <div class="fretboard-controls">
                <div class="control-group">
                    <label for="fretflow-key-${i}">Key:</label>
                    <select id="fretflow-key-${i}" class="fretflow-key" aria-label="Select key">
                        <option value="C">C</option>
                        <option value="C#">C#</option>
                        <option value="D">D</option>
                        <option value="D#">D#</option>
                        <option value="E">E</option>
                        <option value="F">F</option>
                        <option value="F#">F#</option>
                        <option value="G">G</option>
                        <option value="G#">G#</option>
                        <option value="A">A</option>
                        <option value="A#">A#</option>
                        <option value="B">B</option>
                    </select>
                </div>
                <div class="control-group">
                    <label for="fretflow-scale-${i}">Scale:</label>
                    <select id="fretflow-scale-${i}" class="fretflow-scale" aria-label="Select scale type">
                        ${scaleOptions}
                    </select>
                </div>
                <div class="control-group">
                    <label for="fretflow-tuning-${i}">Tuning:</label>
                    <select id="fretflow-tuning-${i}" class="tuning-select" aria-label="Select guitar tuning">
                        <option value="standard">Standard (EADGBE)</option>
                        <option value="dropD">Drop D (DADGBE)</option>
                        <option value="openG">Open G (DGDGBD)</option>
                        <option value="DADGAD">DADGAD</option>
                        <option value="openE">Open E (EBEG#BE)</option>
                    </select>
                </div>
            </div>
            <div class="scale-display"></div>
            <div id="fretflow-fretboard-${i}" class="fretboard"></div>
        `;
        
        fretboardsGrid.appendChild(fretboardSection);
        
        // Initialize this fretboard
        const fretboard = fretboardSection.querySelector(`#fretflow-fretboard-${i}`);
        const keySelect = fretboardSection.querySelector(`#fretflow-key-${i}`);
        const tuningSelect = fretboardSection.querySelector(`#fretflow-tuning-${i}`);
        const scaleDisplay = fretboardSection.querySelector('.scale-display');
        
        function updateFretboardDisplay() {
            try {
                const selectedKey = keySelect.value;
                const selectedTuning = TUNINGS[tuningSelect.value];
                
                if (!selectedTuning) {
                    console.error(`Invalid tuning selected: ${tuningSelect.value}`);
                    return;
                }
                
                // Format the scale name for display
                const displayScaleName = selectedScale
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
                
                // Update the scale display
                scaleDisplay.textContent = `${selectedKey} ${displayScaleName}`;
                
                // Update the fretboard
                createFretboard(fretboard, selectedTuning);
                updateFretboardNotes(fretboard, selectedKey, selectedScale, selectedTuning);
                
                // Attach note click handlers
                attachNoteClickHandlers(fretboard);
                
            } catch (error) {
                console.error('Error updating fretboard display:', error);
                log(`Error updating fretboard: ${error.message}`);
            }
        }
        
        // Add event listeners for all controls
        keySelect.addEventListener('change', updateFretboardDisplay);
        tuningSelect.addEventListener('change', updateFretboardDisplay);
        
        // Initial render
        updateFretboardDisplay();
    }
}

function attachNoteClickHandlers(fretboard) {
    if (!fretboard) {
        console.error('Invalid fretboard element provided');
        return;
    }

    // Remove existing event listeners to prevent duplicates
    const oldNotes = fretboard.getElementsByClassName('note');
    Array.from(oldNotes).forEach(note => {
        const clone = note.cloneNode(true);
        note.parentNode.replaceChild(clone, note);
    });

    // Attach new event listeners
    const notes = fretboard.getElementsByClassName('note');
    Array.from(notes).forEach(note => {
        note.addEventListener('click', function(e) {
            e.stopPropagation();
            const noteName = this.dataset.note;
            if (noteName) {
                try {
                    const fretboardVolume = parseFloat(UI.elements.fretboardVolume.value) || 1.0;
                    playNote(noteName, fretboardVolume, 500);
                    log(`Playing note: ${noteName}`);
                } catch (error) {
                    console.error('Error playing note:', error);pla
                    log(`Error playing note ${noteName}: ${error.message}`);
                }
            }
        });
    });
}

// Log initialization
log("FretFlow initialized with 4 independent fretboards");

        
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
    // Audio initialization
    document.addEventListener('click', async () => {
        try {
            await ensureAudioInitialized();
        } catch (error) {
            console.error('Failed to initialize audio on click:', error);
        }
    }, { once: true });
    
    // Start/Stop button
    UI.elements.startStopButton.addEventListener('click', () => {
        if (AppState.isPlaying) {
            stopPlayback();
        } else {
            startPlayback();
        }
    });

    // Drum set controls
    const drumSetToggleBtn = document.getElementById('drumSetToggleBtn');
    if (drumSetToggleBtn) {
        drumSetToggleBtn.addEventListener('click', () => {
            log(`Switched to drum set ${currentDrumSetIndex + 1}`);
        });
    }

    // Sound type handling
    const soundTypeSelect = document.getElementById('sound-type');
    if (soundTypeSelect) {
        soundTypeSelect.addEventListener('change', (e) => {
            const drumSetToggleBtn = document.getElementById('drumSetToggleBtn');
            if (drumSetToggleBtn) {
                drumSetToggleBtn.style.display = e.target.value === 'drums' ? 'inline-block' : 'none';
            }
            createBeats();
            onMetronomeInstrumentChange(e.target.value);
        });

        // Initial visibility setup
        const drumSetToggleBtn = document.getElementById('drumSetToggleBtn');
        if (drumSetToggleBtn) {
            drumSetToggleBtn.style.display = soundTypeSelect.value === 'drums' ? 'inline-block' : 'none';
        }
    }

    // Dark mode toggle
    let colorMode = 0;
    UI.elements.darkModeToggle.addEventListener('click', () => {
        colorMode = (colorMode + 1) % 4;
        document.body.classList.remove('dark-mode', 'dark-mode-2', 'dark-mode-3');
        UI.elements.darkModeToggle.classList.remove('active', 'active-2', 'active-3');
        
        switch(colorMode) {
            case 1:
                document.body.classList.add('dark-mode');
                UI.elements.darkModeToggle.classList.add('active');
                log('Dark mode 1 enabled');
                break;
            case 2:
                document.body.classList.add('dark-mode-2');
                UI.elements.darkModeToggle.classList.add('active-2');
                log('Dark mode 2 enabled');
                break;
            case 3:
                document.body.classList.add('dark-mode-3');
                UI.elements.darkModeToggle.classList.add('active-3');
                log('Dark mode 3 enabled');
                break;
            default:
                log('Light mode enabled');
                break;
        }
    });

    // Chords toggle
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

    // Time signature
    UI.elements.timeSignature.addEventListener('change', () => {
        createBeats();
        if (AppState.isPlaying) {
            stopPlayback();
            startPlayback();
        }
    });

    // Volume controls
    UI.elements.metronomeVolume.addEventListener('input', () => {
        const volume = parseFloat(UI.elements.metronomeVolume.value);
        log(`Metronome volume set to ${volume}`);
    });

    UI.elements.chordFretboardVolume.addEventListener('input', () => {
        log(`Chord fretboard volume set to ${UI.elements.chordFretboardVolume.value}`);
    });

    UI.elements.chordVolume.addEventListener('input', () => {
        log(`Chord volume set to ${UI.elements.chordVolume.value}`);
    });

    UI.elements.fretboardVolume.addEventListener('input', () => {
        log(`Fretboard volume set to ${UI.elements.fretboardVolume.value}`);
    });

    // Progression controls
    UI.elements.progressionSelect.addEventListener('change', () => {
        loadProgression(UI.elements.progressionSelect.value);
    });

    UI.elements.keySelect.addEventListener('change', () => {
        updateProgressionKey(UI.elements.keySelect.value);
        initializeFretFlow();
    });

    // Tuning controls
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

    // Measure changes
    UI.elements.measures.addEventListener('change', (e) => {
        if (e.target.classList.contains('root-note') || e.target.classList.contains('chord-quality')) {
            const measure = e.target.closest('.measure');
            const root = measure.querySelector('.root-note').value;
            const quality = measure.querySelector('.chord-quality').value;
            const secondKeySelect = measure.querySelector('.second-key');
            secondKeySelect.value = root;
            if (measure === UI.elements.measures.firstElementChild) {
                const tuning = TUNINGS[UI.elements.chordTuning.value];
                updateFretboardNotes(UI.elements.chordFretboard, root, scaleSelect.value, tuning);
            }
            log(`Updated chord in measure to ${root} ${quality}`);
        }
    });

    log("Event listeners set up");
}

// Initialize the application
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

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    initializeApp().catch(error => {
        console.error("Initialization failed:", error);
        updateLoadingStatus("Initialization failed");
        initializeScaleSelects();
    });
});