/* ========================================
   FOOTER REALISTIC RAIN — Enhanced v2
   Thinner streaks, variable wind, ground mist,
   puddle ripples, and depth-of-field blur
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('footer-rain');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W, H;

    function resize() {
        const footer = canvas.parentElement;
        W = canvas.width = footer.offsetWidth;
        H = canvas.height = footer.offsetHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // --- Config ---
    const WIND = 0.18;           // base wind angle (radians)
    let windOscillation = 0;     // oscillates over time for natural wind shift
    let windTarget = WIND;
    let windCurrent = WIND;

    // 5 depth layers for parallax realism
    const layers = [
        { count: 40, sMin: 1, sMax: 2, lMin: 8, lMax: 14, op: 0.04, w: 0.3 },
        { count: 50, sMin: 2, sMax: 3.5, lMin: 10, lMax: 18, op: 0.07, w: 0.5 },
        { count: 60, sMin: 3.5, sMax: 5, lMin: 12, lMax: 25, op: 0.12, w: 0.7 },
        { count: 45, sMin: 5, sMax: 7, lMin: 18, lMax: 35, op: 0.2, w: 1.0 },
        { count: 30, sMin: 7, sMax: 10, lMin: 25, lMax: 45, op: 0.32, w: 1.3 },
    ];

    // --- Raindrop ---
    class Drop {
        constructor(layer) {
            this.L = layer;
            this.reset(true);
        }
        reset(init = false) {
            this.x = Math.random() * (W + 120) - 60;
            this.y = init ? Math.random() * H : -10 - Math.random() * 100;
            this.speed = this.L.sMin + Math.random() * (this.L.sMax - this.L.sMin);
            this.len = this.L.lMin + Math.random() * (this.L.lMax - this.L.lMin);
            this.op = this.L.op * (0.5 + Math.random() * 0.5);
            this.w = this.L.w;
        }
        update(wind) {
            this.x += Math.sin(wind) * this.speed * 1.2;
            this.y += Math.cos(wind) * this.speed;
            if (this.y > H) {
                // Splash for visible drops
                if (this.op > 0.08 && Math.random() > 0.4) spawnSplash(this.x, H - 1);
                // Ripple for close drops
                if (this.op > 0.15 && Math.random() > 0.6) spawnRipple(this.x);
                this.reset();
            }
        }
        draw(wind) {
            const dx = Math.sin(wind) * this.len;
            const dy = Math.cos(wind) * this.len;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + dx, this.y + dy);
            ctx.strokeStyle = `rgba(180, 205, 240, ${this.op})`;
            ctx.lineWidth = this.w;
            ctx.stroke();
        }
    }

    // --- Splashes ---
    const splashes = [];
    class Splash {
        constructor(x, y) {
            this.x = x; this.y = y;
            this.vx = (Math.random() - 0.5) * 2.5;
            this.vy = -Math.random() * 2 - 1;
            this.r = Math.random() * 1.2 + 0.3;
            this.life = 1.0;
            this.decay = 0.04 + Math.random() * 0.03;
        }
        update() {
            this.x += this.vx; this.y += this.vy;
            this.vy += 0.12;
            this.life -= this.decay;
        }
        draw() {
            if (this.life <= 0) return;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 220, 255, ${this.life * 0.35})`;
            ctx.fill();
        }
    }
    function spawnSplash(x, y) {
        for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++)
            splashes.push(new Splash(x, y));
    }

    // --- Puddle Ripples ---
    const ripples = [];
    class Ripple {
        constructor(x) {
            this.x = x;
            this.y = H - 2 - Math.random() * 4;
            this.radius = 0;
            this.maxRadius = 6 + Math.random() * 10;
            this.life = 1.0;
            this.speed = 0.3 + Math.random() * 0.3;
        }
        update() {
            this.radius += this.speed;
            this.life = 1 - (this.radius / this.maxRadius);
        }
        draw() {
            if (this.life <= 0) return;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.radius, this.radius * 0.35, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(180, 210, 255, ${this.life * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
    }
    function spawnRipple(x) { ripples.push(new Ripple(x)); }

    // --- Init drops ---
    const drops = [];
    layers.forEach(L => {
        for (let i = 0; i < L.count; i++) drops.push(new Drop(L));
    });

    // --- Lightning ---
    let flashAlpha = 0;
    function maybeFlash() {
        if (Math.random() > 0.997) flashAlpha = 0.25;
    }

    // --- Ground Mist ---
    let mistPhase = 0;
    function drawMist() {
        mistPhase += 0.003;
        const gradient = ctx.createLinearGradient(0, H - 30, 0, H);
        gradient.addColorStop(0, 'rgba(10, 10, 15, 0)');
        gradient.addColorStop(1, `rgba(20, 25, 35, ${0.15 + Math.sin(mistPhase) * 0.05})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, H - 30, W, 30);
    }

    // --- Main Loop ---
    let time = 0;
    function draw() {
        time++;
        maybeFlash();

        // Wind oscillation for natural variation
        if (time % 120 === 0) windTarget = WIND + (Math.random() - 0.5) * 0.12;
        windCurrent += (windTarget - windCurrent) * 0.02;
        const wind = windCurrent;

        // Clear with fade (for trail effect)
        if (flashAlpha > 0) {
            ctx.fillStyle = `rgba(160, 180, 220, ${flashAlpha})`;
            flashAlpha *= 0.8;
            if (flashAlpha < 0.01) flashAlpha = 0;
        } else {
            ctx.fillStyle = 'rgba(10, 10, 15, 0.18)';
        }
        ctx.fillRect(0, 0, W, H);

        // Drops
        for (const d of drops) { d.update(wind); d.draw(wind); }

        // Splashes
        for (let i = splashes.length - 1; i >= 0; i--) {
            splashes[i].update(); splashes[i].draw();
            if (splashes[i].life <= 0) splashes.splice(i, 1);
        }

        // Ripples
        for (let i = ripples.length - 1; i >= 0; i--) {
            ripples[i].update(); ripples[i].draw();
            if (ripples[i].life <= 0) ripples.splice(i, 1);
        }

        // Ground mist
        drawMist();

        requestAnimationFrame(draw);
    }
    draw();
});
