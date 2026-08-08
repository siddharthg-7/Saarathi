---
version: 1.0.0
name: Bezaleel LaunchLayer System
description: A premium design system characterized by golden highlights, glassmorphism, and hardware-accelerated scroll animations.
colors:
  background: "#030303"
  surface: "#0A0A0A"
  primary-gold: "#D4AF37"
  light-gold: "#FACC15"
  dim-gold: "#856c1b"
  text-main: "#E5E5E5"
  text-muted: "#A3A3A3"
  border-low: "rgba(255, 255, 255, 0.05)"
  border-medium: "rgba(255, 255, 255, 0.1)"
typography:
  display:
    family: "Space Grotesk"
    weight: "600"
    tracking: "tight"
  body:
    family: "Inter"
    weight: "400"
    size: "16px"
  utility:
    family: "Inter"
    weight: "500"
    size: "12px"
    transform: "uppercase"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  section: "96px"
rounded:
  sm: "4px"
  md: "8px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
components:
  nav:
    background: "rgba(0, 0, 0, 0.5)"
    blur: "12px"
    height: "80px"
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)"
  buttons:
    primary:
      variant: "shiny-cta"
      border: "1px solid rgba(255, 255, 255, 0.1)"
      glow: "rgba(212, 175, 55, 0.15)"
    secondary:
      variant: "btn-secondary"
      background: "rgba(255, 255, 255, 0.03)"
  cards:
    service:
      background: "rgba(23, 23, 23, 0.3)"
      hoverBorder: "#D4AF37/30"
    work:
      aspectRatio: "16/10"
      background: "card-grid-bg"
  pills:
    glass:
      variant: "apple-glass-pill"
      blur: "12px"
      border: "1px solid rgba(255, 255, 255, 0.08)"
motion:
  speed: "0.8s"
  curve: "cubic-bezier(0.25, 1, 0.5, 1)"
  animations:
    scroll: "fade-in-blur-up"
    accent: "beam-spin-conic"
    glow: "gold-text-pulse"
---
## Overview
The Bezaleel LaunchLayer system conveys prestige and technical superiority. It uses a dark mode palette punctuated by "Gold Primary" highlights to guide user attention toward conversion points and value propositions.

## Colors
- **Primary Black (#030303)**: The foundation of the visual depth.
- **Gold Spectrum**: Using `#D4AF37` for structural accents and `#FACC15` for interactive highlights.
- **Neutral Hierarchy**: Whites and Greys are strictly filtered to keep contrast high but glare low.

## Typography
- **Headers**: Space Grotesk provides a geometric, futuristic feel.
- **Body**: Inter ensures readability across dense technical descriptions.
- **Large Display**: Section headers use massive fluid typography (up to 14vw) to create visual rhythm.

## Spacing
- Standardized on a 4px/8px base system.
- Hero padding is aggressive (Top 24, Bottom 12) to frame the 3D assets.

## Layout
- **Perspective Grids**: Background layers use linear gradients to create a 50px grid pattern, masked for a fade-away effect.
- **Z-Index Strategy**:
  - Base (-20): Perspective grids.
  - Midground (-10): Blur glows and ambient lights.
  - Foreground (10-50): Content and floating glass pills.
  - Top (50+): Navigation and overlays.

## Elevation & Depth
- **Glassmorphism**: Achieved via `backdrop-filter: blur(12px)` and thin 1px white borders at low opacity.
- **Hardware Acceleration**: Use of `translate3d` and `will-change` properties on scroll-animated elements to ensure 60fps performance.

## Shapes
- **Pills**: Navigation and badges use `9999px` rounding.
- **Containers**: Service and Work cards use `16px` to `24px` radii for a softer modern-tech feel.

## Components
- **Shiny CTA**: Features a CSS-based light-sweep effect (`::before` skew) on hover.
- **Beam Ring**: A wrapper using `conic-gradient` and mask-compositing to create a spinning border glow on the 'Revenue Infrastructure' badge.
- **Infinite Marquee**: Dual-layer horizontal loops for client logos and testimonials to simulate constant activity.
- **Contact Form**: Minimalist inputs using only bottom borders to maintain the grid-like structural integrity.

## Motion
- **Entrance**: Blur-to-Focus combined with a 30px Y-axis slide.
- **Micro-interactions**: Icons within cards use a 'pop' animation (scale 1.2 + slight rotation) on hover.
- **3D Spline**: Integration of 3D characters as background/midground focal points with absolute positioning.

## Do's and Don'ts
### Do's
- Use `animate-on-scroll` on all major section content.
- Maintain the subtle gold glow on key phrases using the `animate-gold-glow` utility.
- Use high-contrast grayscale imagery for work items until hovered.

### Don'ts
- Avoid using solid backgrounds for cards; always prefer subtle transparency or glass effects.
- Do not use sharp corners (radius 0px) for UI elements.
- Do not use more than one gold accent color per visual group.

## Accessibility
- Contrast ratios for gold on black must be monitored (Primary Gold on Black is roughly 4.5:1).
- Navigation uses `backdrop-blur` to ensure text readability over complex background gradients.
- Support for `prefers-reduced-motion` should be implemented for the marquee and beam-spin elements.