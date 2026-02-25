/* ========================================
   PSYCLOX PORTFOLIO - MAIN JAVASCRIPT
   ======================================== */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Loader FIRST to ensure it handles the loading state
    initLoader();
    initHackerEffect();

    // Initialize all modules
    try {
        initThemeToggle();
    } catch (e) { console.error("Theme Error:", e); }

    try {
        initCanvasBackground();
    } catch (e) { console.error("Canvas Error:", e); }

    initCustomCursor();
    initNavigation();
    initTypewriter();
    initParticles();
    initScrollAnimations();
    initSkillBars();
    initCounters();
    initAchievementCounters();
    initContactForm();
    initSmoothScroll();
    initActiveNavHighlight();
    initExperienceCards();
    initAboutCardsParallax();
    initHeroStartupAnimations();
    initCardTextCyclers();
});

/* ========================================
   LOADER
   ======================================== */

function initLoader() {
    const loader = document.getElementById('loader');
    const loaderVideo = document.getElementById('loader-video');

    if (!loader) return;

    // Prevent scrolling while loading
    document.body.classList.add('page-loading');

    // Function to hide loader with brutal glitch exit
    const finishLoading = () => {
        loader.classList.add('loader-glitch-out');
        setTimeout(() => {
            loader.classList.add('hidden');
            document.body.classList.remove('loading');
            document.body.classList.remove('page-loading');
            document.body.classList.add('page-loaded');

            // Dispatch event for other animations (like hero 3D) to know loading is done
            window.dispatchEvent(new Event('loaderFinished'));
        }, 800); // Wait for CSS glitch out animation to finish
    };

    // COMMENTED OUT FOR TESTING: Check if already loaded from cache quickly
    /*
    if (sessionStorage.getItem('hasLoadedBefore')) {
        loader.style.display = 'none';
        document.body.classList.remove('page-loading');
        document.body.classList.add('page-loaded');

        // Ensure other scripts know we are done
        setTimeout(() => window.dispatchEvent(new Event('loaderFinished')), 50);
        return;
    }
    sessionStorage.setItem('hasLoadedBefore', 'true');
    */

    if (loaderVideo) {
        // Ensure video plays
        loaderVideo.play().catch(e => console.log('Autoplay prevented:', e));

        // Wait for video to end or fallback timeout
        loaderVideo.addEventListener('ended', finishLoading);
        setTimeout(finishLoading, 4000); // Fallback if video is longer or fails
    } else {
        setTimeout(finishLoading, 2500);
    }
}

/* ========================================
   MODERN THEME TOGGLE - SMOOTH CROSSFADE
   ======================================== */

/* ========================================
   MODERN THEME TOGGLE - GSAP SVG ANIMATION
   ======================================== */

function initThemeToggle() {
    // Theme toggle removed - Permanent Dark Theme
    const themeBack = document.getElementById('theme-back');
    const themeFront = document.getElementById('theme-front');
    if (themeBack) themeBack.setAttribute('href', '#night-scene');
    if (themeFront) themeFront.setAttribute('href', '#day-scene');

    document.documentElement.setAttribute('data-theme', '');
    localStorage.setItem('theme', 'dark');

    // Background looping animations (Keep these)
    gsap.to('.clouds-big', { duration: 15, repeat: -1, x: -74, ease: 'linear' });
    gsap.to('.clouds-medium', { duration: 20, repeat: -1, x: -65, ease: 'linear' });
    gsap.to('.clouds-small', { duration: 25, repeat: -1, x: -71, ease: 'linear' });
    gsap.to('.star', { duration: 'random(0.4, 1.5)', repeat: -1, yoyo: true, opacity: 'random(0.2, 0.5)' });
}

/* ========================================
   PARALLAX CANVAS BACKGROUND
   Different effects for dark and light theme
   ======================================== */

// Initialize Hacker Text Effect
function initHackerEffect() {
    // RESTRICTED TO PROJECTS SECTION ONLY
    const textElements = document.querySelectorAll('#projects p, #projects h3, #projects span, #projects a, #projects .project-title, #projects .tech-tag, #projects .project-description');

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    textElements.forEach(element => {
        // Skip if empty or contains only child elements (container)
        if (element.children.length > 0 && element.tagName !== 'P' && element.tagName !== 'H3') return;
        if (!element.textContent.trim()) return;

        element.dataset.originalText = element.textContent;

        element.addEventListener('mouseenter', () => {
            element.classList.add('hacker-active');

            // Scramble effect for headings or key elements
            if (element.tagName.match(/^H[1-3]$/) || element.classList.contains('glitch-effect') || element.classList.contains('project-title')) {
                let iterations = 0;
                const originalText = element.dataset.originalText;

                clearInterval(element.hackerInterval);

                element.hackerInterval = setInterval(() => {
                    element.textContent = originalText
                        .split("")
                        .map((letter, index) => {
                            if (index < iterations) {
                                return originalText[index];
                            }
                            return letters[Math.floor(Math.random() * 36)];
                        })
                        .join("");

                    if (iterations >= originalText.length) {
                        clearInterval(element.hackerInterval);
                    }

                    iterations += 1 / 3;
                }, 30);
            }
        });

        element.addEventListener('mouseleave', () => {
            element.classList.remove('hacker-active');
            // Restore text immediately
            if (element.hackerInterval) {
                clearInterval(element.hackerInterval);
                element.textContent = element.dataset.originalText;
            }
        });
    });
}

