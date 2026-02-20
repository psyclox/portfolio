/* ========================================
   FOOTER REALISTIC RAIN EFFECT
   Canvas-based rain with streaks, splashes,
   layered depth, and lightning flashes.
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('footer-rain');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Resize canvas
    function resizeCanvas() {
        const footer = canvas.parentElement;
        canvas.width = footer.offsetWidth;
        canvas.height = footer.offsetHeight;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // --- Rain Configuration ---
    const WIND_ANGLE = 0.25; // radians (~15 degrees lean)
    const LAYER_COUNT = 3;   // background, mid, foreground

    const layers = [
        { count: 60, speedMin: 1.5, speedMax: 3, lenMin: 10, lenMax: 20, opacity: 0.08, width: 0.5 },  // far background
        { count: 80, speedMin: 3, speedMax: 5, lenMin: 15, lenMax: 30, opacity: 0.15, width: 1 },  // mid
        { count: 50, speedMin: 5, speedMax: 8, lenMin: 25, lenMax: 45, opacity: 0.3, width: 1.5 },  // foreground
    ];

    // --- Raindrop class ---
    class Raindrop {
        constructor(layer) {
            this.layer = layer;
            this.reset(true);
        }

        reset(initial = false) {
            const L = this.layer;
            this.x = Math.random() * (canvas.width + 100) - 50;
            this.y = initial ? Math.random() * canvas.height : -20 - Math.random() * 80;
            this.speed = L.speedMin + Math.random() * (L.speedMax - L.speedMin);
            this.length = L.lenMin + Math.random() * (L.lenMax - L.lenMin);
            this.opacity = L.opacity * (0.6 + Math.random() * 0.4);
            this.width = L.width;
        }

        update() {
            this.x += Math.sin(WIND_ANGLE) * this.speed;
            this.y += Math.cos(WIND_ANGLE) * this.speed;

            if (this.y > canvas.height) {
                // Spawn splash
                if (this.layer.opacity > 0.1 && Math.random() > 0.5) {
                    spawnSplash(this.x, canvas.height - 2);
                }
                this.reset();
            }
        }

        draw() {
            const dx = Math.sin(WIND_ANGLE) * this.length;
            const dy = Math.cos(WIND_ANGLE) * this.length;

            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + dx, this.y + dy);
            ctx.strokeStyle = `rgba(180, 200, 230, ${this.opacity})`;
            ctx.lineWidth = this.width;
            ctx.stroke();
        }
    }

    // --- Splash Particles ---
    const splashes = [];

    class Splash {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * 3;
            this.vy = -Math.random() * 2.5 - 0.5;
            this.radius = Math.random() * 1.5 + 0.5;
            this.life = 1.0;
            this.decay = 0.03 + Math.random() * 0.04;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.1; // gravity
            this.life -= this.decay;
        }

        draw() {
            if (this.life <= 0) return;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(180, 200, 230, ${this.life * 0.4})`;
            ctx.fill();
        }
    }

    function spawnSplash(x, y) {
        const count = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            splashes.push(new Splash(x, y));
        }
    }

    // --- Initialize drops ---
    const drops = [];
    layers.forEach(layer => {
        for (let i = 0; i < layer.count; i++) {
            drops.push(new Raindrop(layer));
        }
    });

    // --- Lightning System ---
    let flashActive = 0;

    function doLightning() {
        if (Math.random() > 0.995) {
            flashActive = 4;
        }
    }

    // --- Main Draw Loop ---
    function draw() {
        doLightning();

        // Background fade
        if (flashActive > 0) {
            ctx.fillStyle = `rgba(200, 210, 230, ${flashActive * 0.06})`;
            flashActive--;
        } else {
            ctx.fillStyle = 'rgba(10, 10, 15, 0.25)';
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Update and draw rain
        drops.forEach(drop => {
            drop.update();
            // During flash, boost opacity
            if (flashActive > 0) {
                const origOpacity = drop.opacity;
                drop.opacity = Math.min(0.6, drop.opacity * 3);
                drop.draw();
                drop.opacity = origOpacity;
            } else {
                drop.draw();
            }
        });

        // Update and draw splashes
        for (let i = splashes.length - 1; i >= 0; i--) {
            splashes[i].update();
            splashes[i].draw();
            if (splashes[i].life <= 0) {
                splashes.splice(i, 1);
            }
        }

        requestAnimationFrame(draw);
    }

    draw();
});
