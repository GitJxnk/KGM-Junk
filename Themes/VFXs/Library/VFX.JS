// ==UserScript==
// @name         Library
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Null
// @author       Marshal
// @match        https://www.kogama.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    let canvas, ctx, animationId;
    let books = [], runes = [], dustMotes = [], inkDrops = [];
    let time = 0;
    
    const BOOK_COVERS = [
        '#8B4513', '#654321', '#5D4037', '#3E2723',
        '#795548', '#6D4C41', '#5D4037', '#4E342E'
    ];

    const PAGE_TONES = [
        '#F5EBDC', '#F3E5AB', '#FAF0E6',
        '#FFF8DC', '#FDF5E6', '#FAEBD7'
    ];

    const GLOW_COLOURS = [
        '#9370DB', '#8A2BE2', '#4B0082',
        '#483D8B', '#6A5ACD', '#7B68EE'
    ];

    // Elder Futhark runes
    const RUNES = [
        'ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚹ','ᚺ','ᚾ',
        'ᛁ','ᛃ','ᛇ','ᛈ','ᛉ','ᛊ','ᛏ','ᛒ','ᛖ','ᛗ',
        'ᛚ','ᛜ','ᛟ','ᛞ'
    ];

    function pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function rand(min, max) {
        return min + Math.random() * (max - min);
    }

    // Shift a hex colour lighter or darker by a fixed amount per channel
    function shiftColour(hex, amount) {
        const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
        const r = clamp(parseInt(hex.substr(1, 2), 16) + amount, 0, 255);
        const g = clamp(parseInt(hex.substr(3, 2), 16) + amount, 0, 255);
        const b = clamp(parseInt(hex.substr(5, 2), 16) + amount, 0, 255);
        return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
    }

    // Turn a 6-digit hex colour into rgba(...) with the given alpha
    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.substr(1, 2), 16);
        const g = parseInt(hex.substr(3, 2), 16);
        const b = parseInt(hex.substr(5, 2), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            ._33DXe {
                overflow: visible !important;
                isolation: isolate;
            }
            ._13UrL ._23KvS ._33DXe {
                opacity: 9;
                background-image: none !important;
                filter: blur(0px);
            }
            .arcane-library {
                position: absolute !important;
                top: 0; left: 0;
                width: 100%; height: 100%;
                pointer-events: none;
                z-index: 9999;
            }
        `;
        document.head.appendChild(style);
    }

    function init() {
        const target = document.querySelector('._33DXe');
        if (!target) { setTimeout(init, 1000); return; }

        injectStyles();

        // Tear down any previous instance
        if (animationId) cancelAnimationFrame(animationId);
        target.querySelector('.arcane-library')?.remove();

        // Build the overlay canvas
        canvas = document.createElement('canvas');
        canvas.className = 'arcane-library';
        Object.assign(canvas.style, {
            position: 'absolute', top: '0', left: '0',
            width: '100%', height: '100%',
            pointerEvents: 'none', zIndex: '9999'
        });
        target.appendChild(canvas);
        ctx = canvas.getContext('2d');

        setTimeout(() => {
            resizeCanvas();
            populate();
            animate();
        }, 100);
    }
    
    function resizeCanvas() {
        if (!canvas?.parentElement) return;
        const { width, height } = canvas.parentElement.getBoundingClientRect();
        canvas.width  = width;
        canvas.height = height;
        books = []; runes = []; dustMotes = []; inkDrops = [];
    }
    
    function populate() {
        if (!canvas || canvas.width === 0 || canvas.height === 0) return;

        const area = canvas.width * canvas.height;

        const bookCount = Math.min(8,  Math.floor(area / 40000));
        const runeCount = Math.min(12, Math.floor(area / 30000));

        for (let i = 0; i < bookCount; i++) spawnBook();
        for (let i = 0; i < runeCount; i++) spawnRune();
        for (let i = 0; i < 60; i++)        spawnDust();
        for (let i = 0; i < 5;  i++)        spawnInkDrop();
    }

    function spawnBook() {
        const w = canvas.width, h = canvas.height;
        const bookW = rand(20, 45);
        const cover  = pick(BOOK_COVERS);

        const book = {
            x: Math.random() * w,
            y: Math.random() * h * 0.8,
            width:     bookW,
            height:    bookW * 1.5,
            thickness: rand(3, 7),
            coverColour: cover,
            pageColour:  pick(PAGE_TONES),
            rotation:      Math.random() * Math.PI * 2,
            rotationSpeed: rand(-0.0025, 0.0025),
            floatOffset: Math.random() * Math.PI * 2,
            floatSpeed:  rand(0.01, 0.03),
            glow:      Math.random() * Math.PI * 2,
            glowSpeed: rand(0.02, 0.05),
            pages: []
        };

        const pageCount = 3 + Math.floor(Math.random() * 5);
        for (let i = 0; i < pageCount; i++) {
            book.pages.push({
                offset:    rand(-1.5, 1.5),
                curve:     Math.random() * 0.3,
                flip:      Math.random() * Math.PI * 2,
                flipSpeed: rand(-0.005, 0.005)
            });
        }

        books.push(book);
    }

    function spawnRune() {
        const w = canvas.width, h = canvas.height;
        runes.push({
            x: Math.random() * w,
            y: Math.random() * h,
            size:   rand(12, 28),
            symbol: pick(RUNES),
            colour: pick(GLOW_COLOURS),
            rotation:      Math.random() * Math.PI * 2,
            rotationSpeed: rand(-0.0015, 0.0015),
            pulse:      Math.random() * Math.PI * 2,
            pulseSpeed: rand(0.02, 0.05),
            float:       Math.random() * Math.PI * 2,
            floatSpeed:  rand(0.01, 0.03),
            floatAmount: rand(2, 6),
            trail: [],
            maxTrail: 3
        });
    }

    function spawnDust(x, y) {
        const w = canvas.width, h = canvas.height;
        dustMotes.push({
            x: x ?? Math.random() * w,
            y: y ?? Math.random() * h,
            size:  rand(1, 3),
            speed: rand(0.05, 0.15),
            drift: rand(-0.01, 0.01),
            wave:  Math.random() * Math.PI * 2,
            alpha: rand(0.1, 0.3)
        });
    }

    function spawnInkDrop() {
        const w = canvas.width, h = canvas.height;
        inkDrops.push({
            x: Math.random() * w,
            y: Math.random() * h,
            size:       rand(3, 7),
            ripple:     0,
            rippleSpeed: rand(0.05, 0.1),
            maxRipple:   rand(8, 14),
            float:      Math.random() * Math.PI * 2,
            floatSpeed: rand(0.02, 0.05)
        });
    }

    function updateBooks() {
        for (const b of books) {
            b.floatOffset += b.floatSpeed;
            b.y           += Math.sin(b.floatOffset) * 0.1;
            b.rotation    += b.rotationSpeed;
            b.glow        += b.glowSpeed;
            for (const p of b.pages) p.flip += p.flipSpeed;
        }
        if (books.length < 8 && Math.random() < 0.001) spawnBook();
    }

    function updateRunes() {
        for (const r of runes) {
            r.pulse    += r.pulseSpeed;
            r.rotation += r.rotationSpeed;
            r.float    += r.floatSpeed;
            r.y        += Math.sin(r.float) * 0.1;

            r.trail.unshift({ x: r.x, y: r.y });
            if (r.trail.length > r.maxTrail) r.trail.pop();
        }
        if (runes.length < 12 && Math.random() < 0.001) spawnRune();
    }

    function updateDust() {
        const w = canvas.width, h = canvas.height;
        for (let i = dustMotes.length - 1; i >= 0; i--) {
            const d = dustMotes[i];
            d.y    -= d.speed;
            d.x    += d.drift;
            d.wave += 0.01;
            d.x    += Math.sin(d.wave) * 0.1;

            if (d.y < -10) {
                dustMotes.splice(i, 1);
                spawnDust(Math.random() * w, h + 10);
            }
        }
    }

    function updateInkDrops() {
        for (let i = inkDrops.length - 1; i >= 0; i--) {
            const ink = inkDrops[i];
            ink.ripple += ink.rippleSpeed;
            ink.float  += ink.floatSpeed;
            ink.y      += Math.sin(ink.float) * 0.05;

            if (ink.ripple > ink.maxRipple) {
                inkDrops.splice(i, 1);
                if (Math.random() < 0.3) spawnInkDrop();
            }
        }
    }

    function drawAtmosphere() {
        const w = canvas.width, h = canvas.height;

        // Warm ambient tint
        const ambient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h));
        ambient.addColorStop(0, 'rgba(139,115,85,0.10)');
        ambient.addColorStop(1, 'rgba(60,40,20,0.30)');
        ctx.fillStyle = ambient;
        ctx.fillRect(0, 0, w, h);

        // Three faint light shafts
        if (w > 400) {
            ctx.save();
            ctx.globalCompositeOperation = 'overlay';
            for (let i = 0; i < 3; i++) {
                const bx = w * (0.2 + i * 0.3);
                const beam = ctx.createLinearGradient(bx, 0, bx, h);
                beam.addColorStop(0,   'rgba(255,215,0,0.05)');
                beam.addColorStop(0.5, 'rgba(255,255,200,0.08)');
                beam.addColorStop(1,   'rgba(255,255,200,0)');
                ctx.fillStyle = beam;
                ctx.fillRect(bx - 15, 0, 30, h);
            }
            ctx.restore();
        }
    }

    function drawBook(b) {
        const glowAlpha = 0.3 + Math.sin(b.glow) * 0.1;

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rotation);

        // Magical aura
        const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, b.width * 1.5);
        aura.addColorStop(0, `rgba(147,112,219,${glowAlpha * 0.3})`);
        aura.addColorStop(1, 'rgba(147,112,219,0)');
        ctx.fillStyle = aura;
        ctx.fillRect(-b.width, -b.height, b.width * 2, b.height * 2);

        const hw = b.height / 2;

        // Spine
        ctx.fillStyle = b.coverColour;
        ctx.fillRect(-b.thickness / 2, -hw, b.thickness, b.height);

        // Front cover
        ctx.fillStyle = shiftColour(b.coverColour, -20);
        ctx.fillRect(0, -hw, b.width, b.height);

        // Pages (side-on, slightly curved)
        ctx.fillStyle = b.pageColour;
        for (const p of b.pages) {
            ctx.save();
            ctx.translate(p.offset, 0);
            ctx.beginPath();
            ctx.moveTo(0, -hw);
            ctx.quadraticCurveTo(p.curve * 5,  0,  0, hw);
            ctx.lineTo(-1, hw);
            ctx.quadraticCurveTo(p.curve * 5 - 1, 0, -1, -hw);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        // Back cover peeking out
        ctx.fillStyle = shiftColour(b.coverColour, 10);
        ctx.fillRect(-b.width, -hw, b.width * 0.3, b.height);

        // Gold decorative lines
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth   = 1;
        // Two lines across the spine
        for (const yPos of [-hw * 0.67, hw * 0.67]) {
            ctx.beginPath();
            ctx.moveTo(-b.thickness / 2, yPos);
            ctx.lineTo( b.thickness / 2, yPos);
            ctx.stroke();
        }
        // One line near the top of the front cover
        ctx.beginPath();
        ctx.moveTo(b.width * 0.2, -hw + 5);
        ctx.lineTo(b.width * 0.8, -hw + 5);
        ctx.stroke();

        ctx.restore();
    }

    function drawRune(r) {
        const pulse  = 0.5 + Math.sin(r.pulse) * 0.3;
        const floatY = Math.sin(r.float) * r.floatAmount;

        // Ghost trail
        r.trail.forEach((pt, i) => {
            const a = (i / r.trail.length) * 0.4 * pulse;
            ctx.fillStyle = hexToRgba(r.colour, a);
            ctx.font = `${r.size * 0.8}px serif`;
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(r.symbol, pt.x, pt.y + floatY);
        });

        ctx.save();
        ctx.translate(r.x, r.y + floatY);
        ctx.rotate(r.rotation);

        // Glow halo
        const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, r.size * 1.5);
        halo.addColorStop(0, hexToRgba(r.colour, pulse * 0.5));
        halo.addColorStop(1, hexToRgba(r.colour, 0));
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, r.size * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // The rune itself
        ctx.font = `${r.size}px serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = `rgba(255,255,255,${pulse})`;
        ctx.fillText(r.symbol, 0, 0);

        ctx.restore();
    }

    function drawDust(d) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,220,${d.alpha})`;
        ctx.fill();
    }

    function drawInkDrop(ink) {
        const progress = ink.ripple / ink.maxRipple;
        const alpha    = 1 - progress;

        // Core drop
        ctx.beginPath();
        ctx.arc(ink.x, ink.y, ink.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(48,25,52,${alpha})`;
        ctx.fill();

        // Expanding ripple rings
        if (ink.ripple > 0) {
            ctx.strokeStyle = `rgba(48,25,52,${alpha * 0.5})`;
            ctx.lineWidth   = (1 - progress) * 2;

            ctx.beginPath();
            ctx.arc(ink.x, ink.y, ink.ripple, 0, Math.PI * 2);
            ctx.stroke();

            if (ink.ripple > ink.size * 2) {
                ctx.beginPath();
                ctx.arc(ink.x, ink.y, ink.ripple * 0.7, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }

    function draw() {
        const w = canvas.width, h = canvas.height;

        ctx.fillStyle = 'rgba(60,40,20,0.03)';
        ctx.fillRect(0, 0, w, h);

        drawAtmosphere();

        for (const d   of dustMotes) drawDust(d);
        for (const ink of inkDrops)  drawInkDrop(ink);
        for (const b   of books)     drawBook(b);
        for (const r   of runes)     drawRune(r);
    }

    function animate(timestamp) {
        if (!canvas?.isConnected) {
            if (animationId) cancelAnimationFrame(animationId);
            return;
        }

        time = timestamp;
        updateBooks();
        updateRunes();
        updateDust();
        updateInkDrops();
        draw();

        animationId = requestAnimationFrame(animate);
    }

    setTimeout(init, 500);
    setInterval(() => {
        if (!document.querySelector('.arcane-library')) init();
    }, 2000);
})();