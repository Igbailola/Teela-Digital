/* ============================================================
   HERO MOTION — 3D GEOMETRIC SHAPES VIEWPORT PHYSICS & BOUNCING
   - 8 transparent geometric shapes floating & bouncing freely
     all around the hero section and among the hero text
   - Strictly contained within the hero viewport (never outside view)
   - Natural elastic boundary collisions on all 4 edges
   - Soft inter-shape separation so shapes stay breathable
   - Interactive pointer drag & fling with momentum
   - Proximity cursor repulsion
   - Respects prefers-reduced-motion
   ============================================================ */

const SHAPES_CONFIG = [
  {
    id: '01',
    selector: '.hero-shape--01', // Green Sphere
    initX: 0.72,
    initY: 0.15,
    vx: -38,
    vy: 32,
    rot: -4,
    vRot: 2.2,
    depth: 1.2
  },
  {
    id: '02',
    selector: '.hero-shape--02', // Blue Column
    initX: 0.88,
    initY: 0.55,
    vx: -34,
    vy: -36,
    rot: 4,
    vRot: -1.6,
    depth: 1.0
  },
  {
    id: '03',
    selector: '.hero-shape--03', // Purple Column
    initX: 0.08,
    initY: 0.70,
    vx: 40,
    vy: -32,
    rot: -6,
    vRot: 1.5,
    depth: 0.85
  },
  {
    id: '04',
    selector: '.hero-shape--04', // Purple Torus Ring
    initX: 0.38,
    initY: 0.18,
    vx: 36,
    vy: 38,
    rot: 12,
    vRot: 2.8,
    depth: 0.95
  },
  {
    id: '05',
    selector: '.hero-shape--05', // Blue Spiral
    initX: 0.84,
    initY: 0.14,
    vx: -40,
    vy: 34,
    rot: -10,
    vRot: -2.5,
    depth: 1.1
  },
  {
    id: '06',
    selector: '.hero-shape--06', // Purple Star
    initX: 0.06,
    initY: 0.20,
    vx: 38,
    vy: 36,
    rot: 8,
    vRot: 2.6,
    depth: 0.75
  },
  {
    id: '07',
    selector: '.hero-shape--07', // Cyan Metaball
    initX: 0.44,
    initY: 0.65,
    vx: -36,
    vy: -38,
    rot: -5,
    vRot: -1.8,
    depth: 1.3
  },
  {
    id: '08',
    selector: '.hero-shape--08', // Red Droplet Cluster
    initX: 0.66,
    initY: 0.74,
    vx: -34,
    vy: -30,
    rot: 6,
    vRot: 2.0,
    depth: 1.15
  }
];

