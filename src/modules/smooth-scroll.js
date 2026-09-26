/* ============================================================
   SMOOTH SCROLL
   Handle anchor link clicks with smooth scroll + offset
   ============================================================ */

export function initSmoothScroll() {
  const HEADER_HEIGHT = 80;

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const targetPosition = target.getBoundingClientRect().top + window.scrollY - HEADER_HEIGHT;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });

      // Update URL hash without jumping
      history.pushState(null, '', targetId);
    });
  });
}
