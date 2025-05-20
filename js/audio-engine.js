// audio-engine.js - Extracted from index (19.2).html

// Create a global AudioEngine object
const AudioEngine = {
    context: null,
    soundBuffers: {},
    pianoSampleBuffers: {},
    reverbNode: null,
    samplesLoaded: false,
    currentChordGain: null,

    initialize: async function() {
        try {
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
            console.log("Audio engine initialized successfully");
            return this.context;
        } catch (error) {
            console.error("Error initializing audio engine:", error);
            // Create a new context if there was an error
            if (!this.context) {
                this.context = new (window.AudioContext || window.webkitAudioContext)();
            }
            // Mark as initialized anyway so the app can continue
            AppState.updateState({ audioInitialized: true });
            return this.context;
        }
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
                console.log(`Loaded ${type} sound from ${filename}`);
            } catch (error) {
                console.warn(`Failed to load ${filename}:`, error);
                // Create synthetic sound as fallback
                this.soundBuffers[type] = await this.createDrumSound(type);
                console.log(`Using fallback synthetic sound for ${type}`);
            }
        }
        
        if (typeof updateLoadingStatus === 'function') {
            updateLoadingStatus("Drum sounds loaded");
        }
    },
    
    createDrumSound: async function(type) {
        const sampleRate = this.context.sampleRate;
        const duration = type === 'hihat' ? 0.05 : 0.2;
        const buffer = this.context.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        switch (type) {
            case 'click':
                for (let i = 0; i < data.length; i++) {
                    const t = i / sampleRate;
                    data[i] = Math.sin(2 * Math.PI * 1000 * t) * Math.exp(-t * 20);
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
                    data[i] = Math.sin(2 * Math.PI * (100 + 20 * Math.exp(-t * 40)) * t) * Math.exp(-t * 10) * 2;
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
                // Generic beep sound as ultimate fallback
                for (let i = 0; i < data.length; i++) {
                    const t = i / sampleRate;
                    data[i] = Math.sin(2 * Math.PI * 440 * t) * Math.exp(-t * 10);
                }
        }
        
        return buffer;
    },
    
    loadPianoSamples: async function() {
        // Use the global ALL_NOTES and OCTAVES arrays
        this.pianoSampleBuffers = {}; // Reset

        // Create synthetic piano samples since we don't have the actual files
        const sampleRate = this.context.sampleRate;
        
        for (const note of ALL_NOTES) {
            for (const octave of OCTAVES) {
                const fileName = getSampleFileName(note, octave); // e.g., 'ds4.wav'
                const key = `${note}${octave}`; // e.g., 'ds4'
                
                // Add velocity to the key for compatibility with playNote function
                const keyWithVelocity = `${key}v12`;
                
                try {
                    // Try to load the actual sample first
                    const response = await fetch(fileName);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
                    this.pianoSampleBuffers[key] = audioBuffer;
                    this.pianoSampleBuffers[keyWithVelocity] = audioBuffer; // Store with velocity suffix too
                    console.log(`Loaded piano sample: ${fileName}`);
                } catch (e) {
                    // Create a synthetic piano tone as fallback
                    const duration = 1.0; // 1 second
                    const buffer = this.context.createBuffer(1, sampleRate * duration, sampleRate);
                    const data = buffer.getChannelData(0);
                    
                    // Calculate frequency based on note and octave
                    const noteIndex = ALL_NOTES.indexOf(note);
                    const baseFreq = 440; // A4 = 440Hz
                    const semitoneRatio = Math.pow(2, 1/12);
                    // Calculate semitones from A4
                    const semitones = (octave - 4) * 12 + (noteIndex - ALL_NOTES.indexOf('a'));
                    const freq = baseFreq * Math.pow(semitoneRatio, semitones);
                    
                    // Generate a simple sine wave with decay
                    for (let i = 0; i < data.length; i++) {
                        const t = i / sampleRate;
                        data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 5);
                    }
                    
                    this.pianoSampleBuffers[key] = buffer;
                    this.pianoSampleBuffers[keyWithVelocity] = buffer; // Store with velocity suffix too
                    console.log(`Created synthetic piano sample for: ${key} (${freq.toFixed(2)}Hz)`);
                }
            }
        }
        
        this.samplesLoaded = true;
        console.log("Piano samples loaded/created successfully");
    },
    
    setupReverb: async function() {
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
    },
    
    // Play a note using oscillator as fallback if sample not found
    playNote: function(noteName, volume = 1.0, duration = 1000) {
        if (!this.context || !noteName) return;
        
        try {
            // Extract the pitch class and octave from the note name
            const match = noteName.match(/^([A-G][b#]?)(\d)$/);
            if (!match) {
                console.warn(`Invalid note format: ${noteName}`);
                return;
            }
            
            let [, rawNote, octaveStr] = match;
            const baseNote = standardizeNoteName(rawNote).replace('m', '');
            const mappedNote = SAMPLE_NOTE_MAP[baseNote] || baseNote.toLowerCase();
            const octave = Math.max(2, Math.min(6, parseInt(octaveStr)));
            
            // Try different formats of the sample name
            const sampleFormats = [
                `${mappedNote}${octave}v12`,  // With velocity
                `${mappedNote}${octave}`,     // Without velocity
                `${mappedNote.toLowerCase()}${octave}v12`, // Lowercase with velocity
                `${mappedNote.toLowerCase()}${octave}`     // Lowercase without velocity
            ];
            
            let buffer = null;
            for (const sampleName of sampleFormats) {
                buffer = this.pianoSampleBuffers[sampleName];
                if (buffer) {
                    console.log(`Found piano sample for ${sampleName}`);
                    break;
                }
            }
            
            if (!buffer) {
                console.warn(`No piano sample found for ${noteName}, using oscillator fallback`);
                this.playOscillatorNote(noteName, volume, duration);
                return;
            }
            
            const source = this.context.createBufferSource();
            source.buffer = buffer;
            
            const gainNode = this.context.createGain();
            gainNode.gain.value = volume;
            
            source.connect(gainNode);
            gainNode.connect(this.context.destination);
            
            // Add a bit of reverb
            if (this.reverbNode) {
                const reverbGain = this.context.createGain();
                reverbGain.gain.value = 0.1; // Subtle reverb
                source.connect(reverbGain);
                reverbGain.connect(this.reverbNode);
            }
            
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
            // Fallback to oscillator if any error occurs
            this.playOscillatorNote(noteName, volume, duration);
        }
    },
    
    // Fallback method using oscillator
    playOscillatorNote: function(noteName, volume = 1.0, duration = 1000) {
        if (!this.context) return;
        
        try {
            // Parse note name to get frequency
            const match = noteName.match(/^([A-G][b#]?)(\d)$/);
            if (!match) {
                console.warn(`Invalid note format for oscillator: ${noteName}`);
                return;
            }
            
            const [, note, octaveStr] = match;
            const octave = parseInt(octaveStr);
            
            // Calculate frequency based on note and octave
            const noteToIndex = {
                'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 
                'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 
                'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
            };
            
            const noteIndex = noteToIndex[note] || 0;
            const baseFreq = 440; // A4 = 440Hz
            const semitoneRatio = Math.pow(2, 1/12);
            // Calculate semitones from A4
            const semitones = (octave - 4) * 12 + (noteIndex - 9); // 9 is A
            const freq = baseFreq * Math.pow(semitoneRatio, semitones);
            
            // Create oscillator
            const oscillator = this.context.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.value = freq;
            
            // Create gain node for volume and envelope
            const gainNode = this.context.createGain();
            gainNode.gain.value = 0; // Start silent
            
            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);
            
            // Add a bit of reverb
            if (this.reverbNode) {
                const reverbGain = this.context.createGain();
                reverbGain.gain.value = 0.1; // Subtle reverb
                oscillator.connect(reverbGain);
                reverbGain.connect(this.reverbNode);
            }
            
            // Start oscillator
            oscillator.start();
            
            // Apply attack
            gainNode.gain.setValueAtTime(0, this.context.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.context.currentTime + 0.01);
            
            // Apply decay and sustain
            gainNode.gain.linearRampToValueAtTime(volume * 0.7, this.context.currentTime + 0.1);
            
            // Apply release
            gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + (duration / 1000));
            
            // Stop oscillator after duration
            setTimeout(() => {
                try {
                    oscillator.stop();
                } catch (e) {
                    // No-op on already stopped oscillator
                }
            }, duration);
            
            console.log(`Played oscillator note ${noteName} at ${freq.toFixed(2)}Hz`);
        } catch (error) {
            console.error('Error playing oscillator note:', error);
        }
    }
};

// Make AudioEngine globally accessible
window.AudioEngine = AudioEngine;

// For backward compatibility with the original code
window.AudioContextManager = AudioEngine;
