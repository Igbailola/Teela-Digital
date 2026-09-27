/* ============================================================
   SHAPE MOTION — Hero and final-CTA kinetic shapes
   Both sections run the same visual system: a multi-harmonic
   buoyant drift plus a cursor spring, paused off-screen. All
   machinery lives in motion.js; this file is only the tuning
   for each section.
   ============================================================ */

import { initFloatingShapes, setTransform } from './motion.js';

// Global tempo for the hero. Scales frequency only — amplitudes
// and cursor response are untouched. 1 = original pace.
const HERO_RATE = 0.68;

/**
 * Glassmorphic floating shapes for the hero and the CTA band.
 */
export function initShapeMotion() {
  initHero();
  initFinalCta();
}

/**
 * Hero — glass sculpture drifts gently; companions each get
 * unique phase offsets so they never move in lockstep.
 */
function initHero() {
  const section = document.getElementById('hero');
  if (!section) return;

  const trackers = [];

  const focal = section.querySelector('.hero-focal-element');
  if (focal) {
    trackers.push({
      el: focal,
      update(t, cx, cy) {
        setTransform(
          focal,
          Math.sin(t * 0.8) * 24 + Math.cos(t * 0.5) * 12 + cx * 32,
          Math.cos(t * 0.7) * 20 + Math.sin(t * 1.1) * 10 + cy * 24,
          Math.sin(t * 0.6) * 4 + cx * 5
        );
      },
    });
  }

  section.querySelectorAll('.hero-companion').forEach((el, i) => trackers.push({
    el,
    update: companionUpdater(el, i),
  }));

  initFloatingShapes({
    section,
    trackers,
    threshold: 0.05,
    rate: HERO_RATE,
    stiffness: 0.1,
    // The hero is at the top of the page, so it is on screen at load.
    startVisible: true,
  });
}

/**
 * Build an updater for a hero companion shape.
 * @param {HTMLElement} el
 * @param {number} index
 * @returns {(t: number, cx: number, cy: number) => void}
 */
function companionUpdater(el, index) {
  const speed = parseFloat(el.dataset.speed) || 1;
  const phaseX = index * 1.3 + 0.5;
  const phaseY = index * 1.1 + 0.8;
  const freqX = 1.4 + index * 0.15;
  const freqY = 1.55 + index * 0.12;
  const ampX = 36 + (index % 3) * 10;
  const ampY = 32 + (index % 3) * 8;

  const rotates = el.matches('.hero-companion--ring, .hero-companion--capsule, .hero-companion--gem');
  const baseRot = el.classList.contains('hero-companion--capsule') ? -15
    : el.classList.contains('hero-companion--gem') ? 22
      : 0;

  return (t, cx, cy) => {
    const x = Math.sin(t * freqX + phaseX) * ampX * speed
      + Math.cos(t * (freqX * 0.55) + phaseY) * (ampX * 0.4)
      + cx * (20 * speed);
    const y = Math.cos(t * freqY + phaseY) * ampY * speed
      + Math.sin(t * (freqY * 0.6) + phaseX) * (ampY * 0.35)
      + cy * (16 * speed);

    setTransform(el, x, y, rotates ? baseRot + Math.sin(t * 1.2 + phaseX) * 12 : undefined);
  };
}

/**
 * Final CTA — four companion shapes, slightly faster tempo
 * than the hero, each with a constant base rotation.
 */
function initFinalCta() {
  const section = document.getElementById('final-cta');
  if (!section) return;

  const trackers = [];

  const focal = section.querySelector('.cta-focal-element');
  if (focal) {
    trackers.push({
      el: focal,
      update(t, cx, cy) {
        setTransform(
          focal,
          Math.sin(t * 1.55) * 32 + Math.cos(t * 0.85) * 16 + cx * 38,
          Math.cos(t * 1.35) * 28 + Math.sin(t * 2.1) * 12 + cy * 28,
          Math.sin(t * 1.15) * 5.5 + cx * 7
        );
      },
    });
  }

  // [selector, freqX, freqY, phaseX, phaseY, ampX, ampY, rot, cursorX, cursorY]
  const companions = [
    ['.cta-companion--orb', 1.7, 1.5, 0.4, 0.8, 44, 38, false, 24, 18],
    ['.cta-companion--ring', 1.85, 1.6, 1.2, 1.6, 46, 40, 'spin', 28, 20],
    ['.cta-companion--capsule', 1.5, 1.75, 2.1, 2.4, 40, 36, -15, 22, 16],
    ['.cta-companion--gem', 1.65, 1.7, 3.0, 3.2, 42, 38, 22, 26, 18],
  ];

  for (const [selector, freqX, freqY, phaseX, phaseY, ampX, ampY, rot, curX, curY] of companions) {
    const el = section.querySelector(selector);
    if (!el) continue;

    trackers.push({
      el,
      update(t, cx, cy) {
        const x = Math.cos(t * freqX + phaseX) * ampX + Math.sin(t * 0.8) * (ampX * 0.4) + cx * curX;
        const y = Math.sin(t * freqY + phaseY) * ampY + Math.cos(t * 1.1) * (ampY * 0.37) + cy * curY;

        let rotation;
        if (rot === 'spin') {
          rotation = -t * 14;
        } else if (typeof rot === 'number') {
          rotation = rot + Math.sin(t * 1.5) * 14;
        }

        setTransform(el, x, y, rotation);
      },
    });
  }

  initFloatingShapes({
    section,
    trackers,
    threshold: 0.1,
    rate: 1,
    stiffness: 0.12,
    startVisible: false,
  });
}
