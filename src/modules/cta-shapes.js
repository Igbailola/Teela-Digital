/* ============================================================
   CTA SHAPES
   Smooth spring-damped cursor interaction & kinetic motion
   for the visual focal point in the Let's Talk section.
   Delivers the soft, playful, alive Framer Motion feel.
   ============================================================ */

export function initCtaShapes() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const section = document.getElementById('final-cta');
  if (!section) return;

  const focalElement = section.querySelector('.cta-focal-element');
  const companions = section.querySelectorAll('.cta-companion');

  if (!focalElement && !companions.length) return;

  let isInView = false;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let rafId = null;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isInView = entry.isIntersecting;
        if (isInView && !rafId) {
          rafId = requestAnimationFrame(animateLoop);
        } else if (!isInView && rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      });
    },
    { threshold: 0.15 }
  );

  observer.observe(section);

  function animateLoop() {
    if (!isInView) {
      rafId = null;
      return;
    }

    // Spring interpolation (lerp)
    const factor = 0.08;
    currentX += (targetX - currentX) * factor;
    currentY += (targetY - currentY) * factor;

    // Apply soft cursor displacement and gentle tilt to focal centerpiece
    if (focalElement) {
      const moveX = currentX * 22;
      const moveY = currentY * 16;
      const tilt = currentX * 6;
      focalElement.style.setProperty('--cursor-x', `${moveX.toFixed(2)}px`);
      focalElement.style.setProperty('--cursor-y', `${moveY.toFixed(2)}px`);
      focalElement.style.setProperty('--cursor-tilt', `${tilt.toFixed(2)}deg`);
      focalElement.style.transform = `translate(var(--cursor-x, 0), var(--cursor-y, 0)) rotate(var(--cursor-tilt, 0deg))`;
    }

    // Apply displacement to companions
    companions.forEach((comp) => {
      const speed = parseFloat(comp.dataset.floatSpeed) || 1;
      const compX = currentX * 12 * speed;
      const compY = currentY * 10 * speed;
      comp.style.setProperty('--cursor-x', `${compX.toFixed(2)}px`);
      comp.style.setProperty('--cursor-y', `${compY.toFixed(2)}px`);
      comp.style.transform = `translate(var(--cursor-x, 0), var(--cursor-y, 0))`;
    });

    rafId = requestAnimationFrame(animateLoop);
  }

  // Update target coordinates on mouse move
  window.addEventListener('mousemove', (e) => {
    if (!isInView) return;

    const sectionRect = section.getBoundingClientRect();
    const centerX = sectionRect.left + sectionRect.width / 2;
    const centerY = sectionRect.top + sectionRect.height / 2;

    targetX = Math.max(-1, Math.min(1, (e.clientX - centerX) / (sectionRect.width / 2)));
    targetY = Math.max(-1, Math.min(1, (e.clientY - centerY) / (sectionRect.height / 2)));
  }, { passive: true });

  // Reset target on mouse leave
  section.addEventListener('mouseleave', () => {
    targetX = 0;
    targetY = 0;
  });
}
