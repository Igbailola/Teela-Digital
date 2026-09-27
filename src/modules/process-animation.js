/* ============================================================
   PROCESS ANIMATION
   Scroll-linked progressive reveal for the process section
   ============================================================ */

import { prefersReducedMotion } from './motion.js';

export function initProcessAnimation() {
  const section = document.getElementById('process');
  const steps = document.querySelectorAll('[data-process-step]');
  const progressFill = document.getElementById('process-progress-fill');

  if (!section || !steps.length) return;

  if (prefersReducedMotion()) {
    // Show all steps immediately
    steps.forEach(step => {
      step.classList.add('is-active');
      step.style.opacity = '1';
      step.style.transform = 'none';
    });
    if (progressFill) progressFill.style.width = '100%';
    return;
  }

  // Use IntersectionObserver on each step for progressive reveal
  const stepObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-active');
        }
      });
    },
    {
      threshold: 0.3,
      rootMargin: '0px 0px -80px 0px',
    }
  );

  steps.forEach(step => stepObserver.observe(step));

  // Scroll-linked progress bar
  if (progressFill) {
    let ticking = false;

    function updateProgress() {
      const sectionRect = section.getBoundingClientRect();
      const sectionTop = sectionRect.top;
      const sectionHeight = sectionRect.height;
      const windowHeight = window.innerHeight;

      // Calculate how far through the section we've scrolled
      const scrollStart = windowHeight * 0.7; // Start when section is 70% visible
      const scrollRange = sectionHeight - windowHeight * 0.3;

      const progress = Math.max(0, Math.min(1,
        (scrollStart - sectionTop) / scrollRange
      ));

      progressFill.style.width = `${progress * 100}%`;
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateProgress);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    updateProgress(); // Initial state
  }
}
