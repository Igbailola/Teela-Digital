/* ============================================================
   MOTION — shared utilities
   Reduced-motion detection plus the buoyant-drift engine that
   the hero and final-CTA sections both run. Each of those
   sections only supplies its own tuning, so the observer, the
   rAF loop and the cursor spring live here exactly once.
   ============================================================ */

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Whether the visitor has asked the OS to reduce motion.
 * @returns {boolean}
 */
export function prefersReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * Clamp a normalised pointer offset to -1..1.
 * @param {number} n
 * @returns {number}
 */
function clamp(n) {
  return Math.max(-1, Math.min(1, n));
}

/**
 * Write a transform to an element without allocating a template
 * string in the caller's hot path.
 * @param {HTMLElement} el
 * @param {number} x
 * @param {number} y
 * @param {number} [rot]
 */
export function setTransform(el, x, y, rot) {
  const r = rot === undefined ? '' : ` rotate(${rot.toFixed(2)}deg)`;
  el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)${r}`;
}

/**
 * Drive a set of elements from one shared animation loop.
 *
 * The loop only runs while the section is on screen, and the
 * cursor spring only advances while it is too — so an off-screen
 * section costs nothing.
 *
 * @param {object} options
 * @param {HTMLElement} options.section       Element watched for visibility
 * @param {Array<{el: HTMLElement, update: (t: number, cx: number, cy: number) => void}>} options.trackers
 * @param {number} [options.threshold]        IntersectionObserver ratio
 * @param {number} [options.rate]             Global tempo multiplier
 * @param {number} [options.stiffness]        Cursor spring interpolation factor
 * @param {boolean} [options.startVisible]    Seed the loop as already on screen
 */
export function initFloatingShapes({
  section,
  trackers,
  threshold = 0.05,
  rate = 1,
  stiffness = 0.1,
  startVisible = false,
}) {
  if (!section || !trackers.length) return;
  if (prefersReducedMotion()) return;

  let isInView = startVisible;
  let targetX = 0;
  let targetY = 0;
  let curX = 0;
  let curY = 0;
  let rafId = null;
  let startTime = null;

  function tick(now) {
    if (!isInView) {
      rafId = null;
      return;
    }

    if (!startTime) startTime = now;
    const t = ((now - startTime) / 1000) * rate;

    curX += (targetX - curX) * stiffness;
    curY += (targetY - curY) * stiffness;

    for (const tracker of trackers) {
      tracker.update(t, curX, curY);
    }

    rafId = requestAnimationFrame(tick);
  }

  new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        isInView = entry.isIntersecting;

        if (isInView && !rafId) {
          startTime = performance.now();
          rafId = requestAnimationFrame(tick);
        } else if (!isInView && rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }
    },
    { threshold }
  ).observe(section);

  window.addEventListener(
    'mousemove',
    (e) => {
      if (!isInView) return;

      const r = section.getBoundingClientRect();
      targetX = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2));
      targetY = clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2));
    },
    { passive: true }
  );

  section.addEventListener('mouseleave', () => {
    targetX = 0;
    targetY = 0;
  });

  if (startVisible) rafId = requestAnimationFrame(tick);
}
