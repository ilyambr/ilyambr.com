/**
 * 360° Interactive Canvas Object Scrubbing Engine
 * Replicating the multi-angle physical scrub effect from lilguy.net
 */

(function () {
    'use strict';

    const spinCanvases = document.querySelectorAll('.spin-canvas');
    const dpr = window.devicePixelRatio || 1;

    spinCanvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        const card = canvas.closest('.product-card');
        const type = canvas.dataset.type || 'star';

        let width = canvas.width;
        let height = canvas.height;
        let currentAngle = 0;
        let targetAngle = 0;
        let isHovered = false;
        let isDragging = false;
        let startX = 0;
        let startAngle = 0;

        function resize() {
            const rect = canvas.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.scale(dpr, dpr);
        }

        resize();
        window.addEventListener('resize', resize);

        // Hover scrubbing
        card.addEventListener('mouseenter', (e) => {
            isHovered = true;
            const rect = card.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width;
            targetAngle = relX * Math.PI * 2;
        });

        card.addEventListener('mousemove', (e) => {
            if (!isDragging) {
                const rect = card.getBoundingClientRect();
                const relX = (e.clientX - rect.left) / rect.width;
                targetAngle = (relX - 0.5) * Math.PI * 2.5;
            }
        });

        card.addEventListener('mouseleave', () => {
            isHovered = false;
            targetAngle = 0; // Return to default front-facing resting pose
        });

        // Click & Drag Scrubbing
        card.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startAngle = targetAngle;
        });

        window.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - startX;
                targetAngle = startAngle + (deltaX / 100) * Math.PI;
            }
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
        });

        /**
         * 3D Geometry Rendering based on Model Type
         */
        function drawModel(angle) {
            ctx.clearRect(0, 0, width, height);

            const cx = width / 2;
            const cy = height / 2;
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const strokeColor = isDark ? '#f4f4f6' : '#18191b';
            const fillColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';

            ctx.save();
            ctx.translate(cx, cy);

            if (type === 'star') {
                // 3D Star Object
                const size = 65;
                const points = 5;

                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 2.5;
                ctx.fillStyle = fillColor;

                for (let layer = -2; layer <= 2; layer++) {
                    const layerScale = 1 - Math.abs(layer) * 0.15;
                    const rot = angle + layer * 0.12;

                    ctx.save();
                    ctx.scale(Math.cos(rot) * layerScale, layerScale);

                    ctx.beginPath();
                    for (let i = 0; i < points * 2; i++) {
                        const r = (i % 2 === 0 ? size : size * 0.48) * layerScale;
                        const a = (i * Math.PI) / points - Math.PI / 2;
                        const px = Math.cos(a) * r;
                        const py = Math.sin(a) * r;
                        if (i === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();
                }

                // Core Eye in center
                const eyeRadius = 14;
                ctx.fillStyle = isDark ? '#ffffff' : '#18191b';
                ctx.beginPath();
                ctx.arc(Math.sin(angle) * 12, 0, eyeRadius, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = isDark ? '#000000' : '#ffffff';
                ctx.beginPath();
                ctx.arc(Math.sin(angle) * 12 - 3, -3, 4, 0, Math.PI * 2);
                ctx.fill();

            } else if (type === 'crystal') {
                // 3D Prismatic Hexagon / Crystal
                const size = 60;
                const heightZ = 75;

                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 2;
                ctx.fillStyle = fillColor;

                const rotY = angle;
                const rotX = 0.35;

                const vertices = [];
                const hexSides = 6;

                for (let h = -1; h <= 1; h += 2) {
                    for (let i = 0; i < hexSides; i++) {
                        const theta = (i * Math.PI * 2) / hexSides;
                        let x = Math.cos(theta) * size;
                        let y = (h * heightZ) / 2;
                        let z = Math.sin(theta) * size;

                        const rx = x * Math.cos(rotY) + z * Math.sin(rotY);
                        const rz = -x * Math.sin(rotY) + z * Math.cos(rotY);
                        const ry = y * Math.cos(rotX) - rz * Math.sin(rotX);

                        vertices.push({ x: rx, y: ry, z: rz });
                    }
                }

                ctx.beginPath();
                for (let i = 0; i < hexSides; i++) {
                    const next = (i + 1) % hexSides;
                    ctx.moveTo(vertices[i].x, vertices[i].y);
                    ctx.lineTo(vertices[next].x, vertices[next].y);
                    ctx.lineTo(vertices[next + hexSides].x, vertices[next + hexSides].y);
                    ctx.lineTo(vertices[i + hexSides].x, vertices[i + hexSides].y);
                }
                ctx.closePath();
                ctx.stroke();
                ctx.fill();

            } else if (type === 'torus') {
                // 3D Wireframe Torus Ring
                const R = 55;
                const r = 24;
                const numRings = 14;
                const numPoints = 14;

                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 1.5;

                for (let i = 0; i < numRings; i++) {
                    const u = (i * Math.PI * 2) / numRings + angle;
                    ctx.beginPath();

                    for (let j = 0; j <= numPoints; j++) {
                        const v = (j * Math.PI * 2) / numPoints;
                        const x = (R + r * Math.cos(v)) * Math.cos(u);
                        const y = r * Math.sin(v);
                        const z = (R + r * Math.cos(v)) * Math.sin(u);

                        const px = x;
                        const py = y * Math.cos(0.4) - z * Math.sin(0.4);

                        if (j === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.stroke();
                }
            }

            ctx.restore();
        }

        // Render Loop for each spinner
        function animate() {
            const lerpSpeed = isHovered || isDragging ? 0.12 : 0.05;
            currentAngle += (targetAngle - currentAngle) * lerpSpeed;

            drawModel(currentAngle);
            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    });
})();
