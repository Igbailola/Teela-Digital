/* ============================================================
   CTA SHAPES — KINETIC MOTION & SPRING DYNAMICS
   - Shapes in the Let's Talk section move at the pace of the hero shapes (~35-50 px/s).
   - High-performance requestAnimationFrame subpixel rendering.
   - Multi-harmonic continuous buoyant drift + dynamic cursor spring reaction.
   - Pauses when outside viewport for optimal performance.
   ============================================================ */

export function initCtaShapes() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const section = document.getElementById('final-cta');
  if (!section) return;

  const focalElement = section.querySelector('.cta-focal-element');
  const orb = section.querySelector('.cta-companion--orb');
  const ring = section.querySelector('.cta-companion--ring');
  const capsule = section.querySelector('.cta-companion--capsule');
  const gem = section.querySelector('.cta-companion--gem');

  let isInView = false;
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
    { threshold: 0.1 }
  );

  observer.observe(section);

  function animateLoop(now) {
    if (!isInView) {
      rafId = null;
      return;
    }

    if (!startTime) startTime = now;
    const t = (now - startTime) / 1000;

    // Fast spring interpolation for cursor tracking
    curCursorX += (targetCursorX - curCursorX) * 0.12;
    curCursorY += (targetCursorY - curCursorY) * 0.12;

    // ----------------------------------------------------------------
    // 1. Focal Centerpiece Motion (~40-50 px/s kinetic buoyant tempo)
    // ----------------------------------------------------------------
    if (focalElement) {
      const floatX = Math.sin(t * 1.55) * 32 + Math.cos(t * 0.85) * 16;
      const floatY = Math.cos(t * 1.35) * 28 + Math.sin(t * 2.1) * 12;
      const rot = Math.sin(t * 1.15) * 5.5;

      const totalX = floatX + curCursorX * 38;
      const totalY = floatY + curCursorY * 28;
      const totalRot = rot + curCursorX * 7;

      focalElement.style.transform = `translate3d(${totalX.toFixed(2)}px, ${totalY.toFixed(2)}px, 0) rotate(${totalRot.toFixed(2)}deg)`;
    }

    // ----------------------------------------------------------------
    // 2. Orb Companion Motion (~48 px/s pace)
    // ----------------------------------------------------------------
    if (orb) {
      const floatX = Math.cos(t * 1.7 + 0.4) * 44 + Math.sin(t * 0.8) * 18;
      const floatY = Math.sin(t * 1.5 + 0.8) * 38 + Math.cos(t * 1.1) * 14;
      const totalX = floatX + curCursorX * 24;
      const totalY = floatY + curCursorY * 18;

      orb.style.transform = `translate3d(${totalX.toFixed(2)}px, ${totalY.toFixed(2)}px, 0)`;
    }

    // ----------------------------------------------------------------
    // 3. Ring Companion Motion (~52 px/s pace)
    // ----------------------------------------------------------------
    if (ring) {
      const floatX = Math.sin(t * 1.85 + 1.2) * 46 + Math.cos(t * 0.75) * 16;
      const floatY = Math.cos(t * 1.6 + 1.6) * 40 + Math.sin(t * 1.25) * 15;
      const rot = -t * 14;
      const totalX = floatX + curCursorX * 28;
      const totalY = floatY + curCursorY * 20;

      ring.style.transform = `translate3d(${totalX.toFixed(2)}px, ${totalY.toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg)`;
    }

    // ----------------------------------------------------------------
    // 4. Capsule Companion Motion (~44 px/s pace)
    // ----------------------------------------------------------------
    if (capsule) {
      const floatX = Math.cos(t * 1.5 + 2.1) * 40 + Math.sin(t * 0.9) * 16;
      const floatY = Math.sin(t * 1.75 + 2.4) * 36 + Math.cos(t * 1.05) * 12;
      const rot = -15 + Math.sin(t * 1.55) * 14;
      const totalX = floatX + curCursorX * 22;
      const totalY = floatY + curCursorY * 16;

      capsule.style.transform = `translate3d(${totalX.toFixed(2)}px, ${totalY.toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg)`;
    }

    // ----------------------------------------------------------------
    // 5. Gem Companion Motion (~46 px/s pace)
    // ----------------------------------------------------------------
    if (gem) {
      const floatX = Math.sin(t * 1.65 + 3.0) * 42 + Math.cos(t * 0.8) * 16;
      const floatY = Math.cos(t * 1.7 + 3.2) * 38 + Math.sin(t * 1.3) * 14;
      const rot = 22 + Math.sin(t * 1.4) * 16;
      const totalX = floatX + curCursorX * 26;
      const totalY = floatY + curCursorY * 18;

      gem.style.transform = `translate3d(${totalX.toFixed(2)}px, ${totalY.toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg)`;
    }

    rafId = requestAnimationFrame(animateLoop);
  }

  // Pointer interactions across the section
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
}
