/**
 * Impulse Response Generator for Audio Reverb
 * Synthesizes an authentic acoustic room impulse response for Web Audio ConvolverNode.
 * Features discrete early reflection taps for spatial depth and a frequency-damped diffuse tail.
 */
function createReverbImpulseResponse(audioCtx, duration = 2.8, decay = 2.4) {
    const sampleRate = audioCtx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const impulse = audioCtx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    // Early reflections: define the physical room dimensions and distant localization cues
    const earlyReflections = [
        { delay: 0.014, leftGain: 0.70, rightGain: 0.25 },
        { delay: 0.026, leftGain: -0.55, rightGain: 0.60 },
        { delay: 0.042, leftGain: 0.48, rightGain: -0.45 },
        { delay: 0.062, leftGain: -0.38, rightGain: 0.40 },
        { delay: 0.086, leftGain: 0.30, rightGain: -0.32 },
        { delay: 0.112, leftGain: -0.22, rightGain: 0.25 }
    ];

    for (let k = 0; k < earlyReflections.length; k++) {
        const er = earlyReflections[k];
        const idxL = Math.floor(er.delay * sampleRate);
        const idxR = Math.floor((er.delay + 0.0025) * sampleRate);
        if (idxL < length) left[idxL] += er.leftGain;
        if (idxR < length) right[idxR] += er.rightGain;
    }

    // Dense diffuse reverberation tail with natural air/material absorption
    let filterL = 0;
    let filterR = 0;
    for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-t * decay);

        // High frequency absorption increases over the decay tail
        const damping = Math.min(0.82, 0.32 + (t / duration) * 0.48);
        const noiseL = (Math.random() * 2 - 1) * envelope;
        const noiseR = (Math.random() * 2 - 1) * envelope;

        filterL = filterL * damping + noiseL * (1 - damping);
        filterR = filterR * damping + noiseR * (1 - damping);

        left[i] += filterL;
        right[i] += filterR;
    }

    // Channel energy normalization
    let sumSqL = 0;
    let sumSqR = 0;
    for (let i = 0; i < length; i++) {
        sumSqL += left[i] * left[i];
        sumSqR += right[i] * right[i];
    }
    const normL = Math.sqrt(sumSqL) || 1;
    const normR = Math.sqrt(sumSqR) || 1;

    for (let i = 0; i < length; i++) {
        left[i] /= normL;
        right[i] /= normR;
    }

    return impulse;
}

window.createReverbImpulseResponse = createReverbImpulseResponse;
