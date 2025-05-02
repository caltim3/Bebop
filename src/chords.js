const progressions = {
        progressionSelect: document.getElementById('progression-select'),
    pianoSampleBuffers: {},
            await this.loadPianoSamples();
    loadPianoSamples: async function() {
        this.pianoSampleBuffers = {}; // Reset
                    this.pianoSampleBuffers[key] = audioBuffer;
function getChordFromFunction(chordFunction, key = 'C') {
    const buffer = AudioContextManager.pianoSampleBuffers[sampleName];
        const buffer = AudioContextManager.pianoSampleBuffers[sampleKey];
    if (!progressionName || !progressions[progressionName]) {
    const progression = progressions[progressionName];
            const chordSymbol = getChordFromFunction(chordFunction, selectedKey);
    const progression = progressions[selectedProgression];
        const chord = getChordFromFunction(newKey, chordFunc);