# Clinical & Quantum Aesthetic Color Palettes

Q-RAKSHAK features a scroll-driven thematic journey powered by **GSAP ScrollTrigger**, dynamically shifting the page ambiance through each disease track.

---

## 1. Theme Palette Matrix

| Viewport Section | Dominant Hue | Master Background Gradient | Primary Accent | Glow Tone | Clinical Rationale |
|---|---|---|---|---|---|
| **0. Desktop Login Hero** | Crisp Pure White | `#FFFFFF` with slate-900 grid | `#059669` (Emerald) | `rgba(5, 150, 105, 0.15)` | High-clarity clinical authentication cockpit |
| **Transition Zone** | Slow Dark Blend | `#FFFFFF` $\rightarrow$ `#0A0F1D` | `#3B82F6` (Blue) | `rgba(59, 130, 246, 0.2)` | Prepares eye for immersive dark benchmark mode |
| **1. Breast Cancer** | Cosmic Violet / Magenta | `radial-gradient(ellipse at 50% 20%, #160829 0%, #080312 100%)` | `#D946EF` (Fuchsia) | `rgba(217, 70, 239, 0.18)` | Oncological histology & quantum state superposition |
| **2. Heart Disease** | Crimson / Cyber-Rose | `radial-gradient(ellipse at 50% 20%, #200812 0%, #090206 100%)` | `#F43F5E` (Rose) | `rgba(244, 63, 94, 0.20)` | Arterial blood flow, myocardium & cardiac vitality |
| **3. Parkinson's** | Neural Indigo / Cyan | `radial-gradient(ellipse at 50% 20%, #0A1434 0%, #030614 100%)` | `#06B6D4` (Cyan) | `rgba(6, 182, 212, 0.20)` | Synaptic neural networks & motor telemonitoring |
| **4. Diabetes** | Metabolic Emerald / Teal | `radial-gradient(ellipse at 50% 20%, #062016 0%, #020A07 100%)` | `#10B981` (Emerald) | `rgba(16, 185, 129, 0.20)` | Endocrine balance, pancreatic insulin regulation |

---

## 2. GSAP ScrollTrigger Integration Code

```javascript
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function setupBenchmarkScrollThemes(containerRef, sections) {
  const themes = [
    { target: "#section-breast-cancer", bg: "#080312", glow: "rgba(217, 70, 239, 0.18)" },
    { target: "#section-heart-disease", bg: "#090206", glow: "rgba(244, 63, 94, 0.20)" },
    { target: "#section-parkinsons", bg: "#030614", glow: "rgba(6, 182, 212, 0.20)" },
    { target: "#section-diabetes", bg: "#020A07", glow: "rgba(16, 185, 129, 0.20)" },
  ];

  themes.forEach(({ target, bg, glow }) => {
    ScrollTrigger.create({
      trigger: target,
      start: "top 60%",
      end: "bottom 40%",
      onEnter: () => {
        gsap.to(containerRef.current, {
          backgroundColor: bg,
          duration: 1.2,
          ease: "power2.out"
        });
      },
      onEnterBack: () => {
        gsap.to(containerRef.current, {
          backgroundColor: bg,
          duration: 1.2,
          ease: "power2.out"
        });
      }
    });
  });
}
```

---

## 3. Contrast Ratios & WCAG 2.1 AAA Accessibility
- All primary data metric text over dark section backgrounds utilizes `#FFFFFF` or `#F8FAFC`, delivering contrast ratios $> 14:1$ (exceeding WCAG AAA standard of 7:1).
- Secondary diagnostic keys utilize `#94A3B8` (Slate 400), delivering contrast ratio $> 5.8:1$.
- Interactive buttons and badges maintain distinct hover and active focus rings with minimum $3\text{px}$ offset.
