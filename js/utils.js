import { NOTES, NOTES_CHROMATIC, CHORD_INTERVALS, OCTAVES_FOR_SAMPLES, SAMPLE_NOTE_MAP } from './constants.js';

/**
 * Logs a message to the console with a prefix.
 * @param {string} message - The message to log.
 */
export function log(message) {
    console.log(`[Bebop Blueprint Debug] ${message}`);
}

export function transposeChordData(chordData, originalSongKeyRoot, targetGlobalKeyRoot) {
    const originalKeyRootIndex = NOTES_CHROMATIC.indexOf(standardizeNoteName(originalSongKeyRoot));
    const targetKeyRootIndex = NOTES_CHROMATIC.indexOf(standardizeNoteName(targetGlobalKeyRoot));
    if (originalKeyRootIndex === -1 || targetKeyRootIndex === -1) {
        console.error(`Invalid key for transposition: Original '${originalSongKeyRoot}', Target '${targetGlobalKeyRoot}'. Returning original chord.`);
        return { ...chordData };
    }
    const transpositionInterval = (targetKeyRootIndex - originalKeyRootIndex + 12) % 12;
    const originalChordRootIndex = NOTES_CHROMATIC.indexOf(standardizeNoteName(chordData.root));
    if (originalChordRootIndex === -1) {
        console.error(`Invalid original chord root for transposition: '${chordData.root}'. Returning original chord.`);
        return { ...chordData };
    }
    const transposedChordRootIndex = (originalChordRootIndex + transpositionInterval + 12) % 12;
    const transposedRoot = NOTES_CHROMATIC[transposedChordRootIndex];
    return { root: transposedRoot, quality: chordData.quality };
}  
        
