/**
 * UI Micro-Interactions, Typography Bump, and HUD Controls
 */

(function () {
    'use strict';

    /**
     * Character Bump Effect for Headings
     */
    function initCharacterBump() {
        const headingLines = document.querySelectorAll('.hero-heading .line');

        headingLines.forEach(line => {
            const childNodes = Array.from(line.childNodes);
            line.innerHTML = '';

            childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.textContent;
                    for (let char of text) {
                        if (char === ' ') {
                            line.appendChild(document.createTextNode(' '));
                        } else {
                            const span = document.createElement('span');
                            span.className = 'char cursor-hover';
                            span.dataset.cursorStyle = 'circle';
                            span.textContent = char;
                            line.appendChild(span);
                        }
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    const el = node;
                    const text = el.textContent;
                    el.innerHTML = '';
                    for (let char of text) {
                        if (char === ' ') {
                            el.appendChild(document.createTextNode(' '));
                        } else {
                            const span = document.createElement('span');
                            span.className = 'char cursor-hover';
                            span.dataset.cursorStyle = 'circle';
                            span.textContent = char;
                            el.appendChild(span);
                        }
                    }
                    line.appendChild(el);
                }
            });
        });

        // Add bump event listeners
        document.querySelectorAll('.hero-heading .char').forEach(char => {
            char.addEventListener('mouseenter', () => {
                char.classList.add('bump');
                setTimeout(() => {
                    char.classList.remove('bump');
                }, 100);
            });
        });
    }

    initCharacterBump();

    /**
     * Theme Switcher (Dark / Light Mode)
     */
    const themeToggle = document.getElementById('themeToggle');
    let currentTheme = localStorage.getItem('lilguy_theme') || 'light';

    function setTheme(theme) {
        currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('lilguy_theme', theme);
    }

    if (currentTheme === 'dark') {
        setTheme('dark');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            setTheme(currentTheme === 'dark' ? 'light' : 'dark');
        });
    }

    /**
     * Floating Live Control Panel (HUD)
     */
    const controlPanel = document.getElementById('controlPanel');
    const panelToggle = document.getElementById('panelToggle');
    const toggleTrail = document.getElementById('toggleTrail');
    const toggleMagnet = document.getElementById('toggleMagnet');
    const toggleGaze = document.getElementById('toggleGaze');
    const toggleGlitchText = document.getElementById('toggleGlitchText');
    const trailDistance = document.getElementById('trailDistance');
    const trailDistVal = document.getElementById('trailDistVal');
    const cursorBlur = document.getElementById('cursorBlur');
    const blurVal = document.getElementById('blurVal');

    if (panelToggle) {
        panelToggle.addEventListener('click', () => {
            controlPanel.classList.toggle('minimized');
            panelToggle.textContent = controlPanel.classList.contains('minimized') ? '+' : '−';
        });
    }

    if (toggleTrail) {
        toggleTrail.addEventListener('change', (e) => {
            if (window.trailEngine) {
                window.trailEngine.setEnabled(e.target.checked);
            }
        });
    }

    if (toggleMagnet) {
        toggleMagnet.addEventListener('change', (e) => {
            if (window.cursorEngine) {
                window.cursorEngine.setMagnetic(e.target.checked);
            }
        });
    }

    if (toggleGaze) {
        toggleGaze.addEventListener('change', (e) => {
            if (window.creatureEngine) {
                window.creatureEngine.setTracking(e.target.checked);
            }
        });
    }

    if (toggleGlitchText) {
        toggleGlitchText.addEventListener('change', (e) => {
            if (window.textGlitches) {
                window.textGlitches.forEach(g => g.enabled = e.target.checked);
            }
        });
    }

    if (trailDistance && trailDistVal) {
        trailDistance.addEventListener('input', (e) => {
            const val = e.target.value;
            trailDistVal.textContent = `${val}px`;
            if (window.trailEngine) {
                window.trailEngine.setWakeDistance(parseInt(val, 10));
            }
        });
    }

    if (cursorBlur && blurVal) {
        cursorBlur.addEventListener('input', (e) => {
            const val = e.target.value;
            blurVal.textContent = `${val}px`;
            if (window.cursorEngine) {
                window.cursorEngine.setBlur(parseInt(val, 10));
            }
        });
    }
})();
