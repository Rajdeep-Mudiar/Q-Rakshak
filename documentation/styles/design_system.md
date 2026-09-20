# UI Styles & Editorial Design System Specification

The **Q-RAKSHAK Clinical Editorial Design System** provides a clean, ultra-legible, high-contrast visual architecture designed for high-stress clinical workflows and high-fidelity scientific benchmarks.

---

## 1. Typography & Hierarchy

The interface pairs an authoritative modern sans-serif typeface for clinical headers with a high-precision monospace face for telemetry, circuit metadata, and laboratory metrics.

```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Roboto Mono', Menlo, monospace;
}
```

### Type Scale
| Element | CSS Size | Weight | Line Height | Letter Spacing | Purpose |
|---|---|---|---|---|---|
| **Display Hero** | `clamp(2.5rem, 4.4vw, 4.2rem)` | 900 | 1.05 | -0.04em | Login & Landing Page Primary Titles |
| **Section Banner** | `clamp(1.5rem, 2.8vw, 2.2rem)` | 800 | 1.15 | -0.02em | Disease Evaluation Track Headers |
| **Cockpit Subhead** | `1.15rem` | 700 | 1.35 | -0.01em | Model Evaluation Cards & Metric Summaries |
| **Body Primary** | `0.95rem` | 400 | 1.65 | normal | Explanatory Text, Clinical Narrative |
| **Data Metric Large** | `1.85rem` | 800 | 1.00 | -0.03em | Benchmark Accuracy & AUC-ROC Numbers |
| **Data Metric Small** | `0.82rem` | 600 | 1.40 | normal | Sensitivity, Specificity, Precision, F1 |
| **Terminal / Code** | `0.75rem` | 700 | 1.40 | 0.05em | Telemetry Keys, LaTeX Math, ASCII Headers |

---

## 2. Spacing, Grid & Layout System

- **Master Grid**: 12-column responsive fluid grid with 24px column gutters.
- **Micro-Grid Background**: 40px $\times$ 40px architectural grid lines:
  ```css
  background-image:
    linear-gradient(rgba(15, 23, 42, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(15, 23, 42, 0.035) 1px, transparent 1px);
  background-size: 40px 40px;
  ```
- **Viewport Constraints**: Desktop maximum content container `1440px` centered with auto margins.

---

## 3. Glassmorphic Surface Cards

For dark-mode benchmark tables and quantum circuit telemetry cards:

```css
.quantum-glass-card {
  background: rgba(15, 23, 42, 0.70);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.6);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease;
}

.quantum-glass-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.18);
}
```

---

## 4. Status Badges & Clinical Indicators

```css
/* Quantum Champion Badge */
.badge-quantum-lead {
  background: rgba(168, 85, 247, 0.12);
  color: #C084FC;
  border: 1px solid rgba(168, 85, 247, 0.3);
  font-family: var(--font-mono);
  font-size: 0.70rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
}

/* Classical Sentinel SOTA Badge */
.badge-classical-sota {
  background: rgba(16, 185, 129, 0.12);
  color: #34D399;
  border: 1px solid rgba(16, 185, 129, 0.3);
  font-family: var(--font-mono);
  font-size: 0.70rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
}

/* Autonomous Safety Override / Fallback Badge */
.badge-safety-override {
  background: rgba(245, 158, 11, 0.12);
  color: #FBBF24;
  border: 1px solid rgba(245, 158, 11, 0.3);
  font-family: var(--font-mono);
  font-size: 0.70rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
}
```

---

## 5. Animation Micro-Interactions (GSAP & CSS)

- **Hover Micro-Lifts**: `scale(1.01)` with `0.2s ease-out`.
- **Button Active Compression**: `scale(0.98)` on `:active`.
- **Pulsing Scroll Cue**: Continuous floating translateY `[0px -> 8px -> 0px]` over 2 seconds infinite loop.
- **GSAP ScrollTrigger Interpolation**: Seamless background color blending as user scrolls across evaluation sections.
