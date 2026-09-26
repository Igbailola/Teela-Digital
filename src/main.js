/* ============================================================
   TEELA DIGITAL — Main Application
   ============================================================ */

import { initScrollReveal } from './modules/scroll-reveal.js';
import { initNavigation } from './modules/navigation.js';
import { initContactForm } from './modules/contact-form.js';
import { initSmoothScroll } from './modules/smooth-scroll.js';
import { initProcessAnimation } from './modules/process-animation.js';
import { initCtaShapes } from './modules/cta-shapes.js';
import { initHeroMotion } from './modules/hero-motion.js';
import { initNewsletter } from './modules/newsletter.js';
import { initServiceLinks } from './modules/service-links.js';

/**
 * Boot the application after DOM is ready.
 */
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initHeroMotion();
  initScrollReveal();
  initProcessAnimation();
  initContactForm();
  initNewsletter();
  initServiceLinks();
  initSmoothScroll();
  initCtaShapes();
});
