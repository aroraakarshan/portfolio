// VLSI Power Delivery Network canvas — replaces generic particles with a
// domain-specific grid mesh. Mouse proximity simulates IR drop (green→yellow→red).
// Initialized by index.astro via a <script> import; no framework runtime.

interface GridNode {
  x: number;
  y: number;
  baseAlpha: number;
  heat: number;       // 0 = cool (nominal), 1 = hot (IR drop)
  pulse: number;      // 0–1 animation phase for current-flow pulses
  layer: number;      // 0 = power, 1 = ground (visual differentiation)
}

interface CurrentPath {
  nodes: number[];    // indices into grid
  progress: number;   // 0–1 animation progress
  speed: number;
  color: string;
}

// Lerp between two hex colors via RGB
function lerpColor(a: string, b: string, t: number): string {
  const ah = parseInt(a.slice(1), 16);
  const bh = parseInt(b.slice(1), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

// IR-drop heatmap: green → yellow → red
function heatColor(t: number): string {
  if (t < 0.5) return lerpColor('#22c55e', '#eab308', t * 2);
  return lerpColor('#eab308', '#ef4444', (t - 0.5) * 2);
}

export function initParticleCanvas(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CELL = 60;                 // grid spacing in px
  const MOUSE_RADIUS = 280;       // IR drop influence radius
  const NODE_RADIUS = 2.2;
  const RAIL_ALPHA = 0.07;        // baseline rail opacity
  const RAIL_ALPHA_HOT = 0.25;    // rail opacity near mouse

  let animId = 0;
  let mouseX = -9999;
  let mouseY = -9999;
  let cols = 0;
  let rows = 0;
  const grid: GridNode[] = [];
  const paths: CurrentPath[] = [];

  // Build grid
  const buildGrid = () => {
    grid.length = 0;
    paths.length = 0;
    cols = Math.ceil(canvas.width / CELL) + 1;
    rows = Math.ceil(canvas.height / CELL) + 1;
    const offsetX = (canvas.width - (cols - 1) * CELL) / 2;
    const offsetY = (canvas.height - (rows - 1) * CELL) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        grid.push({
          x: offsetX + c * CELL,
          y: offsetY + r * CELL,
          baseAlpha: 0.15 + Math.random() * 0.15,
          heat: 0,
          pulse: 0,
          layer: (r + c) % 3 === 0 ? 1 : 0,
        });
      }
    }

    // Create a few random current-flow paths (horizontal and vertical runs)
    const pathCount = Math.min(8, Math.floor(cols * rows / 40));
    for (let i = 0; i < pathCount; i++) {
      const isHorizontal = Math.random() > 0.4;
      const pathNodes: number[] = [];
      if (isHorizontal) {
        const r = Math.floor(Math.random() * rows);
        const startC = Math.floor(Math.random() * (cols - 4));
        const len = 4 + Math.floor(Math.random() * (cols - startC - 3));
        for (let c = startC; c < startC + len && c < cols; c++) {
          pathNodes.push(r * cols + c);
        }
      } else {
        const c = Math.floor(Math.random() * cols);
        const startR = Math.floor(Math.random() * (rows - 4));
        const len = 4 + Math.floor(Math.random() * (rows - startR - 3));
        for (let r = startR; r < startR + len && r < rows; r++) {
          pathNodes.push(r * cols + c);
        }
      }
      if (pathNodes.length >= 4) {
        paths.push({
          nodes: pathNodes,
          progress: Math.random(),
          speed: 0.003 + Math.random() * 0.004,
          color: ['#3b82f6', '#06b6d4', '#22c55e', '#a855f7'][Math.floor(Math.random() * 4)],
        });
      }
    }
  };

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    buildGrid();
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

  const idx = (r: number, c: number) => r * cols + c;

  const drawStatic = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw rails
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const n = grid[idx(r, c)];
        // Horizontal rail
        if (c < cols - 1) {
          const n2 = grid[idx(r, c + 1)];
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.strokeStyle = n.layer === 1 ? 'rgba(59,130,246,0.06)' : 'rgba(6,182,212,0.04)';
          ctx.lineWidth = n.layer === 1 ? 1 : 0.5;
          ctx.stroke();
        }
        // Vertical rail
        if (r < rows - 1) {
          const n2 = grid[idx(r + 1, c)];
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.strokeStyle = n.layer === 1 ? 'rgba(59,130,246,0.06)' : 'rgba(6,182,212,0.04)';
          ctx.lineWidth = n.layer === 1 ? 1 : 0.5;
          ctx.stroke();
        }
        // Node dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, NODE_RADIUS * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = n.layer === 1 ? 'rgba(59,130,246,0.2)' : 'rgba(6,182,212,0.12)';
        ctx.fill();
      }
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update heat based on mouse proximity
    for (const n of grid) {
      const dx = n.x - mouseX;
      const dy = n.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const targetHeat = dist < MOUSE_RADIUS ? Math.pow(1 - dist / MOUSE_RADIUS, 1.5) : 0;
      // Smooth transition
      n.heat += (targetHeat - n.heat) * 0.08;
    }

    // Draw rails (connections between adjacent nodes)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const n = grid[idx(r, c)];
        // Horizontal rail
        if (c < cols - 1) {
          const n2 = grid[idx(r, c + 1)];
          const avgHeat = (n.heat + n2.heat) / 2;
          const alpha = RAIL_ALPHA + avgHeat * (RAIL_ALPHA_HOT - RAIL_ALPHA);
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(n2.x, n2.y);
          if (avgHeat > 0.05) {
            ctx.strokeStyle = heatColor(avgHeat);
            ctx.globalAlpha = alpha * 1.5;
            ctx.lineWidth = 1 + avgHeat * 1.5;
          } else {
            ctx.strokeStyle = n.layer === 1 ? '#3b82f6' : '#06b6d4';
            ctx.globalAlpha = alpha;
            ctx.lineWidth = n.layer === 1 ? 1 : 0.5;
          }
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        // Vertical rail
        if (r < rows - 1) {
          const n2 = grid[idx(r + 1, c)];
          const avgHeat = (n.heat + n2.heat) / 2;
          const alpha = RAIL_ALPHA + avgHeat * (RAIL_ALPHA_HOT - RAIL_ALPHA);
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(n2.x, n2.y);
          if (avgHeat > 0.05) {
            ctx.strokeStyle = heatColor(avgHeat);
            ctx.globalAlpha = alpha * 1.5;
            ctx.lineWidth = 1 + avgHeat * 1.5;
          } else {
            ctx.strokeStyle = n.layer === 1 ? '#3b82f6' : '#06b6d4';
            ctx.globalAlpha = alpha;
            ctx.lineWidth = n.layer === 1 ? 1 : 0.5;
          }
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }

    // Draw current-flow pulses along paths
    for (const path of paths) {
      path.progress = (path.progress + path.speed) % 1;
      const totalSegments = path.nodes.length - 1;
      const pulsePos = path.progress * totalSegments;
      const pulseWidth = 3; // number of segments the pulse covers

      for (let s = 0; s < totalSegments; s++) {
        const n1 = grid[path.nodes[s]];
        const n2 = grid[path.nodes[s + 1]];
        // How close is this segment to the pulse head?
        const dist = Math.abs(s - pulsePos);
        const wrapped = Math.min(dist, totalSegments - dist);
        if (wrapped < pulseWidth) {
          const intensity = 1 - wrapped / pulseWidth;
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.strokeStyle = path.color;
          ctx.globalAlpha = intensity * 0.35;
          ctx.lineWidth = 2 + intensity * 1.5;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }

    // Draw nodes
    for (const n of grid) {
      const radius = NODE_RADIUS + n.heat * 2;
      ctx.beginPath();
      ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
      if (n.heat > 0.05) {
        ctx.fillStyle = heatColor(n.heat);
        ctx.globalAlpha = 0.3 + n.heat * 0.6;
      } else {
        ctx.fillStyle = n.layer === 1 ? '#3b82f6' : '#06b6d4';
        ctx.globalAlpha = n.baseAlpha;
      }
      ctx.fill();
      ctx.globalAlpha = 1;

      // Glow ring on hot nodes
      if (n.heat > 0.3) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = heatColor(n.heat);
        ctx.globalAlpha = n.heat * 0.2;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
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
