/**
 * Backtrack Ambient Audio Engine & Controls
 * Plays "For Fun.mp3" across /backtrack/ and its subsidiaries (/privacy, /terms, /thanks).
 * Applies pleasant room reverb on subpages, clear and direct on /backtrack/ landing.
 * Includes sleek retro/monospace mute and volume controls in the footer.
 */
(function () {
    'use strict';

    const AUDIO_SRC = '/backtrack/audio/for-fun.mp3';
    const STORAGE_KEY_PLAYING = 'backtrack_audio_playing';
    const STORAGE_KEY_MUTED = 'backtrack_audio_muted';
    const STORAGE_KEY_VOLUME = 'backtrack_audio_volume';
    const STORAGE_KEY_TIME = 'backtrack_audio_current_time';
    const STORAGE_KEY_TIMESTAMP = 'backtrack_audio_save_timestamp';

    // Determine whether the current path is a subpage (/backtrack/privacy, /terms, /thanks, etc.)
    // Note: Excludes docs (docs.ilyambr.com is on separate domain and not affected)
    const path = window.location.pathname.replace(/\/+$/, '');
    const isSubpage = path.startsWith('/backtrack/') && path !== '/backtrack';

    let audioCtx = null;
    let audioElement = null;
    let sourceNode = null;
    let dryGain = null;
    let wetGain = null;
    let lowpassNode = null;
    let convolverNode = null;
    let masterGain = null;
    let initialized = false;

    // Retrieve saved user preferences - default NOT muted, default quiet comfortable volume (22%)
    const storedMuted = localStorage.getItem(STORAGE_KEY_MUTED);
    let isMuted = storedMuted === 'true'; // false if never set

    const storedVol = localStorage.getItem(STORAGE_KEY_VOLUME);
    let savedVolume = storedVol !== null ? parseFloat(storedVol) : 0.22;
    if (isNaN(savedVolume)) {
        savedVolume = 0.22;
    }

    // Audio Element Setup
    function setupAudioElement() {
        if (audioElement) return audioElement;

        audioElement = new Audio();
        audioElement.src = AUDIO_SRC;
        audioElement.loop = true;
        audioElement.preload = 'auto';
        audioElement.crossOrigin = 'anonymous';

        // Restore playback position seamlessly across page navigation
        const savedTime = parseFloat(localStorage.getItem(STORAGE_KEY_TIME));
        const savedTimestamp = parseFloat(localStorage.getItem(STORAGE_KEY_TIMESTAMP));
        if (!isNaN(savedTime)) {
            let targetTime = savedTime;
            if (!isNaN(savedTimestamp)) {
                const elapsed = (Date.now() - savedTimestamp) / 1000;
                if (elapsed > 0 && elapsed < 30) {
                    targetTime += elapsed;
                }
            }

            // Seek as soon as metadata is ready or immediately
            if (audioElement.readyState >= 1) {
                if (audioElement.duration && targetTime > audioElement.duration) {
                    targetTime = targetTime % audioElement.duration;
                }
                audioElement.currentTime = targetTime;
            } else {
                audioElement.addEventListener('loadedmetadata', () => {
                    if (audioElement.duration && targetTime > audioElement.duration) {
                        targetTime = targetTime % audioElement.duration;
                    }
                    audioElement.currentTime = targetTime;
                }, { once: true });
            }
        }

        // Periodic state persistence
        setInterval(() => {
            if (audioElement && !audioElement.paused) {
                localStorage.setItem(STORAGE_KEY_TIME, audioElement.currentTime.toString());
                localStorage.setItem(STORAGE_KEY_TIMESTAMP, Date.now().toString());
            }
        }, 800);

        window.addEventListener('beforeunload', () => {
            if (audioElement) {
                localStorage.setItem(STORAGE_KEY_TIME, audioElement.currentTime.toString());
                localStorage.setItem(STORAGE_KEY_TIMESTAMP, Date.now().toString());
            }
        });

        window.addEventListener('pagehide', () => {
            if (audioElement) {
                localStorage.setItem(STORAGE_KEY_TIME, audioElement.currentTime.toString());
                localStorage.setItem(STORAGE_KEY_TIMESTAMP, Date.now().toString());
            }
        });

        return audioElement;
    }

    // Web Audio Graph Setup
    function setupWebAudio() {
        if (audioCtx) return;

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;

        audioCtx = new AudioContextClass();

        if (!audioElement) {
            setupAudioElement();
        }

        sourceNode = audioCtx.createMediaElementSource(audioElement);
        masterGain = audioCtx.createGain();

        // Dry Path
        dryGain = audioCtx.createGain();

        // Wet (Reverb + Gentle Lowpass) Path
        wetGain = audioCtx.createGain();
        lowpassNode = audioCtx.createBiquadFilter();
        lowpassNode.type = 'lowpass';

        convolverNode = audioCtx.createConvolver();
        if (window.createReverbImpulseResponse) {
            convolverNode.buffer = window.createReverbImpulseResponse(audioCtx, 1.8, 2.4);
        }

        /*
         * Graph routing:
         * sourceNode -> dryGain -------------> masterGain -> audioCtx.destination
         *            \-> lowpass -> convolver -> wetGain /
         */
        sourceNode.connect(dryGain);
        dryGain.connect(masterGain);

        sourceNode.connect(lowpassNode);
        lowpassNode.connect(convolverNode);
        convolverNode.connect(wetGain);
        wetGain.connect(masterGain);

        masterGain.connect(audioCtx.destination);

        applyAcousticProfile(isSubpage);
        applyVolume();
    }

    // Configure wet/dry and frequency filtering depending on whether page is main landing or subpage
    function applyAcousticProfile(distantReverbed) {
        if (!audioCtx) return;

        const now = audioCtx.currentTime;
        if (distantReverbed) {
            // Pleasant room reverb effect: not excessively far or buried, warm and atmospheric
            // 45% dry clarity kept so vocals and melody are clearly heard
            dryGain.gain.setValueAtTime(dryGain.gain.value, now);
            dryGain.gain.linearRampToValueAtTime(0.45, now + 0.1);

            // Gentle lowpass roll-off at 4200 Hz (warm rather than completely muffled)
            lowpassNode.frequency.setValueAtTime(lowpassNode.frequency.value, now);
            lowpassNode.frequency.exponentialRampToValueAtTime(4200, now + 0.1);

            // 55% wet reverb tail
            wetGain.gain.setValueAtTime(wetGain.gain.value, now);
            wetGain.gain.linearRampToValueAtTime(0.55, now + 0.1);
        } else {
            // Main /backtrack landing: crisp, full spectrum, upfront
            dryGain.gain.setValueAtTime(dryGain.gain.value, now);
            dryGain.gain.linearRampToValueAtTime(1.0, now + 0.1);

            lowpassNode.frequency.setValueAtTime(lowpassNode.frequency.value, now);
            lowpassNode.frequency.exponentialRampToValueAtTime(16000, now + 0.1);

            wetGain.gain.setValueAtTime(wetGain.gain.value, now);
            wetGain.gain.linearRampToValueAtTime(0.0, now + 0.1);
        }
    }

    function applyVolume() {
        const effectiveVol = isMuted ? 0 : savedVolume;
        if (masterGain && audioCtx) {
            masterGain.gain.setValueAtTime(effectiveVol, audioCtx.currentTime);
        } else if (audioElement) {
            audioElement.volume = effectiveVol;
        }
    }

    async function startAudio() {
        setupAudioElement();
        setupWebAudio();

        if (audioCtx && audioCtx.state === 'suspended') {
            try {
                await audioCtx.resume();
            } catch (_) {}
        }

        try {
            await audioElement.play();
            localStorage.setItem(STORAGE_KEY_PLAYING, 'true');
            updateUI();
        } catch (e) {
            // Browser autoplay policy blocked unprompted playback: resume on first user interaction anywhere
            const resumeOnGesture = async () => {
                if (audioCtx && audioCtx.state === 'suspended') {
                    try {
                        await audioCtx.resume();
                    } catch (_) {}
                }
                if (audioElement && audioElement.paused) {
                    try {
                        await audioElement.play();
                        localStorage.setItem(STORAGE_KEY_PLAYING, 'true');
                        updateUI();
                    } catch (_) {}
                }
                window.removeEventListener('click', resumeOnGesture);
                window.removeEventListener('keydown', resumeOnGesture);
                window.removeEventListener('scroll', resumeOnGesture);
            };
            window.addEventListener('click', resumeOnGesture, { once: true });
            window.addEventListener('keydown', resumeOnGesture, { once: true });
            window.addEventListener('scroll', resumeOnGesture, { once: true });
        }
    }

    function toggleMute() {
        isMuted = !isMuted;
        localStorage.setItem(STORAGE_KEY_MUTED, isMuted ? 'true' : 'false');
        applyVolume();
        updateUI();

        if (audioElement && audioElement.paused && !isMuted) {
            startAudio();
        }
    }

    function setVolume(val) {
        savedVolume = Math.max(0, Math.min(1, parseFloat(val)));
        localStorage.setItem(STORAGE_KEY_VOLUME, savedVolume.toString());
        if (savedVolume > 0 && isMuted) {
            isMuted = false;
            localStorage.setItem(STORAGE_KEY_MUTED, 'false');
        } else if (savedVolume === 0) {
            isMuted = true;
            localStorage.setItem(STORAGE_KEY_MUTED, 'true');
        }
        applyVolume();
        updateUI();

        if (audioElement && audioElement.paused && savedVolume > 0) {
            startAudio();
        }
    }

    // Construct Footer UI Widget
    function injectAudioControls() {
        const footerContent = document.querySelector('.footer-content');
        if (!footerContent) return;

        // Check if already injected
        if (document.getElementById('backtrack-audio-widget')) return;

        const widget = document.createElement('div');
        widget.id = 'backtrack-audio-widget';
        widget.className = 'backtrack-audio-widget';

        widget.innerHTML = `
            <div class="audio-track-info" title="Now Playing: For Fun">
                <span class="audio-wave-icon" aria-hidden="true">
                    <span></span><span></span><span></span><span></span>
                </span>
                <span class="audio-track-label">for fun</span>
            </div>
            <div class="audio-controls-group">
                <button type="button" class="audio-mute-btn cursor-hover" aria-label="Mute / Unmute" title="Mute / Unmute Audio">
                    <svg class="audio-icon-unmuted" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                    <svg class="audio-icon-muted" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <line x1="23" y1="9" x2="17" y2="15"></line>
                        <line x1="17" y1="9" x2="23" y2="15"></line>
                    </svg>
                </button>
                <div class="audio-slider-container">
                    <input type="range" class="audio-volume-slider cursor-hover" min="0" max="1" step="0.01" value="${savedVolume}" aria-label="Volume Slider" title="Volume">
                </div>
            </div>
        `;

        // Insert between footer brand/logo and footer links, or append nicely
        const footerLinks = footerContent.querySelector('.footer-links');
        if (footerLinks) {
            footerContent.insertBefore(widget, footerLinks);
        } else {
            footerContent.appendChild(widget);
        }

        const muteBtn = widget.querySelector('.audio-mute-btn');
        const slider = widget.querySelector('.audio-volume-slider');

        muteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMute();
        });

        slider.addEventListener('input', (e) => {
            setVolume(e.target.value);
        });

        // Trigger cursor engine to register interactive elements for magnetic snap
        if (window.cursorEngine && typeof window.cursorEngine.refreshTargets === 'function') {
            window.cursorEngine.refreshTargets();
        }

        updateUI();
    }

    function updateUI() {
        const widget = document.getElementById('backtrack-audio-widget');
        if (!widget) return;

        const isPlaying = audioElement && !audioElement.paused;
        const effectivelyAudible = isPlaying && !isMuted && savedVolume > 0;

        if (effectivelyAudible) {
            widget.classList.add('is-audible');
            widget.classList.remove('is-muted');
        } else {
            widget.classList.remove('is-audible');
            widget.classList.add('is-muted');
        }

        const slider = widget.querySelector('.audio-volume-slider');
        if (slider) {
            slider.value = isMuted ? 0 : savedVolume;
            const pct = (slider.value * 100).toFixed(0);
            slider.style.setProperty('--slider-fill', `${pct}%`);
        }

        const muteBtn = widget.querySelector('.audio-mute-btn');
        if (muteBtn) {
            muteBtn.setAttribute('aria-label', isMuted ? 'Unmute Audio' : 'Mute Audio');
        }
    }

    // Initialize
    function init() {
        if (initialized) return;
        initialized = true;

        injectAudioControls();
        startAudio();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
