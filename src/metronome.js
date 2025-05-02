const DRUM_PATTERNS = {
    const drumSoundSets = [
    tempo: 120,
        tempoDisplay: document.getElementById('tempo-display'),
        startStopButton: document.getElementById('start-stop'),
        tempo: document.getElementById('tempo'),
        tapTempo: document.getElementById('tap-tempo'),
        accentIntensity: document.getElementById('accent-intensity')
            await this.setupReverb();
                this.soundBuffers[type] = await this.createDrumSound(type);
    createDrumSound: async function(type) {
    setupReverb: async function() {
        const currentSet = drumSoundSets[currentDrumSetIndex];
    const set = drumSoundSets[currentDrumSetIndex];
                await AudioContextManager.createDrumSound(type);
            currentDrumSetIndex = (currentDrumSetIndex + 1) % drumSoundSets.length;
            drumSetToggleBtn.textContent = drumSoundSets[currentDrumSetIndex].name;
    // Tempo controls