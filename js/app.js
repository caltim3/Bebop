// app.js - Extracted from index (19.2).html

// Global error handler
window.addEventListener('error', function(event) {
    console.error('Global error caught:', event.error || event.message);
    const errorInfo = {
        message: event.message,
        source: event.filename,
        lineNo: event.lineno,
        colNo: event.colno,
        error: event.error ? (event.error.stack || event.error.toString()) : 'Unknown error'
    };
    
    // Store errors for debugging
    if (!window._appErrors) window._appErrors = [];
    window._appErrors.push(errorInfo);
    
    // Show error in UI if in development mode
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `<strong>Error:</strong> ${errorInfo.message} <br>
                             <small>${errorInfo.source}:${errorInfo.lineNo}</small>
                             <button class="close-btn">×</button>`;
        document.body.appendChild(errorDiv);
        
        // Add close button functionality
        errorDiv.querySelector('.close-btn').addEventListener('click', () => {
            errorDiv.remove();
        });
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 10000);
    }
    
    // Prevent default browser error handling
    event.preventDefault();
});

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

// Make log function globally accessible
window.log = log;
window.updateLoadingStatus = updateLoadingStatus;

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Application State Management
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
    elements: {},
    
    initialize() {
        console.log("Initializing UI elements");
        // Initialize UI elements
        this.cacheElements();
        this.setupEventListeners();
        this.initializeFretboard();
        this.initializeMetronome();
    },
    
    cacheElements() {
        console.log("Caching UI elements");
        // Cache all UI elements for quick access
        this.elements = {
            chordFretboard: document.getElementById('chord-fretboard'),
            measures: document.getElementById('measures'),
            tempoDisplay: document.getElementById('tempo-display'),
            startStopButton: document.getElementById('start-stop'),
            progressionSelect: document.getElementById('progression-select'),
            chordsEnabled: document.getElementById('chordsEnabled'),
            chordVolume: document.getElementById('chord-volume'),
            metronomeVolume: document.getElementById('metronome-volume'),
            soundType: document.getElementById('sound-type'),
            accentIntensity: document.getElementById('accent-intensity'),
            timeSignature: document.getElementById('time-signature'),
            tempo: document.getElementById('tempo'),
            tapTempo: document.getElementById('tap-tempo'),
            beatsContainer: document.querySelector('.beats-container'),
            chordTuning: document.getElementById('chord-tuning'),
            scaleDisplay: document.getElementById('scale-display')
        };
        
        // Log missing elements
        Object.entries(this.elements).forEach(([key, element]) => {
            if (!element) {
                console.warn(`UI element not found: ${key}`);
            }
        });
    },
    
    initializeFretboard() {
        console.log("Initializing fretboard");
        if (this.elements.chordFretboard && typeof EventHandlers.initializeFretboard === 'function') {
            EventHandlers.initializeFretboard(this.elements.chordFretboard);
        } else {
            console.error("Cannot initialize fretboard - missing element or function");
        }
    },
    
    initializeMetronome() {
        console.log("Initializing metronome");
        if (this.elements.beatsContainer) {
            // Clear existing beats
            this.elements.beatsContainer.innerHTML = '';
            
            // Get time signature
            const timeSignature = this.elements.timeSignature ? 
                parseInt(this.elements.timeSignature.value) : 4;
            
            // Create beat elements
            for (let i = 0; i < timeSignature; i++) {
                const beat = document.createElement('div');
                beat.className = 'beat';
                beat.dataset.beat = i;
                beat.dataset.sound = i === 0 ? 'kick' : 'hihat';
                beat.dataset.baseVolume = i === 0 ? '1.0' : '0.8';
                beat.textContent = i + 1;
                this.elements.beatsContainer.appendChild(beat);
            }
            
            console.log(`Created ${timeSignature} beat elements`);
        } else {
            console.error("Cannot initialize metronome - missing beats container");
        }
    },
    
    setupEventListeners() {
        console.log("Setting up UI event listeners");
        
        // Start/Stop button
        if (this.elements.startStopButton) {
            this.elements.startStopButton.addEventListener('click', this.togglePlayback);
        }
        
        // Time signature change
        if (this.elements.timeSignature) {
            this.elements.timeSignature.addEventListener('change', () => {
                this.initializeMetronome();
                if (AppState.isPlaying) {
                    stopMetronome();
                    startMetronome();
                }
            });
        }
        
        // Tempo change
        if (this.elements.tempo) {
            this.elements.tempo.addEventListener('input', () => {
                const tempo = this.elements.tempo.value;
                if (this.elements.tempoDisplay) {
                    this.elements.tempoDisplay.textContent = `${tempo} BPM`;
                }
                if (AppState) {
                    AppState.updateState({ tempo: parseInt(tempo) });
                }
                
                // Restart metronome if it's playing to apply new tempo
                if (AppState.isPlaying) {
                    stopMetronome();
                    startMetronome();
                }
            });
        }
        
        // Tap tempo
        if (this.elements.tapTempo) {
            let lastTapTime = 0;
            let tapCount = 0;
            let tapTimes = [];
            
            this.elements.tapTempo.addEventListener('click', () => {
                const now = Date.now();
                
                if (lastTapTime && (now - lastTapTime) < 2000) {
                    tapTimes.push(now - lastTapTime);
                    tapCount++;
                    
                    // Calculate average of last 4 taps
                    if (tapTimes.length > 4) {
                        tapTimes.shift();
                    }
                    
                    const avgTime = tapTimes.reduce((sum, time) => sum + time, 0) / tapTimes.length;
                    const tempo = Math.round(60000 / avgTime);
                    
                    // Update UI
                    if (this.elements.tempo) {
                        this.elements.tempo.value = tempo;
                    }
                    if (this.elements.tempoDisplay) {
                        this.elements.tempoDisplay.textContent = `${tempo} BPM`;
                    }
                    
                    // Update state
                    if (AppState) {
                        AppState.updateState({ tempo });
                    }
                    
                    // Restart metronome if it's playing to apply new tempo
                    if (AppState.isPlaying) {
                        stopMetronome();
                        startMetronome();
                    }
                } else {
                    // Reset if more than 2 seconds since last tap
                    tapCount = 1;
                    tapTimes = [];
                }
                
                lastTapTime = now;
            });
        }
        
        // Sound type change
        if (this.elements.soundType) {
            this.elements.soundType.addEventListener('change', () => {
                const soundType = this.elements.soundType.value;
                if (typeof UIComponents.onMetronomeInstrumentChange === 'function') {
                    UIComponents.onMetronomeInstrumentChange(soundType);
                }
            });
        }
        
        // Tuning change
        if (this.elements.chordTuning && this.elements.chordFretboard) {
            this.elements.chordTuning.addEventListener('change', () => {
                const tuningValue = this.elements.chordTuning.value;
                const tuning = TUNINGS[tuningValue] || TUNINGS.standard;
                
                // Update fretboard with current scale
                if (typeof updateFretboardNotes === 'function') {
                    updateFretboardNotes(
                        this.elements.chordFretboard, 
                        'C', // Default root
                        'major', // Default scale
                        tuning
                    );
                }
            });
        }
    },
    
    togglePlayback() {
        const isPlaying = !AppState.isPlaying;
        AppState.updateState({ isPlaying });
        
        // Update UI to reflect playback state
        if (UI.elements.startStopButton) {
            UI.elements.startStopButton.textContent = isPlaying ? 'Stop' : 'Start';
        }
        
        if (isPlaying) {
            // Start playback
            startMetronome();
        } else {
            // Stop playback
            stopMetronome();
        }
    }
};

