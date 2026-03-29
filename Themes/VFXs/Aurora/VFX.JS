// ==UserScript==
// @name         Aurora VFX
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Very resource usage, this was made for fun
// @author       Marshal
// @match        https://www.kogama.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    
    // Config
    const cfg = {
        intensity: 0.7,
        speed: 1.0,
        blur: 60,
        colors: ['#00ffaa', '#00aaff', '#aa00ff', '#ff00aa'],
        layers: 3,
        stars: true,
        starDensity: 0.0004,
        mouseFollow: true,
        targetClass: '_33DXe'
    };
    
    // State
    let target = null;
    let canvas = null;
    let ctx = null;
    let frameId = null;
    let time = 0;
    let mouse = { x: 0, y: 0 };
    let layers = [];
    let stars = [];
    let shootingStars = [];
    
    // Setup styles
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            ._33DXe {
                overflow: visible !important;
                isolation: isolate;
            }
            ._13UrL ._23KvS ._33DXe {
                opacity: 10;
                background-image: none !important;
                filter: blur(3px);
            }
            .aurora-container {
                position: absolute !important;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9999;
                opacity: ${cfg.intensity} !important;
                transition: opacity 0.5s ease;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Aurora wave layer
    class Wave {
        constructor(i) {
            this.color = cfg.colors[i % cfg.colors.length];
            this.alpha = 0.15 + i * 0.05;
            this.speed = 0.0003 + i * 0.0001;
            this.amp = 30 + i * 10;
            this.freq = 0.01 + i * 0.005;
            this.phase = Math.random() * Math.PI * 2;
            this.yOffset = i * 20;
        }
        
        update(dt) {
            this.phase += this.speed * dt * cfg.speed;
        }
        
        draw(ctx, w, h) {
            const auroraH = h * 0.5;
            const yBase = h - auroraH + this.yOffset;
            
            ctx.beginPath();
            ctx.moveTo(0, h);
            
            const steps = Math.min(50, w / 10);
            for (let i = 0; i <= steps; i++) {
                const x = (i / steps) * w;
                const wave = Math.sin(x * this.freq + this.phase) * this.amp +
                           Math.sin(x * this.freq * 0.7 + this.phase * 1.3) * this.amp * 0.5 +
                           Math.cos(x * this.freq * 0.3 + this.phase * 0.7) * this.amp * 0.3;
                ctx.lineTo(x, yBase + wave);
            }
            
            ctx.lineTo(w, h);
            ctx.closePath();
            
            const grad = ctx.createLinearGradient(0, yBase, 0, h);
            const rgba = this.toRGBA(this.color, this.alpha);
            grad.addColorStop(0, rgba);
            grad.addColorStop(1, this.toRGBA(this.color, 0));
            
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.shadowColor = this.color;
            ctx.shadowBlur = cfg.blur;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        toRGBA(hex, a) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r},${g},${b},${a})`;
        }
    }
    
    // Create stars
    function makeStar() {
        const type = Math.random();
        const big = type > 0.9;
        const med = type > 0.7;
        
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: big ? Math.random() * 3 + 2 : med ? Math.random() * 2 + 1 : Math.random() * 1.5 + 0.5,
            speed: (big ? Math.random() * 0.8 + 0.4 : med ? Math.random() * 0.6 + 0.3 : Math.random() * 0.4 + 0.1) * cfg.speed,
            opacity: big ? Math.random() * 0.8 + 0.4 : med ? Math.random() * 0.6 + 0.3 : Math.random() * 0.4 + 0.1,
            twinkle: Math.random() * 0.03 + 0.01,
            offset: Math.random() * Math.PI * 2,
            color: Math.random() > 0.9 ? `rgba(${Math.random() * 100 + 155},${Math.random() * 100 + 155},255,` : 'rgba(255,255,255,',
            drift: (Math.random() - 0.5) * 0.5,
            rot: 0,
            rotSpeed: (Math.random() - 0.5) * 0.02
        };
    }
    
    function makeShootingStar() {
        const w = canvas ? canvas.width / (devicePixelRatio || 1) : 100;
        const h = canvas ? canvas.height / (devicePixelRatio || 1) : 100;
        
        return {
            x: Math.random() * w,
            y: Math.random() * h * 0.3,
            len: Math.random() * 50 + 30,
            speed: Math.random() * 10 + 5,
            angle: Math.random() * Math.PI * 2,
            opacity: 0,
            active: false,
            trail: []
        };
    }
    
    // Init aurora
    function init() {
        layers = Array.from({length: cfg.layers}, (_, i) => new Wave(i));
        
        stars = [];
        if (cfg.stars && canvas) {
            const area = (canvas.width * canvas.height) / (devicePixelRatio || 1);
            const count = Math.floor(area * cfg.starDensity);
            stars = Array.from({length: count}, makeStar);
        }
        
        shootingStars = Array.from({length: 3}, (_, i) => {
            const s = makeShootingStar();
            setTimeout(() => {
                s.active = true;
                s.opacity = 0.8;
            }, Math.random() * 5000);
            return s;
        });
    }
    
    // Resize canvas
    function resize(el) {
        if (!canvas || !el) return;
        
        const dpr = devicePixelRatio || 1;
        const rect = el.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        
        if (ctx) ctx.scale(dpr, dpr);
    }
    
    // Animation loop
    function draw(ts) {
        if (!canvas || !ctx || !target) return;
        
        const dt = ts - time || 0;
        time = ts;
        
        const rect = target.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(0, 0, w, h);
        
        // Draw aurora layers
        layers.forEach(l => {
            l.update(dt);
            l.draw(ctx, w, h);
        });
        
        if (cfg.stars) {
            // Draw stars
            stars.forEach(s => {
                const twinkle = Math.sin(time * s.twinkle + s.offset) * 0.5 + 0.5;
                const alpha = s.opacity * twinkle;
                
                ctx.save();
                ctx.translate(s.x, s.y);
                ctx.rotate(s.rot);
                
                if (Math.random() > 0.8) {
                    ctx.beginPath();
                    ctx.moveTo(-s.size, 0);
                    ctx.lineTo(s.size, 0);
                    ctx.moveTo(0, -s.size);
                    ctx.lineTo(0, s.size);
                    ctx.strokeStyle = s.color + alpha + ')';
                    ctx.lineWidth = s.size / 3;
                    ctx.stroke();
                } else {
                    ctx.beginPath();
                    ctx.arc(0, 0, s.size, 0, Math.PI * 2);
                    ctx.fillStyle = s.color + alpha + ')';
                    ctx.fill();
                    
                    if (s.size > 2) {
                        ctx.shadowColor = 'white';
                        ctx.shadowBlur = 5;
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    }
                }
                
                ctx.restore();
            });
            
            // Draw shooting stars
            shootingStars.forEach((s, i) => {
                if (!s.active) return;
                
                s.x += Math.cos(s.angle) * s.speed * cfg.speed;
                s.y += Math.sin(s.angle) * s.speed * cfg.speed;
                
                s.trail.push({x: s.x, y: s.y});
                if (s.trail.length > 20) s.trail.shift();
                
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                
                s.trail.forEach((p, j) => {
                    ctx.strokeStyle = `rgba(255,255,255,${(j / s.trail.length) * s.opacity})`;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    if (j > 0) ctx.lineTo(s.trail[j-1].x, s.trail[j-1].y);
                    ctx.stroke();
                });
                
                ctx.beginPath();
                ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
                ctx.fill();
                
                s.opacity -= 0.01;
                if (s.opacity <= 0 || s.x < -50 || s.x > w + 50 || s.y < -50 || s.y > h + 50) {
                    shootingStars[i] = makeShootingStar();
                    setTimeout(() => {
                        shootingStars[i].active = true;
                        shootingStars[i].opacity = 0.8;
                    }, Math.random() * 5000);
                }
            });
            
            // Add star clusters occasionally
            if (time % 3000 < 16 && stars.length < 500) {
                const cx = Math.random() * w;
                const cy = Math.random() * h;
                const size = Math.random() * 10 + 5;
                
                for (let i = 0; i < size; i++) {
                    stars.push({
                        x: cx + (Math.random() - 0.5) * 50,
                        y: cy + (Math.random() - 0.5) * 50,
                        size: Math.random() * 1.5 + 0.5,
                        speed: Math.random() * 0.3 + 0.1,
                        opacity: Math.random() * 0.5 + 0.2,
                        twinkle: Math.random() * 0.02 + 0.01,
                        offset: Math.random() * Math.PI * 2,
                        color: 'rgba(255,255,255,',
                        drift: (Math.random() - 0.5) * 0.2,
                        rot: 0,
                        rotSpeed: (Math.random() - 0.5) * 0.01
                    });
                }
            }
        }
        
        // Mouse interaction
        if (cfg.mouseFollow && mouse.x > 0 && mouse.y > 0 && mouse.x < w && mouse.y < h) {
            const ripple = Math.sin(time * 0.002) * 10 + 20;
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, ripple, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            stars.forEach(s => {
                const dx = mouse.x - s.x;
                const dy = mouse.y - s.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 100) {
                    const force = (100 - dist) / 100;
                    s.x += (dx / dist) * force * 2;
                    s.y += (dy / dist) * force * 2;
                }
            });
        }
        
        frameId = requestAnimationFrame(draw);
    }
    
    // Attach aurora to element
    function attach(el) {
        if (frameId) {
            cancelAnimationFrame(frameId);
            frameId = null;
        }
        
        const old = el.querySelector('.aurora-container');
        if (old) old.remove();
        
        const container = document.createElement('div');
        container.className = 'aurora-container';
        el.appendChild(container);
        
        canvas = document.createElement('canvas');
        container.appendChild(canvas);
        
        ctx = canvas.getContext('2d');
        target = el;
        
        init();
        resize(el);
        draw(0);
        
        el.addEventListener('mousemove', e => {
            const rect = el.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });
        
        el.addEventListener('mouseleave', () => {
            mouse.x = -1000;
            mouse.y = -1000;
        });
    }
    
    // Find and attach to targets
    function findTargets() {
        const targets = document.querySelectorAll(`.${cfg.targetClass}`);
        targets.forEach(el => {
            if (!el.querySelector('.aurora-container')) attach(el);
        });
    }
    
    // Setup observers
    function observe() {
        addStyles();
        findTargets();
        
        // Watch for new elements
        const obs = new MutationObserver(mutations => {
            let needUpdate = false;
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.classList?.contains(cfg.targetClass) || 
                            node.querySelectorAll?.(`.${cfg.targetClass}`).length > 0) {
                            needUpdate = true;
                        }
                    }
                });
            });
            if (needUpdate) findTargets();
        });
        obs.observe(document.body, {childList: true, subtree: true});
        
        // Watch for class changes
        const classObs = new MutationObserver(mutations => {
            mutations.forEach(m => {
                if (m.attributeName === 'class' && m.target.classList?.contains(cfg.targetClass)) {
                    attach(m.target);
                }
            });
        });
        classObs.observe(document.body, {
            attributes: true,
            attributeFilter: ['class'],
            subtree: true
        });
        
        // Watch for resizes
        const resizeObs = new ResizeObserver(entries => {
            entries.forEach(e => {
                if (e.target.classList?.contains(cfg.targetClass) && e.target.contains(canvas)) {
                    resize(e.target);
                    init();
                }
            });
        });
        
        setTimeout(() => {
            document.querySelectorAll(`.${cfg.targetClass}`).forEach(el => resizeObs.observe(el));
        }, 1000);
    }
    
    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', observe);
    } else {
        setTimeout(observe, 100);
    }
    
    // Pause when hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && frameId) {
            cancelAnimationFrame(frameId);
            frameId = null;
        } else if (!document.hidden && canvas && ctx && target) {
            draw(0);
        }
    });
})();