/**
 * Magnetic & Morphing Frosted Glass Cursor Engine
 * Replicating handcrafted cursor dynamics with Backtrack square theme & link snapping
 */

(function () {
    'use strict';

    // Check for coarse pointer (touch-only devices)
    const isTouchOnly = window.matchMedia('(pointer: coarse) and (hover: none)').matches;
    if (isTouchOnly) return;

    const cursor = document.querySelector('.custom-cursor');
    if (!cursor) return;

    // Automatically mark all interactive links, buttons, and inputs for magnetic snapping
    function markInteractiveElements() {
        document.querySelectorAll('a, button, input, select, textarea, [role="button"]').forEach(el => {
            if (!el.classList.contains('cursor-hover')) {
                el.classList.add('cursor-hover');
            }
            if (!el.dataset.cursorStyle) {
                el.dataset.cursorStyle = 'square';
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', markInteractiveElements);
    } else {
        markInteractiveElements();
    }

    // State Variables
    let hp = 0.0;
    let hovering = false;
    let magneticEnabled = true;

    // Start Coordinates & Dimensions (default square box: 32x32, borderRadius 0)
    let startTransformX = -16.0;
    let startTransformY = -16.0;
    let startWidth = 32.0;
    let startHeight = 32.0;
    let startBorderRadius = 0.0;

    // Current Interpolated Values
    let currentTransformX = -16.0;
    let currentTransformY = -16.0;
    let currentWidth = 32.0;
    let currentHeight = 32.0;
    let currentBorderRadius = 0.0;

    // Target Values
    let targetTransformX = -16.0;
    let targetTransformY = -16.0;
    let targetWidth = 32.0;
    let targetHeight = 32.0;
    let targetBorderRadius = 0.0;

    // Magnetic Physical Tug on the Hovered Element
    let elementStartTransformX = 0.0;
    let elementStartTransformY = 0.0;
    let elementCurrentTransformX = 0.0;
    let elementCurrentTransformY = 0.0;
    let elementTargetTransformX = 0.0;
    let elementTargetTransformY = 0.0;

    let prevHoveredElement = null;
    const hTickCount = 16;
    let lastCursorFrameTime = performance.now();

    /**
     * Custom Cubic-Bezier numerical solver: cubic-bezier(0.38, 0.05, 0, 1)
     */
    function cursorEase(t) {
        if (t <= 0) return 0;
        if (t >= 1) return 1;

        let low = 0;
        let high = 1;
        let mid = t;

        for (let i = 0; i < 8; i++) {
            const currentT = 3 * (1 - mid) * (1 - mid) * mid * 0.38 + 3 * (1 - mid) * mid * mid * 0 + mid * mid * mid;
            if (Math.abs(currentT - t) < 0.001) break;
            if (currentT < t) low = mid;
            else high = mid;
            mid = (low + high) / 2;
        }

        const u = mid;
        return 3 * (1 - u) * (1 - u) * u * 0.05 + 3 * (1 - u) * u * u * 1.0 + u * u * u;
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

        currentTransformX = startTransformX + (targetTransformX - startTransformX) * hpEase;
        currentTransformY = startTransformY + (targetTransformY - startTransformY) * hpEase;
        currentWidth = startWidth + (targetWidth - startWidth) * hpEase;
        currentHeight = startHeight + (targetHeight - startHeight) * hpEase;
        currentBorderRadius = 0; // Strict zero rounded corners

        cursor.style.transform = `translate(${currentTransformX}px, ${currentTransformY}px)`;
        cursor.style.width = `${currentWidth}px`;
        cursor.style.height = `${currentHeight}px`;
        cursor.style.borderRadius = `0px`;

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
            targetTransformX = -16;
            targetTransformY = -16;
            targetWidth = 32;
            targetHeight = 32;
            targetBorderRadius = 0;
            elementTargetTransformX = 0;
            elementTargetTransformY = 0;
            cursor.classList.remove('cursor-morph');
            if (trailContainer) trailContainer.style.display = '';
            return;
        }

        // Find closest .cursor-hover or interactive link/button element
        let hoveredElement = document.elementFromPoint(e.clientX, e.clientY);
        while (hoveredElement && !hoveredElement.classList.contains('cursor-hover') && hoveredElement.tagName !== 'A' && hoveredElement.tagName !== 'BUTTON') {
            hoveredElement = hoveredElement.parentElement;
        }

        if (hoveredElement) {
            if (!hovering) {
                hovering = true;
                if (trailContainer) trailContainer.style.display = 'none';

                hp = 0.0;
                startTransformX = currentTransformX;
                startTransformY = currentTransformY;
                startWidth = currentWidth;
                startHeight = currentHeight;
                startBorderRadius = 0;
                elementStartTransformX = elementCurrentTransformX;
                elementStartTransformY = elementCurrentTransformY;
            }

            if (prevHoveredElement && prevHoveredElement !== hoveredElement) {
                prevHoveredElement.style.transform = '';
                elementCurrentTransformX = 0;
                elementCurrentTransformY = 0;
                elementStartTransformX = 0;
                elementStartTransformY = 0;
            }

            const rect = hoveredElement.getBoundingClientRect();
            
            // Outset padding around hovered element
            const outsetX = 6;
            const outsetY = 4;
            const outsetRect = {
                left: rect.left - outsetX,
                top: rect.top - outsetY,
                width: rect.width + outsetX * 2,
                height: rect.height + outsetY * 2
            };

            const cursorFactor = 0.94;
            const centerFactor = 0.06;
            const elemFactor = 0.06;

            targetTransformX = ((outsetRect.left - e.clientX) * cursorFactor) + (-0.5 * outsetRect.width * centerFactor);
            targetTransformY = ((outsetRect.top - e.clientY) * cursorFactor) + (-0.5 * outsetRect.height * centerFactor);
            targetWidth = outsetRect.width;
            targetHeight = outsetRect.height;
            targetBorderRadius = 0; // Square corners

            const elementCenterX = outsetRect.left + outsetRect.width / 2;
            const elementCenterY = outsetRect.top + outsetRect.height / 2;
            elementTargetTransformX = (e.clientX - elementCenterX) * elemFactor;
            elementTargetTransformY = (e.clientY - elementCenterY) * elemFactor;

            prevHoveredElement = hoveredElement;
            cursor.classList.add('cursor-morph');
        } else {
            if (hovering) {
                hovering = false;
                if (trailContainer) trailContainer.style.display = '';

                hp = 0.0;
                startTransformX = currentTransformX;
                startTransformY = currentTransformY;
                startWidth = currentWidth;
                startHeight = currentHeight;
                startBorderRadius = 0;
                elementStartTransformX = elementCurrentTransformX;
                elementStartTransformY = elementCurrentTransformY;
            }

            targetTransformX = -16;
            targetTransformY = -16;
            targetWidth = 32;
            targetHeight = 32;
            targetBorderRadius = 0;
            elementTargetTransformX = 0.0;
            elementTargetTransformY = 0.0;

            cursor.classList.remove('cursor-morph');
        }
    });

    document.addEventListener('mouseleave', () => {
        cursor.classList.add('cursor-hide');
        cursorRevealed = false;
    });

    document.addEventListener('mouseenter', () => {
        cursor.classList.remove('cursor-hide');
        cursorRevealed = true;
    });

    window.cursorEngine = {
        setMagnetic: function (enabled) {
            magneticEnabled = enabled;
            if (!enabled && hovering) {
                hovering = false;
                if (trailContainer) trailContainer.style.display = '';
                cursor.classList.remove('cursor-morph');
            }
        },
        refreshTargets: markInteractiveElements
    };
})();
