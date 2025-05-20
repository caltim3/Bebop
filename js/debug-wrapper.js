// debug-wrapper.js - Helper script for debugging the guitar practice app

console.log('>> Debug wrapper loaded');

// Store original console methods
const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
};

// Collect errors and warnings
window._errs = [];
window._logs = [];

// Override console methods to track messages
['log', 'error', 'warn', 'info'].forEach(method => {
    console[method] = function(...args) {
        const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : arg
        ).join(' ');
        
        if (method === 'error' || method === 'warn') {
            window._errs.push({type: method, message});
        }
        
        window._logs.push({type: method, message, timestamp: new Date().toISOString()});
        
        // Call original method
        return originalConsole[method].apply(this, args);
    };
});

// Catch unhandled errors
window.addEventListener('error', function(e) {
    const message = `${e.message} at ${e.filename}:${e.lineno}:${e.colno}`;
    window._errs.push({type: 'error', message, timestamp: new Date().toISOString()});
    window._logs.push({type: 'error', message, timestamp: new Date().toISOString()});
});

// Function to check if an object exists and has expected properties
function checkObject(name, obj, expectedProps = []) {
    if (!obj) {
        console.error(`Missing object: ${name}`);
        return false;
    }
    
    const missingProps = expectedProps.filter(prop => !(prop in obj));
    if (missingProps.length > 0) {
        console.error(`Object ${name} is missing properties: ${missingProps.join(', ')}`);
        return false;
    }
    
    console.log(`Object ${name} exists with all expected properties`);
    return true;
}

// Function to trace function calls
function traceFunction(obj, funcName, objName = '') {
    if (!obj || typeof obj[funcName] !== 'function') {
        console.error(`Function ${objName}.${funcName} not found or not a function`);
        return;
    }
    
    const original = obj[funcName];
    obj[funcName] = function(...args) {
        console.log(`>> Calling ${objName}.${funcName}(${args.map(a => JSON.stringify(a)).join(', ')})`);
        try {
            const result = original.apply(this, args);
            if (result instanceof Promise) {
                return result.then(res => {
                    console.log(`<< ${objName}.${funcName} resolved with:`, res);
                    return res;
                }).catch(err => {
                    console.error(`<< ${objName}.${funcName} rejected with:`, err);
                    throw err;
                });
            } else {
                console.log(`<< ${objName}.${funcName} returned:`, result);
                return result;
            }
        } catch (error) {
            console.error(`<< ${objName}.${funcName} threw error:`, error);
            throw error;
        }
    };
}

// Export helper functions
window.debugHelpers = {
    checkObject,
    traceFunction,
    getLogs: () => window._logs,
    getErrors: () => window._errs,
    clearLogs: () => { window._logs = []; },
    clearErrors: () => { window._errs = []; }
};

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - Debug wrapper active');
    
    // Check for critical elements
    setTimeout(() => {
        const criticalElements = [
            'chord-fretboard',
            'chord-tuning',
            'scale-display',
            'start-stop',
            'metronome-volume',
            'tempo',
            'tempo-display'
        ];
        
        criticalElements.forEach(id => {
            const element = document.getElementById(id);
            if (!element) {
                console.error(`Critical element not found: #${id}`);
            } else {
                console.log(`Found element: #${id}`);
            }
        });
    }, 500);
});

// Trace critical functions after all scripts are loaded
window.addEventListener('load', function() {
    console.log('All resources loaded - Tracing critical functions');
    
    // Wait a bit to ensure all scripts have initialized their objects
    setTimeout(() => {
        // Trace AudioEngine methods
        if (window.AudioEngine) {
            ['initialize', 'loadSounds', 'loadPianoSamples'].forEach(method => {
                traceFunction(window.AudioEngine, method, 'AudioEngine');
            });
        }
        
        // Trace UI Component methods
        if (window.UIComponents) {
            ['playNote', 'playChord', 'playMetronomeSound'].forEach(method => {
                traceFunction(window.UIComponents, method, 'UIComponents');
            });
        }
        
        // Trace EventHandlers methods
        if (window.EventHandlers) {
            ['initializeFretboard', 'updateChordProgression'].forEach(method => {
                traceFunction(window.EventHandlers, method, 'EventHandlers');
            });
        }
        
        // Trace global functions
        ['updateFretboardNotes', 'startMetronome', 'stopMetronome'].forEach(funcName => {
            if (typeof window[funcName] === 'function') {
                traceFunction(window, funcName, 'window');
            }
        });
    }, 1000);
});