function initCanvasBackground() {
    const canvas = document.getElementById('canvas-bg');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    // Track mouse velocity for "throw" effect
    let lastMouseX = mouseX;
    let lastMouseY = mouseY;
    let mouseVx = 0;
    let mouseVy = 0;

    let animationId;

    // Parallax layers with different speeds
    const layers = [];
    const numLayers = 4;

    // Resize canvas to full screen
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initLayers();
    }

    // Get theme-specific settings
    function getThemeConfig() {
        // Permanently return Antigravity (Dark) theme
        return {
            type: 'antigravity',
            colors: [
                '#4285F4', // Blue
                '#EA4335', // Red
                '#FBBC04', // Yellow
                '#34A853', // Green
                '#FF6B6B', // Theme Coral
                '#A29BFE'  // Soft Purple
            ],
            glowColor: 'transparent',
            lineColor: 'transparent'
        };
    }

    // Initialize parallax/physics layers
    function initLayers() {
        layers.length = 0;
        const config = getThemeConfig();

        if (config.type === 'antigravity') {
            const layer = { items: [], speed: 1 };
            const particleCount = window.innerWidth < 768 ? 80 : 180;

            for (let i = 0; i < particleCount; i++) {
                const size = Math.random() * 6 + 3;
                layer.items.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: -(Math.random() * 2 + 0.5),
                    size: size,
                    bgSize: size,
                    rotation: Math.random() * Math.PI * 2,
                    rotSpeed: (Math.random() - 0.5) * 0.05,
                    color: config.colors[Math.floor(Math.random() * config.colors.length)],
                    shape: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)],
                    friction: 0.96
                });
            }
            layers.push(layer);

        } else if (config.type === 'ether-mesh') {
            // ETHER MESH INITIALIZATION
            // Create a structured but organic grid of nodes
            const layer = { items: [], speed: 1 };
            const spacing = window.innerWidth < 768 ? 80 : 100; // Grid spacing
            const cols = Math.ceil(canvas.width / spacing);
            const rows = Math.ceil(canvas.height / spacing);

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    // Jitter position for organic feel
                    const jitterX = (Math.random() - 0.5) * 40;
                    const jitterY = (Math.random() - 0.5) * 40;
                    const x = c * spacing + spacing / 2 + jitterX;
                    const y = r * spacing + spacing / 2 + jitterY;

                    // Determine type/color
                    // Mostly grey, some purple, rare coral
                    let color = config.colors[4]; // Default light grey
                    let size = Math.random() * 2 + 2; // Default small

                    const rand = Math.random();
                    if (rand > 0.95) { color = config.colors[2]; size = 5; } // Coral (Rare)
                    else if (rand > 0.8) { color = config.colors[0]; size = 4; } // Purple
                    else if (rand > 0.6) { color = config.colors[1]; } // Deep Purple

                    layer.items.push({
                        x: x,
                        y: y,
                        baseX: x, // Anchor Point
                        baseY: y, // Anchor Point
                        vx: 0,
                        vy: 0,
                        size: size,
                        color: color,
                        rotation: 0
                    });
                }
            }
            layers.push(layer);
        }
    }

    // Draw shapes
    function drawShape(ctx, item, config, scale = 1) {
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(item.rotation);

        if (config.type === 'antigravity') {
            // ANTIGRAVITY (Dark Theme) Logic - Unchanged
            ctx.globalCompositeOperation = 'lighter';
            const s = item.size;
            ctx.fillStyle = item.color;
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            if (item.shape === 'circle') ctx.arc(0, 0, s * 1.5, 0, Math.PI * 2);
            else if (item.shape === 'square') ctx.rect(-s * 1.5 / 2, -s * 1.5 / 2, s * 1.5, s * 1.5);
            else if (item.shape === 'triangle') {
                ctx.moveTo(0, -s * 1.5 / 2);
                ctx.lineTo(s * 1.5 / 2, s * 1.5 / 2);
                ctx.lineTo(-s * 1.5 / 2, s * 1.5 / 2);
                ctx.closePath();
            }
            ctx.fill();

            ctx.globalAlpha = 1.0;
            ctx.beginPath();
            if (item.shape === 'circle') ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
            else if (item.shape === 'square') ctx.rect(-s / 2, -s / 2, s, s);
            else if (item.shape === 'triangle') {
                ctx.moveTo(0, -s / 2);
                ctx.lineTo(s / 2, s / 2);
                ctx.lineTo(-s / 2, s / 2);
                ctx.closePath();
            }
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.9;
            ctx.beginPath();
            ctx.arc(0, 0, s / 6, 0, Math.PI * 2);
            ctx.fill();

        } else if (config.type === 'ether-mesh') {
            // ETHER MESH (Light Theme) - Professional Nodes
            ctx.fillStyle = item.color;
            ctx.beginPath();
            ctx.arc(0, 0, item.size, 0, Math.PI * 2);
            ctx.fill();

            // Subtle ring (Professional detail)
            ctx.strokeStyle = 'rgba(102, 126, 234, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, item.size + 3, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Draw connection lines between nearby items
    function drawConnections(config) {
        if (config.type === 'antigravity') return;

        // Ether Mesh Connections
        layers.forEach(layer => {
            layer.items.forEach((item, i) => {
                // Connect to base to visualize tension (Optional, but looks cool) or just neighbors
                // Standard Neighbor Connection
                layer.items.slice(i + 1).forEach(other => {
                    const dx = item.x - other.x;
                    const dy = item.y - other.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const connectDist = 180; // Tighter professional web

                    if (dist < connectDist) {
                        const opacity = (1 - dist / connectDist) * 0.4; // Max opacity 0.4
                        ctx.strokeStyle = config.lineColor.replace('0.6', opacity.toFixed(2));
                        ctx.lineWidth = 1.5; // Slightly bolder professional lines
                        ctx.beginPath();
                        ctx.moveTo(item.x, item.y);
                        ctx.lineTo(other.x, other.y);
                        ctx.stroke();
                    }
                });
            });
        });
    }

    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        mouseVx = mouseX - lastMouseX;
        mouseVy = mouseY - lastMouseY;
        lastMouseX = mouseX;
        lastMouseY = mouseY;

        const config = getThemeConfig();

        if (config.type === 'antigravity') {
            // ... Antigravity Logic (Keep existing) ...
            const interactionRadius = 250;
            layers.forEach(layer => {
                layer.items.forEach(item => {
                    item.x += item.vx;
                    item.y += item.vy;
                    item.rotation += item.rotSpeed;
                    if (item.y < -50) item.y = canvas.height + 50;
                    if (item.x < -50) item.x = canvas.width + 50;
                    if (item.x > canvas.width + 50) item.x = -50;
                    const dx = mouseX - item.x;
                    const dy = mouseY - item.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < interactionRadius) {
                        const influence = (interactionRadius - dist) / interactionRadius;
                        if (Math.abs(mouseVx) > 0.5 || Math.abs(mouseVy) > 0.5) {
                            item.vx += mouseVx * 0.08 * influence;
                            item.vy += mouseVy * 0.08 * influence;
                        } else {
                            item.vx += (dx * 0.001) * influence;
                            item.vy += (dy * 0.001) * influence;
                        }
                    }
                    item.vx *= 0.94;
                    const targetVy = -(Math.random() * 0.5 + 1);
                    item.vy = item.vy * 0.95 + (targetVy * 0.05);
                    if (Math.abs(item.vy) < 0.5) item.vy -= 0.05;
                    drawShape(ctx, item, config, 1);
                });
            });

        } else if (config.type === 'ether-mesh') {
            // ETHER MESH PHYSICS
            // Spring-based elastic grid that reacts to cursor
            const mouseRadius = 300; // Awareness range
            const springStrength = 0.05; // Snap back speed
            const repulsionStrength = 20; // How hard mouse pushes

            layers.forEach(layer => {
                layer.items.forEach(item => {
                    // 1. Calculate Cursor Interaction (Repulsion)
                    const dx = mouseX - item.x;
                    const dy = mouseY - item.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    let forceX = 0;
                    let forceY = 0;

                    if (dist < mouseRadius) {
                        const angle = Math.atan2(dy, dx);
                        const force = (mouseRadius - dist) / mouseRadius; // 0 to 1
                        const push = force * repulsionStrength;

                        // Push AWAY from cursor
                        forceX = -Math.cos(angle) * push;
                        forceY = -Math.sin(angle) * push;
                    }

                    // 2. Spring Physics (Return to Base)
                    // dx/dy to anchor point
                    const homeDx = item.baseX - item.x;
                    const homeDy = item.baseY - item.y;

                    // Apply velocities
                    item.vx += (forceX + homeDx * springStrength) * 0.1; // Add forces to velocity
                    item.vy += (forceY + homeDy * springStrength) * 0.1;

                    // Friction
                    item.vx *= 0.85; // Damping
                    item.vy *= 0.85;

                    // 3. Update Position
                    item.x += item.vx;
                    item.y += item.vy;

                    // 4. Subtle drift for liveliness even when static
                    item.x += Math.sin(Date.now() * 0.001 + item.baseY) * 0.2;
                    item.y += Math.cos(Date.now() * 0.002 + item.baseX) * 0.2;

                    drawShape(ctx, item, config, 1);
                });
            });
            drawConnections(config);
        }

        animationId = requestAnimationFrame(animate);
    }

    // Track mouse position
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Handle resize
    window.addEventListener('resize', () => {
        resizeCanvas();
    });

    // Reinit layers when theme changes
    // Reinit layers when theme changes
    const themeToggle = document.getElementById('theme-toggle-input');
    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            setTimeout(() => {
                resizeCanvas(); // Full re-init ensures clean state
            }, 100);
        });
    }

    // Init
    resizeCanvas();
    animate();
}

