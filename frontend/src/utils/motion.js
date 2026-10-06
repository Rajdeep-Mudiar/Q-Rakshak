import gsap from "gsap";

/**
 * Checks if the user or browser prefers reduced motion.
 */
export function isReducedMotion() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.body.classList.contains("reduced-motion")
  );
}

/**
 * Animate elements into view with a subtle staggered fade and slide.
 * @param {HTMLElement | string | Array} target - Elements to animate
 * @param {Object} options - Custom gsap overrides
 */
export function animateEntrance(target, options = {}) {
  if (!target || isReducedMotion()) return null;

  return gsap.fromTo(
    target,
    {
      opacity: 0,
      y: options.y ?? 14,
      scale: options.scale ?? 0.99,
    },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: options.duration ?? 0.35,
      stagger: options.stagger ?? 0.05,
      ease: options.ease ?? "power2.out",
      clearProps: "transform",
      ...options,
    }
  );
}

/**
 * Animate a modal or drawer opening.
 * @param {HTMLElement} overlayRef - Backdrop overlay element
 * @param {HTMLElement} modalRef - Modal dialog card
 */
export function animateModalOpen(overlayRef, modalRef) {
  if (isReducedMotion()) return;

  const tl = gsap.timeline();
  if (overlayRef) {
    tl.fromTo(overlayRef, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, 0);
  }
  if (modalRef) {
    tl.fromTo(
      modalRef,
      { opacity: 0, scale: 0.95, y: 16 },
      { opacity: 1, scale: 1, y: 0, duration: 0.28, ease: "back.out(1.15)" },
      0.05
    );
  }
  return tl;
}

/**
 * Smooth metric count-up animation for KPI numbers.
 * @param {HTMLElement} targetRef - The element displaying the number
 * @param {number} startVal - Starting number
 * @param {number} endVal - Final target number
 * @param {number} decimals - Number of decimal places
 * @param {string} suffix - Optional suffix like '%' or ' ms'
 */
export function animateCounter(targetRef, startVal, endVal, decimals = 1, suffix = "") {
  if (!targetRef) return;
  if (isReducedMotion()) {
    targetRef.textContent = `${Number(endVal).toFixed(decimals)}${suffix}`;
    return;
  }

  const obj = { val: startVal };
  return gsap.to(obj, {
    val: endVal,
    duration: 0.9,
    ease: "power2.out",
    onUpdate: () => {
      if (targetRef) {
        targetRef.textContent = `${obj.val.toFixed(decimals)}${suffix}`;
      }
    },
  });
}

/**
 * Editorial Hero Entrance with luxury staggered fade and slide.
 */
export function animateEditorialHero(containerRef) {
  if (!containerRef || isReducedMotion()) return;
  const elements = containerRef.querySelectorAll(".editorial-reveal");
  if (!elements || elements.length === 0) return;

  return gsap.fromTo(
    elements,
    { opacity: 0, y: 22, filter: "blur(4px)" },
    {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.65,
      stagger: 0.08,
      ease: "power3.out",
      clearProps: "all",
    }
  );
}

/**
 * Editorial Grid / Cards staggered entrance.
 */
export function animateCardStagger(containerRef, cardSelector = ".editorial-card") {
  if (!containerRef || isReducedMotion()) return;
  const cards = containerRef.querySelectorAll(cardSelector);
  if (!cards || cards.length === 0) return;

  return gsap.fromTo(
    cards,
    { opacity: 0, y: 16, scale: 0.98 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.45,
      stagger: 0.06,
      ease: "power2.out",
      clearProps: "transform",
    }
  );
}

/**
 * Subtle breathing pulse glow on status or telemetry nodes.
 */
export function animatePulseGlow(targetRef) {
  if (!targetRef || isReducedMotion()) return;
  return gsap.to(targetRef, {
    boxShadow: "0 0 16px rgba(212, 175, 55, 0.45)",
    repeat: -1,
    yoyo: true,
    duration: 1.6,
    ease: "sine.inOut",
  });
}

/**
 * 3D Card Flip Animation for ID Cards and Dual-Faced Clinical Views
 * @param {HTMLElement} cardInnerRef - Inner wrapper containing front and back faces
 * @param {boolean} isFlipped - Whether card is flipped to back
 */
export function animateCard3DFlip(cardInnerRef, isFlipped) {
  if (!cardInnerRef) return;
  if (isReducedMotion()) {
    gsap.set(cardInnerRef, { rotateY: isFlipped ? 180 : 0 });
    return;
  }
  return gsap.to(cardInnerRef, {
    rotateY: isFlipped ? 180 : 0,
    duration: 0.7,
    ease: "back.out(1.4)",
    transformStyle: "preserve-3d",
  });
}

