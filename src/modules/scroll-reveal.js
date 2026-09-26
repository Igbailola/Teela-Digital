/* ============================================================
   SCROLL REVEAL
   IntersectionObserver-based reveal on scroll with staggering
   ============================================================ */

export function initScrollReveal() {
  // Respect prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    // Show everything immediately
    document.querySelectorAll('.reveal-up').forEach(el => {
      el.classList.add('is-visible');
    });
    return;
  }

  const elements = document.querySelectorAll('.reveal-up');

  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  elements.forEach(el => {
    // Don't observe hero elements — they use CSS animations
    if (el.closest('.hero')) return;
    observer.observe(el);
  });
}