export function standardizeNoteName(note) {
    if (!note || typeof note !== 'string') return '';
    let standardized = note.trim().replace('♭', 'b').replace('♯', '#');
    if (standardized === "Bbb" || standardized === "bbb") return "A";
    if (standardized === "E##" || standardized === "e##") return "Gb";
    if (standardized === "B##" || standardized === "b##") return "Db"; // C natural (B# is C, B## is C# -> Db)
    standardized = standardized.toUpperCase();
    const sharpToFlatMap = { 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb' };
    if (sharpToFlatMap[standardized]) {
        return sharpToFlatMap[standardized];
    }
    // Check if it's already a valid flat name or natural name in NOTES_CHROMATIC
    const foundNote = NOTES_CHROMATIC.find(n_chromatic => n_chromatic.toUpperCase() === standardized);
    if (foundNote) return foundNote;

    // Final check for single letter naturals (e.g. "C" from "CMaj7")
    if (NOTES_CHROMATIC.includes(note.charAt(0).toUpperCase() + note.slice(1))) {
        return note.charAt(0).toUpperCase() + note.slice(1);
    }
    return standardized; // Fallback if no match
}

export function standardizeNoteNameForSamples(note) {
    const stdNote = standardizeNoteName(note); // Ensures Db, Eb etc.
    // SAMPLE_NOTE_MAP uses lowercase 'cs', 'ds' for sharps/flats
    return SAMPLE_NOTE_MAP[stdNote] || SAMPLE_NOTE_MAP[note.toUpperCase()] || note.toLowerCase();
}

export function getStandardQuality(rawQualityInput) {
    if (!rawQualityInput || typeof rawQualityInput !== 'string') return 'maj7'; // Default or error
    let quality = rawQualityInput.toLowerCase().trim();
    
    // Handle slashes (e.g., C/G) - we only care about the chord part
    quality = quality.split('/')[0].trim();

    // Specific complex qualities first
    if (quality === 'alt' || quality === '7alt') return 'alt';
    if (quality === '7b9' || quality === 'dom7b9') return 'dom7b9';
    if (quality === '7#9' || quality === 'dom7#9') return 'dom7#9';
    if (quality === '7b5' || quality === 'dom7b5') return 'dom7b5';
    if (quality === '7sus' || quality === '7sus4' || quality === 'dom7sus') return 'dom7sus';
    if (quality === 'imaj7' || quality === 'm(maj7)' || quality === 'minmaj7' || quality === 'mmaj7') return 'imaj7';

    // More common qualities
    if (quality === 'm7b5' || quality === 'min7b5' || quality === 'ø' || quality === 'mi7b5' || quality.startsWith('m7b5')) return 'min7b5';
    if (quality === 'dim7' || quality === '°7' || (quality.startsWith('dim') && quality.includes('7'))) return 'dim7';
    if (quality === 'maj7' || quality === 'ma7' || quality === 'Δ' || quality.startsWith('maj7') || quality.startsWith('ma7')) return 'maj7';
    if (quality === '7' || quality === 'dom7' || quality === 'dom' || (quality.startsWith('7') && !quality.startsWith('7b') && !quality.startsWith('7#') && !quality.startsWith('7s'))) return 'dom7';
    if (quality === 'm7' || quality === 'min7' || quality === 'mi7' || quality.startsWith('m7') || quality.startsWith('min7')) return 'min7';
    
    if (quality === 'maj6' || quality === 'ma6' || quality === '6' || quality.startsWith('maj6') || quality.startsWith('ma6')) return 'maj6'; // Needs to be before 'maj'
    if (quality === 'm6' || quality === 'min6' || quality === 'mi6' || quality.startsWith('m6') || quality.startsWith('min6')) return 'min6'; // Needs to be before 'min'
    if (quality === '6/9' || quality.startsWith('6/9')) return 'maj6'; // Simplified to maj6 for interval fetching, specific voicings would handle 9th

    // Triads and simpler forms
    if (quality === 'maj' || quality === '') return 'maj'; // Empty string often implies major
    if (quality === 'm' || quality === 'min' || quality === 'mi') return 'min';
    if (quality === 'dim' || quality === '°') return 'dim';
    if (quality === 'aug' || quality === '+') return 'aug';
    if (quality === 'sus4' || quality === 'sus') return 'sus4';
    if (quality === 'sus2') return 'sus2';
    
    // Check if the raw input (or processed quality) is a direct key in CHORD_INTERVALS
    if (CHORD_INTERVALS[rawQualityInput]) return rawQualityInput;
    if (CHORD_INTERVALS[quality]) return quality;

    console.warn(`getStandardQuality: Unstandardized quality "${rawQualityInput}". Defaulting to 'maj7'.`);
    return 'maj7';
}


export function parseChord(chordString) {
    if (typeof chordString !== 'string' || !chordString.trim()) {
        // console.warn("parseChord: received empty or invalid chordString:", chordString);
        return null;
    }
    chordString = chordString.trim();
    // Regex to capture root note (A-G with optional # or b) and the rest as quality string
    const match = chordString.match(/^([A-G][#b]?)(.*)$/);
    if (!match) {
        // console.warn(`parseChord: could not match chordString format: "${chordString}"`);
        return null;
    }

    const root = standardizeNoteName(match[1]);
    const qualityString = match[2].trim(); // This is the raw quality string (e.g., "maj7", "m7b5", "alt")
    
    const quality = getStandardQuality(qualityString);

    return { root: root, quality: quality, originalString: chordString };
}

export function parseRomanNumeralToAbsoluteChord(romanString, key) {
    const isMinorKey = key.includes('m');
    const normalizedKeyRoot = standardizeNoteName(key.replace('m', '')); // e.g., "Cm" -> "C"
    const keyRootIndex = NOTES_CHROMATIC.indexOf(normalizedKeyRoot);

    if (keyRootIndex === -1) {
        console.error(`Invalid key for Roman numeral parsing: ${key}`);
        return { root: 'C', quality: 'maj7', originalRoman: romanString }; // Fallback
    }

    // Check if romanString is already an absolute chord (e.g. "Cmaj7", "F#7")
    // Handle cases like "Cm7/Bb" - only parse "Cm7"
    const firstChordInSplit = romanString.split('/')[0].trim();
    const absoluteChordAttempt = parseChord(firstChordInSplit);
    if (absoluteChordAttempt && absoluteChordAttempt.root && CHORD_INTERVALS[absoluteChordAttempt.quality]) {
        return { ...absoluteChordAttempt, originalRoman: romanString }; // It's already an absolute chord
    }
    
    // Proceed with Roman numeral parsing
    // Regex for Roman numerals: (optional b or #)(I-VII or i-vii)(any quality suffix)
    const romanMatch = firstChordInSplit.match(/^(b|#)?([IViv]+)(.*)$/);
    if (!romanMatch) {
        // console.warn(`Could not parse Roman numeral: ${firstChordInSplit} in key ${key}. Defaulting to I of key.`);
        return { root: normalizedKeyRoot, quality: 'maj7', originalRoman: romanString };
    }

    const accidental = romanMatch[1]; // 'b', '#', or undefined
    const numeral = romanMatch[2];    // "I", "ii", "V", etc.
    let qualitySuffix = romanMatch[3].trim(); // "maj7", "7", "m7b5", etc.

    const majorScaleIntervals = { 'I': 0, 'II': 2, 'III': 4, 'IV': 5, 'V': 7, 'VI': 9, 'VII': 11 };
    const minorScaleIntervals = { 'i': 0, 'ii': 2, 'III': 3, 'iv': 5, 'v': 7, 'VI': 8, 'VII': 10 }; // Natural minor for reference

    let degreeInterval;
    const isUpperCaseNumeral = numeral === numeral.toUpperCase();

    if (isMinorKey) {
        // In minor keys, V is often Major/Dominant, III can be Major, VI and VII can be Major or altered.
        // Default to natural minor intervals, but allow uppercase to imply major quality or dominant.
        degreeInterval = minorScaleIntervals[numeral.toLowerCase()];
        if (isUpperCaseNumeral && numeral.toLowerCase() === 'v') degreeInterval = majorScaleIntervals['V']; // V in minor is major/dominant
        if (isUpperCaseNumeral && numeral.toLowerCase() === 'iv') degreeInterval = majorScaleIntervals['IV']; // IV in minor (Dorian influence or borrowing)
        // Add more specific minor key conventions if needed (e.g. III+ for harmonic minor's augmented III)
    } else { // Major key
        degreeInterval = majorScaleIntervals[numeral.toUpperCase()];
    }
    
    if (degreeInterval === undefined) {
        console.warn(`Unknown Roman numeral base: ${numeral} in "${firstChordInSplit}". Assuming I of key.`);
        return { root: normalizedKeyRoot, quality: 'maj7', originalRoman: romanString };
    }

    let chordRootIndex = (keyRootIndex + degreeInterval) % 12;
    if (accidental === 'b') chordRootIndex = (chordRootIndex - 1 + 12) % 12;
    else if (accidental === '#') chordRootIndex = (chordRootIndex + 1) % 12;

    const chordRoot = NOTES_CHROMATIC[chordRootIndex];
    let finalQuality = getStandardQuality(qualitySuffix); // Standardize the suffix

    // If no quality suffix was provided, infer common diatonic quality
    if (!qualitySuffix) {
        if (numeral.toLowerCase() === 'v' && (isMinorKey || !qualitySuffix)) { // V or v (if suffix implies dom7)
            finalQuality = 'dom7';
        } else if (numeral.toLowerCase() === 'vii' && !isUpperCaseNumeral) { // vii in major, or ii in minor if written as viiø
            finalQuality = 'min7b5'; // vii°7 or viiø7
        } else {
            finalQuality = isUpperCaseNumeral ? 'maj7' : 'min7';
        }
    } else if (!CHORD_INTERVALS[finalQuality]) { // Suffix was there, but not fully resolved by getStandardQuality
        console.warn(`Quality suffix "${qualitySuffix}" for Roman ${firstChordInSplit} not fully resolved. Defaulting based on numeral case.`);
        finalQuality = isUpperCaseNumeral ? 'maj7' : 'min7';
    }
    
    return { root: chordRoot, quality: finalQuality, originalRoman: romanString };
}


export function getChordNotes(root, quality) {
    let intervals = CHORD_INTERVALS[quality];
    if (!intervals) {
        console.warn(`Quality "${quality}" for root "${root}" not found in CHORD_INTERVALS. Defaulting to dom7 intervals.`);
        intervals = CHORD_INTERVALS['dom7']; // Fallback
    }
    const standardizedRoot = standardizeNoteName(root);
    const rootIndex = NOTES.indexOf(standardizedRoot);
    if (rootIndex === -1) {
        console.error(`Invalid root note for getChordNotes: ${root}`);
        return [standardizedRoot]; // Return at least the root if it's valid-ish
    }
    return intervals.map(interval => NOTES[(rootIndex + interval + 12) % 12]);
}

export function suggestScaleForQuality(quality) {
    // This is a simplified mapping. More advanced logic could consider context.
    const scaleMap = {
        'maj7': 'major',
        'maj': 'major',
        'maj6': 'major',
        'maj9': 'major',
        'dom7': 'mixolydian',
        'dom9': 'mixolydian',
        'dom7b9': 'diminishedWH', // Or Phrygian Dominant, or Altered depending on context
        'dom7#9': 'altered',     // Or Lydian Dominant #9
        'alt': 'altered',
        'dom7sus': 'mixolydian', // Or Dorian if context implies ii-V suspension
        'min7': 'dorian',
        'min': 'dorian',        // Or Aeolian
        'min9': 'dorian',
        'min6': 'dorian',        // Or Melodic Minor
        'min7b5': 'locrian',     // Or Locrian #2
        'dim7': 'diminishedWH',  // Whole-Half diminished
        'imaj7': 'melodicMinor', // Or Harmonic Minor
        // Add more as needed
    };
    return scaleMap[quality] || 'major'; // Default to major if no specific suggestion
}


export function generateInversions(baseNotes) {
    const voicings = [];
    voicings.push([...baseNotes]); // Root position
    for (let i = 1; i < baseNotes.length; i++) {
        // Create inversion by moving the first 'i' notes to the end
        voicings.push([...baseNotes.slice(i), ...baseNotes.slice(0, i)]);
    }
    return voicings;
}

export function generateDrop2Voicing(rootPositionNotes) {
    // Assumes rootPositionNotes is an array of 4 pitch classes (e.g., ["C", "E", "G", "Bb"])
    // Drop 2: Take the 2nd note from the top and drop it an octave.
    // In a stack 1-2-3-4 (lowest to highest), it becomes 2(low)-1-3-4.
    // If input is ordered [R, 3, 5, 7], that's 1,2,3,4.
    // Then 2nd from top is 5th (index 2). This means this definition is different.
    // Standard Drop 2 from close voicing (R 3 5 7 from low to high): R 5 7 3 (with 3 an octave higher)
    if (rootPositionNotes.length !== 4) return null;
    // Assuming rootPositionNotes are [R, 3rd, 5th, 7th] in pitch class order
    // To get drop 2 from a close voicing like C E G Bb:
    // Close: C  E  G  Bb  (0 4 7 10)
    // Drop 2:C  G  Bb E' (0 7 10 4+12) -> becomes R, 5th, 7th, 3rd(oct up)
    // So, the notes are [rootPositionNotes[0], rootPositionNotes[2], rootPositionNotes[3], rootPositionNotes[1]]
    return [ rootPositionNotes[0], rootPositionNotes[2], rootPositionNotes[3], rootPositionNotes[1] ];
}


export function getChordVoicing(baseNotesInRootPosition, quality) {
    // This is a simplified version. For more sophisticated voicings,
    // you'd consider voice leading, instrument range, desired thickness, etc.
    let potentialVoicings = [];

    // Add simple inversions
    const simpleInversions = generateInversions(baseNotesInRootPosition);
    potentialVoicings.push(...simpleInversions);

    // If it's a 4-note chord, consider Drop 2
    if (baseNotesInRootPosition.length === 4) {
        // Randomly apply Drop 2 sometimes
        if (Math.random() < 0.25) { // 25% chance to try Drop 2
            const drop2 = generateDrop2Voicing(baseNotesInRootPosition);
            if (drop2) potentialVoicings.push(drop2);
        }
        // Maybe another common voicing like Drop 3 or spread voicings if desired
        // Example of a spread voicing (root, 7th, 3rd, 5th for some styles)
        if (Math.random() < 0.10) { // 10% chance for this specific spread
             potentialVoicings.push([ baseNotesInRootPosition[0], baseNotesInRootPosition[3], baseNotesInRootPosition[1], baseNotesInRootPosition[2] ]);
        }
    }
    
    // Pick one randomly from the generated voicings
    return potentialVoicings[Math.floor(Math.random() * potentialVoicings.length)];
}

export function getMidiNoteNumber(noteNameWithOctave) {
    if (!noteNameWithOctave) return -1000; // Arbitrary low number for invalid
    const match = noteNameWithOctave.match(/^([A-G][#bs]?)(\d)$/i);
    if (!match) {
        // console.warn("Invalid note format for MIDI conversion:", noteNameWithOctave);
        return -1000;
    }

    let [, pitchClassStd, octaveStr] = match;
    pitchClassStd = standardizeNoteName(pitchClassStd); // Ensure like "Db" not "C#" if NOTES_CHROMATIC is flat-based
    const octave = parseInt(octaveStr);
    const noteVal = NOTES_CHROMATIC.indexOf(pitchClassStd);

    if (noteVal === -1) {
        // console.warn("Pitch class not found in chromatic scale:", pitchClassStd);
        return -1000;
    }
    // MIDI C4 is 60. C0 is 12. In this system, C0 would be 0.
    // Assuming NOTES_CHROMATIC[0] ('C') at octave 0 is MIDI note 0 for internal calculation.
    // Adjust if your system maps C4 to a specific MIDI value differently.
    return (octave * 12) + noteVal; 
}


export function getBestVoicing_VoiceLed(baseNotesInRootPosition, quality,
                                 prevVoicingWithOctaves, targetOctaveRange, // e.g. [3,4]
                                 allowMoreVariationForRhythmicHit = false) {

    let candidatePCVoicings = []; // Pitch Class voicings (inversions, drop2 etc.)
    const inversions = generateInversions(baseNotesInRootPosition);
    candidatePCVoicings.push(...inversions);

    if (baseNotesInRootPosition.length === 4) {
        const drop2 = generateDrop2Voicing(baseNotesInRootPosition);
        if (drop2) candidatePCVoicings.push(drop2);
        // Could add more common jazz voicings here (e.g. "A" and "B" forms for guitar)
    }
    // Remove duplicate pitch class sets (e.g. [C,E,G] is same as [E,G,C] for this step)
    candidatePCVoicings = [...new Set(candidatePCVoicings.map(v => JSON.stringify(v.slice().sort())))].map(s => JSON.parse(s));

    let scoredVoicings = [];

    for (const pcVoicing of candidatePCVoicings) {
        // Try to realize this pitch class voicing starting in a couple of octaves
        for (let octaveStartAttempt = targetOctaveRange[0]; octaveStartAttempt <= targetOctaveRange[0] + 1; octaveStartAttempt++) {
            let currentRealizedVoicing = []; // Will hold notes with octaves e.g. ["C3", "E3", "G3"]
            
            // Sort pitch classes to build voicing upwards consistently
            let tempPcVoicingSorted = [...pcVoicing].sort((a, b) => NOTES_CHROMATIC.indexOf(standardizeNoteName(a)) - NOTES_CHROMATIC.indexOf(standardizeNoteName(b)));

            let currentOctave = octaveStartAttempt;
            // First note sets the starting octave
            currentRealizedVoicing.push(`${tempPcVoicingSorted[0]}${currentOctave}`);

            for (let i = 1; i < tempPcVoicingSorted.length; i++) {
                let noteName = tempPcVoicingSorted[i];
                let prevNoteMidi = getMidiNoteNumber(currentRealizedVoicing[i-1]);
                let currentNoteMidi = getMidiNoteNumber(`${noteName}${currentOctave}`);
                
                // Ensure current note is higher than previous note
                while (currentNoteMidi <= prevNoteMidi) {
                    currentOctave++;
                    currentNoteMidi = getMidiNoteNumber(`${noteName}${currentOctave}`);
                }
                // Check if going down an octave would still be higher and closer
                if (currentNoteMidi > prevNoteMidi + 12 && getMidiNoteNumber(`${noteName}${currentOctave-1}`) > prevNoteMidi ) {
                     currentOctave--; // Prefer tighter voicing if possible
                }
                currentRealizedVoicing.push(`${noteName}${currentOctave}`);
            }

            // Basic validation: range and sample availability
            const minMidi = getMidiNoteNumber(currentRealizedVoicing[0]);
            const maxMidi = getMidiNoteNumber(currentRealizedVoicing[currentRealizedVoicing.length - 1]);
            const minSampleOctave = OCTAVES_FOR_SAMPLES[0];
            const maxSampleOctave = OCTAVES_FOR_SAMPLES[OCTAVES_FOR_SAMPLES.length-1];

            if (maxMidi - minMidi > 36) continue; // Avoid excessively wide voicings (3 octaves)
            // Ensure all notes are within playable sample range (crude check based on highest/lowest note)
            if (maxMidi > getMidiNoteNumber(`${NOTES_CHROMATIC[11]}${maxSampleOctave}`) || minMidi < getMidiNoteNumber(`${NOTES_CHROMATIC[0]}${minSampleOctave}`)) continue;


            // Scoring based on voice leading from previousVoicingWithOctaves
            let score = 0;
            if (prevVoicingWithOctaves && prevVoicingWithOctaves.length === currentRealizedVoicing.length) {
                let totalMovement = 0;
                let commonTones = 0; // Pitch classes in common
                let heldTones = 0;   // Exact same note (pitch class + octave)

                // Sort both previous and current by MIDI pitch for consistent comparison
                const sortedPrev = [...prevVoicingWithOctaves].sort((a, b) => getMidiNoteNumber(a) - getMidiNoteNumber(b));
                const sortedCurr = [...currentRealizedVoicing].sort((a, b) => getMidiNoteNumber(a) - getMidiNoteNumber(b));

                for (let k = 0; k < sortedCurr.length; k++) {
                    const prevNoteMIDI = getMidiNoteNumber(sortedPrev[k]);
                    const currNoteMIDI = getMidiNoteNumber(sortedCurr[k]);
                    totalMovement += Math.abs(currNoteMIDI - prevNoteMIDI);
                    if (prevNoteMIDI === currNoteMIDI) heldTones++;
                    if ((prevNoteMIDI % 12) === (currNoteMIDI % 12)) commonTones++;
                }
                // Higher score is better: many held/common tones, little movement
                score = (heldTones * 25) + (commonTones * 10) - totalMovement;
            } else {
                // No previous chord or different number of voices, just some randomness
                score = Math.random() * -5; // Slight penalty to prioritize continuity if possible
            }
            scoredVoicings.push({ voicing: currentRealizedVoicing, score });
        }
    }

    if (scoredVoicings.length === 0) {
        // Fallback if no valid voicings found (should be rare)
        // Just take base notes and put them in a reasonable octave
        let fallbackOctave = targetOctaveRange[Math.floor(targetOctaveRange.length / 2)];
        if (!OCTAVES_FOR_SAMPLES.includes(fallbackOctave)) fallbackOctave = OCTAVES_FOR_SAMPLES[0];
        return baseNotesInRootPosition.map(note => `${note}${fallbackOctave}`);
    }

    scoredVoicings.sort((a, b) => b.score - a.score); // Sort by best score

    // Introduce some variability, especially for rhythmic hits
    if (allowMoreVariationForRhythmicHit && scoredVoicings.length > 1 && Math.random() < 0.60) { // 60% chance to pick 2nd best for variation
        return scoredVoicings[Math.min(1, scoredVoicings.length - 1)].voicing;
    }

    // Mostly pick the best, but occasionally the second best for variety
    if (Math.random() < 0.80 || scoredVoicings.length === 1) { // 80% chance for best
        return scoredVoicings[0].voicing;
    } else {
        return scoredVoicings[1].voicing;
    }
}

export function safeAddEventListener(element, event, handler) {
    if (element && typeof element.addEventListener === 'function') {
        element.addEventListener(event, handler);
        return true;
    }
    console.warn(`Attempted to add listener to invalid element for event '${event}':`, element);
    return false;
}