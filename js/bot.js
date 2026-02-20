/* ========================================
   ROBOTO ROBOT COMPANION — JavaScript
   - 3D Head rotation tracks cursor
   - Golden eyes shift towards cursor
   - Visible from About → Contact
   - Reacts to interactive elements
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    const robot = document.getElementById('cyber-bot');
    const head = document.getElementById('bot-head');
    const eyes = document.getElementById('bot-eyes');

    if (!robot || !head || !eyes) return;

    // Config
    const maxHeadRotateY = 35; // degrees
    const maxHeadRotateX = 25; // degrees
    const maxEyeShift = 8; // pixels

    // Base Rest Rotations
    const baseRotZ = 10;
    const baseRotY = -15;
    const baseRotX = 10;

    // State
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    // Physics State
    let headRotX = 0, headRotY = 0;
    let headVX = 0, headVY = 0;
    let eyeX = 0, eyeY = 0;
    let eyeVX = 0, eyeVY = 0;

    // Physics constants
    const stiffness = 0.06;
    const damping = 0.65;
    const eyeStiffness = 0.08;
    const eyeDamping = 0.7;

    const aboutSection = document.getElementById('about');
    const contactSection = document.getElementById('contact');

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });


    // Random Idling Offset
    let idleOffsetX = 0;
    let idleOffsetY = 0;

    function randomIdleLooking() {
        if (!robot.classList.contains('hidden') && !robot.classList.contains('curious')) {
            // Occasionally look around if not hovering anything
            if (Math.random() > 0.6) {
                idleOffsetX = (Math.random() - 0.5) * 800; // Big fake movements
                idleOffsetY = (Math.random() - 0.5) * 800;
            } else {
                idleOffsetX = 0;
                idleOffsetY = 0;
            }
        }
        setTimeout(randomIdleLooking, 2000 + Math.random() * 3000);
    }
    setTimeout(randomIdleLooking, 1000);

    function update() {
        // Calculate center of the bot to determine delta
        const rect = robot.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const targetX = mouseX - cx + idleOffsetX;
        const targetY = mouseY - cy + idleOffsetY;

        // Dist from center relative to screen size to calculate angle percentages
        const pctX = (targetX / (window.innerWidth / 2));
        const pctY = (targetY / (window.innerHeight / 2));

        // --- Head Spring Physics (Rotations) ---
        // clamp to max rotation mapped by mouse percentage distance
        const tHeadY = Math.max(-maxHeadRotateY, Math.min(maxHeadRotateY, pctX * maxHeadRotateY));
        const tHeadX = Math.max(-maxHeadRotateX, Math.min(maxHeadRotateX, -pctY * maxHeadRotateX));

        const ax = (tHeadX - headRotX) * stiffness;
        const ay = (tHeadY - headRotY) * stiffness;
        headVX = (headVX + ax) * damping;
        headVY = (headVY + ay) * damping;
        headRotX += headVX;
        headRotY += headVY;

        if (!robot.classList.contains('curious')) {
            head.style.transform = `rotateZ(${baseRotZ}deg) rotateY(${baseRotY + headRotY}deg) rotateX(${baseRotX + headRotX}deg)`;
        }

        // --- Eye Spring Physics (Translation) ---
        const dist = Math.hypot(targetX, targetY);
        const angle = Math.atan2(targetY, targetX);

        const clampEye = Math.min(maxEyeShift, dist / 25);
        const targetPX = Math.cos(angle) * clampEye;
        const targetPY = Math.sin(angle) * clampEye;

        const pax = (targetPX - eyeX) * eyeStiffness;
        const pay = (targetPY - eyeY) * eyeStiffness;
        eyeVX = (eyeVX + pax) * eyeDamping;
        eyeVY = (eyeVY + pay) * eyeDamping;
        eyeX += eyeVX;
        eyeY += eyeVY;

        eyes.style.transform = `translate(${eyeX}px, ${eyeY}px) translateY(-5px)`;

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
        const footer = document.querySelector('footer');
        if (footer) {
            const footerTop = footer.getBoundingClientRect().top;
            if (footerTop < window.innerHeight) {
                pastContact = true;
            }
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
