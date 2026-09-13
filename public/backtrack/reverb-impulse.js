/**
 * Impulse Response Generator for Audio Reverb
 * Synthesizes a lush, wide stereo acoustic room impulse response for Web Audio ConvolverNode
 */
function createReverbImpulseResponse(audioCtx, duration = 2.8, decay = 3.2) {
    const sampleRate = audioCtx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const impulse = audioCtx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        const n = i / length;
        // Exponential decay envelope
        const envelope = Math.exp(-n * decay);
        
        // Stereo decorrelated white noise shaped by envelope
        left[i] = (Math.random() * 2 - 1) * envelope;
        right[i] = (Math.random() * 2 - 1) * envelope;
    }

    return impulse;
}

window.createReverbImpulseResponse = createReverbImpulseResponse;
