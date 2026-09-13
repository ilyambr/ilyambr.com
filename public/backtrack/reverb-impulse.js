/**
 * Impulse Response Generator for Audio Reverb
 * Synthesizes a realistic decaying stereo impulse response for Web Audio ConvolverNode
 */
function createReverbImpulseResponse(audioCtx, duration = 3.2, decay = 3.5) {
    const sampleRate = audioCtx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const impulse = audioCtx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        // Exponential decay envelope
        const n = i / length;
        const envelope = Math.exp(-n * decay);
        
        // Stereo decorrelated white noise shaped by envelope
        left[i] = (Math.random() * 2 - 1) * envelope;
        right[i] = (Math.random() * 2 - 1) * envelope;
    }

    return impulse;
}

window.createReverbImpulseResponse = createReverbImpulseResponse;
