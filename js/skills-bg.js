document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("unified-nodes-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const parent = canvas.parentElement;

    let width, height;

    // Resize canvas to cover the whole unified wrapper
    function resize() {
        width = parent.clientWidth;
        height = parent.clientHeight;
        canvas.width = width;
        canvas.height = height;
    }

    window.addEventListener('resize', resize);
    resize();

    // Mouse coordinates (default off-screen or center initially)
    let mouse = { x: -1000, y: -1000 };

    // We only want the nodes to react when mouse is actually inside the wrapper
    parent.addEventListener('mousemove', (e) => {
        // We must calculate purely relative to the parent container
        const rect = parent.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    parent.addEventListener('mouseleave', () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    const nodeCount = window.innerWidth < 768 ? 100 : 250;
    const nodes = [];

    class Node {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.8;
            this.vy = (Math.random() - 0.5) * 0.8;
            this.radius = Math.random() * 2 + 1;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off edges
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;

            // Mouse Interaction
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Subtle attraction to mouse to feel "alive"
            if (distance < 200) {
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const force = (200 - distance) / 200;

                // Very gentle pull
                this.x += forceDirectionX * force * 1.5;
                this.y += forceDirectionY * force * 1.5;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(181, 23, 158, 0.5)"; // #b5179e Base purple/pink
            ctx.fill();
        }
    }

    for (let i = 0; i < nodeCount; i++) {
        nodes.push(new Node());
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Update and draw nodes
        nodes.forEach(node => {
            node.update();
            node.draw();
        });

        // Draw connections
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 150) {
                    // Opacity based on distance
                    const opacity = 1 - (dist / 150);
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    // Use #ff4d6d for lines 
                    ctx.strokeStyle = `rgba(255, 77, 109, ${opacity * 0.3})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }

            // Draw line to mouse
            const dxMouse = nodes[i].x - mouse.x;
            const dyMouse = nodes[i].y - mouse.y;
            const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

            if (distMouse < 200) {
                const opacity = 1 - (distMouse / 200);
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(mouse.x, mouse.y);
                // Brighter line to mouse
                ctx.strokeStyle = `rgba(181, 23, 158, ${opacity * 0.6})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        }

        requestAnimationFrame(animate);
    }

    // Since the document length might change on load or interactions (like window resize),
    // we use a ResizeObserver to keep canvas strictly attached to parent dimensions seamlessly
    const resizeObserver = new ResizeObserver(() => {
        resize();
    });
    resizeObserver.observe(parent);

    animate();
});