// Ensure audio is initialized
async function ensureAudioInitialized() {
    if (!AppState.audioInitialized) {
        await AudioEngine.initialize();
    }
    return AudioEngine.context;
}

// Metronome functionality
let metronomeInterval;
let nextNoteTime = 0;
let scheduledNotes = [];
let metronomeWorker = null;

function startMetronome() {
    if (metronomeInterval) {
        console.log("Metronome already running");
        return;
    }
    
    // Initialize the beats container if it's empty
    const beatsContainer = document.querySelector('.beats-container');
    if (beatsContainer && beatsContainer.children.length === 0) {
        const timeSignature = parseInt(document.getElementById('time-signature')?.value || 4);
        console.log(`Initializing beats container with ${timeSignature} beats`);
        
        for (let i = 0; i < timeSignature; i++) {
            const beat = document.createElement('div');
            beat.className = 'beat';
            beat.dataset.beat = i;
            beat.dataset.sound = i === 0 ? 'kick' : 'hihat';
            beat.dataset.baseVolume = i === 0 ? '1.0' : '0.8';
            beat.textContent = i + 1;
            beatsContainer.appendChild(beat);
        }
    }
    
    // Make sure AudioEngine is initialized
    ensureAudioInitialized().then(audioContext => {
        console.log("AudioEngine initialized, starting metronome");
        
        // Reset state
        AppState.currentBeat = 0;
        nextNoteTime = audioContext.currentTime;
        scheduledNotes = [];
        
        // Get tempo from UI or use default
        const tempoElement = document.getElementById('tempo');
        const tempo = tempoElement ? parseInt(tempoElement.value) : AppState.tempo;
        
        console.log(`Starting metronome at ${tempo} BPM`);
        const beatDuration = 60 / tempo;
        
        // Update tempo display
        const tempoDisplay = document.getElementById('tempo-display');
        if (tempoDisplay) {
            tempoDisplay.textContent = `${tempo} BPM`;
        }
        
        // Update AppState
        AppState.updateState({ tempo, isPlaying: true });
        
        // Schedule ahead time (in seconds)
        const scheduleAheadTime = 0.1;
        
        // Create a worker for timing if supported
        if (window.Worker) {
            try {
                // Create a simple worker for timing
                const workerBlob = new Blob([`
                    let timerID = null;
                    let interval = 100;
                    
                    self.onmessage = function(e) {
                        if (e.data === "start") {
                            timerID = setInterval(function() { 
                                self.postMessage("tick"); 
                            }, interval);
                        } else if (e.data === "stop") {
                            clearInterval(timerID);
                            timerID = null;
                        } else if (e.data.interval) {
                            interval = e.data.interval;
                            if (timerID) {
                                clearInterval(timerID);
                                timerID = setInterval(function() { 
                                    self.postMessage("tick"); 
                                }, interval);
                            }
                        }
                    };
                `], { type: 'application/javascript' });
                
                metronomeWorker = new Worker(URL.createObjectURL(workerBlob));
                
                metronomeWorker.onmessage = function(e) {
                    if (e.data === "tick") {
                        scheduleNotes();
                    }
                };
                
                metronomeWorker.postMessage({ interval: 25 });
                metronomeWorker.postMessage("start");
            } catch (e) {
                console.error("Error creating Web Worker:", e);
                // Fall back to setInterval
                useIntervalFallback();
            }
        } else {
            console.log("Web Workers not supported, using interval fallback");
            useIntervalFallback();
        }
        
        function useIntervalFallback() {
            metronomeInterval = setInterval(() => {
                scheduleNotes();
            }, 25); // Check every 25ms
        }
        
        function scheduleNotes() {
            // Get time signature from UI
            const timeSignature = parseInt(document.getElementById('time-signature')?.value || 4);
            
            // Schedule notes ahead
            while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
                // Schedule the current beat
                scheduleBeat(AppState.currentBeat, nextNoteTime);
                
                // Calculate next beat and measure
                const nextBeat = (AppState.currentBeat + 1) % timeSignature;
                const nextMeasure = nextBeat === 0 ? AppState.currentMeasure + 1 : AppState.currentMeasure;
                
                // Update state for next iteration
                AppState.updateState({
                    currentBeat: nextBeat,
                    currentMeasure: nextMeasure
                });
                
                // Advance time
                nextNoteTime += beatDuration;
            }
        }
        
        function scheduleBeat(beatIndex, time) {
            // Add to scheduled notes
            scheduledNotes.push({
                beat: beatIndex,
                time: time
            });
            
            // Schedule the sound
            const beatElement = document.querySelector(`.beat[data-beat="${beatIndex}"]`);
            if (!beatElement) return;
            
            const soundType = document.getElementById('sound-type')?.value || 'click';
            const metronomeVolume = parseFloat(document.getElementById('metronome-volume')?.value || 0.5);
            
            // Get the sound for this beat
            const drumSound = beatElement.dataset.sound || (beatIndex === 0 ? 'kick' : 'hihat');
            if (drumSound === 'silent') return;
            
            // Get volume for this beat
            const baseVolume = parseFloat(beatElement.dataset.baseVolume || 1.0);
            const isAccent = baseVolume >= 1.0;
            const accentBoost = parseFloat(document.getElementById('accent-intensity')?.value || 1.5);
            const finalVolume = isAccent ? Math.min(metronomeVolume * accentBoost, 1.0) : metronomeVolume;
            
            // Create oscillator for the click
            if (soundType === 'click') {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.type = 'sine';
                oscillator.frequency.value = isAccent ? 880 : 440; // Higher pitch for accent
                
                gainNode.gain.value = 0;
                gainNode.gain.setValueAtTime(0, time);
                gainNode.gain.linearRampToValueAtTime(finalVolume, time + 0.001);
                gainNode.gain.linearRampToValueAtTime(0, time + 0.1);
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.start(time);
                oscillator.stop(time + 0.1);
            } 
            // Use sample for woodblock or drums
            else {
                // Get the appropriate buffer
                let buffer;
                if (soundType === 'woodblock') {
                    buffer = AudioEngine.soundBuffers['woodblock'];
                } else {
                    // For drums, use the specific drum sound
                    buffer = AudioEngine.soundBuffers[drumSound];
                }
                
                if (buffer) {
                    const source = audioContext.createBufferSource();
                    source.buffer = buffer;
                    
                    const gainNode = audioContext.createGain();
                    gainNode.gain.value = finalVolume;
                    
                    source.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    // Add reverb for drums
                    if (soundType === 'drums' && AudioEngine.reverbNode) {
                        const reverbGain = audioContext.createGain();
                        reverbGain.gain.value = 0.1; // Subtle reverb
                        source.connect(reverbGain);
                        reverbGain.connect(AudioEngine.reverbNode);
                    }
                    
                    source.start(time);
                }
            }
            
            // Schedule UI update
            setTimeout(() => {
                updateBeatDisplay(beatIndex);
            }, (time - audioContext.currentTime) * 1000);
        }
    }).catch(error => {
        console.error("Failed to initialize AudioEngine:", error);
    });
}