/* ========================================
   ACHIEVEMENT COUNTERS
   ======================================== */

function initAchievementCounters() {
    const achievementValues = document.querySelectorAll('.achievement-value[data-count]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.dataset.count);
                animateAchievementCounter(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.5
    });

    achievementValues.forEach(value => {
        observer.observe(value);
    });
}

function animateAchievementCounter(element, target) {
    let current = 0;
    const increment = target / 40;
    const duration = 1500;
    const stepTime = duration / 40;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + '+';
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current) + '+';
        }
    }, stepTime);
}

/* ========================================
   CUSTOM CURSOR
   ======================================== */

function initCustomCursor() {
    const cursor = document.getElementById('cursor');
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorRing = document.querySelector('.cursor-ring');

    if (!cursor || !cursorDot || !cursorRing) return;

    // Check if device supports hover (not touch)
    if (window.matchMedia('(hover: none)').matches) {
        cursor.style.display = 'none';
        return;
    }

    let mouseX = 0;
    let mouseY = 0;
    let dotX = 0;
    let dotY = 0;
    let ringX = 0;
    let ringY = 0;

    // Track mouse position
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Animate cursor with lerp
    function animateCursor() {
        // Dot follows quickly
        dotX += (mouseX - dotX) * 0.5;
        dotY += (mouseY - dotY) * 0.5;

        // Ring follows with smooth trail
        ringX += (mouseX - ringX) * 0.25;
        ringY += (mouseY - ringY) * 0.25;

        cursorDot.style.left = `${dotX}px`;
        cursorDot.style.top = `${dotY}px`;
        cursorRing.style.left = `${ringX}px`;
        cursorRing.style.top = `${ringY}px`;

        requestAnimationFrame(animateCursor);
    }

    animateCursor();

    // Hover effects on interactive elements
    const interactiveElements = document.querySelectorAll('a, button, input, textarea, [data-cursor]');

    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('hovering');
        });

        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('hovering');
        });
    });

    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
        cursor.style.opacity = '1';
    });
}

