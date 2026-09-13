/**
 * Backtrack Ambient Audio Engine & Seamless Navigation Controls
 * Plays "For Fun.mp3" continuously across /backtrack/ and its subsidiaries (/privacy, /terms, /thanks).
 * Applies pleasant room reverb on subpages, clear and direct on /backtrack/ landing, with volume parity.
 * Includes sleek retro/monospace mute and volume controls in the footer.
 * Provides client-side PJAX navigation across /backtrack pages to eliminate playback pauses.
 */
(function () {
    'use strict';

    const AUDIO_SRC = '/backtrack/audio/for-fun.mp3';
    const STORAGE_KEY_PLAYING = 'backtrack_audio_playing';
    const STORAGE_KEY_MUTED = 'backtrack_audio_muted_v2';
    const STORAGE_KEY_VOLUME = 'backtrack_audio_volume';
    const STORAGE_KEY_TIME = 'backtrack_audio_current_time';
    const STORAGE_KEY_TIMESTAMP = 'backtrack_audio_save_timestamp';

    // Clear legacy storage key that may have been erroneously set to 'true'
    try {
        localStorage.removeItem('backtrack_audio_muted');
    } catch (_) {}

    // Determine whether a given pathname is a subpage
    function checkIsSubpage(pathname) {
        const clean = (pathname || window.location.pathname).replace(/\/+$/, '') || '/';
        return clean.startsWith('/backtrack/') && clean !== '/backtrack';
    }

    let audioCtx = null;
    let audioElement = null;
    let sourceNode = null;
    let dryFilter = null;
    let dryGain = null;
    let wetFilter = null;
    let wetGain = null;
    let convolverNode = null;
    let submixGain = null;
    let compressorNode = null;
    let masterGain = null;
    let initialized = false;

    // Retrieve saved user preferences - default NOT muted, default quiet comfortable volume (22%)
    let isMuted = false;
    try {
        const storedMuted = localStorage.getItem(STORAGE_KEY_MUTED);
        if (storedMuted !== null) {
            isMuted = storedMuted === 'true';
        }
    } catch (_) {}

    let savedVolume = 0.22;
    try {
        const storedVol = localStorage.getItem(STORAGE_KEY_VOLUME);
        if (storedVol !== null) {
            const parsed = parseFloat(storedVol);
            if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
                savedVolume = parsed;
            }
        }
    } catch (_) {}

    // Audio Element Setup
    function setupAudioElement() {
        if (audioElement) return audioElement;

        audioElement = new Audio();
        audioElement.src = AUDIO_SRC;
        audioElement.loop = true;
        audioElement.preload = 'auto';
        audioElement.crossOrigin = 'anonymous';

        // Restore playback position seamlessly across page navigation
        try {
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

                const applySeek = () => {
                    if (audioElement.duration && targetTime > audioElement.duration) {
                        targetTime = targetTime % audioElement.duration;
                    }
                    audioElement.currentTime = targetTime;
                };

                if (audioElement.readyState >= 1) {
                    applySeek();
                } else {
                    audioElement.addEventListener('loadedmetadata', applySeek, { once: true });
                }
            }
        } catch (_) {}

        // Periodic state persistence
        setInterval(() => {
            if (audioElement && !audioElement.paused) {
                try {
                    localStorage.setItem(STORAGE_KEY_TIME, audioElement.currentTime.toString());
                    localStorage.setItem(STORAGE_KEY_TIMESTAMP, Date.now().toString());
                } catch (_) {}
            }
        }, 1000);

        const saveState = () => {
            if (audioElement) {
                try {
                    localStorage.setItem(STORAGE_KEY_TIME, audioElement.currentTime.toString());
                    localStorage.setItem(STORAGE_KEY_TIMESTAMP, Date.now().toString());
                } catch (_) {}
            }
        };
        window.addEventListener('beforeunload', saveState);
        window.addEventListener('pagehide', saveState);

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

        // Dry Path (Direct Sound)
        dryFilter = audioCtx.createBiquadFilter();
        dryFilter.type = 'lowpass';
        dryGain = audioCtx.createGain();

        // Wet Path (Acoustic Reverb)
        wetFilter = audioCtx.createBiquadFilter();
        wetFilter.type = 'lowpass';
        wetGain = audioCtx.createGain();

        convolverNode = audioCtx.createConvolver();
        if (window.createReverbImpulseResponse) {
            convolverNode.buffer = window.createReverbImpulseResponse(audioCtx, 2.8, 2.4);
        }

        // Submix & Dynamics Leveler (ensures equal perceived loudness between landing and subpages)
        submixGain = audioCtx.createGain();
        compressorNode = audioCtx.createDynamicsCompressor();
        compressorNode.threshold.setValueAtTime(-14, audioCtx.currentTime);
        compressorNode.knee.setValueAtTime(10, audioCtx.currentTime);
        compressorNode.ratio.setValueAtTime(2.5, audioCtx.currentTime);
        compressorNode.attack.setValueAtTime(0.01, audioCtx.currentTime);
        compressorNode.release.setValueAtTime(0.2, audioCtx.currentTime);

        // Master Output Gain
        masterGain = audioCtx.createGain();

        /*
         * Graph routing:
         * sourceNode ────┬──> dryFilter ──> dryGain ──────────┐
         *                └──> wetFilter ──> convolver ──> wetGain ──┴──> submixGain ──> compressorNode ──> masterGain ──> destination
         */
        sourceNode.connect(dryFilter);
        dryFilter.connect(dryGain);
        dryGain.connect(submixGain);

        sourceNode.connect(wetFilter);
        wetFilter.connect(convolverNode);
        convolverNode.connect(wetGain);
        wetGain.connect(submixGain);

        submixGain.connect(compressorNode);
        compressorNode.connect(masterGain);
        masterGain.connect(audioCtx.destination);

        applyAcousticProfile(checkIsSubpage(), false);
        applyVolume();
    }

    // Configure wet/dry and frequency filtering depending on whether page is main landing or subpage
    function applyAcousticProfile(distantReverbed, smooth = false) {
        if (!audioCtx || !dryGain || !wetGain || !dryFilter || !wetFilter || !submixGain) return;

        const now = audioCtx.currentTime;
        const rampTime = smooth ? 0.35 : 0.02;

        if (distantReverbed) {
            // Far-away reverbed profile with exact loudness parity:
            // Direct sound warm and clear (lowpass 4400Hz, dryGain 0.62)
            // Spacious reverb tail (lowpass 3400Hz, wetGain 1.12)
            // Submix makeup gain 1.15 to maintain identical RMS energy
            if (smooth) {
                dryFilter.frequency.setTargetAtTime(4400, now, rampTime);
                dryGain.gain.setTargetAtTime(0.62, now, rampTime);
                wetFilter.frequency.setTargetAtTime(3400, now, rampTime);
                wetGain.gain.setTargetAtTime(1.12, now, rampTime);
                submixGain.gain.setTargetAtTime(1.15, now, rampTime);
            } else {
                dryFilter.frequency.setValueAtTime(4400, now);
                dryGain.gain.setValueAtTime(0.62, now);
                wetFilter.frequency.setValueAtTime(3400, now);
                wetGain.gain.setValueAtTime(1.12, now);
                submixGain.gain.setValueAtTime(1.15, now);
            }
        } else {
            // Main /backtrack landing: crisp, full spectrum, upfront direct sound
            if (smooth) {
                dryFilter.frequency.setTargetAtTime(20000, now, rampTime);
                dryGain.gain.setTargetAtTime(1.0, now, rampTime);
                wetFilter.frequency.setTargetAtTime(20000, now, rampTime);
                wetGain.gain.setTargetAtTime(0.0, now, rampTime);
                submixGain.gain.setTargetAtTime(1.0, now, rampTime);
            } else {
                dryFilter.frequency.setValueAtTime(20000, now);
                dryGain.gain.setValueAtTime(1.0, now);
                wetFilter.frequency.setValueAtTime(20000, now);
                wetGain.gain.setValueAtTime(0.0, now);
                submixGain.gain.setValueAtTime(1.0, now);
            }
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
            try {
                localStorage.setItem(STORAGE_KEY_PLAYING, 'true');
            } catch (_) {}
            updateUI();
        } catch (e) {
            // Browser autoplay policy blocked unprompted playback: unlock on user interaction anywhere
            const resumeOnGesture = async () => {
                if (audioCtx && audioCtx.state === 'suspended') {
                    try {
                        await audioCtx.resume();
                    } catch (_) {}
                }
                if (audioElement && audioElement.paused) {
                    try {
                        await audioElement.play();
                        try {
                            localStorage.setItem(STORAGE_KEY_PLAYING, 'true');
                        } catch (_) {}
                        updateUI();
                    } catch (_) {}
                }
                ['click', 'pointerdown', 'keydown', 'touchstart'].forEach(evt => {
                    window.removeEventListener(evt, resumeOnGesture);
                    document.removeEventListener(evt, resumeOnGesture);
                });
            };

            ['click', 'pointerdown', 'keydown', 'touchstart'].forEach(evt => {
                window.addEventListener(evt, resumeOnGesture, { once: true, passive: true });
                document.addEventListener(evt, resumeOnGesture, { once: true, passive: true });
            });
        }
    }

    function toggleMute() {
        isMuted = !isMuted;
        try {
            localStorage.setItem(STORAGE_KEY_MUTED, isMuted ? 'true' : 'false');
        } catch (_) {}
        applyVolume();
        updateUI();

        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        if (audioElement && audioElement.paused && !isMuted) {
            startAudio();
        }
    }

    function setVolume(val) {
        savedVolume = Math.max(0, Math.min(1, parseFloat(val)));
        try {
            localStorage.setItem(STORAGE_KEY_VOLUME, savedVolume.toString());
        } catch (_) {}

        if (savedVolume > 0 && isMuted) {
            isMuted = false;
            try {
                localStorage.setItem(STORAGE_KEY_MUTED, 'false');
            } catch (_) {}
        } else if (savedVolume === 0) {
            isMuted = true;
            try {
                localStorage.setItem(STORAGE_KEY_MUTED, 'true');
            } catch (_) {}
        }

        applyVolume();
        updateUI();

        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        if (audioElement && audioElement.paused && savedVolume > 0 && !isMuted) {
            startAudio();
        }
    }

    // Construct Footer UI Widget
    function injectAudioControls() {
        const footerContent = document.querySelector('.footer-content');
        if (!footerContent) return;

        // Check if already injected
        if (document.getElementById('backtrack-audio-widget')) {
            updateUI();
            return;
        }

        const widget = document.createElement('div');
        widget.id = 'backtrack-audio-widget';
        widget.className = 'backtrack-audio-widget';

        widget.innerHTML = `
            <div class="audio-track-info cursor-hover" title="Now Playing: For Fun (Click to toggle playback)" style="cursor: pointer;">
                <span class="audio-wave-icon" aria-hidden="true">
                    <span></span><span></span><span></span><span></span>
                </span>
                <span class="audio-track-label">for fun</span>
            </div>
            <div class="audio-controls-group">
                <button type="button" class="audio-mute-btn cursor-hover" aria-label="Mute Audio" title="Mute / Unmute Audio">
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

        // Insert between footer brand/logo and footer links
        const footerLinks = footerContent.querySelector('.footer-links');
        if (footerLinks) {
            footerContent.insertBefore(widget, footerLinks);
        } else {
            footerContent.appendChild(widget);
        }

        const muteBtn = widget.querySelector('.audio-mute-btn');
        const slider = widget.querySelector('.audio-volume-slider');
        const trackInfo = widget.querySelector('.audio-track-info');

        muteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMute();
        });

        slider.addEventListener('input', (e) => {
            setVolume(e.target.value);
        });

        if (trackInfo) {
            trackInfo.addEventListener('click', () => {
                if (audioElement && !audioElement.paused) {
                    audioElement.pause();
                    updateUI();
                } else {
                    if (isMuted) {
                        isMuted = false;
                        try {
                            localStorage.setItem(STORAGE_KEY_MUTED, 'false');
                        } catch (_) {}
                        applyVolume();
                    }
                    startAudio();
                }
            });
        }

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
        const isAudible = isPlaying && !isMuted && savedVolume > 0;

        // Waveform animation reflects whether sound is actively playing
        widget.classList.toggle('is-audible', isAudible);

        // Mute state reflects purely the user mute setting (NOT autoplay pause)
        const effectivelyMuted = isMuted || savedVolume === 0;
        widget.classList.toggle('is-muted', effectivelyMuted);

        const slider = widget.querySelector('.audio-volume-slider');
        if (slider) {
            const displayVol = effectivelyMuted ? 0 : savedVolume;
            slider.value = displayVol;
            const pct = (displayVol * 100).toFixed(0);
            slider.style.setProperty('--slider-fill', `${pct}%`);
        }

        const muteBtn = widget.querySelector('.audio-mute-btn');
        if (muteBtn) {
            muteBtn.setAttribute('aria-label', effectivelyMuted ? 'Unmute Audio' : 'Mute Audio');
        }
    }

    // Seamless Client-Side Navigation (PJAX) across Backtrack
    // Keeps audio playing continuously without pause when switching between pages
    async function loadPage(targetUrl, pushState = true) {
        try {
            const response = await fetch(targetUrl);
            if (!response.ok) {
                window.location.href = targetUrl;
                return;
            }

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // 1. Update Document Title
            document.title = doc.title;

            // 2. Update Header (breadcrumbs and navigation states)
            const newHeader = doc.querySelector('.site-header');
            const curHeader = document.querySelector('.site-header');
            if (newHeader && curHeader) {
                curHeader.innerHTML = newHeader.innerHTML;
            }

            // 3. Update Main Content Container
            const newMain = doc.querySelector('main');
            const curMain = document.querySelector('main');
            if (newMain && curMain) {
                curMain.className = newMain.className;
                curMain.innerHTML = newMain.innerHTML;
            }

            // 4. Update History State
            if (pushState) {
                window.history.pushState({}, '', targetUrl);
            }

            // 5. Smoothly transition acoustic space (0s pause, real-time Web Audio morphing)
            const newUrl = new URL(targetUrl, window.location.origin);
            const isSub = checkIsSubpage(newUrl.pathname);
            applyAcousticProfile(isSub, true);

            // 6. Handle Scroll Position
            if (newUrl.hash) {
                const targetEl = document.querySelector(newUrl.hash);
                if (targetEl) {
                    targetEl.scrollIntoView();
                }
            } else {
                window.scrollTo({ top: 0, behavior: 'instant' });
            }

            // 7. Refresh Cursor Targets
            if (window.cursorEngine && typeof window.cursorEngine.refreshTargets === 'function') {
                window.cursorEngine.refreshTargets();
            }

            updateUI();
        } catch (err) {
            console.error('Seamless transition fallback to full reload:', err);
            window.location.href = targetUrl;
        }
    }

    function setupSeamlessNavigation() {
        document.addEventListener('click', (e) => {
            // Find closest anchor tag
            const anchor = e.target.closest('a');
            if (!anchor) return;

            const href = anchor.getAttribute('href');
            if (!href) return;

            // Allow external links, blank targets, non-HTTP links, or modifier clicks to behave normally
            if (anchor.target === '_blank' || href.startsWith('mailto:') || href.startsWith('tel:')) return;
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

            const url = new URL(anchor.href, window.location.origin);

            // Ensure destination is on the same origin
            if (url.origin !== window.location.origin) return;

            // Check if internal Backtrack navigation
            const targetPath = url.pathname.replace(/\/+$/, '') || '/';
            const isBacktrackTarget = targetPath === '/backtrack' || targetPath.startsWith('/backtrack/');
            if (!isBacktrackTarget) return;

            // If same page hash navigation, let browser scroll naturally
            if (url.pathname === window.location.pathname && url.hash) {
                return;
            }

            e.preventDefault();

            // If navigating to the exact current URL, just scroll to top
            if (url.href === window.location.href) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            loadPage(url.href, true);
        });

        window.addEventListener('popstate', () => {
            loadPage(window.location.href, false);
        });
    }

    // Initialize
    function init() {
        if (initialized) return;
        initialized = true;

        injectAudioControls();
        setupSeamlessNavigation();
        startAudio();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

