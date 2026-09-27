/* ============================================================
   SMOOTH SCROLL
   Anchor clicks scroll to their target under the fixed header.
   Offset is measured from the live header rather than hardcoded,
   and focus follows the scroll so keyboard users are not stranded.
   ============================================================ */

import { prefersReducedMotion } from './motion.js';

/**
 * Distance between the top of the viewport and the top of the
 * sticky header, re-read on every scroll so it stays correct if
 * the header resizes between breakpoints.
 * @returns {number}
 */
function headerOffset() {
  const header = document.getElementById('site-header');
  const gap = 16;
  return (header ? header.getBoundingClientRect().height : 0) + gap;
}

export function initSmoothScroll() {
  const reduceMotion = prefersReducedMotion();

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const top = target.getBoundingClientRect().top + window.scrollY - headerOffset();

      window.scrollTo({
        top,
        behavior: reduceMotion ? 'auto' : 'smooth',
      });

      // Update the URL without a jump.
      history.pushState(null, '', targetId);

      // Move focus so keyboard and screen reader users land on the
      // new section. Suppressed by default: focusing an element
      // scrolls it into view, which would fight the smooth scroll.
      const hadTabIndex = target.hasAttribute('tabindex');
      if (!hadTabIndex) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      if (!hadTabIndex) target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
    });
  });
}