export function initHeroMotion() {
  const heroSection = document.getElementById('hero');
  const stage = document.getElementById('hero-shapes-stage');
  if (!heroSection || !stage) return;

  function getBounds() {
    const rect = heroSection.getBoundingClientRect();
    return {
      w: rect.width || window.innerWidth,
      h: rect.height || window.innerHeight,
      minX: 16,
      minY: 96, // Safely below navbar
      maxYPadding: 24
    };
  }

  let bounds = getBounds();

  // Initialize shape instances
  const shapes = [];

  SHAPES_CONFIG.forEach((cfg) => {
    const el = stage.querySelector(cfg.selector);
    if (!el) return;

    const w = el.offsetWidth || 120;
    const h = el.offsetHeight || 120;

    const maxX = Math.max(bounds.minX, bounds.w - w - bounds.minX);
    const maxY = Math.max(bounds.minY, bounds.h - h - bounds.maxYPadding);

    const x = Math.max(bounds.minX, Math.min(maxX, bounds.minX + cfg.initX * (maxX - bounds.minX)));
    const y = Math.max(bounds.minY, Math.min(maxY, bounds.minY + cfg.initY * (maxY - bounds.minY)));

    const item = {
      el,
      w,
      h,
      x,
      y,
      vx: cfg.vx,
      vy: cfg.vy,
      rot: cfg.rot,
      vRot: cfg.vRot,
      depth: cfg.depth,
      isDragging: false,
      dragOffsetX: 0,
      dragOffsetY: 0,
      lastDragX: x,
      lastDragY: y,
      lastDragTime: performance.now(),
      targetScale: 1,
      currentScale: 1
    };

    shapes.push(item);
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${item.rot.toFixed(1)}deg)`;
  });

  // Handle Resize
  window.addEventListener('resize', () => {
    bounds = getBounds();
    shapes.forEach((shape) => {
      shape.w = shape.el.offsetWidth || shape.w;
      shape.h = shape.el.offsetHeight || shape.h;
      const maxX = Math.max(bounds.minX, bounds.w - shape.w - bounds.minX);
      const maxY = Math.max(bounds.minY, bounds.h - shape.h - bounds.maxYPadding);
      shape.x = Math.max(bounds.minX, Math.min(maxX, shape.x));
      shape.y = Math.max(bounds.minY, Math.min(maxY, shape.y));
    });
  }, { passive: true });

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  // ----------------------------------------------------
  // INTERACTIVE POINTER DRAG & FLING
  // ----------------------------------------------------
  let activeDrag = null;

  shapes.forEach((shape) => {
    shape.el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      activeDrag = shape;
      shape.isDragging = true;
      shape.targetScale = 1.08;
      shape.el.style.zIndex = '20';

      const heroRect = heroSection.getBoundingClientRect();
      const pointerX = e.clientX - heroRect.left;
      const pointerY = e.clientY - heroRect.top;

      shape.dragOffsetX = pointerX - shape.x;
      shape.dragOffsetY = pointerY - shape.y;
      shape.lastDragX = e.clientX;
      shape.lastDragY = e.clientY;
      shape.lastDragTime = performance.now();
      shape.vx = 0;
      shape.vy = 0;
    });
  });

  window.addEventListener('pointermove', (e) => {
    if (!activeDrag) return;

    const heroRect = heroSection.getBoundingClientRect();
    const pointerX = e.clientX - heroRect.left;
    const pointerY = e.clientY - heroRect.top;

    const minX = bounds.minX;
    const maxX = Math.max(minX, bounds.w - activeDrag.w - minX);
    const minY = bounds.minY;
    const maxY = Math.max(minY, bounds.h - activeDrag.h - bounds.maxYPadding);

    activeDrag.x = Math.max(minX, Math.min(maxX, pointerX - activeDrag.dragOffsetX));
    activeDrag.y = Math.max(minY, Math.min(maxY, pointerY - activeDrag.dragOffsetY));

    const now = performance.now();
    const dt = Math.max(1, now - activeDrag.lastDragTime) / 1000;
    const instVx = (e.clientX - activeDrag.lastDragX) / dt;
    const instVy = (e.clientY - activeDrag.lastDragY) / dt;

    activeDrag.vx = activeDrag.vx * 0.4 + instVx * 0.6;
    activeDrag.vy = activeDrag.vy * 0.4 + instVy * 0.6;

    activeDrag.lastDragX = e.clientX;
    activeDrag.lastDragY = e.clientY;
    activeDrag.lastDragTime = now;
  });

  function endDrag() {
    if (!activeDrag) return;
    activeDrag.isDragging = false;
    activeDrag.targetScale = 1;
    activeDrag.el.style.zIndex = '1';

    // Clamp fling velocity
    const maxFling = 280;
    activeDrag.vx = Math.max(-maxFling, Math.min(maxFling, activeDrag.vx));
    activeDrag.vy = Math.max(-maxFling, Math.min(maxFling, activeDrag.vy));

    // Ensure baseline motion on gentle release
    const speed = Math.hypot(activeDrag.vx, activeDrag.vy);
    if (speed < 24) {
      activeDrag.vx = (Math.random() - 0.5) * 70;
      activeDrag.vy = (Math.random() - 0.5) * 70;
    }

    activeDrag = null;
  }

  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  // ----------------------------------------------------
  // CURSOR PROXIMITY REPULSION (GENTLE NUDGE)
  // ----------------------------------------------------
  let mouseX = -9999;
  let mouseY = -9999;

  heroSection.addEventListener('mousemove', (e) => {
    const heroRect = heroSection.getBoundingClientRect();
    mouseX = e.clientX - heroRect.left;
    mouseY = e.clientY - heroRect.top;
  }, { passive: true });

  heroSection.addEventListener('mouseleave', () => {
    mouseX = -9999;
    mouseY = -9999;
  });

  // ----------------------------------------------------
  // ANIMATION LOOP — FREE BOUNCING ALL AROUND HERO SECTION
  // ----------------------------------------------------
  let isInView = true;
  let rafId = null;
  let lastTime = performance.now();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isInView = entry.isIntersecting;
        if (isInView && !rafId) {
          lastTime = performance.now();
          rafId = requestAnimationFrame(tick);
        } else if (!isInView && rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      });
    },
    { threshold: 0.05 }
  );

  observer.observe(heroSection);

  function tick(now) {
    if (!isInView) {
      rafId = null;
      return;
    }

    const dt = Math.min(0.04, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;

    // 1. Soft inter-shape separation so shapes stay breathable all around
    for (let i = 0; i < shapes.length; i++) {
      for (let j = i + 1; j < shapes.length; j++) {
        const sA = shapes[i];
        const sB = shapes[j];
        if (sA.isDragging || sB.isDragging) continue;

        const cAx = sA.x + sA.w * 0.5;
        const cAy = sA.y + sA.h * 0.5;
        const cBx = sB.x + sB.w * 0.5;
        const cBy = sB.y + sB.h * 0.5;

        const dx = cBx - cAx;
        const dy = cBy - cAy;
        const dist = Math.hypot(dx, dy);
        const minDist = (sA.w + sB.w) * 0.55;

        if (dist > 0 && dist < minDist) {
          const force = ((minDist - dist) / minDist) * 40;
          const nx = dx / dist;
          const ny = dy / dist;

          sA.vx -= nx * force * dt;
          sA.vy -= ny * force * dt;
          sB.vx += nx * force * dt;
          sB.vy += ny * force * dt;
        }
      }
    }

    // 2. Update shapes motion & free boundary bouncing
    shapes.forEach((shape) => {
      shape.currentScale += (shape.targetScale - shape.currentScale) * 0.15;

      if (!shape.isDragging) {
        // Cursor proximity nudge
        if (mouseX > -1000) {
          const centerX = shape.x + shape.w * 0.5;
          const centerY = shape.y + shape.h * 0.5;
          const dx = centerX - mouseX;
          const dy = centerY - mouseY;
          const dist = Math.hypot(dx, dy);
          const pushRadius = 130;

          if (dist > 0 && dist < pushRadius) {
            const force = ((pushRadius - dist) / pushRadius) * 50;
            shape.vx += (dx / dist) * force * dt;
            shape.vy += (dy / dist) * force * dt;
          }
        }

        // Apply velocity & rotation freely
        shape.x += shape.vx * dt;
        shape.y += shape.vy * dt;
        shape.rot += shape.vRot * dt;

        // Viewport Boundaries
        const minX = bounds.minX;
        const maxX = Math.max(minX, bounds.w - shape.w - minX);
        const minY = bounds.minY;
        const maxY = Math.max(minY, bounds.h - shape.h - bounds.maxYPadding);

        // Left wall elastic bounce
        if (shape.x <= minX) {
          shape.x = minX;
          shape.vx = Math.abs(shape.vx);
          shape.vy += (Math.random() - 0.5) * 10;
          shape.vRot += (Math.random() - 0.5) * 3;
        }
        // Right wall elastic bounce
        else if (shape.x >= maxX) {
          shape.x = maxX;
          shape.vx = -Math.abs(shape.vx);
          shape.vy += (Math.random() - 0.5) * 10;
          shape.vRot += (Math.random() - 0.5) * 3;
        }

        // Top wall elastic bounce (stay below navbar)
        if (shape.y <= minY) {
          shape.y = minY;
          shape.vy = Math.abs(shape.vy);
          shape.vx += (Math.random() - 0.5) * 10;
          shape.vRot += (Math.random() - 0.5) * 3;
        }
        // Bottom wall elastic bounce (stay above marquee)
        else if (shape.y >= maxY) {
          shape.y = maxY;
          shape.vy = -Math.abs(shape.vy);
          shape.vx += (Math.random() - 0.5) * 10;
          shape.vRot += (Math.random() - 0.5) * 3;
        }

        // Velocity cruise regulation — maintains lively free bouncing
        const currentSpeed = Math.hypot(shape.vx, shape.vy);
        const minSpeed = 32;
        const maxCruise = 65;

        if (currentSpeed < minSpeed && currentSpeed > 0) {
          const boost = minSpeed / currentSpeed;
          shape.vx *= 1 + (boost - 1) * 0.08;
          shape.vy *= 1 + (boost - 1) * 0.08;
        } else if (currentSpeed > maxCruise) {
          shape.vx *= 0.985;
          shape.vy *= 0.985;
        }

        // Gentle rotational friction
        shape.vRot = Math.max(-10, Math.min(10, shape.vRot * 0.998));
      }

      // Render shape transform (smooth subpixel translate3d)
      shape.el.style.transform = `translate3d(${shape.x.toFixed(2)}px, ${shape.y.toFixed(2)}px, 0) rotate(${shape.rot.toFixed(2)}deg) scale(${shape.currentScale.toFixed(3)})`;
    });

    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);
}