/* ========================================
   NAVIGATION
   ======================================== */

/* ========================================
   NAVIGATION
   ======================================== */

function initNavigation() {
    const header = document.querySelector('.header') || document.getElementById('header');
    const navToggle = document.getElementById('nav-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    // Header scroll effect
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (currentScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    if (navToggle && mobileMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
        });

        // Close menu when clicking links
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
                navToggle.classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

/* ========================================
   TYPEWRITER EFFECT
   ======================================== */

function initTypewriter() {
    const typewriter = document.getElementById('typewriter');
    const cursorElement = document.querySelector('.cursor-blink');
    if (!typewriter) return;

    // Roles to cycle through
    const roles = ['Purple Teamer', 'Cybersecurity Analyst', 'Penetration Tester'];
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;

    function type() {
        const currentRole = roles[roleIndex];

        if (isDeleting) {
            typewriter.textContent = currentRole.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 50;
        } else {
            typewriter.textContent = currentRole.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 100;
        }

        if (!isDeleting && charIndex === currentRole.length) {
            // Pause at end of word before deleting
            typingSpeed = 3000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            // Move to next role
            roleIndex = (roleIndex + 1) % roles.length;
            // Pause before starting to type again
            typingSpeed = 500;
        }

        setTimeout(type, typingSpeed);
    }

    // Start typing after a delay
    setTimeout(type, 1000);
}

/* ========================================
   CARD DYNAMIC TEXT CYCLING
   ======================================== */
function initCardTextCyclers() {
    const brandElement = document.getElementById('card-dynamic-brand');
    const phraseElement = document.getElementById('card-dynamic-phrase');

    // Helper for typewriter effect
    function runTypewriter(element, words, typeSpeed, deleteSpeed, pauseEnd) {
        if (!element) return;
        let wordIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        function type() {
            const currentWord = words[wordIndex];

            if (isDeleting) {
                element.textContent = currentWord.substring(0, charIndex - 1);
                charIndex--;
            } else {
                element.textContent = currentWord.substring(0, charIndex + 1);
                charIndex++;
            }

            let nextSpeed = isDeleting ? deleteSpeed : typeSpeed;

            if (!isDeleting && charIndex === currentWord.length) {
                // Done typing word, pause then delete
                nextSpeed = pauseEnd;
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                // Done deleting, move to next
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                nextSpeed = 500; // Pause before typing next word
            }

            setTimeout(type, nextSpeed);
        }

        // Start typing
        setTimeout(type, 1000);
    }

    // Initialize Brand Typewriter
    if (brandElement) {
        // Ensure starting text is empty before first type
        brandElement.textContent = '';
        runTypewriter(brandElement, ['PSYCLOX', 'KARTHIKEYAN'], 120, 60, 5000);
    }

    // Initialize Phrase Typewriter
    if (phraseElement) {
        phraseElement.textContent = '';
        runTypewriter(phraseElement, [
            'Move Your Cursor',
            'Explore Everyday',
            'click NEW for updated portfolio',
            'Break The Matrix',
            'Find The Limits',
            'Think Outside The Box'
        ], 80, 40, 2500);
    }
}

/* ========================================
   PARTICLE BACKGROUND
   ======================================== */

function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    // Reduce particles on mobile
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 15 : 30;

    for (let i = 0; i < particleCount; i++) {
        createParticle(container);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    // Random position and animation
    const size = Math.random() * 4 + 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDuration = `${Math.random() * 6 + 6}s`;
    particle.style.animationDelay = `${Math.random() * 8}s`;
    particle.style.opacity = Math.random() * 0.5 + 0.3;

    container.appendChild(particle);
}

/* ========================================
   HERO STARTUP ANIMATIONS
   ======================================== */

function initHeroStartupAnimations() {
    if (typeof gsap === 'undefined') return;

    const runHeroGSAP = () => {
        const tl = gsap.timeline();

        // Ensure hero elements start visible if they were hidden by CSS
        gsap.set('.hero-left-aesthetic > *, .hero-3d-cards', { clearProps: 'all' });

        tl.from('.hero-left-aesthetic > *', {
            y: 40,
            autoAlpha: 0,
            stagger: 0.15,
            duration: 1,
            ease: 'power3.out'
        })
            .from('.hero-3d-cards', {
                x: 60,
                autoAlpha: 0,
                rotationY: -15,
                duration: 1.2,
                ease: 'back.out(1.2)'
            }, "-=0.6");

        // Refresh ScrollTrigger to recalculate layout now that loader is gone
        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
        }
    };

    if (document.body.classList.contains('page-loaded')) {
        runHeroGSAP();
    } else {
        window.addEventListener('loaderFinished', runHeroGSAP);
    }
}

/* ========================================
   GSAP SCROLL ANIMATIONS
   ======================================== */

function initScrollAnimations() {
    // Check if GSAP is loaded
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.warn('GSAP not loaded, skipping scroll animations');
        return;
    }

    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Section headers
    gsap.utils.toArray('.section-header').forEach(header => {
        gsap.from(header, {
            scrollTrigger: {
                trigger: header,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            y: 60,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out'
        });
    });

    // About Section (New UI)
    gsap.from('.ui-about-slanted-group', {
        scrollTrigger: {
            trigger: '#about',
            start: 'top 80%'
        },
        y: 100,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out'
    });

    gsap.from('.ui-about-center', {
        scrollTrigger: {
            trigger: '.ui-about-center',
            start: 'top 85%'
        },
        y: 50,
        opacity: 0,
        scale: 0.95,
        duration: 1,
        ease: 'power4.out'
    });

    // Skills Arsenal Cards
    gsap.utils.toArray('.arsenal-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%'
            },
            y: 50,
            opacity: 0,
            duration: 0.8,
            delay: i * 0.15,
            ease: 'power3.out'
        });
    });

    // Project cards
    gsap.utils.toArray('.project-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%'
            },
            y: 50,
            opacity: 0,
            duration: 0.8,
            delay: i * 0.1,
            ease: 'power2.out'
        });
    });

    // Timeline items
    gsap.utils.toArray('.timeline-item').forEach((item, i) => {
        gsap.from(item, {
            scrollTrigger: {
                trigger: item,
                start: 'top 80%'
            },
            x: -60,
            opacity: 0,
            duration: 0.8,
            delay: i * 0.2,
            ease: 'power3.out'
        });
    });

    // Education card
    gsap.from('.education-card', {
        scrollTrigger: {
            trigger: '.education-card',
            start: 'top 80%'
        },
        y: 60,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
    });

    // Certification cards
    gsap.utils.toArray('.cert-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%'
            },
            y: 50,
            scale: 0.9,
            opacity: 0,
            duration: 0.6,
            delay: i * 0.1,
            ease: 'back.out(1.7)'
        });
    });

    // Achievement items
    gsap.utils.toArray('.achievement-item').forEach((item, i) => {
        gsap.from(item, {
            scrollTrigger: {
                trigger: item,
                start: 'top 85%'
            },
            y: 40,
            opacity: 0,
            duration: 0.6,
            delay: i * 0.1,
            ease: 'power3.out'
        });
    });

    // Contact section
    gsap.from('.contact-info', {
        scrollTrigger: {
            trigger: '.contact-content',
            start: 'top 70%'
        },
        x: -60,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
    });

    gsap.from('.contact-form', {
        scrollTrigger: {
            trigger: '.contact-content',
            start: 'top 70%'
        },
        x: 60,
        opacity: 0,
        duration: 0.8,
        delay: 0.2,
        ease: 'power3.out'
    });

    // Info cards stagger
    gsap.utils.toArray('.info-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%'
            },
            y: 30,
            opacity: 0,
            duration: 0.5,
            delay: i * 0.1,
            ease: 'power3.out'
        });
    });

    // HOME SLIDER ANIMATION REMOVED (Handled by scroll-illusion.js)
}

