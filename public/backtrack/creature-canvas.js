/**
 * Procedural Creature Gaze Tracking Canvas Engine ("Little Guy")
 * Implements asynchronous exponential eye saccades, natural blinking, and interactive expressions.
 */

(function () {
    'use strict';

    const canvas = document.getElementById('creatureCanvas');
    const gazeCoordEl = document.getElementById('gazeCoordinates');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let dpr = window.devicePixelRatio || 1;
    let width, height;

    // Mouse Tracking State
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let trackingEnabled = true;

    // Creature Physical State
    const creature = {
        x: 0,
        y: 0,
        radius: 120,
        idlePhase: 0,
        expression: 'normal', // 'normal', 'happy', 'surprised', 'wink'
        expressionTimer: 0,
        blinkProgress: 0, // 0 = open, 1 = closed
        isBlinking: false,
        blinkDuration: 180, // ms
        lastBlinkTime: performance.now(),
        nextBlinkDelay: 3000,
        
        // Eyes definition with individual time constants (tau) for async saccades
        eyes: [
            {
                offsetX: -42,
                offsetY: -10,
                radius: 26,
                pupilRadius: 12,
                currentLookX: 0,
                currentLookY: 0,
                targetLookX: 0,
                targetLookY: 0,
                tau: 90 // ms response time constant
            },
            {
                offsetX: 42,
                offsetY: -10,
                radius: 26,
                pupilRadius: 12,
                currentLookX: 0,
                currentLookY: 0,
                targetLookX: 0,
                targetLookY: 0,
                tau: 160 // ms (slightly different for lifelike micro-delay)
            }
        ]
    };

    /**
     * Resize & Canvas Scaling
     */
    function resizeCanvas() {
        const rect = canvas.parentElement.getBoundingClientRect();
        width = rect.width;
        height = rect.height;

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.scale(dpr, dpr);

        creature.x = width / 2;
        creature.y = height / 2 + 10;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    /**
     * Pointer Move Listener
     */
    window.addEventListener('pointermove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    /**
     * Interactive Click Expressions
     */
    const expressions = ['happy', 'surprised', 'wink'];
    let exprIdx = 0;

    canvas.parentElement.addEventListener('click', () => {
        creature.expression = expressions[exprIdx % expressions.length];
        creature.expressionTimer = performance.now() + 1400;
        exprIdx++;
    });

    /**
     * Physics & Animation Loop
     */
    let lastTime = performance.now();

    function renderLoop(currentTime) {
        const deltaTime = Math.min((currentTime - lastTime), 100);
        lastTime = currentTime;

        // Update Idle floating
        creature.idlePhase += (deltaTime / 1000) * 2;
        const idleOffsetY = Math.sin(creature.idlePhase) * 6;

        // Natural Blinking Cycle
        if (currentTime - creature.lastBlinkTime > creature.nextBlinkDelay && !creature.isBlinking) {
            creature.isBlinking = true;
            creature.blinkStart = currentTime;
        }

        if (creature.isBlinking) {
            const progress = (currentTime - creature.blinkStart) / creature.blinkDuration;
            if (progress >= 1) {
                creature.isBlinking = false;
                creature.blinkProgress = 0;
                creature.lastBlinkTime = currentTime;
                creature.nextBlinkDelay = 2500 + Math.random() * 4000;
            } else {
                creature.blinkProgress = Math.sin(progress * Math.PI);
            }
        }

        // Reset temporary expressions
        if (creature.expressionTimer && currentTime > creature.expressionTimer) {
            creature.expression = 'normal';
            creature.expressionTimer = 0;
        }

        // Clear Canvas
        ctx.clearRect(0, 0, width, height);

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const bodyColor = isDark ? '#1c1f26' : '#f0f1f4';
        const strokeColor = isDark ? '#3b404d' : '#27272a';
        const eyeBgColor = isDark ? '#ffffff' : '#ffffff';
        const pupilColor = isDark ? '#121316' : '#18191b';
        const blushColor = isDark ? 'rgba(244, 114, 182, 0.25)' : 'rgba(251, 113, 133, 0.2)';

        // Draw Soft Ground Shadow
        ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.04)';
        ctx.beginPath();
        ctx.ellipse(creature.x, creature.y + creature.radius - 10, creature.radius * 0.8, 16, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw Creature Body (Cute rounded star creature)
        const creatureY = creature.y + idleOffsetY;

        ctx.save();
        ctx.translate(creature.x, creatureY);

        ctx.fillStyle = bodyColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;

        ctx.beginPath();
        const points = 5;
        const outerRadius = creature.radius;
        const innerRadius = creature.radius * 0.72;

        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else {
                const prevAngle = ((i - 1) * Math.PI) / points - Math.PI / 2;
                const prevR = (i - 1) % 2 === 0 ? outerRadius : innerRadius;
                const cx = Math.cos((prevAngle + angle) / 2) * (r * 1.05);
                const cy = Math.sin((prevAngle + angle) / 2) * (r * 1.05);
                ctx.quadraticCurveTo(cx, cy, px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cheek Blushes
        ctx.fillStyle = blushColor;
        ctx.beginPath();
        ctx.arc(-55, 12, 14, 0, Math.PI * 2);
        ctx.arc(55, 12, 14, 0, Math.PI * 2);
        ctx.fill();

        // Canvas Rect for Gaze calculations
        const canvasRect = canvas.getBoundingClientRect();

        // Draw Eyes with Asynchronous Gaze Physics
        creature.eyes.forEach((eye, index) => {
            const eyeAbsX = canvasRect.left + creature.x + eye.offsetX;
            const eyeAbsY = canvasRect.top + creatureY + eye.offsetY;

            let dx = mouseX - eyeAbsX;
            let dy = mouseY - eyeAbsY;
            const distance = Math.hypot(dx, dy);

            const maxTravel = eye.radius - eye.pupilRadius - 2;

            if (trackingEnabled && distance > 0.1) {
                const normX = dx / distance;
                const normY = dy / distance;
                const travel = Math.min(distance * 0.08, maxTravel);
                eye.targetLookX = normX * travel;
                eye.targetLookY = normY * travel;
            } else {
                eye.targetLookX = 0;
                eye.targetLookY = 0;
            }

            const expFactor = 1 - Math.exp(-deltaTime / eye.tau);
            eye.currentLookX += (eye.targetLookX - eye.currentLookX) * expFactor;
            eye.currentLookY += (eye.targetLookY - eye.currentLookY) * expFactor;

            ctx.save();
            ctx.translate(eye.offsetX, eye.offsetY);

            const isWinkingEye = creature.expression === 'wink' && index === 1;
            const isHappy = creature.expression === 'happy';

            if (isHappy) {
                ctx.strokeStyle = pupilColor;
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.arc(0, 4, eye.radius * 0.65, Math.PI * 1.15, Math.PI * 1.85);
                ctx.stroke();
            } else if (isWinkingEye || creature.blinkProgress > 0.85) {
                ctx.strokeStyle = pupilColor;
                ctx.lineWidth = 3.5;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(-eye.radius * 0.7, 0);
                ctx.lineTo(eye.radius * 0.7, 0);
                ctx.stroke();
            } else {
                ctx.fillStyle = eyeBgColor;
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 2.5;

                ctx.beginPath();
                ctx.arc(0, 0, eye.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.save();
                ctx.beginPath();
                ctx.arc(0, 0, eye.radius, 0, Math.PI * 2);
                ctx.clip();

                const pupilX = eye.currentLookX;
                const pupilY = eye.currentLookY;
                const pupilSize = creature.expression === 'surprised' ? eye.pupilRadius * 1.35 : eye.pupilRadius;

                ctx.fillStyle = pupilColor;
                ctx.beginPath();
                ctx.arc(pupilX, pupilY, pupilSize, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(pupilX - pupilSize * 0.35, pupilY - pupilSize * 0.35, pupilSize * 0.38, 0, Math.PI * 2);
                ctx.fill();

                if (creature.blinkProgress > 0) {
                    ctx.fillStyle = bodyColor;
                    const eyelidHeight = (eye.radius * 2) * creature.blinkProgress;
                    ctx.fillRect(-eye.radius, -eye.radius, eye.radius * 2, eyelidHeight);
                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(-eye.radius, -eye.radius + eyelidHeight);
                    ctx.lineTo(eye.radius, -eye.radius + eyelidHeight);
                    ctx.stroke();
                }

                ctx.restore();
            }

            ctx.restore();
        });

        // Small Cute Mouth
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();

        if (creature.expression === 'happy') {
            ctx.arc(0, 16, 12, 0.15, Math.PI - 0.15);
        } else if (creature.expression === 'surprised') {
            ctx.fillStyle = strokeColor;
            ctx.ellipse(0, 20, 6, 9, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.arc(0, 14, 8, 0.3, Math.PI - 0.3);
        }
        ctx.stroke();

        ctx.restore();

        // Update coordinate readouts for HUD
        if (gazeCoordEl) {
            const relX = Math.round(mouseX - (canvasRect.left + creature.x));
            const relY = Math.round(mouseY - (canvasRect.top + creature.y));
            gazeCoordEl.textContent = trackingEnabled ? `gaze: tracking (${relX}, ${relY})` : 'gaze: idle';
        }

        requestAnimationFrame(renderLoop);
    }

    requestAnimationFrame(renderLoop);

    // Expose engine controls
    window.creatureEngine = {
        setTracking(enabled) {
            trackingEnabled = enabled;
        }
    };
})();