function stopMetronome() {
    // Stop the worker if it exists
    if (metronomeWorker) {
        metronomeWorker.postMessage("stop");
        metronomeWorker = null;
    }
    
    // Clear the interval if it exists
    if (metronomeInterval) {
        clearInterval(metronomeInterval);
        metronomeInterval = null;
    }
    
    // Reset scheduled notes
    scheduledNotes = [];
    
    console.log("Metronome stopped");
    
    // Update AppState
    AppState.updateState({ isPlaying: false });
    
    // Reset beat display
    const beatElements = document.querySelectorAll('.beat');
    beatElements.forEach(el => {
        el.classList.remove('current');
    });
}

function updateBeatDisplay(beatIndex) {
    // Update UI to show current beat
    const beatElements = document.querySelectorAll('.beat');
    
    beatElements.forEach(el => {
        el.classList.remove('current');
        if (parseInt(el.dataset.beat) === beatIndex) {
            el.classList.add('current');
        }
    });
}

// Application initialization
async function initializeApp() {
    log('Initializing application...');
    updateLoadingStatus('Initializing audio engine...');
    
    try {
        // Initialize audio engine
        await AudioEngine.initialize();
        
        // Initialize UI
        UI.initialize();
        
        // Set up event listeners
        EventHandlers.setupEventListeners();
        
        // Application is ready
        updateLoadingStatus('Ready!');
        setTimeout(() => {
            const indicator = document.getElementById('loading-indicator');
            if (indicator) {
                indicator.style.opacity = 0;
                setTimeout(() => indicator.remove(), 500);
            }
        }, 1000);
        
        log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        updateLoadingStatus('Error initializing application');
    }
}

// Make global objects accessible
window.AppState = AppState;
window.UI = UI;
window.log = log;
window.updateLoadingStatus = updateLoadingStatus;
window.debounce = debounce;
window.ensureAudioInitialized = ensureAudioInitialized;
window.startMetronome = startMetronome;
window.stopMetronome = stopMetronome;
window.updateBeatDisplay = updateBeatDisplay;
window.initializeApp = initializeApp;

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Make sure all global objects are properly initialized
    window.AppState = AppState;
    window.UI = UI;
    window.log = log;
    window.updateLoadingStatus = updateLoadingStatus;
    window.debounce = debounce;
    window.ensureAudioInitialized = ensureAudioInitialized;
    window.startMetronome = startMetronome;
    window.stopMetronome = stopMetronome;
    window.updateBeatDisplay = updateBeatDisplay;
    window.initializeApp = initializeApp;
    
    // Initialize the application
    initializeApp().catch(error => {
        console.error("Initialization failed:", error);
        updateLoadingStatus("Initialization failed");
    });
});