/* ========================================
   SKILL BARS ANIMATION
   ======================================== */

function initSkillBars() {
    const skillBars = document.querySelectorAll('.skill-progress');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progress = entry.target.dataset.progress;
                entry.target.style.width = `${progress}%`;
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.5
    });

    skillBars.forEach(bar => {
        observer.observe(bar);
    });
}

/* ========================================
   COUNTER ANIMATION
   ======================================== */

function initCounters() {
    // Select both .stat-number and .number (terminal stats) elements
    const counters = document.querySelectorAll('.stat-number, .number[data-count]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.dataset.count);
                animateCounter(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.5
    });

    counters.forEach(counter => {
        observer.observe(counter);
    });
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 50;
    const duration = 2000;
    const stepTime = duration / 50;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, stepTime);
}

/* ========================================
   CONTACT FORM
   ======================================== */



function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // New cyber button elements
        const submitBtn = form.querySelector('.cyber-btn');
        const btnText = submitBtn.querySelector('.btn-glitch-text');
        const btnProgress = submitBtn.querySelector('.btn-progress');

        const originalText = btnText.textContent;

        // Visual Feedback - Loading
        btnText.textContent = 'TRANSMISSION_INITIATED...';
        submitBtn.style.borderColor = '#fbbf24'; // Warning yellow
        btnText.style.boxShadow = '0 0 15px rgba(251, 191, 36, 0.3)';
        btnText.style.color = '#fbbf24';
        submitBtn.disabled = true;

        // Progress bar simulation
        btnProgress.style.width = '30%';

        // Prepare FormData for Web3Forms
        const formData = new FormData(form);
        formData.append("access_key", "72a66426-c1f4-4e58-af6f-c3b77c514450");

        try {
            // Simulated progress
            setTimeout(() => btnProgress.style.width = '70%', 500);

            const response = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                // Success State
                btnProgress.style.width = '100%';
                btnText.textContent = 'TRANSMISSION_COMPLETE';
                submitBtn.style.borderColor = '#4ade80'; // Success green
                btnText.style.color = '#4ade80';
                submitBtn.style.boxShadow = '0 0 20px rgba(74, 222, 128, 0.4)';

                // Alert as requested
                alert("Success! Your message has been sent.");
                form.reset();

                // Reset button after delay
                setTimeout(() => {
                    btnText.textContent = originalText;
                    submitBtn.style.borderColor = '';
                    submitBtn.style.boxShadow = '';
                    btnText.style.color = '';
                    btnProgress.style.width = '0';
                    submitBtn.disabled = false;
                }, 5000);

            } else {
                throw new Error(data.message);
            }

        } catch (error) {
            console.error("Web3Forms Error:", error);
            // Error State
            btnText.textContent = 'TRANSMISSION_FAILED';
            submitBtn.style.borderColor = '#ff3333'; // Error red
            btnText.style.color = '#ff3333';

            alert("Error: " + error.message);

            setTimeout(() => {
                btnText.textContent = originalText;
                submitBtn.style.borderColor = '';
                btnText.style.color = '';
                btnProgress.style.width = '0';
                submitBtn.disabled = false;
            }, 3000);
        }
    });

    // Input animations - Cyber Focus
    const inputs = form.querySelectorAll('.cyber-input, .cyber-textarea');
    inputs.forEach(input => {
        // Optional: Add sound effect on focus?
        input.addEventListener('focus', () => {
            // Placeholder for future sound effect
        });
    });
}

