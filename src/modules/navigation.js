/* ============================================================
   NAVIGATION
   Header scroll behaviour + mobile menu toggle
   ============================================================ */

export function initNavigation() {
  const header = document.getElementById('site-header');
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('[data-nav-link]');

  if (!header || !toggle || !menu) return;

  /* ---- Scroll state ---- */
  let lastScroll = 0;
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const scrollY = window.scrollY;

      // Add/remove scrolled state for background blur
      if (scrollY > 50) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }

      lastScroll = scrollY;
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Mobile menu toggle ---- */
  function openMenu() {
    toggle.setAttribute('aria-expanded', 'true');
    menu.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    toggle.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function toggleMenu() {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  toggle.addEventListener('click', toggleMenu);

  // Close menu when a nav link is clicked
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      closeMenu();
      toggle.focus();
    }
  });
}
