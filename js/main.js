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
});

/* ========================================
   LOADER
   ======================================== */

function initLoader() {
    const loader = document.getElementById('loader');

    // Function to hide loader
    const hideLoader = () => {
        document.body.classList.add('page-loading');
        setTimeout(() => {
            loader.classList.add('hidden');
            document.body.classList.remove('loading');
            document.body.classList.remove('page-loading');
            document.body.classList.add('page-loaded');
        }, 1500);
    };

    // Check if already loaded
    if (document.readyState === 'complete') {
        hideLoader();
    } else {
        window.addEventListener('load', hideLoader);
        // Fallback safety timeout (5s)
        setTimeout(hideLoader, 5000);
    }
}

/* ========================================
   MODERN THEME TOGGLE - SMOOTH CROSSFADE
   ======================================== */

function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Set initial theme (dark is default)
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme === 'dark' ? '' : savedTheme);
    } else if (!systemPrefersDark) {
        document.documentElement.setAttribute('data-theme', 'light');
    }

    // Toggle theme on button click with smooth transition
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        // Add smooth transition class
        document.body.classList.add('theme-switching');

        // Apply theme change
        document.documentElement.setAttribute('data-theme', newTheme === 'dark' ? '' : newTheme);
        localStorage.setItem('theme', newTheme);

        // Remove transition class after animation
        setTimeout(() => {
            document.body.classList.remove('theme-switching');
        }, 600);
    });

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            document.documentElement.setAttribute('data-theme', e.matches ? '' : 'light');
        }
    });
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
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        if (isLight) {
            // Light theme: ETHER MESH (Professional Fluid Network)
            // Colors: Corporate Purple, Coral Accent, Soft Greys
            return {
                type: 'ether-mesh',
                colors: [
                    '#667eea', // Primary Purple
                    '#764ba2', // Deep Purple
                    '#ff6b6b', // Coral Accent (Rare)
                    '#b2bec3', // Soft Grey (Common)
                    '#dfe6e9'  // Light Grey
                ],
                glowColor: 'transparent',
                lineColor: 'rgba(102, 126, 234, 0.4)' // Initial line color
            };
        } else {
            // Dark theme: Antigravity "Lively" Confetti
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
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
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
        dotX += (mouseX - dotX) * 0.2;
        dotY += (mouseY - dotY) * 0.2;

        // Ring follows slower
        ringX += (mouseX - ringX) * 0.1;
        ringY += (mouseY - ringY) * 0.1;

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

function initNavigation() {
    const header = document.getElementById('header');
    const navToggle = document.getElementById('nav-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    // Header scroll effect
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        // Add scrolled class
        if (currentScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
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
    const roles = ['Purple Teamer', 'Cybersecurity Analyst'];
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

    // Hero animations
    gsap.from('.hero-badge', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 1.8
    });

    gsap.from('.hero-title', {
        y: 50,
        opacity: 0,
        duration: 1,
        delay: 2
    });

    gsap.from('.hero-subtitle', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        delay: 2.2
    });

    gsap.from('.hero-description', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 2.4
    });

    gsap.from('.hero-cta', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 2.6
    });

    gsap.from('.hero-socials', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        delay: 2.8
    });

    gsap.from('.hero-visual', {
        scale: 0.8,
        opacity: 0,
        duration: 1.2,
        delay: 1.6,
        ease: 'back.out(1.7)'
    });

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

    // About section
    gsap.from('.about-image-wrapper', {
        scrollTrigger: {
            trigger: '.about-content',
            start: 'top 70%'
        },
        x: -80,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
    });

    gsap.from('.about-text', {
        scrollTrigger: {
            trigger: '.about-content',
            start: 'top 70%'
        },
        x: 80,
        opacity: 0,
        duration: 1,
        delay: 0.2,
        ease: 'power3.out'
    });



    // Skill categories
    gsap.utils.toArray('.skill-category').forEach((category, i) => {
        gsap.from(category, {
            scrollTrigger: {
                trigger: category,
                start: 'top 80%'
            },
            y: 60,
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
                start: 'top 80%'
            },
            y: 80,
            opacity: 0,
            duration: 0.8,
            delay: i * 0.1,
            ease: 'power3.out'
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

    // Initialize EmailJS (User needs to add their own keys)
    // Sign up at https://www.emailjs.com/ to get your keys
    const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY'; // Replace with your key
    const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID'; // Replace with your service ID
    const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID'; // Replace with your template ID

    // Initialize EmailJS if available
    if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
        emailjs.init(EMAILJS_PUBLIC_KEY);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('.btn-submit');
        const originalText = submitBtn.innerHTML;

        // Show loading state
        submitBtn.innerHTML = '<span>Sending...</span>';
        submitBtn.disabled = true;

        // Collect form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Try EmailJS first, fallback to mailto
        try {
            if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
                // Use EmailJS
                await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                    from_name: data.name,
                    from_email: data.email,
                    subject: data.subject || 'Contact Form Submission',
                    message: data.message
                });

                // Success
                submitBtn.innerHTML = '<span>Message Sent! ✓</span>';
                submitBtn.style.background = 'linear-gradient(135deg, #27ca40 0%, #1fa340 100%)';
                form.reset();
            } else {
                // Fallback to mailto
                const subject = encodeURIComponent(data.subject || 'Contact from Portfolio');
                const body = encodeURIComponent(`Name: ${data.name}\nEmail: ${data.email}\n\nMessage:\n${data.message}`);
                window.location.href = `mailto:karthikeyaneh@gmail.com?subject=${subject}&body=${body}`;

                submitBtn.innerHTML = '<span>Opening Email Client...</span>';
                submitBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            }

            // Reset button after delay
            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.style.background = '';
                submitBtn.disabled = false;
            }, 3000);

        } catch (error) {
            console.error('Form submission error:', error);
            // Error - fallback to mailto
            const subject = encodeURIComponent(data.subject || 'Contact from Portfolio');
            const body = encodeURIComponent(`Name: ${data.name}\nEmail: ${data.email}\n\nMessage:\n${data.message}`);
            window.location.href = `mailto:karthikeyaneh@gmail.com?subject=${subject}&body=${body}`;

            submitBtn.innerHTML = '<span>Opening Email Client...</span>';

            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.style.background = '';
                submitBtn.disabled = false;
            }, 3000);
        }
    });

    // Input animations
    const inputs = form.querySelectorAll('.form-input, .form-textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', () => {
            if (!input.value) {
                input.parentElement.classList.remove('focused');
            }
        });
    });
}

/* ========================================
   SMOOTH SCROLL
   ======================================== */

function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();

            const target = document.querySelector(href);
            if (target) {
                const headerHeight = document.getElementById('header').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

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

function initActiveNavHighlight() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    function highlightNav() {
        const scrollPosition = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', highlightNav);
    highlightNav(); // Initial check
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