/* ========================================
   SMOOTH SCROLL
   ======================================== */

/* ========================================
   SMOOTH SCROLL (FIXED FOR STICKY HERO)
   ======================================== */

function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href === '#' || !href) return;

            e.preventDefault();

            // Special handling for Home
            if (href === '#home') {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                return;
            }

            const target = document.querySelector(href);
            if (target) {
                const header = document.querySelector('.header');
                const headerHeight = header ? header.offsetHeight : 80;

                // Calculate position considering header offset
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - (headerHeight - 2);

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/* ========================================
   ACTIVE NAV HIGHLIGHT
   ======================================== */

/* ========================================
   ACTIVE NAV HIGHLIGHT (FIXED FOR HERO TRACK)
   ======================================== */

function initActiveNavHighlight() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    /* Helper to find link by href */
    const getLink = (id) => document.querySelector(`.nav-link[href="#${id}"]`);

    function highlightNav() {
        const scrollPosition = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        let current = '';

        // 1. Check for Home (Hero Track logic)
        // If we are within the first page or so, definitely Home
        // Or if we are inside the huge hero-scroll-track
        const heroTrack = document.querySelector('.hero-scroll-track');
        if (heroTrack) {
            if (scrollPosition < heroTrack.offsetHeight - (windowHeight * 0.5)) {
                current = 'home';
            }
        } else {
            if (scrollPosition < windowHeight * 0.5) {
                current = 'home';
            }
        }

        // 2. Check other sections
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            // Skip home loop if we handled it, or let this overwrite if it's more specific
            if (sectionId === 'home') return;

            // Standard Offset check (Header approx 100px)
            if (scrollPosition >= (sectionTop - 200) && scrollPosition < (sectionTop + sectionHeight - 200)) {
                current = sectionId;
            }
        });

        // 3. Bottom of page check (Contact / Footer)
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 50) {
            // current = 'contact'; // Optional: force contact active at very bottom
        }

        // Apply active class
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (current && link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', highlightNav);
    window.addEventListener('resize', highlightNav);
    setTimeout(highlightNav, 500); // Check on load
}

/* ========================================
   RIPPLE EFFECT
   ======================================== */

document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
        const rect = this.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.left = `${e.clientX - rect.left}px`;
        ripple.style.top = `${e.clientY - rect.top}px`;
        this.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    });
});

/* ========================================
   TILT EFFECT FOR PROJECT CARDS
   ======================================== */

document.querySelectorAll('[data-tilt]').forEach(card => {
    // Skip on mobile
    if (window.innerWidth < 992) return;

    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    });
});

/* ========================================
   LAZY LOAD IMAGES
   ======================================== */

if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
}

/* ========================================
   PERFORMANCE MONITORING
   ======================================== */

// Log performance metrics
window.addEventListener('load', () => {
    if (window.performance) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`Page load time: ${pageLoadTime}ms`);
    }
});

/* ========================================
   CONSOLE EASTER EGG
   ======================================== */

console.log('%c🔐 Psyclox Portfolio', 'font-size: 24px; font-weight: bold; color: #ff6b6b;');
console.log('%cWelcome, fellow hacker! 👋', 'font-size: 14px; color: #667eea;');
console.log('%cInterested in security? Let\'s connect: linkedin.com/in/karthikeyaneh', 'font-size: 12px; color: #888;');

/* ========================================
   FIX: OSCP LOCKED STYLE FORCE OVERRIDE
   ======================================== */
