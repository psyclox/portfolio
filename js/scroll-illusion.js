/* =============================================
   SCROLL ILLUSION — Hero Text Animation
   Complete rework: Uses GSAP ScrollTrigger.
   Phase 1: "Im Karthikeyan" + UI scatter outward
   Phase 2: "PSYCLOX" + "SECURITY" + "ENGINEER" +
            "ETHICAL HACKER" assemble center-screen
   Phase 3: Color shift to red
   Phase 4: Nav-logo appears
   Phase 5: Everything fades → About section
   ============================================= */

window.addEventListener('load', () => {
    // Force visibility — no FOUC
    const heroElements = document.querySelectorAll('.hero-content, .title-name, .title-name span, .hero-subtitle');
    heroElements.forEach(el => {
        el.style.opacity = '1';
        el.style.visibility = 'visible';
    });

    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    // Wait for GSAP
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        setTimeout(() => initScrollIllusion(), 300);
    } else {
        initScrollIllusion();
    }
});

function initScrollIllusion() {
    gsap.registerPlugin(ScrollTrigger);

    const heroSection = document.getElementById('home');
    const heroName = document.querySelector('.title-name');
    const navLogo = document.querySelector('.nav-logo');
    const header = document.querySelector('.header');
    const titleLine = document.querySelector('.title-line');

    // New structure: morph targets at section level
    const morphLayer = document.querySelector('.hero-morph-layer');
    const psycloxTitle = document.querySelector('.hero-title-psyclox');
    const landingWords = document.querySelectorAll('.hero-landing-word');

    if (!heroName || !navLogo || !heroSection || !titleLine || !psycloxTitle || !morphLayer) return;

    // --- Split text into individual characters for animation ---
    function splitToChars(element) {
        if (!element) return [];
        const text = element.innerText;
        element.innerHTML = '';
        element.style.opacity = '1';

        const chars = [];
        text.split('').forEach(char => {
            const span = document.createElement('span');
            span.innerText = char;
            span.style.display = 'inline-block';
            span.style.opacity = '1';
            span.style.visibility = 'visible';
            span.style.minWidth = (char === ' ') ? '0.3em' : 'auto';
            span.style.willChange = 'transform, opacity';
            span.style.color = 'inherit';
            span.style.webkitTextFillColor = 'inherit';
            element.appendChild(span);
            chars.push(span);
        });
        return chars;
    }

    // Split "Im" and "Karthikeyan" into chars
    const nameChars = splitToChars(heroName);
    const lineChars = splitToChars(titleLine);
    const heroChars = [...lineChars, ...nameChars];

    // Split "PSYCLOX" into chars
    const psycloxChars = splitToChars(psycloxTitle);

    // Split each landing word into chars
    const landingWordChars = [];
    landingWords.forEach(word => {
        landingWordChars.push(splitToChars(word));
    });

    // Initial states
    gsap.set(navLogo, { autoAlpha: 0 });
    gsap.set(morphLayer, { opacity: 1 });

    // Pre-scatter all morph target chars (PSYCLOX + landing words) invisibly
    const random = (min, max) => Math.random() * (max - min) + min;

    psycloxChars.forEach(char => {
        gsap.set(char, {
            x: random(-800, 800),
            y: random(-500, 500),
            rotationZ: random(-360, 360),
            opacity: 0,
            scale: random(2, 5)
        });
    });

    landingWordChars.forEach(wordChars => {
        wordChars.forEach(char => {
            gsap.set(char, {
                x: random(-600, 600),
                y: random(-300, 300),
                rotationZ: random(-180, 180),
                opacity: 0,
                scale: random(1.5, 3)
            });
        });
    });

    // --- Gradient shimmer on hero name ---
    gsap.timeline({ repeat: -1, yoyo: true }).to(heroName, {
        backgroundPosition: '200% center',
        duration: 4,
        ease: 'sine.inOut'
    });

    // --- Main scroll timeline ---
    setTimeout(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: heroSection,
                start: "top top",
                end: "+=250",
                scrub: 0.5,
                pin: true,
                invalidateOnRefresh: true,
                onLeave: () => ScrollTrigger.refresh()
            }
        });

        // ═══════════════════════════════════════
        // PHASE 1 (0 → 0.25): Scatter everything
        // ═══════════════════════════════════════

        // "Im Karthikeyan" explodes outward
        tl.fromTo(heroChars,
            { x: 0, y: 0, rotationZ: 0, scale: 1, autoAlpha: 1 },
            {
                x: "random(-1500, 1500, 10)",
                y: "random(-1500, 1500, 10)",
                rotationZ: "random(-360, 360, 5)",
                scale: "random(0.2, 1.5, 0.1)",
                autoAlpha: 0,
                duration: 0.25,
                ease: "power2.in",
                stagger: 0.005
            }, 0);

        // Subtitle flies up
        const typingText = document.querySelector('.hero-subtitle');
        if (typingText) {
            tl.fromTo(typingText,
                { y: 0, autoAlpha: 1 },
                { y: -300, autoAlpha: 0, duration: 0.25, ease: "power1.in" }, 0);
        }

        // Description, CTAs, socials scatter
        tl.fromTo('.hero-description, .hero-cta > *, .social-link',
            { x: 0, y: 0, rotationZ: 0, scale: 1, autoAlpha: 1 },
            {
                x: "random(-1500, 1500, 10)",
                y: "random(-1500, 1500, 10)",
                rotationZ: "random(-60, 60, 5)",
                autoAlpha: 0,
                scale: 0.5,
                duration: 0.25,
                ease: "power2.in",
                stagger: 0.02
            }, 0);

        // ═══════════════════════════════════════════
        // PHASE 2 (0.15 → 0.5): PSYCLOX assembles
        // ═══════════════════════════════════════════

        tl.to(psycloxChars, {
            x: 0,
            y: 0,
            rotationZ: 0,
            opacity: 1,
            scale: 1,
            duration: 0.3,
            ease: "back.out(1.7)",
            stagger: 0.01
        }, 0.15);

        // ═══════════════════════════════════════════════
        // PHASE 2.5 (0.25 → 0.55): Landing words assemble
        // ═══════════════════════════════════════════════

        landingWordChars.forEach((wordChars, wordIndex) => {
            tl.to(wordChars, {
                x: 0,
                y: 0,
                rotationZ: 0,
                opacity: 1,
                scale: 1,
                duration: 0.25,
                ease: "back.out(1.4)",
                stagger: 0.008
            }, 0.25 + wordIndex * 0.06);
        });

        // ═══════════════════════════════════════════
        // PHASE 3 (0.55 → 0.7): PSYCLOX glows brighter (stays white as identity)
        // ═══════════════════════════════════════════

        tl.to(psycloxTitle, {
            textShadow: '0 0 60px rgba(255, 255, 255, 0.6), 0 0 120px rgba(255, 71, 87, 0.3)',
            duration: 0.15,
            ease: "power2.inOut"
        }, 0.55);

        // Landing words are already red from HTML — just intensify their glow
        landingWords.forEach((word, i) => {
            tl.to(word, {
                textShadow: '0 0 20px rgba(255, 71, 87, 0.4)',
                duration: 0.1,
                ease: "power1.inOut"
            }, 0.58 + i * 0.03);
        });

        // ═══════════════════════════════════════════
        // PHASE 4 (0.65 → 0.8): Nav-logo + header
        // ═══════════════════════════════════════════

        tl.to(header, {
            backgroundColor: "rgba(10, 10, 10, 0.92)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            duration: 0.1
        }, 0.65);

        tl.fromTo(navLogo,
            { autoAlpha: 0, scale: 0.5, filter: "blur(10px)" },
            { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.1, ease: "back.out(2)" },
            0.7
        );

        // ═══════════════════════════════════════════════
        // PHASE 5 (0.8 → 1.0): Fade out → About section
        // ═══════════════════════════════════════════════

        tl.to(morphLayer, {
            autoAlpha: 0,
            y: -100,
            scale: 0.9,
            duration: 0.2,
            ease: "power2.in"
        }, 0.8);

        // Parallax scroll text
        const scrollIllusionText = document.getElementById('hero-scroll-text');
        if (scrollIllusionText) {
            gsap.fromTo(scrollIllusionText,
                { x: '10%' },
                {
                    x: '-40%', opacity: 0,
                    scrollTrigger: { trigger: heroSection, start: "top top", end: "bottom top", scrub: 0.5 }
                }
            );
        }



        ScrollTrigger.refresh();
    }, 200);
}
