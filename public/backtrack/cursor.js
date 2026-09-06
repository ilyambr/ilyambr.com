/**
 * Magnetic & Morphing Frosted Glass Cursor Engine
 * Replicating the handcrafted cubic-bezier physics and magnetic snapping from lilguy.net
 */

(function () {
    'use strict';

    // Check for coarse pointer (touch-only devices)
    const isTouchOnly = window.matchMedia('(pointer: coarse) and (hover: none)').matches;
    if (isTouchOnly) return;

    const cursor = document.querySelector('.custom-cursor');
    if (!cursor) return;

    // State Variables
    let hp = 0.0;
    let hovering = false;
    let magneticEnabled = true;

    // Start Coordinates & Dimensions
    let startTransformX = -20.0;
    let startTransformY = -20.0;
    let startWidth = 40.0;
    let startHeight = 40.0;
    let startBorderRadius = 20.0;

    // Current Interpolated Values
    let currentTransformX = -20.0;
    let currentTransformY = -20.0;
    let currentWidth = 40.0;
    let currentHeight = 40.0;
    let currentBorderRadius = 20.0;

    // Target Values
    let targetTransformX = -20.0;
    let targetTransformY = -20.0;
    let targetWidth = 40.0;
    let targetHeight = 40.0;
    let targetBorderRadius = 20.0;

    // Magnetic Physical Tug on the Hovered Element
    let elementStartTransformX = 0.0;
    let elementStartTransformY = 0.0;
    let elementCurrentTransformX = 0.0;
    let elementCurrentTransformY = 0.0;
    let elementTargetTransformX = 0.0;
    let elementTargetTransformY = 0.0;

    let prevHoveredElement = null;
    const hTickCount = 18; // 18 frames duration
    let lastCursorFrameTime = performance.now();

    /**
     * Custom Cubic-Bezier numerical solver
     * Matches cubic-bezier(0.38, 0.05, 0, 1) - snappy organic fly-in curve
     */
    function cursorEase(t) {
        if (t <= 0) return 0;
        if (t >= 1) return 1;
        let lo = 0, hi = 1, mid;
        for (let i = 0; i < 20; i++) {
            mid = (lo + hi) / 2;
            const x = 3 * 0.38 * mid * (1 - mid) * (1 - mid) + 3 * 0 * mid * mid * (1 - mid) + mid * mid * mid;
            if (x < t) lo = mid; else hi = mid;
        }
        mid = (lo + hi) / 2;
        return 3 * 0.05 * mid * (1 - mid) * (1 - mid) + 3 * 1 * mid * mid * (1 - mid) + mid * mid * mid;
    }

    // Hide initially until mouse enters window
    cursor.classList.add('cursor-hide');
    let cursorRevealed = false;

    /**
     * Animation Loop (60fps)
     */
    function updateCursor() {
        const now = performance.now();
        const deltaTime = (now - lastCursorFrameTime) / 1000;
        lastCursorFrameTime = now;

        const tickAmount = deltaTime * 60;
        hp = Math.min(1.0, hp + (tickAmount / hTickCount));
        const hpEase = cursorEase(hp);

        // Interpolate cursor dimensions and translation
        currentTransformX = startTransformX + (targetTransformX - startTransformX) * hpEase;
        currentTransformY = startTransformY + (targetTransformY - startTransformY) * hpEase;
        currentWidth = startWidth + (targetWidth - startWidth) * hpEase;
        currentHeight = startHeight + (targetHeight - startHeight) * hpEase;
        currentBorderRadius = startBorderRadius + (targetBorderRadius - startBorderRadius) * hpEase;

        cursor.style.transform = `translate(${currentTransformX}px, ${currentTransformY}px)`;
        cursor.style.width = `${currentWidth}px`;
        cursor.style.height = `${currentHeight}px`;
        cursor.style.borderRadius = `${currentBorderRadius}px`;

        // Interpolate physical magnetic pull on hovered button/element
        elementCurrentTransformX = elementStartTransformX + (elementTargetTransformX - elementStartTransformX) * hpEase;
        elementCurrentTransformY = elementStartTransformY + (elementTargetTransformY - elementStartTransformY) * hpEase;

        if (prevHoveredElement && prevHoveredElement instanceof Element) {
            if (!hovering && hp >= 1) {
                prevHoveredElement.style.transform = '';
                prevHoveredElement = null;
                elementCurrentTransformX = 0;
                elementCurrentTransformY = 0;
            } else {
                prevHoveredElement.style.transform = `translate(${elementCurrentTransformX}px, ${elementCurrentTransformY}px)`;
            }
        }

        requestAnimationFrame(updateCursor);
    }

    requestAnimationFrame(updateCursor);

    /**
     * Mouse Move Listener & Magnetic Calculation
     */
    let trailContainer = null;

    document.addEventListener('mousemove', (e) => {
        if (!cursorRevealed) {
            cursorRevealed = true;
            cursor.classList.remove('cursor-hide');
        }

        if (!trailContainer) {
            trailContainer = document.querySelector('.glitch-mouse-container');
        }

        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;

        if (!magneticEnabled) {
            targetTransformX = -20;
            targetTransformY = -20;
            targetWidth = 40;
            targetHeight = 40;
            targetBorderRadius = 20;
            elementTargetTransformX = 0;
            elementTargetTransformY = 0;
            cursor.classList.remove('cursor-morph');
            if (trailContainer) trailContainer.style.display = '';
            return;
        }

        // Find closest .cursor-hover element
        let hoveredElement = document.elementFromPoint(e.clientX, e.clientY);
        while (hoveredElement && !hoveredElement.classList.contains('cursor-hover')) {
            hoveredElement = hoveredElement.parentElement;
        }

        if (hoveredElement && hoveredElement.classList.contains('cursor-hover')) {
            if (!hovering) {
                hovering = true;
                if (trailContainer) trailContainer.style.display = 'none'; // Suppress trail when hovering

                hp = 0.0;
                startTransformX = currentTransformX;
                startTransformY = currentTransformY;
                startWidth = currentWidth;
                startHeight = currentHeight;
                startBorderRadius = currentBorderRadius;
                elementStartTransformX = elementCurrentTransformX;
                elementStartTransformY = elementCurrentTransformY;
            }

            // Reset transform if target element changed
            if (prevHoveredElement && prevHoveredElement !== hoveredElement) {
                prevHoveredElement.style.transform = '';
                elementCurrentTransformX = 0;
                elementCurrentTransformY = 0;
                elementStartTransformX = 0;
                elementStartTransformY = 0;
            }

            const rect = hoveredElement.getBoundingClientRect();
            const cursorStyle = hoveredElement.dataset.cursorStyle || 'default';
            
            // Outset padding around hovered element
            const outsetX = 6;
            const outsetY = 4;
            const outsetRect = {
                left: rect.left - outsetX,
                top: rect.top - outsetY,
                width: rect.width + outsetX * 2,
                height: rect.height + outsetY * 2
            };

            const isSquare = cursorStyle === 'square';
            const isPill = cursorStyle === 'pill';
            const isCircle = cursorStyle === 'circle';
            const isCard = cursorStyle === 'card';

            const cursorFactor = isSquare ? 0.94 : 0.90;
            const centerFactor = isSquare ? 0.06 : 0.10;
            const elemFactor = 0.07; // Magnetic pull strength on the button

            targetTransformX = ((outsetRect.left - e.clientX) * cursorFactor) + (-0.5 * outsetRect.width * centerFactor);
            targetTransformY = ((outsetRect.top - e.clientY) * cursorFactor) + (-0.5 * outsetRect.height * centerFactor);
            targetWidth = outsetRect.width;
            targetHeight = outsetRect.height;

            if (isSquare) {
                targetBorderRadius = 0;
            } else if (isPill) {
                targetBorderRadius = 999;
            } else if (isCircle) {
                targetBorderRadius = Math.max(outsetRect.width, outsetRect.height) / 2;
            } else if (isCard) {
                targetBorderRadius = 12;
            } else {
                targetBorderRadius = 8;
            }

            // Calculate magnetic pull towards pointer
            const elementCenterX = outsetRect.left + outsetRect.width / 2;
            const elementCenterY = outsetRect.top + outsetRect.height / 2;
            elementTargetTransformX = (e.clientX - elementCenterX) * elemFactor;
            elementTargetTransformY = (e.clientY - elementCenterY) * elemFactor;

            prevHoveredElement = hoveredElement;
            cursor.classList.add('cursor-morph');
        } else {
            if (hovering) {
                hovering = false;
                if (trailContainer) trailContainer.style.display = ''; // Restore trail

                hp = 0.0;
                startTransformX = currentTransformX;
                startTransformY = currentTransformY;
                startWidth = currentWidth;
                startHeight = currentHeight;
                startBorderRadius = currentBorderRadius;
                elementStartTransformX = elementCurrentTransformX;
                elementStartTransformY = elementCurrentTransformY;
            }

            // Return to default circle state
            targetTransformX = -20;
            targetTransformY = -20;
            targetWidth = 40;
            targetHeight = 40;
            targetBorderRadius = 20;
            elementTargetTransformX = 0.0;
            elementTargetTransformY = 0.0;

            cursor.classList.remove('cursor-morph');
        }
    });

    // Viewport enter / exit detection
    document.documentElement.addEventListener('mouseout', (e) => {
        if (e.relatedTarget == null) {
            cursor.classList.add('cursor-hide');
        }
    });

    document.documentElement.addEventListener('mouseover', (e) => {
        if (e.relatedTarget == null) {
            cursor.classList.remove('cursor-hide');
        }
    });

    // Expose engine controls for HUD
    window.cursorEngine = {
        setMagnetic(enabled) {
            magneticEnabled = enabled;
            if (!enabled) {
                hovering = false;
                cursor.classList.remove('cursor-morph');
            }
        },
        setBlur(px) {
            document.documentElement.style.setProperty('--cursor-blur', `${px}px`);
        }
    };
})();
