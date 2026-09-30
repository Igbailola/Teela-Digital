/* ============================================================
   TEELA TECH — Main Application
   ============================================================ */

import { initScrollReveal } from './modules/scroll-reveal.js';
import { initNavigation } from './modules/navigation.js';
import { initContactForm } from './modules/contact-form.js';
import { initSmoothScroll } from './modules/smooth-scroll.js';
import { initProcessAnimation } from './modules/process-animation.js';
import { initShapeMotion } from './modules/shape-motion.js';
import { initNewsletter } from './modules/newsletter.js';
import { initServiceLinks } from './modules/service-links.js';

/**
 * Boot the application after DOM is ready.
 */
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initShapeMotion();
  initScrollReveal();
  initProcessAnimation();
  initContactForm();
  initNewsletter();
  initServiceLinks();
  initSmoothScroll();
});
