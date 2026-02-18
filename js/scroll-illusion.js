window.addEventListener('load', () => {
    // 1. FORCE VISIBILITY INSTANTLY
    document.querySelectorAll('.hero-content, .title-name, .title-name span, .hero-subtitle').forEach(el => {
        el.style.opacity = '1';
        el.style.visibility = 'visible';
    });

    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    gsap.registerPlugin(ScrollTrigger);

    const heroName = document.querySelector('.title-name');
    const navLogo = document.querySelector('.nav-logo');
    const header = document.querySelector('.header');
    const heroElementsToFade = document.querySelectorAll('.hero-subtitle, .hero-description, .hero-bg-video, .hero-overlay');
    const scrambleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

    // Prepare Text
    function prepareHeroText(element) {
        if (!element) return [];
        const text = element.innerText;
        element.innerHTML = '';
        element.style.opacity = '1';

        const chars = [];
        text.split('').forEach(char => {
            const span = document.createElement('span');
            span.innerText = char;
            span.dataset.original = char;
            span.style.display = 'inline-block';
            span.style.opacity = '1';
            span.style.visibility = 'visible';
            span.style.minWidth = (char === ' ') ? '0.3em' : 'auto';
            span.style.willChange = 'transform, opacity';
            element.appendChild(span);
            chars.push(span);
        });
        return chars;
    }
    const heroChars = prepareHeroText(heroName);

    // Initial States
    gsap.set(navLogo, { autoAlpha: 0 });

    function getExplosionGeometry() {
        // Logo is fixed in header, so logic remains same
        const logoRect = navLogo.getBoundingClientRect();
        return {
            targetX: logoRect.left + (logoRect.width / 2),
            targetY: logoRect.top + (logoRect.height / 2)
        };
    }

    // DELAY FOR SAFETY
    setTimeout(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".hero-scroll-track", // TRIGGER IS THE TALL WRAPPER
                start: "top top",
                end: "bottom bottom", // Animate over the full height of track
                scrub: 1,
                pin: false, // DISABLED PINNING (Handled by CSS Sticky)
                anticipatePin: 1
            }
        });

        // ANIMATION LOGIC (Same as before, simplified)

        // PHASE 1: CHARACTERS
        heroChars.forEach((char) => {
            const geom = getExplosionGeometry();
            const charRect = char.getBoundingClientRect();
            const startX = 0;
            const startY = 0;
            const charCenterX = charRect.left + (charRect.width / 2);
            const charCenterY = charRect.top + (charRect.height / 2);

            const finalDistX = geom.targetX - charCenterX;
            const finalDistY = geom.targetY - charCenterY;

            const scatterX = (Math.random() - 0.5) * 300;
            const scatterY = (Math.random() - 0.5) * 300;

            tl.fromTo(char,
                { x: 0, y: 0, opacity: 1, scale: 1, rotation: 0, color: "#ffffff", textShadow: "none" },
                {
                    keyframes: [
                        { x: scatterX, y: scatterY, rotation: Math.random() * 360, scale: 1.5, color: "#00fff9", textShadow: "0 0 10px #00fff9", duration: 0.3 },
                        { x: finalDistX, y: finalDistY, rotation: 0, scale: 0.1, opacity: 0, color: "#ffffff", textShadow: "none", duration: 0.7 }
                    ],
                    onUpdate: function () {
                        const p = this.progress();
                        if (p > 0.1 && p < 0.9 && Math.random() > 0.7) {
                            char.innerText = scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
                        } else if (p <= 0.1) {
                            char.innerText = char.dataset.original;
                        }
                    }
                }, 0);
        });

        // PHASE 2: FADE OUT
        tl.fromTo(heroElementsToFade,
            { opacity: 1, y: 0, scale: 1 },
            { opacity: 0, y: -100, scale: 0.9, stagger: 0.05, duration: 0.2 },
            0);

        // PHASE 3: LOGO
        tl.fromTo(navLogo,
            { autoAlpha: 0, scale: 0.5, filter: "blur(10px)" },
            { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.1, ease: "back.out(2)" },
            0.9);

        // PHASE 4: HEADER
        tl.to(header, {
            backgroundColor: "rgba(10, 10, 10, 0.9)",
            backdropFilter: "blur(15px)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            duration: 0.2
        }, 0.5);

        // Force refresh for geometry
        ScrollTrigger.refresh();

    }, 100);
});
