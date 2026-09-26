/* ============================================================
   HERO MOTION — FREE BOUNCING GEOMETRIC SHAPES & REAL SHADOWS
   - True 2D physics engine: shapes glide and bounce freely around the hero
   - Elastic boundary collisions against hero stage boundaries
   - Dynamic real directional & contact shadows
   - Interactive pointer drag & throw / fling with momentum
   - Proximity cursor repulsion (gentle magnetic nudge)
   - Accessibility: honors prefers-reduced-motion
   ============================================================ */

const SHAPES_DATA = [
  {
    id: '01',
    selector: '.hero-shape--01', // Pink Sphere (Dominant foreground)
    initX: 0.46,
    initY: 0.22,
    vx: 32,
    vy: -24,
    rot: -4,
    vRot: 3.5,
    depth: 1.2
  },
  {
    id: '02',
    selector: '.hero-shape--02', // Cyan Cube (Dominant architectural)
    initX: 0.16,
    initY: 0.42,
    vx: -28,
    vy: 28,
    rot: 6,
    vRot: -3.0,
    depth: 1.0
  },
  {
    id: '03',
    selector: '.hero-shape--03', // Yellow Cone (Dynamic accent)
    initX: 0.68,
    initY: 0.08,
    vx: 34,
    vy: 24,
    rot: 14,
    vRot: 4.5,
    depth: 0.75
  },
  {
    id: '04',
    selector: '.hero-shape--04', // Blue Cylinder (Midground foundation)
    initX: 0.50,
    initY: 0.54,
    vx: -24,
    vy: -30,
    rot: -6,
    vRot: -2.5,
    depth: 0.9
  },
  {
    id: '05',
    selector: '.hero-shape--05', // Red Pyramid (Angular counterpoint)
    initX: 0.08,
    initY: 0.64,
    vx: 28,
    vy: -26,
    rot: 8,
    vRot: 4.0,
    depth: 0.7
  },
  {
    id: '06',
    selector: '.hero-shape--06', // Lime Cube (Right elevation)
    initX: 0.75,
    initY: 0.38,
    vx: -32,
    vy: -22,
    rot: -12,
    vRot: -3.8,
    depth: 1.1
  },
  {
    id: '07',
    selector: '.hero-shape--07', // Magenta Prism (Dominant vertical soaring)
    initX: 0.28,
    initY: 0.06,
    vx: 26,
    vy: 30,
    rot: -8,
    vRot: 2.8,
    depth: 1.3
  },
  {
    id: '08',
    selector: '.hero-shape--08', // Orange Cylinder (Left peripheral anchor)
    initX: 0.04,
    initY: 0.20,
    vx: -22,
    vy: 26,
    rot: 12,
    vRot: -2.8,
    depth: 0.8
  },
  {
    id: '09',
    selector: '.hero-shape--09', // Purple Cube (Deep ambient background)
    initX: 0.68,
    initY: 0.70,
    vx: 26,
    vy: 20,
    rot: -15,
    vRot: 2.2,
    depth: 0.6
  }
];

