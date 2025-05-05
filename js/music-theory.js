// music-theory.js - Extracted from index (19.2).html

// Define MusicTheory object to hold all music theory related functions
const MusicTheory = {
    getNoteFromScale: function(key, scale, degree) {
        const chromaticScale = ['c', 'cs', 'd', 'ds', 'e', 'f',
                               'fs', 'g', 'gs', 'a', 'as', 'b'];
        const keyIndex = chromaticScale.indexOf(this.standardizeNoteNameForSamples(key));
        if (keyIndex === -1) return null;

        const noteIndex = (keyIndex + scale[degree]) % 12;
        return chromaticScale[noteIndex];
    },

    standardizeNoteNameForSamples: function(note) {
        note = note.toLowerCase().replace('♯', '#').replace('♭', 'b');
        if (note.length === 2 && note[1] === 'b') {
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
    },
            
    parseChord: function(chord) {
        // Handle null or undefined input
        if (!chord) {
            console.error('Invalid chord input:', chord);
            return null;
        }

        // If chord is already an object with root and quality, return it
        if (typeof chord === 'object' && chord !== null && chord.root && chord.quality) {
            return chord;
        }

        // Ensure chord is a string
        if (typeof chord !== 'string') {
            console.error('Invalid chord input:', chord);
            return null;
        }

        // Rest of your existing parseChord function...
        chord = chord.trim();

        // Handle Roman numeral functional notation
        if (/^[IiVv]+/.test(chord)) {
            return this.parseRomanNumeralChord(chord);
        }

        // Regular expression for parsing chord symbols
        const chordRegex = /^([A-G][#b]?)([mM]|min|maj|dim|aug|sus[24]|[Mm]aj7|\+|-|[Mm]7|7|6|9|11|13)?$/;
        const match = chord.match(chordRegex);

        if (!match) {
            console.warn('Could not parse chord:', chord);
            return null;
        }

        const root = match[1];
        const quality = match[2] || '';

        return {
            root: root,
            quality: quality
        };
    },

    parseRomanNumeralChord: function(chord) {
        // Roman numeral to scale degree mapping
        const romanToNumber = {
            'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7,
            'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5, 'vi': 6, 'vii': 7
        };

        // Parse the Roman numeral part
        const romanRegex = /^(b?[IiVv]+)([mM]|min|maj|dim|aug|7|6|9|11|13)?$/;
        const match = chord.match(romanRegex);

        if (!match) {
            console.warn('Could not parse Roman numeral chord:', chord);
            return null;
        }

        const roman = match[1];
        const quality = match[2] || '';
        const isMinor = roman === roman.toLowerCase();
        const hasFlatted = roman.startsWith('b');
        let scaleDegree = romanToNumber[hasFlatted ? roman.slice(1) : roman];

        if (hasFlatted) {
            scaleDegree = (scaleDegree - 1 + 7) % 7 + 1; // Flatten the scale degree
        }

        // Convert scale degree to root note based on current key
        const currentKey = this.getCurrentKey(); // You'll need to implement this function
        const rootNote = this.getNoteFromScaleDegree(scaleDegree, currentKey);

        return {
            root: rootNote,
            quality: quality || (isMinor ? 'm' : '')
        };
    },

    // Helper function to get the current key
    getCurrentKey: function() {
        // Return the current key of the application
        // This should be stored somewhere in your application state
        return 'C'; // Default to C if not specified
    },

    // Helper function to get a note from a scale degree
    getNoteFromScaleDegree: function(degree, key) {
        const majorScale = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        const keyIndex = majorScale.indexOf(key.toUpperCase().replace(/[#b]/, ''));
        const targetIndex = (keyIndex + degree - 1) % 7;
        return majorScale[targetIndex];
    },

    getChordFromFunction: function(roman, key = "C") {
        // Map Roman numerals to scale degrees
        const romanMap = {
            "I": 0, "II": 2, "III": 4, "IV": 5, "V": 7, "VI": 9, "VII": 11,
            "i": 0, "ii": 2, "iii": 4, "iv": 5, "v": 7, "vi": 9, "vii": 11,
        };
        // Extract base and quality
        const match = roman.match(/^([b#]?)([IViv]+)(.*)$/);
        if (!match) return null;
        let [, accidental, numeral, quality] = match;
        let semitone = romanMap[numeral];
        if (semitone === undefined) return null;
        if (accidental === "b") semitone -= 1;
        if (accidental === "#") semitone += 1;
        // Get root note from key
        const keyNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        let keyIndex = keyNotes.indexOf(key);
        if (keyIndex === -1) keyIndex = 0;
        let rootIndex = (keyIndex + semitone + 12) % 12;
        let root = keyNotes[rootIndex];
        // Determine chord quality
        let chordQuality = "";
        if (quality) {
            chordQuality = quality;
        } else if (numeral === numeral.toUpperCase()) {
            chordQuality = "maj";
        } else {
            chordQuality = "m";
        }
        return { root, quality: chordQuality };
    },
            
    // Helper function for flat notes
    flattenNote: function(note) {
        const sharpToFlat = {
            'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb'
        };
        return sharpToFlat[note] || note;
    },

    getQualityValue: function(quality) {
        const qualityMap = {
            '': 'maj7',           // Default to maj7
            'maj': 'maj7',        // Major triad becomes maj7
            'maj7': 'maj7',       // Keep maj7
            '7': 'dom7',         // Dominant 7
            'dom7': 'dom7',      // Dominant 7
            'm': 'min7',         // Minor triad becomes min7
            'min': 'min7',       // Minor triad becomes min7
            'm7': 'min7',        // Minor 7
            'min7': 'min7',      // Minor 7
            'dim': 'min7b5',     // Diminished becomes half-diminished
            'min7b5': 'min7b5',  // Half-diminished
            '6': '6',            // Major 6
            'm6': 'm6'          // Minor 6
        };
        return qualityMap[quality] || 'maj7';  // Default to maj7 if not found
    },
            
    suggestScaleForQuality: function(quality) {
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
    },

    getCompatibleScales: function(chord, quality) {
        return Object.keys(SCALES);
    }
};

// Make MusicTheory globally accessible
window.MusicTheory = MusicTheory;

// Expose individual functions for backward compatibility
window.standardizeNoteNameForSamples = MusicTheory.standardizeNoteNameForSamples.bind(MusicTheory);
window.parseChord = MusicTheory.parseChord.bind(MusicTheory);
window.getChordFromFunction = MusicTheory.getChordFromFunction.bind(MusicTheory);
window.flattenNote = MusicTheory.flattenNote.bind(MusicTheory);
window.getQualityValue = MusicTheory.getQualityValue.bind(MusicTheory);
window.suggestScaleForQuality = MusicTheory.suggestScaleForQuality.bind(MusicTheory);
window.getCompatibleScales = MusicTheory.getCompatibleScales.bind(MusicTheory);
