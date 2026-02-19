/* ========================================
   CYBER BOT COMPANION — JavaScript
   - Pupil follows cursor
   - Core shifts slightly towards cursor
   - Visible from About → Contact
   - Reacts to interactive elements
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    const robot = document.getElementById('cyber-bot');
    const core = document.getElementById('bot-core');
    const pupil = document.getElementById('bot-pupil');

    if (!robot || !core || !pupil) return;

    // Config
    const maxCoreShift = 10;
    const maxPupilMove = 8;
    const lerpSpeed = 0.08;

    // State
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentCoreX = 0;
    let currentCoreY = 0;
    let currentPupilX = 0;
    let currentPupilY = 0;

    const aboutSection = document.getElementById('about');
    const contactSection = document.getElementById('contact');

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function lerp(current, target, speed) {
        return current + (target - current) * speed;
    }

    function update() {
        // Calculate center of the bot to determine delta
        const rect = robot.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const dx = mouseX - cx;
        const dy = mouseY - cy;

        // Core shifting
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);

        const clampCore = Math.min(maxCoreShift, dist / 40);
        const targetCoreX = Math.cos(angle) * clampCore;
        const targetCoreY = Math.sin(angle) * clampCore;

        currentCoreX = lerp(currentCoreX, targetCoreX, lerpSpeed);
        currentCoreY = lerp(currentCoreY, targetCoreY, lerpSpeed);

        core.style.transform = `translate(${currentCoreX}px, ${currentCoreY}px)`;

        // Pupil tracking
        const clampPupil = Math.min(maxPupilMove, dist / 20);
        const targetPX = Math.cos(angle) * clampPupil;
        const targetPY = Math.sin(angle) * clampPupil;

        currentPupilX = lerp(currentPupilX, targetPX, lerpSpeed * 1.5);
        currentPupilY = lerp(currentPupilY, targetPY, lerpSpeed * 1.5);

        pupil.style.transform = `translate(${currentPupilX}px, ${currentPupilY}px)`;

        requestAnimationFrame(update);
    }

    update();

    // Visibility
    function updateVisibility() {
        if (!aboutSection) {
            robot.classList.remove('hidden');
            return;
        }

        const aboutTop = aboutSection.getBoundingClientRect().top;
        const showRobot = aboutTop < window.innerHeight * 0.6;

        let pastContact = false;
        if (contactSection) {
            const contactBottom = contactSection.getBoundingClientRect().bottom;
            pastContact = contactBottom < 0;
        }

        if (showRobot && !pastContact) {
            robot.classList.remove('hidden');
            robot.classList.add('idle');
        } else {
            robot.classList.add('hidden');
            robot.classList.remove('idle');
        }
    }

    window.addEventListener('scroll', updateVisibility, { passive: true });
    updateVisibility();
    robot.classList.add('hidden');

    // Interactive Curiosity
    document.addEventListener('mouseover', (e) => {
        if (e.target.closest('a, button, input, textarea, .exp-card-v2, .float-card, .reflex-card, .dashboard-item')) {
            robot.classList.add('curious');
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target.closest('a, button, input, textarea, .exp-card-v2, .float-card, .reflex-card, .dashboard-item')) {
            robot.classList.remove('curious');
        }
    });

    // Blinking
    function blink() {
        robot.classList.add('blinking');
        setTimeout(() => robot.classList.remove('blinking'), 150);
        setTimeout(blink, 2500 + Math.random() * 3500);
    }
    setTimeout(blink, 2000);
});
