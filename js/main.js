import { AppState, updateLoadingStatus, currentDrumSetIndex, setCurrentDrumSetIndex } from './state.js';
import { UI, createBeats, updateFretboardNotes, loadProgression, initializeFretFlow, onMetronomeInstrumentChange, updateProgressionKey, addMeasure, removeMeasure, saveCurrentProgression, deleteSelectedUserSong, populateUserSongsDropdown, addFirstChordListener, updateRhythmicStyleUIVisibility } from './ui.js';
import { _toggleLoopingMode, _toggleGuideTones } from './ui.js'; // Import renamed UI interaction functions
import { AudioContextManager, ensureAudioInitializedUserInteraction } from './audio.js';
import { startPlayback, stopPlayback } from './playback.js';
import { TUNINGS, drumSoundSets, progressions } from './constants.js';
import { log, safeAddEventListener } from './utils.js';


function setupEventListeners() {
    try {
        // Critical elements needed for basic functionality
        const requiredElements = [
            'startStopButton', 'tempo', 'tempoDisplay', 'timeSignature',
            'progressionSelect', 'keySelect', 'darkModeToggle', 'chordsEnabled',
            'soundType', 'rhythmicStyleSelect', 'addMeasureButton', 'removeMeasureButton',
            'saveProgressionButton', 'deleteUserSongButton', 'loopSelectedToggle', 'guideTonesToggle',
            'tapTempo', 'chordTuning', 'reverbDial'
        ];
        
        const missingElements = requiredElements.filter(id => {
            const element = UI.elements[id];
            return !element;
        });

        if (missingElements.length > 0) {
            const specificErrorMsg = `[CRITICAL] UI elements missing: ${missingElements.join(', ')}. Check HTML IDs and UI.init(). Execution of setupEventListeners will halt.`;
            console.error(specificErrorMsg);
            alert(specificErrorMsg);
            updateLoadingStatus(specificErrorMsg, true);
            return; 
        }

        // General page interaction to initialize audio
        document.body.addEventListener('click', ensureAudioInitializedUserInteraction, { once: true });

        // Playback Controls
        UI.elements.startStopButton.addEventListener('click', () => AppState.isPlaying ? stopPlayback() : startPlayback());
        
        // Drum Set Toggle (if element exists)
        if (UI.elements.drumSetToggleBtn) {
            UI.elements.drumSetToggleBtn.addEventListener('click', () => {
                let newIndex = (currentDrumSetIndex + 1) % drumSoundSets.length;
                setCurrentDrumSetIndex(newIndex);
                UI.elements.drumSetToggleBtn.textContent = drumSoundSets[newIndex].name;
                log(`Drum set changed to: ${drumSoundSets[newIndex].name}`);
                // Potentially update beats if drum sounds change fundamentally
                // createBeats(); // Uncomment if changing drum set should reset beat accents/sounds
            });
        }

        // Metronome Sound Type
        UI.elements.soundType.addEventListener('change', (e) => {
            onMetronomeInstrumentChange(e.target.value); // Handles UI changes for drum volumes etc.
            // updateRhythmicStyleUIVisibility(); // Called within onMetronomeInstrumentChange
            // createBeats(); // Called within onMetronomeInstrumentChange
        });
        
        // Dark Mode Toggle
        let currentDarkModeIndexState = 0; // Local state for dark mode cycling
        const darkModeClasses = ['', 'dark-mode', 'dark-mode-2', 'dark-mode-3'];
        const activeToggleClasses = ['', 'active', 'active-2', 'active-3'];
        UI.elements.darkModeToggle.addEventListener('click', () => {
            currentDarkModeIndexState = (currentDarkModeIndexState + 1) % darkModeClasses.length;
            darkModeClasses.forEach(cls => { if (cls) document.body.classList.remove(cls); });
            activeToggleClasses.forEach(cls => { if (cls) UI.elements.darkModeToggle.classList.remove(cls); });
            
            if (currentDarkModeIndexState > 0) {
                document.body.classList.add(darkModeClasses[currentDarkModeIndexState]);
                UI.elements.darkModeToggle.classList.add(activeToggleClasses[currentDarkModeIndexState]);
            }
            log(`Color mode changed to: ${darkModeClasses[currentDarkModeIndexState] || 'Light Mode'}`);
        });

        // Chords Enabled Toggle
        UI.elements.chordsEnabled.addEventListener('click', () => {
            const isActive = UI.elements.chordsEnabled.classList.toggle('active');
            UI.elements.chordsEnabled.textContent = isActive ? 'Chords Enabled' : 'Chords Disabled';
            log(`Chords ${isActive ? 'enabled' : 'disabled'}`);
        });

        // Tempo Slider
        UI.elements.tempo.addEventListener('input', () => {
            AppState.tempo = parseInt(UI.elements.tempo.value);
            UI.elements.tempoDisplay.textContent = `${AppState.tempo} BPM`;
            if (AppState.isPlaying) { // If playing, restart with new tempo
                stopPlayback(); 
                startPlayback(); 
            }
        });

        // Tap Tempo Button
        UI.elements.tapTempo.addEventListener('click', () => {
            const now = Date.now();
            AppState.tapTempoTimestamps.push(now);
            if (AppState.tapTempoTimestamps.length > 4) AppState.tapTempoTimestamps.shift(); // Keep last 4 taps

            if (AppState.tapTempoTimestamps.length > 1) {
                let totalInterval = 0;
                for (let i = 1; i < AppState.tapTempoTimestamps.length; i++) {
                    totalInterval += AppState.tapTempoTimestamps[i] - AppState.tapTempoTimestamps[i-1];
                }
                const avgInterval = totalInterval / (AppState.tapTempoTimestamps.length - 1);
                if (avgInterval > 0 && avgInterval < 3000) { // Reasonable interval range
                    AppState.tempo = Math.max(40, Math.min(220, Math.round(60000 / avgInterval)));
                    UI.elements.tempo.value = AppState.tempo;
                    UI.elements.tempoDisplay.textContent = `${AppState.tempo} BPM`;
                    if (AppState.isPlaying) { stopPlayback(); startPlayback(); }
                }
            }
            // Reset timestamps if too long since last tap
            setTimeout(() => { 
                if (AppState.tapTempoTimestamps.length > 0 && (Date.now() - AppState.tapTempoTimestamps[AppState.tapTempoTimestamps.length - 1] > 3000)) {
                    AppState.tapTempoTimestamps = []; 
                }
            }, 3100);
        });

        // Time Signature Select
        UI.elements.timeSignature.addEventListener('change', () => {
            createBeats(); // Recreate beat display for new time signature
            const is44 = parseInt(UI.elements.timeSignature.value) === 4;
            // Enable/disable split measure buttons based on time signature
            document.querySelectorAll('.measure .split-measure-button').forEach(btn => {
                btn.disabled = !is44;
                btn.title = is44 ? "" : "Splitting measures only available in 4/4 time.";
                // If not 4/4 and measure was split, unsplit it (optional behavior)
                if (!is44 && btn.closest('.measure').dataset.isSplit === 'true') {
                    // toggleSplitMeasure(btn.closest('.measure')); // toggleSplitMeasure is in ui.js
                }
            });
            updateRhythmicStyleUIVisibility(); // Rhythmic styles depend on time sig
            if (AppState.isPlaying) { stopPlayback(); startPlayback(); }
        });

        // Rhythmic Style Select
        UI.elements.rhythmicStyleSelect.addEventListener('change', (e) => {
            AppState.currentRhythmicStyle = e.target.value;
            AppState.currentStylePatternBeat = 0; // Reset pattern beat index
            AppState.currentStyleBar = 0; // Reset bar count for multi-bar patterns
            createBeats(); // Recreate beats based on new style
            log(`Rhythmic style changed to: ${AppState.currentRhythmicStyle}`);
        });

        // Reverb Dial
        UI.elements.reverbDial.addEventListener('input', (e) => {
            AudioContextManager.reverbAmount = parseInt(e.target.value, 10) / 100;
            if (UI.elements.reverbDialValue) UI.elements.reverbDialValue.textContent = e.target.value;
            log(`Reverb amount set to: ${AudioContextManager.reverbAmount}`);
        });

        // Progression Loading
        UI.elements.progressionSelect.addEventListener('change', (e) => {
            loadProgression(e.target.value, null, false); // Load standard progression
            if (UI.elements.userProgressionSelect) UI.elements.userProgressionSelect.value = ""; // Deselect user song
        });

        if (UI.elements.userProgressionSelect) {
            UI.elements.userProgressionSelect.addEventListener('change', (e) => {
                if (e.target.value) { // If a user song is selected
                    const userSongs = JSON.parse(localStorage.getItem('userBebopProgressions') || '{}');
                    const selectedSongData = userSongs[e.target.value];
                    // Load user song, using its saved defaultKey or current global key as override
                    loadProgression(e.target.value, selectedSongData?.defaultKey || UI.elements.keySelect.value, true);
                    if (UI.elements.progressionSelect) UI.elements.progressionSelect.value = ""; // Deselect standard progression
                }
            });
        }

        // Global Key Select
        UI.elements.keySelect.addEventListener('change', (e) => updateProgressionKey(e.target.value));
        
        // Chord Fretboard Tuning
        if (UI.elements.chordTuning) {
            UI.elements.chordTuning.addEventListener('change', () => { 
                addFirstChordListener(); // Update main fretboard with new tuning
                initializeFretFlow(); // Reinitialize FretFlow boards with new default tuning (if they use it)
            });
        }

        // Progression Management Buttons
        safeAddEventListener(UI.elements.addMeasureButton, 'click', () => addMeasure());
        safeAddEventListener(UI.elements.removeMeasureButton, 'click', removeMeasure);
        safeAddEventListener(UI.elements.saveProgressionButton, 'click', saveCurrentProgression);
        safeAddEventListener(UI.elements.deleteUserSongButton, 'click', deleteSelectedUserSong);

        // UI Toggles
        safeAddEventListener(UI.elements.guideTonesToggle, 'click', _toggleGuideTones);
        safeAddEventListener(UI.elements.loopSelectedToggle, 'click', _toggleLoopingMode);

        // Collapsible Sections
        document.querySelectorAll('.collapsible-toggle').forEach(button => {
            button.addEventListener('click', () => {
                const contentId = button.getAttribute('aria-controls');
                const content = document.getElementById(contentId);
                if (!content) return;
                
                const isExpanded = button.getAttribute('aria-expanded') === 'true' || false;
                button.setAttribute('aria-expanded', !isExpanded);
                // Adjust display based on original display type (flex for volume stack)
                content.style.display = isExpanded ? 'none' : (contentId === 'metronome-volume-controls-stack' ? 'flex' : 'block'); 
                button.querySelector('.toggle-icon').textContent = isExpanded ? '+' : '-';
                log(`Collapsible section '${contentId}' ${isExpanded ? 'collapsed' : 'expanded'}`);
            });
        });

        // Keyboard Shortcuts
        document.addEventListener('keydown', (event) => {
            const targetTagName = event.target.tagName.toLowerCase();
            // Ignore if typing in input/select/textarea
            if (['input', 'select', 'textarea'].includes(targetTagName)) return; 
            
            let tempoChanged = false;
            switch (event.key) {
                case ' ': 
                    event.preventDefault(); 
                    UI.elements.startStopButton.click(); 
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    UI.elements.tempo.value = AppState.tempo = Math.min(220, parseInt(UI.elements.tempo.value) + 1);
                    tempoChanged = true; 
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    UI.elements.tempo.value = AppState.tempo = Math.max(40, parseInt(UI.elements.tempo.value) - 1);
                    tempoChanged = true; 
                    break;
                // Add more shortcuts if needed (e.g., for looping, guide tones)
            }
            if (tempoChanged) {
                UI.elements.tempoDisplay.textContent = `${AppState.tempo} BPM`;
                if (AppState.isPlaying) { stopPlayback(); startPlayback(); }
            }
        });
        log("Event listeners set up successfully.");

    } catch (error) {
        console.error("Error during setupEventListeners execution (outer catch):", error);
        if (error.message && error.message.startsWith("[CRITICAL]")) {
            // Already handled by alert and updateLoadingStatus
        } else {
            updateLoadingStatus("Error setting up controls. Some features may not work. Check console.", true);
        }
    }
}


