// Vanilla TS port of the former React ParticleCanvas island.
// Initialized by index.astro via a <script> import; no framework runtime.

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

export function initParticleCanvas(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const colors = ['#3b82f6', '#06b6d4', '#22c55e', '#a855f7', '#f59e0b'];
  const connectionDistance = 140;
  const mouseRadius = 200;

  let animId = 0;
  const particles: Particle[] = [];
  let mouseX = -1000;
  let mouseY = -1000;

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  const onMouseMove = (e: MouseEvent) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  };
  if (!reducedMotion) {
    window.addEventListener('mousemove', onMouseMove, { passive: true });
  }

  const count = Math.min(
    100,
    Math.floor((window.innerWidth * window.innerHeight) / 12000),
  );
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 1.8 + 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.5 + 0.15,
    });
  }

  const drawStatic = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < connectionDistance) {
          const opacity = (1 - dist / connectionDistance) * 0.12;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(148, 163, 184, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    for (const p of particles) {
      const dmx = p.x - mouseX;
      const dmy = p.y - mouseY;
      const mouseDist = Math.sqrt(dmx * dmx + dmy * dmy);
      if (mouseDist < mouseRadius && mouseDist > 0) {
        const force = ((mouseRadius - mouseDist) / mouseRadius) * 0.02;
        p.vx += (dmx / mouseDist) * force;
        p.vy += (dmy / mouseDist) * force;
      }

      p.vx *= 0.99;
      p.vy *= 0.99;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    }

    animId = requestAnimationFrame(draw);
  };

  if (reducedMotion) {
    drawStatic();
  } else {
    draw();
  }

  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    window.removeEventListener('mousemove', onMouseMove);
  };
}
