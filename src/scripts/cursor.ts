/**
 * Custom cursor: ring + dot that follow the mouse, with hover grow effect.
 * Requires #cursor and #cursor-dot elements in the DOM.
 * Call initCursor() after DOMContentLoaded or inside an Astro <script>.
 *
 * The optional `hoverSelectors` param lets each page specify which elements
 * trigger the "hovering" class (grow effect). Falls back to a sensible default.
 */
import { gsap } from 'gsap';

const DEFAULT_HOVER_SELECTORS =
  'a, button, .btn, .chip, .stat, .project-card, .mentor-topic, .timeline-item, .content-row, .impact-card, .short-card';

export function initCursor(hoverSelectors: string = DEFAULT_HOVER_SELECTORS) {
  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const cursor = document.getElementById('cursor');
  const cursorDot = document.getElementById('cursor-dot');
  if (!cursor || !cursorDot) return;

  let cx = -100, cy = -100, dx = -100, dy = -100;

  document.addEventListener('mousemove', (e) => {
    cx = e.clientX;
    cy = e.clientY;
    gsap.to(cursorDot, { x: cx, y: cy, duration: 0.08, ease: 'power2.out' });
  });

  gsap.ticker.add(() => {
    dx += (cx - dx) * 0.1;
    dy += (cy - dy) * 0.1;
    gsap.set(cursor, { x: dx, y: dy });
  });

  document.querySelectorAll(hoverSelectors).forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
  });

  // Magnetic pull on buttons/chips
  document.querySelectorAll('.btn, .chip').forEach((btn) => {
    btn.addEventListener('mousemove', (e: Event) => {
      const me = e as MouseEvent;
      const rect = (btn as HTMLElement).getBoundingClientRect();
      const bx = rect.left + rect.width / 2;
      const by = rect.top + rect.height / 2;
      const pullX = (me.clientX - bx) * 0.2;
      const pullY = (me.clientY - by) * 0.2;
      gsap.to(btn, { x: pullX, y: pullY, duration: 0.4, ease: 'power3.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    });
  });
}
