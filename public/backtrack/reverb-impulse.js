/**
 * Impulse Response Generator for Audio Reverb
 * Synthesizes a rich, normalized stereo acoustic room impulse response for Web Audio ConvolverNode
 */
function createReverbImpulseResponse(audioCtx, duration = 3.0, decay = 3.0) {
    const sampleRate = audioCtx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const impulse = audioCtx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    let maxVal = 0;
    for (let i = 0; i < length; i++) {
        const n = i / length;
        // Exponential decay envelope
        const envelope = Math.exp(-n * decay);
        
        // Stereo decorrelated white noise shaped by envelope
        const l = (Math.random() * 2 - 1) * envelope;
        const r = (Math.random() * 2 - 1) * envelope;
        left[i] = l;
        right[i] = r;

        if (Math.abs(l) > maxVal) maxVal = Math.abs(l);
        if (Math.abs(r) > maxVal) maxVal = Math.abs(r);
    }

    // Normalize impulse response to full scale
    if (maxVal > 0) {
        for (let i = 0; i < length; i++) {
            left[i] /= maxVal;
            right[i] /= maxVal;
        }
    }

    return impulse;
}

window.createReverbImpulseResponse = createReverbImpulseResponse;
