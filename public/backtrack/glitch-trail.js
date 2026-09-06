/**
 * Glitch Text & ASCII/Unicode Mouse Trail Engine
 * Replicating the retro terminal particle wake from lilguy.net
 */

(function () {
    'use strict';

    // Curated retro Unicode and ASCII character palette
    const glitchChars = [
        '█', '░', '▒', '▓', '│', '┤', '╡', '╢', '╖', '╕', '╣', '║', '╗', '╝', '╜', '╛',
        '┐', '└', '┴', '┬', '├', '─', '┼', '╞', '╟', '╚', '╔', '╩', '╦', '╠', '═', '╬',
        '╧', '╨', '╤', '╥', '╙', '╘', '╒', '╓', '╫', '╪', '┘', '┌', '■', '▲', '▼', '★',
        '✦', '✧', '◇', '◆', '□', '■', '◎', '●', '⚇', '©', '≈', '√', '∆', '§', '¥', 'ø',
        '0', '1', '•', '°', '±', '≠', '≡', '⌁', '⌂', '⌀', '⎔'
    ];

    /**
     * Glitch Mouse Trail Engine
     */
    class GlitchMouseTrail {
        constructor(options = {}) {
            this.config = {
                spawnInterval: options.spawnInterval || 12, // ms
                glyphDuration: options.glyphDuration || [150, 450], // ms
                glyphScale: options.glyphScale || [0.45, 1.25],
                glyphSpread: options.glyphSpread || 6, // px jitter
                wakeDistance: options.wakeDistance || 28, // px distance to reveal
                enabled: true
            };

            this.mouseX = 0;
            this.mouseY = 0;
            this.lastSpawn = 0;
            this.container = null;

            // Touch screen check
            if (window.matchMedia('(pointer: coarse) and (hover: none)').matches) return;

            this.init();
        }

        init() {
            this.container = document.createElement('div');
            this.container.className = 'glitch-mouse-container';
            document.body.appendChild(this.container);

            document.addEventListener('mousemove', (e) => {
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
                this.onMouseMove();
            });
        }

        random(min, max) {
            return min + Math.random() * (max - min);
        }

        randomChar() {
            return glitchChars[Math.floor(Math.random() * glitchChars.length)];
        }

        onMouseMove() {
            if (!this.config.enabled) return;
            const now = performance.now();
            if (now - this.lastSpawn < this.config.spawnInterval) return;
            this.lastSpawn = now;

            this.spawnGlyph();
        }

        spawnGlyph() {
            if (!this.container || this.container.style.display === 'none') return;

            const glyph = document.createElement('span');
            glyph.className = 'glitch-mouse-glyph';
            glyph.textContent = this.randomChar();

            const offsetX = this.random(-this.config.glyphSpread, this.config.glyphSpread);
            const offsetY = this.random(-this.config.glyphSpread, this.config.glyphSpread);
            const rotation = this.random(-180, 180);
            const scale = this.random(...this.config.glyphScale);

            const spawnX = this.mouseX + offsetX;
            const spawnY = this.mouseY + offsetY;

            glyph.style.left = `${spawnX}px`;
            glyph.style.top = `${spawnY}px`;
            glyph.style.setProperty('--rotation', `${rotation}deg`);
            glyph.style.setProperty('--scale', scale);

            this.container.appendChild(glyph);

            glyph._x = spawnX;
            glyph._y = spawnY;
            glyph._visible = false;

            // Distance-delayed reveal logic
            const checkDistance = () => {
                if (!glyph.parentNode || glyph._visible) return;
                const dx = this.mouseX - glyph._x;
                const dy = this.mouseY - glyph._y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance >= this.config.wakeDistance) {
                    glyph.style.opacity = '1';
                    glyph._visible = true;
                } else {
                    requestAnimationFrame(checkDistance);
                }
            };
            requestAnimationFrame(checkDistance);

            // Decay and removal
            const duration = this.random(...this.config.glyphDuration);
            setTimeout(() => {
                glyph.style.opacity = '0';
                setTimeout(() => {
                    if (glyph.parentNode) glyph.remove();
                }, 150);
            }, duration);
        }

        setEnabled(val) {
            this.config.enabled = val;
            if (!val && this.container) {
                this.container.innerHTML = '';
            }
        }

        setWakeDistance(dist) {
            this.config.wakeDistance = dist;
        }
    }

    /**
     * Text Glitch Effect for .glitch elements
     */
    class TextGlitchEffect {
        constructor(element) {
            this.element = element;
            this.originalText = element.textContent.trim();
            this.enabled = true;
            this.schedule();
        }

        glitch() {
            if (!this.enabled) return;
            const chars = this.originalText.split('');
            const numGlitches = Math.floor(Math.random() * 3) + 1;

            for (let i = 0; i < numGlitches; i++) {
                const idx = Math.floor(Math.random() * chars.length);
                if (chars[idx] !== ' ') {
                    chars[idx] = glitchChars[Math.floor(Math.random() * glitchChars.length)];
                }
            }

            this.element.textContent = chars.join('');

            setTimeout(() => {
                this.element.textContent = this.originalText;
            }, Math.random() * 80 + 40);
        }

        schedule() {
            const nextDelay = Math.random() * 2500 + 1000;
            setTimeout(() => {
                if (this.enabled) this.glitch();
                this.schedule();
            }, nextDelay);
        }
    }

    // Initialize trail and text effects
    window.trailEngine = new GlitchMouseTrail();
    window.textGlitches = [];

    document.querySelectorAll('.glitch').forEach(el => {
        window.textGlitches.push(new TextGlitchEffect(el));
    });
})();
