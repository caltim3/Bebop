const SCALES = {
    // Basic Scales
    // Jazz Scales
    // Symmetric Scales
    // Pentatonic Scales
    // Blues Scales
    // Additional Modern Jazz Scales
    const scaleOptions = Object.keys(SCALES).map(scale => {
    const measureScaleSelects = document.querySelectorAll('.scale-select');
    measureScaleSelects.forEach(select => {
    const scaleIntervals = SCALES[scaleName];
    // Scales
function getCompatibleScales(chord, quality) {
    return Object.keys(SCALES);
    const scaleSelect = measure.querySelector('.scale-select');
    if (!rootSelect || !qualitySelect || !scaleSelect) return;
    // Get compatible scales
    const compatibleScales = getCompatibleScales(root, quality);
    scaleSelect.innerHTML = compatibleScales
    scaleSelect.value = suggestScaleForQuality(quality);
    return Object.keys(SCALES).map(scale =>
    if (!SCALES[scale]) {
    const scaleIntervals = SCALES[scale];
            const scaleSelect = measure.querySelector('.scale-select');
            if (scaleSelect) scaleSelect.value = suggestedScale;
        const scaleSelect = measure.querySelector('.scale-select');
        if (scaleSelect) scaleSelect.value = suggestScaleForQuality(getQualityValue(quality));
    // Create scale options from all available scales
    const scaleOptionsHtml = Object.keys(SCALES).map(scale => {
        // Generate scale options from SCALES constant
        const scaleOptions = Object.entries(SCALES)
        const scaleSelect = fretboardSection.querySelector(`#fretflow-scale-${i}`);
                const selectedScale = scaleSelect.value;
        scaleSelect.addEventListener('change', updateFretboardDisplay);
            const scaleSelect = measure.querySelector('.scale-select');
            scaleSelect.value = suggestScaleForQuality(quality);