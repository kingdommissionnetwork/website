import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  speed: number;
  wobble: number;
  wobbleSpeed: number;
  wobbleOffset: number;
}

export default function AmbientParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect users who request reduced motion: render nothing animated.
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];
    let running = true;
    let visible = true;

    const isCoarsePointer =
      typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;
    const isNarrowScreen = () =>
      typeof window !== "undefined" && window.innerWidth < 768;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initParticles();
    };

    const initParticles = () => {
      // Cap density on mobile: fewer particles on small/coarse-pointer screens
      // to save GPU + battery without visibly changing the effect.
      const cap = isNarrowScreen() || isCoarsePointer ? 28 : 80;
      const count = Math.min(cap, Math.floor((canvas.width * canvas.height) / 15000));
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: 1 + Math.random() * 2,
          opacity: 0.1 + Math.random() * 0.5,
          speed: 0.2 + Math.random() * 0.6,
          wobble: Math.random() * 2 - 1,
          wobbleSpeed: 0.01 + Math.random() * 0.02,
          wobbleOffset: Math.random() * Math.PI * 2,
        });
      }
    };

    const draw = () => {
      if (!running || !visible || document.hidden) {
        animationId = requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.y -= p.speed;
        p.wobbleOffset += p.wobbleSpeed;
        p.x += Math.sin(p.wobbleOffset) * p.wobble;

        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
        const rand = Math.random();
        // Warm gold, luminous amber-orange, or sacred white
        const r = rand > 0.6 ? 249 : rand > 0.2 ? 212 : 255;
        const g = rand > 0.6 ? 115 : rand > 0.2 ? 175 : 255;
        const b = rand > 0.6 ? 22 : rand > 0.2 ? 55 : 240;

        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${p.opacity})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      // Skip work while the tab is backgrounded; resume on return.
      if (!document.hidden) resize();
    };

    // Pause rendering while the canvas is scrolled off-screen.
    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              visible = entries[0]?.isIntersecting ?? true;
            },
            { threshold: 0 }
          )
        : null;
    observer?.observe(canvas);

    resize();
    draw();

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      running = false;
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