function fixOSCPStyle() {
    // Small delay to ensure DOM update
    setTimeout(() => {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const oscpCards = document.querySelectorAll('.locked-oscp');

        oscpCards.forEach(card => {
            if (isLight) {
                // Force Light Theme Styles
                card.style.setProperty('background', 'linear-gradient(145deg, rgba(255, 77, 77, 0.05), transparent)', 'important');
                card.style.setProperty('border', '1px dashed rgba(255, 77, 77, 0.4)', 'important');
                card.style.setProperty('box-shadow', 'none', 'important');
                card.style.setProperty('cursor', 'not-allowed', 'important');
                card.style.setProperty('opacity', '1', 'important');

                // Fix Children
                const icon = card.querySelector('.cert-icon-small');
                if (icon) {
                    icon.style.setProperty('background', 'rgba(255, 77, 77, 0.1)', 'important');
                    icon.style.setProperty('color', '#ff4d4d', 'important');
                    icon.style.setProperty('border', '1px solid rgba(255, 77, 77, 0.2)', 'important');
                }

                const title = card.querySelector('h4');
                if (title) title.style.setProperty('color', 'rgba(255, 77, 77, 0.8)', 'important');

                const status = card.querySelector('.status-locked');
                if (status) {
                    status.style.setProperty('color', '#ff4d4d', 'important');
                    status.style.setProperty('text-shadow', 'none', 'important');
                }

            } else {
                // Reset for Dark Mode (let CSS handle it)
                card.style.removeProperty('background');
                card.style.removeProperty('border');
                card.style.removeProperty('box-shadow');
                card.style.removeProperty('cursor');
                card.style.removeProperty('opacity');

                const icon = card.querySelector('.cert-icon-small');
                if (icon) {
                    icon.style.removeProperty('background');
                    icon.style.removeProperty('color');
                    icon.style.removeProperty('border');
                }

                const title = card.querySelector('h4');
                if (title) title.style.removeProperty('color');

                const status = card.querySelector('.status-locked');
                if (status) {
                    status.style.removeProperty('color');
                    status.style.removeProperty('text-shadow');
                }
            }
        });
    }, 50);
}

// Run on load and theme change
document.addEventListener('DOMContentLoaded', fixOSCPStyle);
window.addEventListener('load', fixOSCPStyle);

// Attach to theme toggle
const toggleBtn = document.getElementById('theme-toggle');
if (toggleBtn) {
    toggleBtn.addEventListener('click', fixOSCPStyle);
}

// MutationObserver to watch for attribute changes on html
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
            fixOSCPStyle();
        }
    });
});

observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
});