export function initHeroMotion() {
  const heroSection = document.getElementById('hero');
  const stage = document.getElementById('hero-shapes-stage');
  if (!heroSection || !stage) return;

  let stageRect = stage.getBoundingClientRect();
  let stageW = stageRect.width || 620;
  let stageH = stageRect.height || 580;

  // Initialize shape instances
  const shapes = [];

  SHAPES_DATA.forEach((data) => {
    const el = stage.querySelector(data.selector);
    if (!el) return;

    const shadowEl = el.querySelector('.hero-shape__shadow');
    const shapeW = el.offsetWidth || (data.selector.includes('01') ? 165 : 135);
    const shapeH = el.offsetHeight || (data.selector.includes('07') ? 170 : 135);

    // Initial position in pixels
    const x = Math.max(0, Math.min(stageW - shapeW, data.initX * (stageW - shapeW)));
    const y = Math.max(0, Math.min(stageH - shapeH, data.initY * (stageH - shapeH)));

    const item = {
      el,
      shadowEl,
      w: shapeW,
      h: shapeH,
      x,
      y,
      vx: data.vx,
      vy: data.vy,
      rot: data.rot,
      vRot: data.vRot,
      depth: data.depth,
      origZ: el.style.zIndex || window.getComputedStyle(el).zIndex,
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

    // Set initial transform
    el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${item.rot.toFixed(2)}deg) scale(1)`;
  });

  if (shapes.length === 0) return;

  // Check reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    shapes.forEach((s) => {
      s.el.style.transform = `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0) rotate(${s.rot.toFixed(1)}deg)`;
    });
    return;
  }

  // Update bounds on window resize
  function updateBounds() {
    stageRect = stage.getBoundingClientRect();
    stageW = stageRect.width || 620;
    stageH = stageRect.height || 580;

    shapes.forEach((s) => {
      s.w = s.el.offsetWidth || s.w;
      s.h = s.el.offsetHeight || s.h;
      // Clamp within new stage dimensions
      s.x = Math.max(0, Math.min(Math.max(10, stageW - s.w), s.x));
      s.y = Math.max(0, Math.min(Math.max(10, stageH - s.h), s.y));
    });
  }

  window.addEventListener('resize', updateBounds, { passive: true });

  // ----------------------------------------------------
  // INTERACTIVE DRAG & TOSS (FLING) PHYSICS
  // ----------------------------------------------------
  let activeDragShape = null;

  shapes.forEach((shape) => {
    shape.el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      activeDragShape = shape;
      shape.isDragging = true;
      shape.el.style.zIndex = '120';
      shape.targetScale = 1.06;

      const rect = shape.el.getBoundingClientRect();
      shape.dragOffsetX = e.clientX - rect.left;
      shape.dragOffsetY = e.clientY - rect.top;

      shape.lastDragX = e.clientX;
      shape.lastDragY = e.clientY;
      shape.lastDragTime = performance.now();

      stage.setPointerCapture(e.pointerId);
    });
  });

  window.addEventListener('pointermove', (e) => {
    if (!activeDragShape) return;

    stageRect = stage.getBoundingClientRect();
    const now = performance.now();
    const dt = Math.max(0.001, (now - activeDragShape.lastDragTime) / 1000);

    const newX = e.clientX - stageRect.left - activeDragShape.dragOffsetX;
    const newY = e.clientY - stageRect.top - activeDragShape.dragOffsetY;

    // Track fling velocity (pixels/second)
    const instantVx = (e.clientX - activeDragShape.lastDragX) / dt;
    const instantVy = (e.clientY - activeDragShape.lastDragY) / dt;

    activeDragShape.vx = instantVx * 0.75 + activeDragShape.vx * 0.25;
    activeDragShape.vy = instantVy * 0.75 + activeDragShape.vy * 0.25;

    activeDragShape.x = Math.max(0, Math.min(stageW - activeDragShape.w, newX));
    activeDragShape.y = Math.max(0, Math.min(stageH - activeDragShape.h, newY));

    activeDragShape.lastDragX = e.clientX;
    activeDragShape.lastDragY = e.clientY;
    activeDragShape.lastDragTime = now;
  });

  function endDrag() {
    if (!activeDragShape) return;
    activeDragShape.isDragging = false;
    activeDragShape.targetScale = 1;
    activeDragShape.el.style.zIndex = activeDragShape.origZ;

    // Clamp fling speed so it bounces lively but doesn't vanish
    const maxFling = 280;
    activeDragShape.vx = Math.max(-maxFling, Math.min(maxFling, activeDragShape.vx));
    activeDragShape.vy = Math.max(-maxFling, Math.min(maxFling, activeDragShape.vy));

    // Ensure minimum bounce velocity if released gently
    const speed = Math.hypot(activeDragShape.vx, activeDragShape.vy);
    if (speed < 30) {
      activeDragShape.vx = (Math.random() - 0.5) * 60;
      activeDragShape.vy = (Math.random() - 0.5) * 60;
    }

    activeDragShape = null;
  }

  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  // ----------------------------------------------------
  // CURSOR PROXIMITY REPULSION (GENTLE NUDGE)
  // ----------------------------------------------------
  let mouseStageX = -9999;
  let mouseStageY = -9999;

  stage.addEventListener('mousemove', (e) => {
    stageRect = stage.getBoundingClientRect();
    mouseStageX = e.clientX - stageRect.left;
    mouseStageY = e.clientY - stageRect.top;
  }, { passive: true });

  stage.addEventListener('mouseleave', () => {
    mouseStageX = -9999;
    mouseStageY = -9999;
  });

  // ----------------------------------------------------
  // ANIMATION LOOP (PHYSICS & BOUNCE ENGINE)
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

    shapes.forEach((shape) => {
      // Smooth scale interpolation
      shape.currentScale += (shape.targetScale - shape.currentScale) * 0.15;

      if (!shape.isDragging) {
        // Cursor proximity nudge
        if (mouseStageX > -1000) {
          const centerX = shape.x + shape.w * 0.5;
          const centerY = shape.y + shape.h * 0.5;
          const dx = centerX - mouseStageX;
          const dy = centerY - mouseStageY;
          const dist = Math.hypot(dx, dy);
          const pushRadius = 110;

          if (dist > 0 && dist < pushRadius) {
            const force = ((pushRadius - dist) / pushRadius) * 45;
            shape.vx += (dx / dist) * force * dt;
            shape.vy += (dy / dist) * force * dt;
          }
        }

        // Apply velocity
        shape.x += shape.vx * dt;
        shape.y += shape.vy * dt;
        shape.rot += shape.vRot * dt;

        // Bouncing against stage boundaries
        const maxX = Math.max(0, stageW - shape.w);
        const maxY = Math.max(0, stageH - shape.h);

        // Left wall bounce
        if (shape.x <= 0) {
          shape.x = 0;
          shape.vx = Math.abs(shape.vx);
          shape.vRot += (Math.random() - 0.5) * 4;
        }
        // Right wall bounce
        else if (shape.x >= maxX) {
          shape.x = maxX;
          shape.vx = -Math.abs(shape.vx);
          shape.vRot += (Math.random() - 0.5) * 4;
        }

        // Top wall bounce
        if (shape.y <= 0) {
          shape.y = 0;
          shape.vy = Math.abs(shape.vy);
          shape.vRot += (Math.random() - 0.5) * 4;
        }
        // Bottom wall bounce
        else if (shape.y >= maxY) {
          shape.y = maxY;
          shape.vy = -Math.abs(shape.vy);
          shape.vRot += (Math.random() - 0.5) * 4;
        }

        // Regulate cruising velocity: keep smooth & continuous floating
        const currentSpeed = Math.hypot(shape.vx, shape.vy);
        const minSpeed = 24;
        const maxCruise = 70;

        if (currentSpeed < minSpeed && currentSpeed > 0) {
          const boost = minSpeed / currentSpeed;
          shape.vx *= 1 + (boost - 1) * 0.05;
          shape.vy *= 1 + (boost - 1) * 0.05;
        } else if (currentSpeed > maxCruise) {
          // Gently damp after high fling
          shape.vx *= 0.985;
          shape.vy *= 0.985;
        }

        // Keep rotation gentle
        shape.vRot = Math.max(-12, Math.min(12, shape.vRot * 0.998));
      }

      // Render shape transform
      shape.el.style.transform = `translate3d(${shape.x.toFixed(2)}px, ${shape.y.toFixed(2)}px, 0) rotate(${shape.rot.toFixed(2)}deg) scale(${shape.currentScale.toFixed(3)})`;

      // Real dynamic shadow response: adjusts with height and lateral position
      if (shape.shadowEl) {
        const heightFraction = Math.max(0, Math.min(1, shape.y / Math.max(1, stageH - shape.h)));
        // When object bounces down near bottom: shadow is sharper & darker; when high up: softer & slightly wider
        const shadowScaleX = 0.85 + (1 - heightFraction) * 0.35;
        const shadowScaleY = 0.9 + (1 - heightFraction) * 0.25;
        const shadowOpacity = 0.55 + heightFraction * 0.35;

        // Directional shadow shift matching top-left keylight
        const shadowOffsetX = ((shape.x / Math.max(1, stageW)) - 0.5) * 12;

        shape.shadowEl.style.transform = `translate3d(${shadowOffsetX.toFixed(1)}px, 0, 0) scale(${shadowScaleX.toFixed(2)}, ${shadowScaleY.toFixed(2)})`;
        shape.shadowEl.style.opacity = shadowOpacity.toFixed(2);
      }
    });

    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);
}
