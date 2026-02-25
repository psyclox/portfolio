/* ===========================================
   THE HIDEOUT — Game Center v3
   Infinite Runner · Highscores · Full-width canvases
   Chess captured pieces · Fixed toggle colors
   =========================================== */
(function () {
    'use strict';

    // ── highscore helpers ──
    function getHighscore(game) {
        return parseInt(localStorage.getItem('hideout_hs_' + game) || '0', 10);
    }
    function setHighscore(game, score) {
        const prev = getHighscore(game);
        if (score > prev) { localStorage.setItem('hideout_hs_' + game, score); return true; }
        return false;
    }

    // ── shared state ──
    let activeGame = null;
    let gameLoopId = null;
    let keyHandler = null;

    // ── DOM refs ──
    let toggleInput, toggleTrack, switchCircle;
    let container, footerGrid;
    let canvasContainer, scoreDisplay, controlsHint;
    let player1Label, player2Label;
    let undoBtn, redoBtn;
    let sidebarBtns;

    // ── helpers ──
    function stopGame() {
        if (gameLoopId) { cancelAnimationFrame(gameLoopId); clearInterval(gameLoopId); gameLoopId = null; }
        if (keyHandler) { window.removeEventListener('keydown', keyHandler); window.removeEventListener('keyup', keyHandler.__upHandler || (() => { })); keyHandler = null; }
        activeGame = null;
        if (undoBtn) { undoBtn.disabled = true; undoBtn.onclick = null; }
        if (redoBtn) { redoBtn.disabled = true; redoBtn.onclick = null; }
        setPlayerVisibility(false);
    }
    function setScore(v) { if (scoreDisplay) scoreDisplay.textContent = v; }
    function setHint(t) { if (controlsHint) controlsHint.textContent = t; }
    function setPlayerVisibility(show) {
        const p1 = document.querySelector('.info-player.p1');
        const p2 = document.querySelector('.info-player.p2');
        if (p1) p1.style.display = show ? '' : 'none';
        if (p2) p2.style.display = show ? '' : 'none';
        // captured areas
        document.querySelectorAll('.captured-area').forEach(e => e.style.display = show ? '' : 'none');
    }
    function highlightTurn(who) {
        const p1el = document.querySelector('.info-player.p1');
        const p2el = document.querySelector('.info-player.p2');
        if (!p1el || !p2el) return;
        p1el.classList.toggle('active-turn', who === 1);
        p2el.classList.toggle('active-turn', who === 2);
    }
    function setActiveSidebar(game) {
        sidebarBtns.forEach(b => b.classList.toggle('active', b.dataset.game === game));
    }

    // ═══════════════════════════════════════════
    //  TOGGLE ANIMATION (Black/Red color-coded)
    //  Default: black track (#111) + red circle (#ff4757)
    //  Active:  red track (#ff4757) + black circle (#111)
    // ═══════════════════════════════════════════
    function animateToGameMode() {
        if (typeof gsap === 'undefined') {
            switchCircle.setAttribute('cx', '41');
            switchCircle.setAttribute('fill', '#111');
            toggleTrack.setAttribute('fill', '#ff4757');
            toggleTrack.setAttribute('stroke', '#cc2233');
            openHideout(); return;
        }
        gsap.to(switchCircle, { duration: 0.35, attr: { cx: 41 }, ease: 'power2.inOut' });
        gsap.to(switchCircle, { duration: 0.2, attr: { fill: '#111' }, delay: 0.15 });
        gsap.to(toggleTrack, { duration: 0.3, attr: { fill: '#ff4757', stroke: '#cc2233' } });
        openHideout();
    }
    function animateToSystemMode() {
        if (typeof gsap === 'undefined') {
            switchCircle.setAttribute('cx', '19');
            switchCircle.setAttribute('fill', '#ff4757');
            toggleTrack.setAttribute('fill', '#111');
            toggleTrack.setAttribute('stroke', '#333');
            closeHideout(); return;
        }
        gsap.to(switchCircle, { duration: 0.35, attr: { cx: 19 }, ease: 'power2.inOut' });
        gsap.to(switchCircle, { duration: 0.2, attr: { fill: '#ff4757' }, delay: 0.15 });
        gsap.to(toggleTrack, { duration: 0.3, attr: { fill: '#111', stroke: '#333' } });
        closeHideout();
    }
    function openHideout() {
        container.classList.remove('hidden');
        // Trigger reflow before adding active class for transition
        void container.offsetHeight;
        container.classList.add('active');
    }
    function closeHideout() {
        stopGame();
        container.classList.remove('active');
        container.classList.add('hidden');
        showWelcome();
        sidebarBtns.forEach(b => b.classList.remove('active'));
    }
    function showWelcome() {
        canvasContainer.innerHTML = '<div id="game-welcome" class="game-welcome"><h2>THE HIDEOUT</h2><p>SELECT A GAME FROM THE LEFT</p></div>';
        setScore('0');
        setHint('WASD / ARROWS');
        setPlayerVisibility(false);
    }

    // ═══════════════════════════════════════════
    //  GAME LAUNCHER
    // ═══════════════════════════════════════════
    function launchGame(type) {
        stopGame();
        canvasContainer.innerHTML = '';
        activeGame = type;
        setScore('0');
        setActiveSidebar(type);
        const aiContainer = document.getElementById('chess-ai-container');
        if (aiContainer) aiContainer.style.display = type === 'chess' ? 'flex' : 'none';
        switch (type) {
            case 'snake': startSnake(); break;
            case 'mario': startMario(); break;
            case 'flappy': startFlappy(); break;
            case 'xo': startXO(); break;
            case 'chess': startChess(); break;
            case 'cube': startCube(); break;
        }
    }

    // ── Full-size canvas (fills center panel) ──
    function makeCanvas() {
        const c = document.createElement('canvas');
        c.className = 'game-canvas';
        canvasContainer.appendChild(c);
        function resize() {
            c.width = canvasContainer.clientWidth;
            c.height = canvasContainer.clientHeight;
        }
        resize();
        window.addEventListener('resize', resize);
        c._cleanup = () => window.removeEventListener('resize', resize);
        return c;
    }

    // ═══════════════════════════════════════════
    //  🐍  SNAKE (fills entire panel)
    // ═══════════════════════════════════════════
    function startSnake() {
        setHint('ARROWS / WASD TO MOVE');
        setPlayerVisibility(false);
        const c = makeCanvas();
        const ctx = c.getContext('2d');
        const G = 20;
        let snake, food, dx, dy, score;
        function init() {
            const cols = Math.floor(c.width / G);
            const rows = Math.floor(c.height / G);
            snake = [{ x: Math.floor(cols / 2), y: Math.floor(rows / 2) }];
            dx = 0; dy = 0; score = 0; setScore(0);
            food = spawn();
        }
        function spawn() {
            const cols = Math.floor(c.width / G), rows = Math.floor(c.height / G);
            let f;
            do { f = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) }; }
            while (snake.some(p => p.x === f.x && p.y === f.y));
            return f;
        }
        function tick() {
            if (dx === 0 && dy === 0) { draw(); return; }
            const cols = Math.floor(c.width / G), rows = Math.floor(c.height / G);
            const head = { x: snake[0].x + dx, y: snake[0].y + dy };
            if (head.x < 0) head.x = cols - 1;
            if (head.x >= cols) head.x = 0;
            if (head.y < 0) head.y = rows - 1;
            if (head.y >= rows) head.y = 0;
            if (snake.some(p => p.x === head.x && p.y === head.y)) { setHighscore('snake', score); init(); draw(); return; }
            snake.unshift(head);
            if (head.x === food.x && head.y === food.y) { score += 10; setScore(score); food = spawn(); } else snake.pop();
            draw();
        }
        function draw() {
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, c.width, c.height);
            // Grid lines
            ctx.strokeStyle = '#0d0d0d'; ctx.lineWidth = .5;
            const cols = Math.floor(c.width / G), rows = Math.floor(c.height / G);
            for (let x = 0; x <= cols; x++) { ctx.beginPath(); ctx.moveTo(x * G, 0); ctx.lineTo(x * G, rows * G); ctx.stroke(); }
            for (let y = 0; y <= rows; y++) { ctx.beginPath(); ctx.moveTo(0, y * G); ctx.lineTo(cols * G, y * G); ctx.stroke(); }
            // Snake
            snake.forEach((p, i) => {
                ctx.fillStyle = i === 0 ? '#ff4757' : '#cc3344';
                ctx.fillRect(p.x * G + 1, p.y * G + 1, G - 2, G - 2);
            });
            // Food
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(food.x * G + G / 2, food.y * G + G / 2, G / 3, 0, Math.PI * 2);
            ctx.fill();
        }
        init();
        gameLoopId = setInterval(tick, 90);
        draw();
        keyHandler = e => {
            if (activeGame !== 'snake') return;
            const k = e.key.toLowerCase();
            if ((k === 'arrowup' || k === 'w') && dy === 0) { dx = 0; dy = -1; e.preventDefault(); }
            if ((k === 'arrowdown' || k === 's') && dy === 0) { dx = 0; dy = 1; e.preventDefault(); }
            if ((k === 'arrowleft' || k === 'a') && dx === 0) { dx = -1; dy = 0; e.preventDefault(); }
            if ((k === 'arrowright' || k === 'd') && dx === 0) { dx = 1; dy = 0; e.preventDefault(); }
        };
        window.addEventListener('keydown', keyHandler);
    }

    // ═══════════════════════════════════════════
    //  🏃  MARIO-STYLE PLATFORMER (full panel)
    //  Climb, run, stomp enemies, go left/right
    // ═══════════════════════════════════════════
    function startMario() {
        setHint('← → MOVE · ↑/W/SPACE JUMP · STOMP RED ENEMIES');
        setPlayerVisibility(false);
        const c = makeCanvas();
        const ctx = c.getContext('2d');

        const GRAVITY = 0.6;
        const JUMP_FORCE = -13;
        const MOVE_SPEED = 5;

        const keys = {};
        keyHandler = e => {
            if (activeGame !== 'mario') return;
            keys[e.key.toLowerCase()] = true;
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase()) || e.code === 'Space') e.preventDefault();
        };
        const upHandler = e => { keys[e.key.toLowerCase()] = false; };
        keyHandler.__upHandler = upHandler;
        window.addEventListener('keydown', keyHandler);
        window.addEventListener('keyup', upHandler);

        let score, gameOver, player, platforms, enemies, coins, cameraX;
        const PW = 24, PH = 30;

        // ── Infinite Generation State ──
        let floorGenX = 0;      // rightmost floor x generated
        let platGenX = 400;     // rightmost elevated platform x generated
        let platGenY;           // last elevated platform Y
        let enemyGenX = 600;    // rightmost enemy x generated
        let coinGenX = 250;     // rightmost coin x generated
        const SPAWN_AHEAD = 1200; // how far ahead of camera to spawn
        const DESPAWN_BEHIND = 800; // how far behind camera to remove

        function reset() {
            const floorY = c.height - 30;
            score = 0; gameOver = false; setScore(0); cameraX = 0;
            player = { x: 80, y: floorY - PH, w: PW, h: PH, vx: 0, vy: 0, grounded: false, facing: 1 };

            platforms = [];
            enemies = [];
            coins = [];

            // Reset generation state
            floorGenX = -200;
            platGenX = 400;
            platGenY = floorY;
            enemyGenX = 600;
            coinGenX = 250;

            // Seed initial content
            generateAhead(c.width + SPAWN_AHEAD);
        }

        function generateAhead(targetX) {
            const floorY = c.height - 30;

            // Floor: continuous overlapping segments
            while (floorGenX < targetX) {
                platforms.push({ x: floorGenX, y: floorY, w: 420, h: 30, type: 'floor' });
                floorGenX += 400;
            }

            // Elevated platforms
            while (platGenX < targetX) {
                const gap = 80 + Math.random() * 100;
                const x = platGenX + gap + Math.random() * 80;
                let y = floorY - (50 + Math.random() * 80);
                if (y < platGenY - 110) y = platGenY - 100;
                // Bias back towards floor periodically
                if (Math.random() < 0.3) y = floorY - (40 + Math.random() * 50);
                const w = 80 + Math.random() * 120;
                platforms.push({ x: x, y: y, w: w, h: 16, type: 'platform' });
                platGenX = x + w;
                platGenY = y;
            }

            // Enemies
            while (enemyGenX < targetX) {
                const typeRoll = Math.random();
                let type = 'walker';
                if (typeRoll > 0.7) type = 'spike';
                else if (typeRoll > 0.4) type = 'flyer';
                let y = floorY - 20;
                if (type === 'flyer') y = floorY - 50 - Math.random() * 60;
                enemies.push({
                    x: enemyGenX, y: y, w: 24, h: 24,
                    vx: type === 'walker' ? -1 - Math.random() : (type === 'flyer' ? -0.5 : 0),
                    alive: true, baseY: y, type: type,
                    floatOffset: Math.random() * Math.PI * 2
                });
                enemyGenX += 300 + Math.random() * 400;
            }

            // Coins
            while (coinGenX < targetX) {
                coins.push({ x: coinGenX, y: c.height - 80 - Math.random() * 120, collected: false });
                coinGenX += 150 + Math.random() * 200;
            }
        }

        function cleanup() {
            const removeX = cameraX - DESPAWN_BEHIND;
            platforms = platforms.filter(p => p.x + p.w > removeX);
            enemies = enemies.filter(e => e.x + e.w > removeX);
            coins = coins.filter(co => co.x > removeX - 50);
        }

        function tick() {
            if (gameOver) return;
            const floorY = c.height - 30;

            // Infinite generation
            generateAhead(cameraX + c.width + SPAWN_AHEAD);
            cleanup();

            // Move
            player.vx = 0;
            if (keys['arrowleft'] || keys['a']) { player.vx = -MOVE_SPEED; player.facing = -1; }
            if (keys['arrowright'] || keys['d']) { player.vx = MOVE_SPEED; player.facing = 1; }
            if ((keys['arrowup'] || keys['w'] || keys[' ']) && player.grounded) {
                player.vy = JUMP_FORCE;
                player.grounded = false;
            }

            player.vy += GRAVITY;
            player.x += player.vx;
            player.y += player.vy;

            // Distance score (1 point per 10px forward)
            const distScore = Math.max(0, Math.floor(player.x / 10));
            if (distScore > score) { score = distScore; setScore(score); }

            // Platform collision
            player.grounded = false;
            if (player.y > c.height + 100) gameOver = true;

            for (const p of platforms) {
                if (player.x + player.w > p.x && player.x < p.x + p.w) {
                    if (player.vy >= 0 && player.y + player.h >= p.y && player.y + player.h < p.y + p.h + 16) {
                        player.y = p.y - player.h;
                        player.vy = 0;
                        player.grounded = true;
                    }
                    else if (player.vy < 0 && player.y > p.y + p.h && player.y < p.y + p.h + 10) {
                        player.y = p.y + p.h;
                        player.vy = 0;
                    }
                }
            }

            // Enemies
            for (const e of enemies) {
                if (!e.alive) continue;
                if (e.type === 'walker') {
                    e.x += e.vx;
                    let onPlatform = false;
                    for (const p of platforms) {
                        if (e.x + e.w > p.x && e.x < p.x + p.w && e.y + e.h >= p.y && e.y + e.h <= p.y + 5) {
                            onPlatform = true; break;
                        }
                    }
                    if (!onPlatform) e.vx *= -1;
                } else if (e.type === 'flyer') {
                    e.x += e.vx;
                    e.y = e.baseY + Math.sin(Date.now() / 300 + e.floatOffset) * 20;
                }

                if (player.x + player.w > e.x + 4 && player.x < e.x + e.w - 4 &&
                    player.y + player.h > e.y + 4 && player.y < e.y + e.h) {
                    const isStomp = player.vy > 0 && player.y + player.h < e.y + e.h / 2 + 10;
                    if (isStomp && e.type !== 'spike') {
                        e.alive = false;
                        player.vy = JUMP_FORCE * 0.7;
                        score += 150;
                        setScore(score);
                    } else {
                        gameOver = true;
                    }
                }
            }

            // Coins
            for (const co of coins) {
                if (co.collected) continue;
                const dist = Math.hypot(player.x + PW / 2 - co.x, player.y + PH / 2 - co.y);
                if (dist < 20) { co.collected = true; score += 50; setScore(score); }
            }

            cameraX = player.x - c.width / 3;

            draw();
            if (!gameOver) requestAnimationFrame(tick);
            else {
                const isNew = setHighscore('mario', score);
                const hs = getHighscore('mario');
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(0, 0, c.width, c.height);
                ctx.fillStyle = '#ff4757';
                ctx.font = '30px "Orbitron"';
                ctx.textAlign = 'center';
                ctx.fillText('GAME OVER', c.width / 2, c.height / 2 - 20);
                ctx.font = '16px "Rajdhani"';
                ctx.fillStyle = '#fff';
                ctx.fillText('SCORE: ' + score + (isNew ? '  ★ NEW HIGH!' : ''), c.width / 2, c.height / 2 + 10);
                ctx.fillStyle = '#888';
                ctx.fillText('HIGH SCORE: ' + hs, c.width / 2, c.height / 2 + 30);
                ctx.fillText('PRESS R TO RESTART', c.width / 2, c.height / 2 + 55);

                const restartHandler = (e) => {
                    if (e.key.toLowerCase() === 'r') {
                        window.removeEventListener('keydown', restartHandler);
                        reset();
                        requestAnimationFrame(tick);
                    }
                };
                window.addEventListener('keydown', restartHandler);
            }
        }

        function draw() {
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, c.width, c.height);

            ctx.save();
            ctx.translate(-cameraX, 0);

            // Only draw visible items
            const viewLeft = cameraX - 50;
            const viewRight = cameraX + c.width + 50;

            // Platforms
            ctx.fillStyle = '#333';
            for (const p of platforms) {
                if (p.x + p.w < viewLeft || p.x > viewRight) continue;
                ctx.fillRect(p.x, p.y, p.w, p.h);
                ctx.fillStyle = '#ff4757';
                ctx.fillRect(p.x, p.y, p.w, 2);
                ctx.fillStyle = '#333';
            }

            // Coins
            ctx.fillStyle = '#ffd700';
            for (const co of coins) {
                if (co.collected || co.x < viewLeft || co.x > viewRight) continue;
                ctx.beginPath();
                ctx.arc(co.x, co.y, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(co.x - 2, co.y - 2, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffd700';
            }

            // Enemies
            for (const e of enemies) {
                if (!e.alive || e.x + e.w < viewLeft || e.x > viewRight) continue;
                if (e.type === 'walker') {
                    ctx.fillStyle = '#ef0e0e';
                    ctx.fillRect(e.x, e.y, e.w, e.h);
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(e.x + (e.vx < 0 ? 4 : 14), e.y + 4, 6, 6);
                } else if (e.type === 'flyer') {
                    ctx.fillStyle = '#a55eea';
                    ctx.beginPath();
                    ctx.arc(e.x + e.w / 2, e.y + e.h / 2, e.w / 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = 'rgba(255,255,255,0.5)';
                    ctx.beginPath();
                    ctx.ellipse(e.x + e.w / 2, e.y + 4, 12, 4, 0, 0, Math.PI * 2);
                    ctx.fill();
                } else if (e.type === 'spike') {
                    ctx.fillStyle = '#d1ccc0';
                    ctx.beginPath();
                    ctx.moveTo(e.x, e.y + e.h);
                    ctx.lineTo(e.x + e.w / 2, e.y);
                    ctx.lineTo(e.x + e.w, e.y + e.h);
                    ctx.fill();
                }
            }

            // Player
            ctx.fillStyle = '#2ed573';
            ctx.fillRect(player.x, player.y, player.w, player.h);
            ctx.fillStyle = '#000';
            const eyeX = player.facing === 1 ? player.x + 14 : player.x + 4;
            ctx.fillRect(eyeX, player.y + 6, 4, 4);

            ctx.restore();
        }

        reset();
        tick();
    }

    // ═══════════════════════════════════════════
    //  🐦  FLAPPY BIRD (fills panel, with countdown)
    // ═══════════════════════════════════════════
    function startFlappy() {
        setHint('SPACE / CLICK TO FLAP');
        setPlayerVisibility(false);
        const c = makeCanvas();
        const ctx = c.getContext('2d');
        let bird, pipes, gravity, lift, frame, score, dead;
        let countdown = 3; // 3, 2, 1, then 0 = playing
        let countdownTimer = null;

        function reset() {
            bird = { x: c.width * 0.15, y: c.height / 2, v: 0, r: 14 };
            pipes = []; gravity = 0.3; lift = -6.5; frame = 0; score = 0; setScore(0); dead = false;
            countdown = 3;
            startCountdown();
        }
        function startCountdown() {
            // Show countdown overlay
            let existing = canvasContainer.querySelector('.countdown-overlay');
            if (existing) existing.remove();
            const overlay = document.createElement('div');
            overlay.className = 'countdown-overlay';
            overlay.innerHTML = '<span>' + countdown + '</span>';
            canvasContainer.appendChild(overlay);

            countdownTimer = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    overlay.innerHTML = '<span>' + countdown + '</span>';
                } else if (countdown === 0) {
                    overlay.innerHTML = '<span>GO!</span>';
                } else {
                    clearInterval(countdownTimer);
                    countdownTimer = null;
                    overlay.remove();
                }
            }, 700);
        }
        function tick() {
            if (dead || countdown > 0) return;
            // countdown === 0 means "GO!" is showing for one tick, -1 means playing
            if (countdown === 0) return;
            frame++; bird.v += gravity; bird.y += bird.v;
            if (bird.y + bird.r > c.height || bird.y - bird.r < 0) { dead = true; return; }
            const gapSize = Math.max(110, c.height * 0.28);
            if (frame % 90 === 0) {
                const top = 30 + Math.random() * (c.height - gapSize - 60);
                pipes.push({ x: c.width, top, gap: gapSize });
            }
            const pipeW = 50;
            for (let i = pipes.length - 1; i >= 0; i--) {
                const p = pipes[i]; p.x -= 3;
                if (p.x + pipeW < 0) { pipes.splice(i, 1); score++; setScore(score); continue; }
                if (bird.x + bird.r > p.x && bird.x - bird.r < p.x + pipeW &&
                    (bird.y - bird.r < p.top || bird.y + bird.r > p.top + p.gap)) dead = true;
            }
        }
        function draw() {
            // Sky gradient
            const grad = ctx.createLinearGradient(0, 0, 0, c.height);
            grad.addColorStop(0, '#050505'); grad.addColorStop(1, '#111');
            ctx.fillStyle = grad; ctx.fillRect(0, 0, c.width, c.height);
            // Bird
            ctx.fillStyle = '#ff4757';
            ctx.beginPath(); ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(bird.x + 5, bird.y - 3, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(bird.x + 6, bird.y - 3, 2, 0, Math.PI * 2); ctx.fill();
            // Pipes
            const pipeW = 50;
            pipes.forEach(p => {
                ctx.fillStyle = '#3a3a3a';
                ctx.fillRect(p.x, 0, pipeW, p.top);
                ctx.fillRect(p.x, p.top + p.gap, pipeW, c.height);
                ctx.fillStyle = '#555';
                ctx.fillRect(p.x - 3, p.top - 16, pipeW + 6, 16);
                ctx.fillRect(p.x - 3, p.top + p.gap, pipeW + 6, 16);
            });
            if (dead) {
                ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0, 0, c.width, c.height);
                const isNew = setHighscore('flappy', score);
                const hs = getHighscore('flappy');
                ctx.fillStyle = '#ff4757'; ctx.font = 'bold 28px Orbitron,monospace'; ctx.textAlign = 'center';
                ctx.fillText('GAME OVER', c.width / 2, c.height / 2 - 18);
                ctx.fillStyle = '#fff'; ctx.font = '14px monospace';
                ctx.fillText('SCORE: ' + score + (isNew ? '  ★ NEW HIGH!' : ''), c.width / 2, c.height / 2 + 6);
                ctx.fillStyle = '#888'; ctx.font = '13px monospace';
                ctx.fillText('HIGH: ' + hs + '  |  SPACE / Click to retry', c.width / 2, c.height / 2 + 24);
                ctx.textAlign = 'start';
            }
        }
        function flap() {
            if (activeGame !== 'flappy') return;
            if (dead) { if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; } reset(); }
            else if (countdown < 0) bird.v = lift;
        }
        reset();
        function loop() { tick(); draw(); gameLoopId = requestAnimationFrame(loop); }
        loop();
        keyHandler = e => { if (e.code === 'Space') { e.preventDefault(); flap(); } };
        window.addEventListener('keydown', keyHandler);
        c.addEventListener('click', flap);
    }

    // ═══════════════════════════════════════════
    //  ❌  TIC-TAC-TOE  (2-Player Offline)
    // ═══════════════════════════════════════════
    function startXO() {
        setHint('CLICK TO PLACE');
        setPlayerVisibility(true);
        player1Label.textContent = 'PLAYER 1 (X)';
        player2Label.textContent = 'PLAYER 2 (O)';

        const board = document.createElement('div'); board.className = 'xo-board';
        canvasContainer.appendChild(board);
        let cells = Array(9).fill(null), turn = 'X', gameOverXO = false;
        highlightTurn(1);
        setScore('-');

        let history = [], future = [];
        undoBtn.disabled = true; redoBtn.disabled = true;

        function render() {
            board.innerHTML = '';
            cells.forEach((v, i) => {
                const d = document.createElement('div');
                d.className = 'xo-cell' + (v === 'X' ? ' x' : v === 'O' ? ' o' : '');
                d.textContent = v || '';
                d.addEventListener('click', () => play(i));
                board.appendChild(d);
            });
        }
        function play(i) {
            if (cells[i] || gameOverXO) return;
            history.push({ cells: [...cells], turn });
            future = [];
            cells[i] = turn;
            const w = winner();
            render();
            undoBtn.disabled = false; redoBtn.disabled = true;
            if (w) {
                gameOverXO = true;
                setScore(w + ' WINS');
                highlightWinCells();
                setTimeout(() => { cells = Array(9).fill(null); turn = 'X'; gameOverXO = false; history = []; future = []; undoBtn.disabled = true; render(); setScore('-'); highlightTurn(1); }, 2500);
            } else if (!cells.includes(null)) {
                gameOverXO = true; setScore('DRAW');
                setTimeout(() => { cells = Array(9).fill(null); turn = 'X'; gameOverXO = false; history = []; future = []; undoBtn.disabled = true; render(); setScore('-'); highlightTurn(1); }, 2500);
            } else {
                turn = turn === 'X' ? 'O' : 'X';
                highlightTurn(turn === 'X' ? 1 : 2);
            }
        }
        function winner() {
            const w = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
            for (const [a, b, cc] of w) if (cells[a] && cells[a] === cells[b] && cells[a] === cells[cc]) return cells[a];
            return null;
        }
        function highlightWinCells() {
            const w = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
            const cellDivs = board.querySelectorAll('.xo-cell');
            for (const [a, b, cc] of w) {
                if (cells[a] && cells[a] === cells[b] && cells[a] === cells[cc]) {
                    cellDivs[a].classList.add('win');
                    cellDivs[b].classList.add('win');
                    cellDivs[cc].classList.add('win');
                }
            }
        }
        undoBtn.onclick = () => {
            if (!history.length || gameOverXO) return;
            future.push({ cells: [...cells], turn });
            const prev = history.pop();
            cells = prev.cells; turn = prev.turn;
            render(); highlightTurn(turn === 'X' ? 1 : 2);
            undoBtn.disabled = !history.length; redoBtn.disabled = false;
        };
        redoBtn.onclick = () => {
            if (!future.length || gameOverXO) return;
            history.push({ cells: [...cells], turn });
            const next = future.pop();
            cells = next.cells; turn = next.turn;
            render(); highlightTurn(turn === 'X' ? 1 : 2);
            undoBtn.disabled = false; redoBtn.disabled = !future.length;
        };
        render();
    }

    // ═══════════════════════════════════════════
    //  ♟  CHESS  (Full Rules · Captured · Undo/Redo)
    // ═══════════════════════════════════════════
    function startChess() {
        setHint('CLICK TO SELECT & MOVE');
        setPlayerVisibility(true);
        player1Label.textContent = 'WHITE';
        player2Label.textContent = 'BLACK';
    
        const aiToggle = document.getElementById('chess-ai-toggle');
    
        let capWhiteEl = document.getElementById('cap-white');
        let capBlackEl = document.getElementById('cap-black');
        if (!capWhiteEl) {
            const infoPanel = document.querySelector('.hideout-info');
            if (infoPanel) {
                let div1 = document.createElement('div');
                div1.className = 'captured-area'; div1.id = 'cap-area-white';
                div1.innerHTML = '<span class="cap-title">CAPTURED BY WHITE</span><div class="cap-pieces" id="cap-white"></div>';
                infoPanel.insertBefore(div1, infoPanel.querySelector('.info-hint'));
    
                let div2 = document.createElement('div');
                div2.className = 'captured-area'; div2.id = 'cap-area-black';
                div2.innerHTML = '<span class="cap-title">CAPTURED BY BLACK</span><div class="cap-pieces" id="cap-black"></div>';
                infoPanel.insertBefore(div2, infoPanel.querySelector('.info-hint'));
            }
            capWhiteEl = document.getElementById('cap-white');
            capBlackEl = document.getElementById('cap-black');
        }
    
        const wrapper = document.createElement('div'); wrapper.className = 'chess-wrapper';
        const leftCapCol = document.createElement('div'); leftCapCol.className = 'chess-captured-col'; leftCapCol.id = 'left-cap';
        const boardEl = document.createElement('div'); boardEl.className = 'chess-board';
        const rightCapCol = document.createElement('div'); rightCapCol.className = 'chess-captured-col'; rightCapCol.id = 'right-cap';
        wrapper.appendChild(leftCapCol);
        wrapper.appendChild(boardEl);
        wrapper.appendChild(rightCapCol);
        canvasContainer.appendChild(wrapper);
    
        const INIT = [
            ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
            ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
            ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
        ];
        const UNI = { r: '♜', n: '♞', b: '♝', q: '♛', k: '♚', p: '♟', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔', P: '♙' };
    
        let state = JSON.parse(JSON.stringify(INIT));
        let sel = null, legalMoves = [], turnW = true;
        let lastFrom = null, lastTo = null;
        let capturedByWhite = [], capturedByBlack = [];
        let history = [], future = [];
    
        let castling = { wK: true, wQ: true, bK: true, bQ: true };
        let enPassant = null; // {r, c}
    
        undoBtn.disabled = true; redoBtn.disabled = true;
        highlightTurn(1);
        setScore("WHITE'S TURN");
    
        function isWhite(pc) { return pc && pc === pc.toUpperCase(); }
        function isBlack(pc) { return pc && pc === pc.toLowerCase(); }
        function isAlly(pc, white) { return white ? isWhite(pc) : isBlack(pc); }
        function isEnemy(pc, white) { return white ? isBlack(pc) : isWhite(pc); }
        function inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
    
        function getPseudoMoves(board, r, c, epTarget, castleRights) {
            const pc = board[r][c];
            if (!pc) return [];
            const moves = [];
            const w = isWhite(pc);
            const type = pc.toLowerCase();
    
            function addIfValid(tr, tc) {
                if (!inBounds(tr, tc)) return false;
                if (isAlly(board[tr][tc], w)) return false;
                moves.push({ r: tr, c: tc });
                return !board[tr][tc]; // true if empty, false if enemy (stop slide)
            }
    
            function slide(dirs) {
                for (const [dr, dc] of dirs) {
                    for (let i = 1; i < 8; i++) { if (!addIfValid(r + dr * i, c + dc * i)) break; }
                }
            }
    
            if (type === 'p') {
                const dir = w ? -1 : 1;
                const startRow = w ? 6 : 1;
                // Move forward
                if (inBounds(r + dir, c) && !board[r + dir][c]) {
                    moves.push({ r: r + dir, c });
                    // Double move
                    if (r === startRow && !board[r + 2 * dir][c]) moves.push({ r: r + 2 * dir, c, epTargetObj: { r: r + dir, c: c } });
                }
                // Captures
                for (const dc of [-1, 1]) {
                    const tr = r + dir, tc = c + dc;
                    if (inBounds(tr, tc)) {
                        if (isEnemy(board[tr][tc], w)) moves.push({ r: tr, c: tc });
                        else if (epTarget && epTarget.r === tr && epTarget.c === tc) {
                            moves.push({ r: tr, c: tc, isEP: true });
                        }
                    }
                }
            } else if (type === 'n') {
                for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) addIfValid(r + dr, c + dc);
            } else if (type === 'b') {
                slide([[-1, -1], [-1, 1], [1, -1], [1, 1]]);
            } else if (type === 'r') {
                slide([[-1, 0], [1, 0], [0, -1], [0, 1]]);
            } else if (type === 'q') {
                slide([[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]);
            } else if (type === 'k') {
                for (const [dr, dc] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) addIfValid(r + dr, c + dc);
    
                // Castling
                if (castleRights) {
                    if (w && r === 7 && c === 4) {
                        if (castleRights.wK && !board[7][5] && !board[7][6]) moves.push({ r: 7, c: 6, castle: 'K' });
                        if (castleRights.wQ && !board[7][3] && !board[7][2] && !board[7][1]) moves.push({ r: 7, c: 2, castle: 'Q' });
                    } else if (!w && r === 0 && c === 4) {
                        if (castleRights.bK && !board[0][5] && !board[0][6]) moves.push({ r: 0, c: 6, castle: 'k' });
                        if (castleRights.bQ && !board[0][3] && !board[0][2] && !board[0][1]) moves.push({ r: 0, c: 2, castle: 'q' });
                    }
                }
            }
            return moves;
        }
    
        function findKing(board, white) {
            const k = white ? 'K' : 'k';
            for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (board[r][c] === k) return { r, c };
            return null;
        }
    
        function isSquareAttacked(board, r, c, byWhite) {
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 8; j++) {
                    const pc = board[i][j];
                    if (pc && isAlly(pc, byWhite)) {
                        const pm = getPseudoMoves(board, i, j, null, null);
                        if (pm.some(m => m.r === r && m.c === c)) return true;
                    }
                }
            }
            return false;
        }
    
        function isInCheck(board, white) {
            const king = findKing(board, white);
            if (!king) return false;
            return isSquareAttacked(board, king.r, king.c, !white);
        }
    
        function applyMoveFast(b, r, c, m, white) {
            let cap = b[m.r][m.c] || null;
            b[m.r][m.c] = b[r][c];
            b[r][c] = '';
            let isEP = false;
            if (m.isEP) {
                b[r][m.c] = '';
                cap = white ? 'p' : 'P';
                isEP = true;
            }
            // castling helper inside fast move not strictly simulating full rook move just for check,
            // but for legality check we only need king moved to see if in check.
            if (b[m.r][m.c].toLowerCase() === 'p' && (m.r === 0 || m.r === 7)) b[m.r][m.c] = white ? 'Q' : 'q';
            return cap;
        }
    
        function getLegalMoves(board, r, c, epTarget, castleRights) {
            const pc = board[r][c];
            if (!pc) return [];
            const w = isWhite(pc);
            const pMoves = getPseudoMoves(board, r, c, epTarget, castleRights);
    
            return pMoves.filter(m => {
                if (m.castle) {
                    if (isInCheck(board, w)) return false;
                    const path = m.castle.toUpperCase() === 'K' ? [5, 6] : [3, 2];
                    for (let dst of path) {
                        const copy = board.map(row => [...row]);
                        copy[r][dst] = copy[r][c];
                        copy[r][c] = '';
                        if (isInCheck(copy, w)) return false;
                    }
                    return true;
                } else {
                    const copy = board.map(row => [...row]);
                    applyMoveFast(copy, r, c, m, w);
                    return !isInCheck(copy, w);
                }
            });
        }
    
        function getAllLegalMoves(board, white, epTarget, castleRights) {
            let moves = [];
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (isAlly(board[r][c], white)) {
                        let vm = getLegalMoves(board, r, c, epTarget, castleRights);
                        for (let m of vm) moves.push({ from: { r, c }, to: m, piece: board[r][c] });
                    }
                }
            }
            return moves;
        }
    
        function getGameStatus(board, white, epTarget, castleRights) {
            const moves = getAllLegalMoves(board, white, epTarget, castleRights);
            if (moves.length > 0) return 'playing';
            return isInCheck(board, white) ? 'checkmate' : 'stalemate';
        }
    
        // ======================= MINIMAX AI (GM Level Simulation) =======================
        const V = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
        // Simple PSTs centered around middle control and king safety
        const PST_P = [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [50, 50, 50, 50, 50, 50, 50, 50],
            [10, 10, 20, 30, 30, 20, 10, 10],
            [5, 5, 10, 25, 25, 10, 5, 5],
            [0, 0, 0, 20, 20, 0, 0, 0],
            [5, -5, -10, 0, 0, -10, -5, 5],
            [5, 10, 10, -20, -20, 10, 10, 5],
            [0, 0, 0, 0, 0, 0, 0, 0]
        ];
        const PST_N = [
            [-50, -40, -30, -30, -30, -30, -40, -50],
            [-40, -20, 0, 0, 0, 0, -20, -40],
            [-30, 0, 10, 15, 15, 10, 0, -30],
            [-30, 5, 15, 20, 20, 15, 5, -30],
            [-30, 0, 15, 20, 20, 15, 0, -30],
            [-30, 5, 10, 15, 15, 10, 5, -30],
            [-40, -20, 0, 5, 5, 0, -20, -40],
            [-50, -40, -30, -30, -30, -30, -40, -50]
        ];
        const PST_B = [
            [-20, -10, -10, -10, -10, -10, -10, -20],
            [-10, 0, 0, 0, 0, 0, 0, -10],
            [-10, 0, 5, 10, 10, 5, 0, -10],
            [-10, 5, 5, 10, 10, 5, 5, -10],
            [-10, 0, 10, 10, 10, 10, 0, -10],
            [-10, 10, 10, 10, 10, 10, 10, -10],
            [-10, 5, 0, 0, 0, 0, 5, -10],
            [-20, -10, -10, -10, -10, -10, -10, -20]
        ];
        const PST = { p: PST_P, n: PST_N, b: PST_B, r: PST_B /* simplified r */, q: PST_B, k: PST_B };
    
        function evaluateBoard(board) {
            let score = 0;
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    let pc = board[r][c];
                    if (!pc) continue;
                    let isW = isWhite(pc);
                    let type = pc.toLowerCase();
                    let val = V[type];
    
                    // PST
                    let rPst = isW ? r : 7 - r;
                    let pstVal = PST[type] ? PST[type][rPst][c] : 0;
    
                    if (isW) score += (val + pstVal);
                    else score -= (val + pstVal);
                }
            }
            return score;
        }
    
        function executeFakeMove(b, m, w) {
            let cap = b[m.to.r][m.to.c];
            b[m.to.r][m.to.c] = b[m.from.r][m.from.c];
            b[m.from.r][m.from.c] = '';
            if (m.to.isEP) { cap = w ? 'p' : 'P'; b[m.from.r][m.to.c] = ''; }
            if (m.to.castle) {
                // ignoring rook move for eval speed since eval only checks material/position
            }
            if (b[m.to.r][m.to.c].toLowerCase() === 'p' && (m.to.r === 0 || m.to.r === 7)) b[m.to.r][m.to.c] = w ? 'Q' : 'q';
            return cap;
        }
    
        function minimax(board, depth, alpha, beta, isMax, ep, cr) {
            if (depth === 0) return evaluateBoard(board);
            let moves = getAllLegalMoves(board, isMax, ep, cr);
            if (moves.length === 0) return isInCheck(board, isMax) ? (isMax ? -99999 + (4 - depth) : 99999 - (4 - depth)) : 0;
    
            // Move ordering: captures first
            moves.sort((a, b) => {
                let vA = board[a.to.r][a.to.c] ? 1 : 0;
                let vB = board[b.to.r][b.to.c] ? 1 : 0;
                return vB - vA;
            });
    
            if (isMax) {
                let best = -Infinity;
                for (let m of moves) {
                    let bCopy = board.map(row => [...row]);
                    executeFakeMove(bCopy, m, true);
                    let val = minimax(bCopy, depth - 1, alpha, beta, false, null, cr);
                    best = Math.max(best, val);
                    alpha = Math.max(alpha, best);
                    if (beta <= alpha) break;
                }
                return best;
            } else {
                let best = Infinity;
                for (let m of moves) {
                    let bCopy = board.map(row => [...row]);
                    executeFakeMove(bCopy, m, false);
                    let val = minimax(bCopy, depth - 1, alpha, beta, true, null, cr);
                    best = Math.min(best, val);
                    beta = Math.min(beta, best);
                    if (beta <= alpha) break;
                }
                return best;
            }
        }
    
        function getBestMoveAI() {
            let bestMove = null;
            let bestVal = Infinity; // Black is minimizing
            let moves = getAllLegalMoves(state, false, enPassant, castling);
            // Move ordering
            moves.sort((a, b) => (state[b.to.r][b.to.c] ? 1 : 0) - (state[a.to.r][a.to.c] ? 1 : 0));
    
            // Depth 3 is reasonable for fast browser play
            const DEPTH = 3;
    
            for (let m of moves) {
                let bCopy = state.map(row => [...row]);
                executeFakeMove(bCopy, m, false);
                let val = minimax(bCopy, DEPTH - 1, -Infinity, Infinity, true, null, castling);
    
                // Add a tiny randomness to avoid repeated deterministic games if equal
                val += (Math.random() - 0.5) * 5;
    
                if (val < bestVal) {
                    bestVal = val;
                    bestMove = m;
                }
            }
            return bestMove;
        }
    
        // ======================= RENDER & INTERACT =======================
        function commitMove(r, c, to) {
            history.push({
                state: state.map(row => [...row]), turnW,
                lastFrom: lastFrom ? { ...lastFrom } : null, lastTo: lastTo ? { ...lastTo } : null,
                capturedByWhite: [...capturedByWhite], capturedByBlack: [...capturedByBlack],
                castling: JSON.parse(JSON.stringify(castling)),
                enPassant: enPassant ? { ...enPassant } : null
            });
            future = [];
            undoBtn.disabled = false; redoBtn.disabled = true;
    
            const w = isWhite(state[r][c]);
            let captured = state[to.r][to.c];
    
            // Execute move
            state[to.r][to.c] = state[r][c];
            state[r][c] = '';
    
            // En Passant capture execution
            if (to.isEP) {
                captured = w ? 'p' : 'P';
                state[r][to.c] = '';
            }
    
            // Castling Execution
            if (to.castle) {
                if (to.castle === 'K') { state[7][5] = 'R'; state[7][7] = ''; }
                if (to.castle === 'Q') { state[7][3] = 'R'; state[7][0] = ''; }
                if (to.castle === 'k') { state[0][5] = 'r'; state[0][7] = ''; }
                if (to.castle === 'q') { state[0][3] = 'r'; state[0][0] = ''; }
            }
    
            // Promotion (Auto Queen)
            if (state[to.r][to.c].toLowerCase() === 'p' && (to.r === 0 || to.r === 7)) {
                state[to.r][to.c] = w ? 'Q' : 'q';
            }
    
            // Update Rights
            if (state[to.r][to.c] === 'K') { castling.wK = false; castling.wQ = false; }
            if (state[to.r][to.c] === 'k') { castling.bK = false; castling.bQ = false; }
            if (state[to.r][to.c] === 'R' && r === 7 && c === 7) castling.wK = false;
            if (state[to.r][to.c] === 'R' && r === 7 && c === 0) castling.wQ = false;
            if (state[to.r][to.c] === 'r' && r === 0 && c === 7) castling.bK = false;
            if (state[to.r][to.c] === 'r' && r === 0 && c === 0) castling.bQ = false;
    
            // Ep Target updating
            enPassant = to.epTargetObj ? to.epTargetObj : null;
    
            if (captured) {
                if (w) capturedByWhite.push(captured);
                else capturedByBlack.push(captured);
            }
    
            lastFrom = { r, c }; lastTo = { r: to.r, c: to.c };
            sel = null; legalMoves = []; turnW = !turnW;
    
            render();
            checkAITurn();
        }
    
        let isAITurn = false;
        function checkAITurn() {
            const status = getGameStatus(state, turnW, enPassant, castling);
            if (status !== 'playing') return;
    
            if (aiToggle && aiToggle.checked && !turnW && !isAITurn) {
                isAITurn = true;
                setTimeout(() => {
                    const aiMove = getBestMoveAI();
                    if (aiMove) {
                        commitMove(aiMove.from.r, aiMove.from.c, aiMove.to);
                    }
                    isAITurn = false;
                }, 100);
            }
        }
    
        aiToggle.addEventListener('change', () => { checkAITurn(); });
    
        function renderCaptured() {
            leftCapCol.innerHTML = capturedByWhite.map(p => '<span class="black-piece">' + UNI[p] + '</span>').join('');
            rightCapCol.innerHTML = capturedByBlack.map(p => '<span class="white-piece">' + UNI[p] + '</span>').join('');
            if (capWhiteEl) capWhiteEl.innerHTML = capturedByWhite.map(p => UNI[p]).join(' ');
            if (capBlackEl) capBlackEl.innerHTML = capturedByBlack.map(p => UNI[p]).join(' ');
        }
    
        function render() {
            boardEl.innerHTML = '';
            const kingPos = findKing(state, turnW);
            const inChk = isInCheck(state, turnW);
    
            for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
                const d = document.createElement('div');
                const isLight = (r + c) % 2 === 0;
                d.className = 'chess-cell ' + (isLight ? 'light' : 'dark');
    
                if (lastFrom && lastFrom.r === r && lastFrom.c === c) d.classList.add('last-move');
                if (lastTo && lastTo.r === r && lastTo.c === c) d.classList.add('last-move');
                if (sel && sel.r === r && sel.c === c) d.classList.add('selected');
                if (inChk && kingPos && kingPos.r === r && kingPos.c === c) d.classList.add('in-check');
                if (legalMoves.some(m => m.r === r && m.c === c)) {
                    d.classList.add(state[r][c] ? 'legal-capture' : 'legal-move');
                }
    
                const pc = state[r][c];
                if (pc) {
                    const span = document.createElement('span');
                    span.textContent = UNI[pc];
                    span.className = 'chess-piece ' + (isWhite(pc) ? 'white-piece' : 'black-piece');
                    d.appendChild(span);
                }
                d.addEventListener('click', () => handleClick(r, c));
                boardEl.appendChild(d);
            }
    
            renderCaptured();
    
            const status = getGameStatus(state, turnW, enPassant, castling);
            if (status === 'checkmate') setScore((turnW ? 'BLACK' : 'WHITE') + ' WINS!');
            else if (status === 'stalemate') setScore('STALEMATE');
            else if (inChk) setScore((turnW ? 'WHITE' : 'BLACK') + ' IN CHECK');
            else setScore(turnW ? "WHITE'S TURN" : "BLACK'S TURN");
            highlightTurn(turnW ? 1 : 2);
        }
    
        function handleClick(r, c) {
            if (isAITurn && !turnW) return; // Block input while AI thinks
            const status = getGameStatus(state, turnW, enPassant, castling);
            if (status !== 'playing') return;
            const pc = state[r][c];
    
            if (sel) {
                if (sel.r === r && sel.c === c) { sel = null; legalMoves = []; render(); return; }
                const moveTarget = legalMoves.find(m => m.r === r && m.c === c);
                if (moveTarget) {
                    commitMove(sel.r, sel.c, moveTarget);
                    return;
                }
                if (pc && isAlly(pc, turnW)) { sel = { r, c }; legalMoves = getLegalMoves(state, r, c, enPassant, castling); render(); return; }
                sel = null; legalMoves = []; render();
            } else {
                if (pc && isAlly(pc, turnW)) { sel = { r, c }; legalMoves = getLegalMoves(state, r, c, enPassant, castling); render(); }
            }
        }
    
        undoBtn.onclick = () => {
            if (!history.length || isAITurn) return;
            future.push({
                state: state.map(row => [...row]), turnW,
                lastFrom: lastFrom ? { ...lastFrom } : null, lastTo: lastTo ? { ...lastTo } : null,
                capturedByWhite: [...capturedByWhite], capturedByBlack: [...capturedByBlack],
                castling: JSON.parse(JSON.stringify(castling)),
                enPassant: enPassant ? { ...enPassant } : null
            });
            const prev = history.pop();
            state = prev.state; turnW = prev.turnW; lastFrom = prev.lastFrom; lastTo = prev.lastTo;
            capturedByWhite = prev.capturedByWhite; capturedByBlack = prev.capturedByBlack;
            castling = prev.castling; enPassant = prev.enPassant;
            sel = null; legalMoves = [];
            undoBtn.disabled = !history.length; redoBtn.disabled = false;
            render();
            checkAITurn();
        };
    
        redoBtn.onclick = () => {
            if (!future.length || isAITurn) return;
            history.push({
                state: state.map(row => [...row]), turnW,
                lastFrom: lastFrom ? { ...lastFrom } : null, lastTo: lastTo ? { ...lastTo } : null,
                capturedByWhite: [...capturedByWhite], capturedByBlack: [...capturedByBlack],
                castling: JSON.parse(JSON.stringify(castling)),
                enPassant: enPassant ? { ...enPassant } : null
            });
            const next = future.pop();
            state = next.state; turnW = next.turnW; lastFrom = next.lastFrom; lastTo = next.lastTo;
            capturedByWhite = next.capturedByWhite; capturedByBlack = next.capturedByBlack;
            castling = next.castling; enPassant = next.enPassant;
            sel = null; legalMoves = [];
            undoBtn.disabled = false; redoBtn.disabled = !future.length;
            render();
            checkAITurn();
        };
        render();
        checkAITurn();
    }
    

    // ═══════════════════════════════════════════
    //  🎲  3D RUBIK'S CUBE — Pattern Match
    // ═══════════════════════════════════════════
    function startCube() {
        setHint('KEYBOARD: U D L R F B | SHIFT = REVERSE');
        setPlayerVisibility(false);
        canvasContainer.innerHTML = ''; // Clear previous games

        if (controlsHint) {
            controlsHint.innerHTML = `
                <div style="font-family:'Rajdhani',monospace; font-size:14px; line-height:1.8;">
                    <strong style="color:#ff4757; font-size:16px;">FACE ROTATIONS:</strong>
                    <br>
                    <span style="color:#fff; font-weight:700;">U</span> <span style="color:#aaa">=</span> <span style="color:#00cc44">Top layer CW</span><br>
                    <span style="color:#fff; font-weight:700;">D</span> <span style="color:#aaa">=</span> <span style="color:#00cc44">Bottom CW</span><br>
                    <span style="color:#fff; font-weight:700;">L</span> <span style="color:#aaa">=</span> <span style="color:#00cc44">Left CW</span><br>
                    <span style="color:#fff; font-weight:700;">R</span> <span style="color:#aaa">=</span> <span style="color:#00cc44">Right CW</span><br>
                    <span style="color:#fff; font-weight:700;">F</span> <span style="color:#aaa">=</span> <span style="color:#00cc44">Front CW</span><br>
                    <span style="color:#fff; font-weight:700;">B</span> <span style="color:#aaa">=</span> <span style="color:#00cc44">Back CW</span><br>
                    <br>
                    <span style="color:#ff4757; font-weight:700;">SHIFT + key</span> = <span style="color:#fff;">Counter-CW</span><br>
                    <br>
                    <strong style="color:#ff4757; font-size:16px;">CAMERA:</strong><br>
                    <span style="color:#fff;">Drag empty space</span><br>
                    <span style="color:#00cc44;">to orbit cube</span>
                </div>
            `;
        }

        // UI Setup
        const wrapper = document.createElement('div');
        wrapper.className = 'cube-game-area';

        wrapper.innerHTML = `
            <div id="cube-canvas-container" style="width: 100%; height: 60vh; position: relative;"></div>
            <div class="cube-info" style="display: flex; gap: 20px; text-align: center; margin-top: 10px;">
                <div class="cube-status" id="cube-status" style="font-size: 1.2rem; color: #ff4757; font-weight: bold;">RUBIK'S CUBE</div>
                <button id="scramble-btn" class="sidebar-btn" style="padding: 5px 15px; font-size: 0.9rem;">SCRAMBLE</button>
            </div>
        `;
        canvasContainer.appendChild(wrapper);

        const container3D = document.getElementById('cube-canvas-container');
        const statusEl = document.getElementById('cube-status');
        const scrambleBtn = document.getElementById('scramble-btn');

        // Three.js Setup
        if (typeof THREE === 'undefined') {
            statusEl.textContent = 'ERROR: Three.js failed to load.';
            return;
        }

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, container3D.clientWidth / container3D.clientHeight, 0.1, 100);
        camera.position.set(5.5, 4.5, 6.5);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container3D.clientWidth, container3D.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container3D.appendChild(renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        scene.add(dirLight);

        // Colors (Standard Rubik's: U:White, D:Yellow, F:Green, B:Blue, L:Orange, R:Red)
        // Adjusting colors to fit the dark theme slightly better, but keeping recognizable Rubik's colors
        const colors = {
            right: 0xff3333, // Red
            left: 0xff8c00, // Orange
            top: 0xeeeeee, // White
            bottom: 0xffd700, // Yellow
            front: 0x00cc44, // Green
            back: 0x2266ff  // Blue
        };

        const materials = [
            new THREE.MeshPhongMaterial({ color: colors.right, shininess: 50 }),
            new THREE.MeshPhongMaterial({ color: colors.left, shininess: 50 }),
            new THREE.MeshPhongMaterial({ color: colors.top, shininess: 50 }),
            new THREE.MeshPhongMaterial({ color: colors.bottom, shininess: 50 }),
            new THREE.MeshPhongMaterial({ color: colors.front, shininess: 50 }),
            new THREE.MeshPhongMaterial({ color: colors.back, shininess: 50 }),
        ];

        const blackMat = new THREE.MeshPhongMaterial({ color: 0x111111 });

        const cubeGroup = new THREE.Group();
        scene.add(cubeGroup);

        const cubies = [];
        const gap = 0.05;
        const size = 1;

        // Build 3x3x3
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const geometry = new THREE.BoxGeometry(size, size, size);
                    // Determine which faces need color based on position
                    const mats = [];
                    mats.push(x === 1 ? materials[0] : blackMat);  // Right
                    mats.push(x === -1 ? materials[1] : blackMat); // Left
                    mats.push(y === 1 ? materials[2] : blackMat);  // Top
                    mats.push(y === -1 ? materials[3] : blackMat); // Bottom
                    mats.push(z === 1 ? materials[4] : blackMat);  // Front
                    mats.push(z === -1 ? materials[5] : blackMat); // Back

                    const mesh = new THREE.Mesh(geometry, mats);
                    mesh.position.set(
                        x * (size + gap),
                        y * (size + gap),
                        z * (size + gap)
                    );

                    // Add slight bevel/edge effect by adding a slightly larger wireframe or black box
                    const edgeGeo = new THREE.EdgesGeometry(geometry);
                    const edgeMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
                    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
                    mesh.add(edges);

                    mesh.userData = { x, y, z };
                    cubies.push(mesh);
                    cubeGroup.add(mesh);
                }
            }
        }

        // --- Interaction Logic ---
        let isDragging = false;
        let isRotatingLayer = false;
        let previousMousePosition = { x: 0, y: 0 };

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        let selectedCubie = null;
        let intersectNormal = null;
        let dragAxis = null; // 'x', 'y', or 'z'
        let dragLayer = null; // array of cubies to rotate
        let dragStartAngle = 0;
        let currentDragAngle = 0;

        container3D.addEventListener('mousedown', (e) => {
            const rect = container3D.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(cubies);

            if (intersects.length > 0) {
                // Clicked on a cubie - prepare for layer rotation
                selectedCubie = intersects[0].object;
                intersectNormal = intersects[0].face.normal.clone().transformDirection(cubeGroup.matrixWorld).round();
                isRotatingLayer = true;
                dragAxis = null;
                dragLayer = null;
            } else {
                // Clicked empty space - whole cube rotation
                isDragging = true;
            }
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        container3D.addEventListener('mousemove', (e) => {
            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };

            if (isDragging) {
                const rotSpeed = 0.01;
                const deltaRotationQuaternion = new THREE.Quaternion().setFromEuler(
                    new THREE.Euler(deltaMove.y * rotSpeed, deltaMove.x * rotSpeed, 0, 'XYZ')
                );
                cubeGroup.quaternion.multiplyQuaternions(deltaRotationQuaternion, cubeGroup.quaternion);
            } else if (isRotatingLayer && selectedCubie) {
                // Determine drag axis on first significant movement
                if (!dragAxis && (Math.abs(deltaMove.x) > 3 || Math.abs(deltaMove.y) > 3)) {
                    const nAbs = { x: Math.abs(intersectNormal.x), y: Math.abs(intersectNormal.y), z: Math.abs(intersectNormal.z) };

                    // Determine which axis to rotate around based on face clicked and drag direction
                    // If clicking the Right/Left face (normal X)
                    if (nAbs.x > 0.5) {
                        dragAxis = Math.abs(deltaMove.y) > Math.abs(deltaMove.x) ? 'z' : 'y';
                    }
                    // If clicking Top/Bottom face (normal Y)
                    else if (nAbs.y > 0.5) {
                        dragAxis = Math.abs(deltaMove.y) > Math.abs(deltaMove.x) ? 'x' : 'z';
                    }
                    // If clicking Front/Back face (normal Z)
                    else if (nAbs.z > 0.5) {
                        // Moving X (left/right) -> rotate around Y axis (top to bottom)
                        // Moving Y (up/down) -> rotate around X axis (left to right)
                        dragAxis = Math.abs(deltaMove.x) > Math.abs(deltaMove.y) ? 'y' : 'x';
                    }

                    // Collect cubies in the same layer
                    dragLayer = [];
                    const threshold = 0.5;
                    const layerValue = selectedCubie.position[dragAxis];

                    cubies.forEach(c => {
                        if (Math.abs(c.position[dragAxis] - layerValue) < threshold) {
                            dragLayer.push(c);
                        }
                    });
                }

                if (dragAxis && dragLayer) {
                    // Apply visual rotation based on mouse movement
                    let angle = 0;

                    if (dragAxis === 'x') angle = deltaMove.y * 0.02; // Dragging up/down spins X
                    else if (dragAxis === 'y') angle = deltaMove.x * 0.02; // Dragging left/right spins Y
                    else if (dragAxis === 'z') {
                        // Z depends on which face was grabbed
                        const nAbs = { x: Math.abs(intersectNormal.x), y: Math.abs(intersectNormal.y) };
                        if (nAbs.x > 0.5) angle = deltaMove.y * -0.02; // Drag up/down on X face
                        else angle = deltaMove.x * 0.02; // Drag left/right on Y face
                    }

                    currentDragAngle += angle;

                    const axisVec = new THREE.Vector3(
                        dragAxis === 'x' ? 1 : 0,
                        dragAxis === 'y' ? 1 : 0,
                        dragAxis === 'z' ? 1 : 0
                    );

                    // Apply rotation to each cubie in the layer
                    dragLayer.forEach(c => {
                        c.position.applyAxisAngle(axisVec, angle);
                        c.rotateOnWorldAxis(axisVec, angle);
                    });
                }
            }

            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
            if (isRotatingLayer && dragLayer && dragAxis) {
                // Determine direction based on angle
                const snapAngle = Math.round(currentDragAngle / (Math.PI / 2)) * (Math.PI / 2);
                const diff = snapAngle - currentDragAngle;

                // Create a temporary pivot to snap the entire layer accurately
                const pivot = new THREE.Object3D();
                pivot.rotation.set(0, 0, 0);
                cubeGroup.add(pivot);

                // Attach layer pieces to pivot
                dragLayer.forEach(c => {
                    pivot.attach(c);
                });

                // Apply the remaining difference to snap
                const axisVec = new THREE.Vector3(
                    dragAxis === 'x' ? 1 : 0,
                    dragAxis === 'y' ? 1 : 0,
                    dragAxis === 'z' ? 1 : 0
                );

                pivot.rotateOnAxis(axisVec, diff);
                pivot.updateMatrixWorld();

                // Detach back to cubeGroup
                dragLayer.forEach(c => {
                    cubeGroup.attach(c);

                    // Force strict grid rounding to entirely eliminate floating point drift
                    c.position.x = Math.round(c.position.x / (size + gap)) * (size + gap);
                    c.position.y = Math.round(c.position.y / (size + gap)) * (size + gap);
                    c.position.z = Math.round(c.position.z / (size + gap)) * (size + gap);

                    // Cleanly align rotations
                    const euler = new THREE.Euler().setFromQuaternion(c.quaternion);
                    euler.x = Math.round(euler.x / (Math.PI / 2)) * (Math.PI / 2);
                    euler.y = Math.round(euler.y / (Math.PI / 2)) * (Math.PI / 2);
                    euler.z = Math.round(euler.z / (Math.PI / 2)) * (Math.PI / 2);
                    c.quaternion.setFromEuler(euler);

                    c.updateMatrix();

                    // Update userData for logical state
                    c.userData.x = Math.round(c.position.x / (size + gap));
                    c.userData.y = Math.round(c.position.y / (size + gap));
                    c.userData.z = Math.round(c.position.z / (size + gap));
                });

                // Cleanup pivot
                cubeGroup.remove(pivot);
            }
            isRotatingLayer = false;
            selectedCubie = null;
            dragLayer = null;
            currentDragAngle = 0;
            dragAxis = null;
        });

        // Real Scramble — programmatic face rotations
        let isScrambling = false;
        function scramble() {
            if (isScrambling) return;
            isScrambling = true;
            statusEl.textContent = 'SCRAMBLING...';
            statusEl.style.color = '#f9ca24';

            const axes = ['x', 'y', 'z'];
            const layerValues = [-(size + gap), 0, (size + gap)];
            let moveIndex = 0;
            const totalMoves = 20;

            function doMove() {
                if (moveIndex >= totalMoves) {
                    statusEl.textContent = 'SOLVE IT!';
                    statusEl.style.color = '#00cc44';
                    isScrambling = false;
                    return;
                }

                const axis = axes[Math.floor(Math.random() * 3)];
                const layerVal = layerValues[Math.floor(Math.random() * 3)];
                const direction = Math.random() > 0.5 ? 1 : -1;
                const rotAngle = direction * Math.PI / 2;
                const threshold = 0.5;

                // Collect cubies in this layer
                const layer = cubies.filter(c => Math.abs(c.position[axis] - layerVal) < threshold);

                const axisVec = new THREE.Vector3(
                    axis === 'x' ? 1 : 0,
                    axis === 'y' ? 1 : 0,
                    axis === 'z' ? 1 : 0
                );

                // Apply rotation
                layer.forEach(c => {
                    c.position.applyAxisAngle(axisVec, rotAngle);
                    c.rotateOnWorldAxis(axisVec, rotAngle);

                    // Snap position
                    c.position.x = Math.round(c.position.x / (size + gap)) * (size + gap);
                    c.position.y = Math.round(c.position.y / (size + gap)) * (size + gap);
                    c.position.z = Math.round(c.position.z / (size + gap)) * (size + gap);

                    // Snap rotation
                    const euler = new THREE.Euler().setFromQuaternion(c.quaternion);
                    euler.x = Math.round(euler.x / (Math.PI / 2)) * (Math.PI / 2);
                    euler.y = Math.round(euler.y / (Math.PI / 2)) * (Math.PI / 2);
                    euler.z = Math.round(euler.z / (Math.PI / 2)) * (Math.PI / 2);
                    c.quaternion.setFromEuler(euler);
                    c.updateMatrix();

                    c.userData.x = Math.round(c.position.x / (size + gap));
                    c.userData.y = Math.round(c.position.y / (size + gap));
                    c.userData.z = Math.round(c.position.z / (size + gap));
                });

                moveIndex++;
                setTimeout(doMove, 80); // Animate at ~12fps
            }

            doMove();
        }

        scrambleBtn.addEventListener('click', scramble);

        // --- Keyboard Face Rotation ---
        // U=Top, D=Bottom, L=Left, R=Right, F=Front, B=Back
        // Shift reverses direction
        function rotateFaceByKey(axis, layerVal, direction) {
            if (isScrambling) return;
            const threshold = 0.5;
            const rotAngle = direction * Math.PI / 2;
            const layer = cubies.filter(c => Math.abs(c.position[axis] - layerVal) < threshold);
            const axisVec = new THREE.Vector3(
                axis === 'x' ? 1 : 0,
                axis === 'y' ? 1 : 0,
                axis === 'z' ? 1 : 0
            );
            layer.forEach(c => {
                c.position.applyAxisAngle(axisVec, rotAngle);
                c.rotateOnWorldAxis(axisVec, rotAngle);
                c.position.x = Math.round(c.position.x / (size + gap)) * (size + gap);
                c.position.y = Math.round(c.position.y / (size + gap)) * (size + gap);
                c.position.z = Math.round(c.position.z / (size + gap)) * (size + gap);
                const euler = new THREE.Euler().setFromQuaternion(c.quaternion);
                euler.x = Math.round(euler.x / (Math.PI / 2)) * (Math.PI / 2);
                euler.y = Math.round(euler.y / (Math.PI / 2)) * (Math.PI / 2);
                euler.z = Math.round(euler.z / (Math.PI / 2)) * (Math.PI / 2);
                c.quaternion.setFromEuler(euler);
                c.updateMatrix();
                c.userData.x = Math.round(c.position.x / (size + gap));
                c.userData.y = Math.round(c.position.y / (size + gap));
                c.userData.z = Math.round(c.position.z / (size + gap));
            });
        }

        keyHandler = function (e) {
            if (e.type !== 'keydown') return;
            const dir = e.shiftKey ? -1 : 1;
            const topVal = (size + gap);
            const botVal = -(size + gap);
            switch (e.key.toLowerCase()) {
                case 'u': rotateFaceByKey('y', topVal, dir); break;     // Top
                case 'd': rotateFaceByKey('y', botVal, -dir); break;    // Bottom
                case 'l': rotateFaceByKey('x', botVal, -dir); break;    // Left
                case 'r': rotateFaceByKey('x', topVal, dir); break;     // Right
                case 'f': rotateFaceByKey('z', topVal, dir); break;     // Front
                case 'b': rotateFaceByKey('z', botVal, -dir); break;    // Back
            }
        };
        window.addEventListener('keydown', keyHandler);

        // Render Loop
        gameLoopId = requestAnimationFrame(function animate() {
            renderer.render(scene, camera);
            if (activeGame === 'cube') {
                gameLoopId = requestAnimationFrame(animate);
            }
        });

        // Handle Resize within container
        const resizeObserver = new ResizeObserver(entries => {
            if (!activeGame || activeGame !== 'cube') return;
            for (let entry of entries) {
                camera.aspect = entry.contentRect.width / entry.contentRect.height;
                camera.updateProjectionMatrix();
                renderer.setSize(entry.contentRect.width, entry.contentRect.height);
            }
        });
        resizeObserver.observe(container3D);

        // Initial gentle spin
        cubeGroup.rotation.x = 0.5;
        cubeGroup.rotation.y = -0.5;
    }

    // ═══════════════════════════════════════════
    //  BOOT
    // ═══════════════════════════════════════════
    document.addEventListener('DOMContentLoaded', () => {
        toggleInput = document.getElementById('hideout-toggle-input');
        toggleTrack = document.getElementById('toggle-track');
        switchCircle = document.getElementById('switch-circle-hideout');
        container = document.getElementById('hideout-container');
        footerGrid = document.querySelector('.footer-v2');
        canvasContainer = document.getElementById('game-canvas-container');
        scoreDisplay = document.getElementById('game-score');
        controlsHint = document.getElementById('game-controls-hint');
        player1Label = document.getElementById('player1-label');
        player2Label = document.getElementById('player2-label');
        undoBtn = document.getElementById('undo-btn');
        redoBtn = document.getElementById('redo-btn');
        sidebarBtns = document.querySelectorAll('.sidebar-btn');

        if (!toggleInput || !container) { console.error('Hideout: missing DOM'); return; }

        setPlayerVisibility(false);

        // Re-bind click events so games actually launch
        sidebarBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const game = btn.getAttribute('data-game');
                if (game) launchGame(game);
            });
        });

        toggleInput.addEventListener('change', () => {
            toggleInput.checked ? animateToGameMode() : animateToSystemMode();
        });

    });
})();