// --- TECH FOOTER: CLOCKS & DATA ---
function initFooterClocks() {
    const localEl = document.getElementById('clock-local');
    const utcEl = document.getElementById('clock-utc');
    const missionEl = document.getElementById('clock-mission');
    const latencyEl = document.getElementById('net-latency');
    const tempEl = document.getElementById('core-temp');

    function updateTime() {
        const now = new Date();

        // Local Time
        if (localEl) localEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });

        // UTC Time
        if (utcEl) utcEl.textContent = now.toISOString().substr(11, 8) + ' UTC';

        // Mission Time
        if (missionEl) {
            const start = new Date(now.getFullYear(), 0, 1);
            const diff = now - start;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const mins = Math.floor((diff / (1000 * 60)) % 60);
            const secs = Math.floor((diff / 1000) % 60);
            missionEl.textContent = `T+${days}D ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
    }

    // Fluctuating Data (Random updates)
    function updateData() {
        if (latencyEl) {
            const lat = Math.floor(Math.random() * 40) + 10; // 10-50ms
            latencyEl.textContent = `${lat}ms`;
            // Color code
            latencyEl.style.color = lat > 40 ? '#ff3333' : 'var(--accent-primary)';
        }
        if (tempEl) {
            const temp = (Math.random() * 5 + 40).toFixed(1); // 40.0 - 45.0 C
            tempEl.textContent = `${temp}°C`;
        }
    }

    setInterval(updateTime, 1000);
    setInterval(updateData, 2000); // 2s update for data
    updateTime();
    updateData();
}



// --- TECH FOOTER: PARTICLE SYSTEM ---
function initParticleSystem() {
    const canvas = document.getElementById('footer-particles');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    const particleCount = 80; // Increased density
    const connectionDistance = 120;
    const mouseDistance = 150; // Interaction radius

    // Mouse tracking
    let mouse = { x: null, y: null };

    // Add event listener to the FOOTER, not just window, to get correct relative coords if needed, 
    // but window is easier for continuous tracking.
    window.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        // Only track if near/over footer
        if (e.clientY > rect.top - 100) {
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        } else {
            mouse.x = null;
            mouse.y = null;
        }
    });

    window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Resize handling
    function resize() {
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.offsetWidth;
            canvas.height = parent.offsetHeight;
            width = canvas.width;
            height = canvas.height;
        }
    }
    window.addEventListener('resize', resize);
    setTimeout(resize, 100);
    resize();

    // Particle Class
    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 1; // Faster drift
            this.vy = (Math.random() - 0.5) * 1; // Faster drift
            this.size = Math.random() * 2 + 1;
            this.baseX = this.x;
            this.baseY = this.y;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Mouse interaction
            if (mouse.x != null) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouseDistance) {
                    // Move away from mouse (repel) - or attract? 
                    // Let's create an "active connection" effect instead of heavy movement
                    // Actually slight attraction looks 'magnetic'
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (mouseDistance - distance) / mouseDistance;
                    const directionX = forceDirectionX * force * 2;
                    const directionY = forceDirectionY * force * 2;

                    this.x += directionX;
                    this.y += directionY;
                }
            }

            // Bounce off edges
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--accent-primary') || '#00ff00';
            ctx.fill();
        }
    }

    // Init Particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    // Animation Loop
    function animate() {
        ctx.clearRect(0, 0, width, height);

        const accent = getComputedStyle(document.body).getPropertyValue('--accent-primary').trim() || '#00ff00';

        particles.forEach((p, index) => {
            p.update();
            p.draw();

            // Connect to Mouse
            if (mouse.x != null) {
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < mouseDistance) {
                    ctx.beginPath();
                    ctx.strokeStyle = accent;
                    ctx.lineWidth = 1;
                    ctx.globalAlpha = 1 - (dist / mouseDistance);
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            }

            // Connect to other particles
            for (let j = index + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < connectionDistance) {
                    ctx.beginPath();
                    ctx.strokeStyle = accent;
                    ctx.globalAlpha = 1 - (dist / connectionDistance);
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            }
        });

        requestAnimationFrame(animate);
    }

    animate();
}

// --- EXPERIENCE TYPEWRITER ---
// --- EXPERIENCE TYPEWRITER ---
function initExperienceTypewriter() {
    const lists = document.querySelectorAll('.timeline-responsibilities');
    if (lists.length === 0) return;

    lists.forEach(list => {
        const listItems = list.querySelectorAll('li');
        if (listItems.length === 0) return;

        // Prepare items: store text and clear content
        listItems.forEach(item => {
            // Only prepare if not already processed
            if (!item.hasAttribute('data-text')) {
                item.setAttribute('data-text', item.textContent.trim());
                item.textContent = '';
                item.style.visibility = 'hidden';
            }
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    observer.unobserve(entry.target);
                    animateList(listItems);
                }
            });
        }, { threshold: 0.1 }); // Lower threshold for better triggering

        observer.observe(list);
    });

    async function animateList(items) {
        for (const item of items) {
            item.style.visibility = 'visible';
            // Only animate if content is empty (prevents double animation)
            if (item.textContent === '') {
                item.classList.add('typing-cursor');
                const text = item.getAttribute('data-text');
                await typeText(item, text);
                item.classList.remove('typing-cursor');
            }
        }
    }

    function typeText(element, text) {
        return new Promise(resolve => {
            let i = 0;
            const speed = 5; // Faster typing for better UX
            const chunkSize = 1; // 1 char at a time for smoothness

            function type() {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                    setTimeout(type, speed);
                } else {
                    resolve();
                }
            }
            type();
        });
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initFooterClocks();
    initParticleSystem();
    initExperienceTypewriter();
    console.log("God Mode: Updates applied v2");

    // Ensure VanillaTilt is initialized if not already
    if (typeof VanillaTilt !== 'undefined') {
        VanillaTilt.init(document.querySelectorAll("[data-tilt]"), {
            max: 15,
            speed: 400,
            glare: true,
            "max-glare": 0.5
        });
    }
});

/* ========================================
   EXPERIENCE CARDS INTERACTION
   ======================================== */

function initExperienceCards() {
    const cards = document.querySelectorAll('.experience-card');

    cards.forEach(card => {
        const header = card.querySelector('.exp-header');
        const toggleBtn = card.querySelector('.exp-toggle-btn');

        if (!header) return;

        // Toggle on header click
        header.addEventListener('click', (e) => {
            // Prevent if clicking links or other buttons in header
            if (e.target.tagName === 'A') return;

            // Critical: Stop propagation to prevent bubbling issues
            e.stopPropagation();

            toggleCard(card);
        });

        // Toggle on button click
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent double trigger
                toggleCard(card);
            });
        }
    });

    function toggleCard(card) {
        const details = card.querySelector('.exp-details');
        if (!details) return;

        const isExpanded = card.classList.contains('expanded');

        if (isExpanded) {
            // Collapse
            card.classList.remove('expanded');
            details.style.maxHeight = '0';
            details.style.opacity = '0';
        } else {
            // Expand
            // Optional: Collapse others for accordion effect?
            // document.querySelectorAll('.experience-card.expanded').forEach(otherCard => {
            //     if (otherCard !== card) toggleCard(otherCard); // This would make it an accordion
            // });

            card.classList.add('expanded');
            // Set max-height to scrollHeight for smooth transition
            // Add a small buffer to ensure content fits comfortably
            details.style.maxHeight = (details.scrollHeight + 20) + 'px';
            details.style.opacity = '1';
        }
    }
}

/* ========================================
   ABOUT CARDS PARALLAX (ISOMETRIC)
   ======================================== */
function initAboutCardsParallax() {
    const wall = document.getElementById('about-card-wall');
    if (!wall) return;

    const aboutSection = document.getElementById('about');
    if (!aboutSection) return;

    const cards = wall.querySelectorAll('.float-card');

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    // Initial alignment (will be animated by JS)
    wall.style.transform = 'rotateX(15deg) rotateY(20deg) rotateZ(-5deg)';

    aboutSection.addEventListener('mousemove', (e) => {
        const rect = aboutSection.getBoundingClientRect();
        targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
        targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1
    });

    aboutSection.addEventListener('mouseleave', () => {
        targetX = 0;
        targetY = 0;
    });

    function animate() {
        // Decrease lerp factor for heavier, more premium smoothing
        currentX += (targetX - currentX) * 0.05;
        currentY += (targetY - currentY) * 0.05;

        // 1. Dynamic Rotation of the entire wall (pivoting on mouse)
        // Base: rotateX(15deg) rotateY(20deg) rotateZ(-5deg)
        const rotX = 15 - (currentY * 8); // Tilt up/down up to 8 deg
        const rotY = 20 + (currentX * 8); // Pan left/right up to 8 deg
        wall.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(-5deg)`;

        // 2. Apply distinct translation depth to each card physically
        cards.forEach(card => {
            const depth = parseFloat(card.getAttribute('data-depth')) || 0;
            // Provide base depth projection even if mouse is 0
            if (depth === 0) {
                card.style.transform = `translate3d(0px, 0px, 0px)`;
            } else {
                const cx = currentX * depth * -25;
                const cy = currentY * depth * -25;
                card.style.transform = `translate3d(${cx}px, ${cy}px, calc(${depth} * 60px))`;
            }
        });

        requestAnimationFrame(animate);
    }

    animate();
}
