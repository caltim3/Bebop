// Musical Constants
export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
export const ENHARMONIC_MAP = {
    'C#': 'Db', 'Db': 'Db',
    'D#': 'Eb', 'Eb': 'Eb',
    'F#': 'Gb', 'Gb': 'Gb',
    'G#': 'Ab', 'Ab': 'Ab',
    'A#': 'Bb', 'Bb': 'Bb'
};

export const FRETBOARD_FREQUENCIES = {
    'string6': [82.41, 87.31, 92.50, 98.00, 103.83, 110.00, 116.54, 123.47, 130.81, 138.59, 146.83, 155.56, 164.81],
    'string5': [110.00, 116.54, 123.47, 130.81, 138.59, 146.83, 155.56, 164.81, 174.61, 185.00, 196.00, 207.65, 220.00],
    'string4': [146.83, 155.56, 164.81, 174.61, 185.00, 196.00, 207.65, 220.00, 233.08, 246.94, 261.63, 277.18, 293.66],
    'string3': [196.00, 207.65, 220.00, 233.08, 246.94, 261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00],
    'string2': [246.94, 261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 415.30, 440.00, 466.16, 493.88],
    'string1': [329.63, 349.23, 369.99, 392.00, 415.30, 440.00, 466.16, 493.88, 523.25, 554.37, 587.33, 622.25, 659.25]
};

export const SCALES = {
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
    altered: [0, 1, 3, 4, 6, 8, 10],    // Super Locrian
    lydianDominant: [0, 2, 4, 6, 7, 9, 10],
    
    // Symmetric Scales
    diminishedWH: [0, 2, 3, 5, 6, 8, 9, 11],  // Diminished (Whole-Half)
    diminishedHW: [0, 1, 3, 4, 6, 7, 9, 10],  // Diminished (Half-Whole)
    wholeHalf: [0, 2, 4, 6, 8, 10],    // Whole Tone
    
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

export const SCALE_NAMES = Object.keys(SCALES);

export const TUNINGS = {
    standard: ['E', 'B', 'G', 'D', 'A', 'E'],  // Note the order change
    dropD: ['E', 'B', 'G', 'D', 'A', 'D'],
    openG: ['D', 'B', 'G', 'D', 'G', 'D'],
    DADGAD: ['D', 'A', 'G', 'D', 'A', 'D'],
    openE: ['E', 'B', 'E', 'Ab', 'B', 'E']
};

export const DRUM_PATTERNS = {
    '2': { kick: [1, 0], snare: [0, 1], hihat: [1, 1] },
    '3': { kick: [1, 0, 0], snare: [0, 1, 0], hihat: [1, 1, 1] },
    '4': { kick: [1, 0, 0, 0, 1, 0, 0, 0], snare: [0, 0, 1, 0, 0, 0, 1, 0], hihat: [1, 1, 1, 1, 1, 1, 1, 1] },
    '6': { kick: [1, 0, 0, 1, 0, 0], snare: [0, 0, 1, 0, 0, 1], hihat: [1, 1, 1, 1, 1, 1] },
    '7': { kick: [1, 0, 0, 1, 0, 0, 0], snare: [0, 0, 1, 0, 0, 1, 0], hihat: [1, 1, 1, 1, 1, 1, 1] },
    '8': { kick: [1, 0, 0, 0, 1, 0, 0, 0], snare: [0, 0, 1, 0, 0, 0, 1, 0], hihat: [1, 1, 1, 1, 1, 1, 1, 1] },
    '12': { kick: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0], snare: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] }
};

export const drumSoundSets = [
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

export const progressions = {
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

export const scaleDegrees = {
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



export const CHORD_QUALITY_INTERVALS = {
    'major': [0, 4, 7],
    'minor': [0, 3, 7],
    'diminished': [0, 3, 6],
    'augmented': [0, 4, 8],
    'maj7': [0, 4, 7, 11],
    'm7': [0, 3, 7, 10],
    'dom7': [0, 4, 7, 10],
    'dim7': [0, 3, 6, 9],
    'augM7': [0, 4, 8, 11],
    'maj6': [0, 4, 7, 9],
    'm6': [0, 3, 7, 9],
    'm9': [0, 3, 7, 10, 14],
    'maj9': [0, 4, 7, 11, 14],
    'sus2': [0, 2, 7],
    'sus4': [0, 5, 7],
    'V7b9': [0, 4, 7, 10, 13],
    'V7#11': [0, 4, 7, 10, 6],
    'add9': [0, 4, 7, 14],
    'lydianDom': [0, 4, 7, 10, 6],
    'm11': [0, 3, 7, 10, 14, 17]
};

export const CHORD_QUALITIES = [
    'major', 'minor', 'diminished', 'augmented',
    'maj7', 'm7', 'dom7', 'dim7', 'augM7',
    'maj6', 'm6',
    'm9', 'maj9',
    'sus2', 'sus4',
    'V7b9', 'V7#11',
    'add9',
    'lydianDom',
    'm11'
];