/**
 * Tactile Error Shake animation for inputs and buttons
 * @param {HTMLElement} targetRef - Element to shake
 */
export function animateErrorShake(targetRef) {
  if (!targetRef || isReducedMotion()) return;
  return gsap.timeline()
    .to(targetRef, { x: -8, duration: 0.06, ease: "power1.inOut" })
    .to(targetRef, { x: 8, duration: 0.06, ease: "power1.inOut" })
    .to(targetRef, { x: -6, duration: 0.06, ease: "power1.inOut" })
    .to(targetRef, { x: 6, duration: 0.06, ease: "power1.inOut" })
    .to(targetRef, { x: -3, duration: 0.05, ease: "power1.inOut" })
    .to(targetRef, { x: 0, duration: 0.05, ease: "power1.out" });
}

/**
 * Gliding Tab Indicator Animation
 * @param {HTMLElement} indicatorRef - Background slider pill
 * @param {HTMLElement} activeTabRef - The currently active tab element
 */
export function animateTabIndicator(indicatorRef, activeTabRef) {
  if (!indicatorRef || !activeTabRef) return;
  const { offsetLeft, offsetWidth } = activeTabRef;
  if (isReducedMotion()) {
    gsap.set(indicatorRef, { x: offsetLeft, width: offsetWidth });
    return;
  }
  return gsap.to(indicatorRef, {
    x: offsetLeft,
    width: offsetWidth,
    duration: 0.35,
    ease: "power3.out",
  });
}

/**
 * Ambient floating animation for background decorative orbs and badges
 */
export function animateAmbientFloat(targetRef, options = {}) {
  if (!targetRef || isReducedMotion()) return;
  return gsap.to(targetRef, {
    y: options.y ?? -10,
    x: options.x ?? 4,
    rotation: options.rotation ?? 2,
    duration: options.duration ?? 3.2,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    ...options,
  });
}

/**
 * Tactile button hover interaction
 */
export function animateCardHover(targetRef) {
  if (!targetRef || isReducedMotion()) return;
  const onEnter = () => gsap.to(targetRef, { y: -3, scale: 1.015, duration: 0.22, ease: "power2.out" });
  const onLeave = () => gsap.to(targetRef, { y: 0, scale: 1, duration: 0.22, ease: "power2.out" });
  targetRef.addEventListener("mouseenter", onEnter);
  targetRef.addEventListener("mouseleave", onLeave);
  return () => {
    targetRef.removeEventListener("mouseenter", onEnter);
    targetRef.removeEventListener("mouseleave", onLeave);
  };
}

/**
 * Rewarding spring pop for successful actions (e.g., booking confirmed, scan uploaded, card saved)
 * @param {HTMLElement} targetRef - Element to pop
 */
export function animateSuccessPop(targetRef) {
  if (!targetRef || isReducedMotion()) return;
  return gsap.timeline()
    .fromTo(targetRef, { scale: 0.88, opacity: 0.5 }, { scale: 1.08, opacity: 1, duration: 0.24, ease: "back.out(2)" })
    .to(targetRef, { scale: 1.0, duration: 0.16, ease: "power2.out" });
}

export const animateMetricCount = animateCounter;

/**
 * Architectural Shutter Reveal for crisp planar card and panel entrances
 * @param {HTMLElement | string | Array} target - Target element(s)
 * @param {Object} options - Custom overrides
 */
export function animateShutterEntrance(target, options = {}) {
  if (!target || isReducedMotion()) return null;

  return gsap.fromTo(
    target,
    {
      opacity: 0,
      y: options.y ?? 10,
    },
    {
      opacity: 1,
      y: 0,
      duration: options.duration ?? 0.32,
      stagger: options.stagger ?? 0.04,
      ease: options.ease ?? "power2.out",
      clearProps: "transform",
      ...options,
    }
  );
}

/**
 * Tactile Architectural Card Hover with razor-sharp hairline border darken and micro-lift
 * @param {HTMLElement} targetRef - Target element
 */
export function animateArchitecturalHover(targetRef) {
  if (!targetRef || isReducedMotion()) return () => {};

  const onEnter = () => {
    gsap.to(targetRef, {
      y: -2,
      borderColor: "#18181B",
      duration: 0.18,
      ease: "power2.out",
    });
  };

  const onLeave = () => {
    gsap.to(targetRef, {
      y: 0,
      borderColor: "#E4E4E7",
      duration: 0.18,
      ease: "power2.out",
    });
  };

  targetRef.addEventListener("mouseenter", onEnter);
  targetRef.addEventListener("mouseleave", onLeave);

  return () => {
    targetRef.removeEventListener("mouseenter", onEnter);
    targetRef.removeEventListener("mouseleave", onLeave);
  };
}


