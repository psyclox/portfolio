/* =============================================
   SCROLL ILLUSION — Hero Text Animation
   Uses GSAP ScrollTrigger with the #about section
   as the trigger endpoint. As user scrolls past
   the hero, text scatters → nav-logo fades in.
   ============================================= */

window.addEventListener('load', () => {
    // 1. Force visibility — no FOUC
    const heroElements = document.querySelectorAll('.hero-content, .title-name, .title-name span, .hero-subtitle');
    heroElements.forEach(el => {
        el.style.opacity = '1';
        el.style.visibility = 'visible';
        el.style.color = '#ffffff';
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
    const heroElementsToFade = document.querySelectorAll(
        '.hero-subtitle, .hero-description, .hero-cta, .hero-socials, .hero-bg-video, .hero-overlay, .title-line, .scroll-indicator'
    );

    if (!heroName || !navLogo || !heroSection) return;

    const scrambleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*_+-=<>?";

    // --- Prepare hero text into individual characters ---
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

    // Initial state — hide nav-logo
    gsap.set(navLogo, { autoAlpha: 0 });

    // --- Gradient masking animation on hero name (runs on load) ---
    const maskTl = gsap.timeline({ repeat: -1, yoyo: true });
    maskTl.to(heroName, {
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
                end: "bottom top",      // When hero scrolls completely out
                scrub: 1.2,
                pin: false,
                anticipatePin: 0
            }
        });

        // PHASE 1: Smooth character transition to nav-logo
        heroChars.forEach((char, i) => {
            const logoRect = navLogo.getBoundingClientRect();
            const charRect = char.getBoundingClientRect();

            const finalDistX = logoRect.left + (logoRect.width / 2) - (charRect.left + charRect.width / 2);
            const finalDistY = logoRect.top + (logoRect.height / 2) - (charRect.top + charRect.height / 2);

            tl.fromTo(char,
                { x: 0, y: 0, opacity: 1, scale: 1, rotation: 0, color: "#ffffff" },
                {
                    x: finalDistX,
                    y: finalDistY,
                    scale: 0.2,
                    opacity: 0,
                    duration: 0.8,
                    ease: "power3.inOut"
                }, 0);
        });

        // PHASE 2: Fade out other hero elements with stagger
        tl.fromTo(heroElementsToFade,
            { opacity: 1, y: 0, scale: 1 },
            { opacity: 0, y: -40, scale: 0.97, duration: 0.4, stagger: 0.03 },
            0.15
        );

        // PHASE 3: Nav-logo appears (late in the scroll)
        tl.fromTo(navLogo,
            { autoAlpha: 0, scale: 0.5, filter: "blur(10px)" },
            { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.2, ease: "back.out(2)" },
            0.75
        );

        // PHASE 4: Header gets background
        tl.to(header, {
            backgroundColor: "rgba(10, 10, 10, 0.92)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            duration: 0.15
        }, 0.75);

        // Force refresh geometry
        ScrollTrigger.refresh();

    }, 200);
}