async function initializeApp() {
    UI.init(); // Cache DOM elements first
    
    createBeats(); // Initial beat display
    const initialTuning = TUNINGS[UI.elements.chordTuning?.value || 'standard'] || TUNINGS.standard;
    updateFretboardNotes(UI.elements.chordFretboard, "C", "major", initialTuning); // Initial main fretboard

    onMetronomeInstrumentChange(UI.elements.soundType?.value || 'click'); // Setup metronome UI
    populateUserSongsDropdown(); // Load any saved user songs

    // Determine initial progression to load
    let initialProgressionName = "I V7"; // Default fallback
    if (UI.elements.progressionSelect && UI.elements.progressionSelect.options.length > 0) {
        const firstOptgroupOption = UI.elements.progressionSelect.querySelector('optgroup > option');
        if (firstOptgroupOption) {
            initialProgressionName = firstOptgroupOption.value;
        } else if (UI.elements.progressionSelect.options[0]) { // Fallback to very first option if no optgroups
            initialProgressionName = UI.elements.progressionSelect.options[0].value;
        }
    }
    
    // Load the initial progression
    const initialProgData = progressions[initialProgressionName] || {}; // Get data for the determined progression
    const initialKey = UI.elements.keySelect?.value || initialProgData.defaultKey || "C";
    loadProgression(initialProgressionName, initialKey, false);

    initializeFretFlow(); // Setup the FretFlow section
    setupEventListeners(); // Add all event listeners

    // Initialize Audio
    try {
        await AudioContextManager.initialize();
    } catch (e) {
        // Error already logged and alerted in AudioContextManager.initialize
        // Provide a way for user to retry initialization on interaction
        updateLoadingStatus("Audio initialization failed. Click screen to retry.", true);
        document.body.addEventListener('click', async function retryAudioInit() {
            document.body.removeEventListener('click', retryAudioInit); // Remove listener after first attempt
            updateLoadingStatus("Retrying audio initialization...", true);
            try {
                await AudioContextManager.initialize();
                updateLoadingStatus("Audio initialized!", true);
                setTimeout(() => updateLoadingStatus("", false), 1500);
            } catch (err) {
                updateLoadingStatus("Audio retry failed. Please refresh or check browser settings.", true);
                console.error("Audio retry failed:", err);
            }
        }, { once: true });
    }

    if (AppState.audioInitialized) {
        updateLoadingStatus("Application initialized.", true);
        setTimeout(() => updateLoadingStatus("", false), 1500);
    }
    log("Application initialized.");
}

// DOMContentLoaded ensures HTML is parsed before JS runs
document.addEventListener('DOMContentLoaded', () => {
    initializeApp().catch(error => {
        console.error("Application initialization failed with an unhandled error:", error);
        updateLoadingStatus("Fatal Error: App could not initialize. Check console for details.", true);
        // Potentially display a more user-friendly error message on the page itself
    });
});
