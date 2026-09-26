/* ============================================================
   HERO SHAPES — Glassmorphic floating animation
   Same kinetic spring dynamics as the Let's Talk section.
   Animates the hero-focal-element and hero-companion shapes
   with multi-harmonic buoyant float + cursor spring tracking.
   ============================================================ */

export function initHeroMotion() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const section = document.getElementById('hero');
  if (!section) return;

  const focalElement = section.querySelector('.hero-focal-element');
  const companions = section.querySelectorAll('.hero-companion');

  if (!focalElement && !companions.length) return;

  // Global tempo for every float harmonic. Scales frequency only —
  // amplitudes and cursor-spring response are untouched.
  // 1 = original pace, lower = lazier drift.
  const FLOAT_RATE = 0.68;

  let isInView = true;
  let targetCursorX = 0;
  let targetCursorY = 0;
  let curCursorX = 0;
  let curCursorY = 0;
  let rafId = null;
  let startTime = null;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isInView = entry.isIntersecting;
        if (isInView && !rafId) {
          startTime = performance.now();
          rafId = requestAnimationFrame(animateLoop);
        } else if (!isInView && rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      });
    },
    { threshold: 0.05 }
  );

  observer.observe(section);

  // Per-companion motion config with unique harmonic offsets
  const companionConfigs = [];
  companions.forEach((comp, i) => {
    const speed = parseFloat(comp.dataset.speed) || 1;
    companionConfigs.push({
      el: comp,
      speed,
      // Each companion gets unique phase offsets for organic, non-synchronized motion
      phaseX: i * 1.3 + 0.5,
      phaseY: i * 1.1 + 0.8,
      freqX: 1.4 + i * 0.15,
      freqY: 1.55 + i * 0.12,
      ampX: 36 + (i % 3) * 10,
      ampY: 32 + (i % 3) * 8,
      hasRotation: comp.classList.contains('hero-companion--ring') || comp.classList.contains('hero-companion--capsule') || comp.classList.contains('hero-companion--gem'),
      baseRot: comp.classList.contains('hero-companion--capsule') ? -15 : comp.classList.contains('hero-companion--gem') ? 22 : 0
    });
  });

  function animateLoop(now) {
    if (!isInView) {
      rafId = null;
      return;
    }

    if (!startTime) startTime = now;
    const t = ((now - startTime) / 1000) * FLOAT_RATE;

    // Spring interpolation for cursor tracking
    curCursorX += (targetCursorX - curCursorX) * 0.10;
    curCursorY += (targetCursorY - curCursorY) * 0.10;

    // ----------------------------------------------------------------
    // 1. Focal Glass Sculpture — gentle slow float
    // ----------------------------------------------------------------
    if (focalElement) {
      const floatX = Math.sin(t * 0.8) * 24 + Math.cos(t * 0.5) * 12;
      const floatY = Math.cos(t * 0.7) * 20 + Math.sin(t * 1.1) * 10;
      const rot = Math.sin(t * 0.6) * 4;

      const totalX = floatX + curCursorX * 32;
      const totalY = floatY + curCursorY * 24;
      const totalRot = rot + curCursorX * 5;

      focalElement.style.transform = `translate3d(${totalX.toFixed(2)}px, ${totalY.toFixed(2)}px, 0) rotate(${totalRot.toFixed(2)}deg)`;
    }

    // ----------------------------------------------------------------
    // 2. Companion shapes — each with unique kinetic float
    // ----------------------------------------------------------------
    companionConfigs.forEach((cfg) => {
      const floatX = Math.sin(t * cfg.freqX + cfg.phaseX) * cfg.ampX * cfg.speed
                    + Math.cos(t * (cfg.freqX * 0.55) + cfg.phaseY) * (cfg.ampX * 0.4);
      const floatY = Math.cos(t * cfg.freqY + cfg.phaseY) * cfg.ampY * cfg.speed
                    + Math.sin(t * (cfg.freqY * 0.6) + cfg.phaseX) * (cfg.ampY * 0.35);

      const totalX = floatX + curCursorX * (20 * cfg.speed);
      const totalY = floatY + curCursorY * (16 * cfg.speed);

      if (cfg.hasRotation) {
        const rot = cfg.baseRot + Math.sin(t * 1.2 + cfg.phaseX) * 12;
        cfg.el.style.transform = `translate3d(${totalX.toFixed(2)}px, ${totalY.toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg)`;
      } else {
        cfg.el.style.transform = `translate3d(${totalX.toFixed(2)}px, ${totalY.toFixed(2)}px, 0)`;
      }
    });

    rafId = requestAnimationFrame(animateLoop);
  }

  // Cursor tracking
  window.addEventListener('mousemove', (e) => {
    if (!isInView) return;

    const sectionRect = section.getBoundingClientRect();
    const centerX = sectionRect.left + sectionRect.width / 2;
    const centerY = sectionRect.top + sectionRect.height / 2;

    targetCursorX = Math.max(-1, Math.min(1, (e.clientX - centerX) / (sectionRect.width / 2)));
    targetCursorY = Math.max(-1, Math.min(1, (e.clientY - centerY) / (sectionRect.height / 2)));
  }, { passive: true });

  section.addEventListener('mouseleave', () => {
    targetCursorX = 0;
    targetCursorY = 0;
  });

  // Start immediately since hero is at top of page
  rafId = requestAnimationFrame(animateLoop);
}
