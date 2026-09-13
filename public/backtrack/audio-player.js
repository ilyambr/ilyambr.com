/**
 * Backtrack Ambient Audio Engine & Controls
 * Plays "For Fun.mp3" across /backtrack/ and its subsidiaries (/privacy, /terms, /thanks).
 * Applies far-away, reverbed room acoustics on subpages, clear and direct on /backtrack/ landing.
 * Includes sleek retro/monospace mute and volume controls in the header.
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

    // Retrieve saved user preferences
    let isMuted = localStorage.getItem(STORAGE_KEY_MUTED) === 'true';
    let savedVolume = parseFloat(localStorage.getItem(STORAGE_KEY_VOLUME));
    if (isNaN(savedVolume)) {
        savedVolume = 0.5; // default 50%
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
        if (!isNaN(savedTime) && !isNaN(savedTimestamp)) {
            const elapsed = (Date.now() - savedTimestamp) / 1000;
            // If less than 15 seconds since last page unload, pick up where it left off plus elapsed
            if (elapsed > 0 && elapsed < 15) {
                audioElement.currentTime = savedTime + elapsed;
            } else if (!isNaN(savedTime)) {
                audioElement.currentTime = savedTime;
            }
        }

        // Periodic state persistence
        setInterval(() => {
            if (audioElement && !audioElement.paused) {
                localStorage.setItem(STORAGE_KEY_TIME, audioElement.currentTime.toString());
                localStorage.setItem(STORAGE_KEY_TIMESTAMP, Date.now().toString());
            }
        }, 1000);

        window.addEventListener('beforeunload', () => {
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

        // Wet (Reverb + Distant Lowpass) Path
        wetGain = audioCtx.createGain();
        lowpassNode = audioCtx.createBiquadFilter();
        lowpassNode.type = 'lowpass';

        convolverNode = audioCtx.createConvolver();
        if (window.createReverbImpulseResponse) {
            convolverNode.buffer = window.createReverbImpulseResponse(audioCtx, 3.5, 3.0);
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
            // Far away, in-the-other-room reverb effect
            // Dry signal drastically lowered and low-passed
            dryGain.gain.setValueAtTime(dryGain.gain.value, now);
            dryGain.gain.linearRampToValueAtTime(0.08, now + 0.1);

            lowpassNode.frequency.setValueAtTime(lowpassNode.frequency.value, now);
            lowpassNode.frequency.exponentialRampToValueAtTime(1400, now + 0.1); // Muffled distant highs

            wetGain.gain.setValueAtTime(wetGain.gain.value, now);
            wetGain.gain.linearRampToValueAtTime(0.92, now + 0.1); // Rich spacious reverb
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
            await audioCtx.resume();
        }

        try {
            await audioElement.play();
            localStorage.setItem(STORAGE_KEY_PLAYING, 'true');
            updateUI();
        } catch (e) {
            // Autoplay blocked: wait for first user gesture
            const resumeOnGesture = async () => {
                if (audioCtx && audioCtx.state === 'suspended') {
                    await audioCtx.resume();
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
            };
            window.addEventListener('click', resumeOnGesture, { once: true });
            window.addEventListener('keydown', resumeOnGesture, { once: true });
        }
    }

    function toggleMute() {
        isMuted = !isMuted;
        localStorage.setItem(STORAGE_KEY_MUTED, isMuted ? 'true' : 'false');
        applyVolume();
        updateUI();

        // If audio was never started (e.g. initial page load waiting for click)
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

    // Construct Header UI Widget
    function injectAudioControls() {
        const headerNav = document.querySelector('.header-nav');
        if (!headerNav) return;

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
                <button type="button" class="audio-mute-btn no-cursor-snap" aria-label="Mute / Unmute" title="Mute / Unmute Audio">
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
                    <input type="range" class="audio-volume-slider no-cursor-snap" min="0" max="1" step="0.01" value="${savedVolume}" aria-label="Volume Slider" title="Volume">
                </div>
            </div>
        `;

        headerNav.appendChild(widget);

        const muteBtn = widget.querySelector('.audio-mute-btn');
        const slider = widget.querySelector('.audio-volume-slider');

        muteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMute();
        });

        slider.addEventListener('input', (e) => {
            setVolume(e.target.value);
        });

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
            // Update custom fill percentage
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

        // Attempt autoplay or listen for first interaction
        startAudio();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
