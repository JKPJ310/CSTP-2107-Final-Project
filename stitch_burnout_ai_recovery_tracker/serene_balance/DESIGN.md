---
name: Serene Balance
colors:
  surface: '#f9f9ff'
  surface-dim: '#d4daea'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e8eeff'
  surface-container-high: '#e3e8f9'
  surface-container-highest: '#dde2f3'
  on-surface: '#161c27'
  on-surface-variant: '#3f4943'
  inverse-surface: '#2a303d'
  inverse-on-surface: '#ecf0ff'
  outline: '#6f7a72'
  outline-variant: '#bec9c1'
  surface-tint: '#176b4b'
  primary: '#096444'
  on-primary: '#ffffff'
  primary-container: '#2e7d5b'
  on-primary-container: '#d0ffe3'
  inverse-primary: '#88d6af'
  secondary: '#556158'
  on-secondary: '#ffffff'
  secondary-container: '#d9e6da'
  on-secondary-container: '#5b675e'
  tertiary: '#913d27'
  on-tertiary: '#ffffff'
  tertiary-container: '#b0553d'
  on-tertiary-container: '#fff2ee'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a4f3ca'
  primary-fixed-dim: '#88d6af'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#d9e6da'
  secondary-fixed-dim: '#bdcabe'
  on-secondary-fixed: '#131e17'
  on-secondary-fixed-variant: '#3e4a41'
  tertiary-fixed: '#ffdbd2'
  tertiary-fixed-dim: '#ffb4a1'
  on-tertiary-fixed: '#3c0800'
  on-tertiary-fixed-variant: '#7c2e19'
  background: '#f9f9ff'
  on-background: '#161c27'
  surface-variant: '#dde2f3'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-desktop: 1rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system is engineered for cognitive decompression, somatic grounding, and burnout prevention. The target audience comprises knowledge workers, healthcare professionals, and high-stress operators vulnerable to chronic overextension and decision fatigue. Every design touchpoint prioritizes neurological stillness: reducing visual noise, eliminating aggressive stimuli, and delivering clear, low-friction interactions.

The visual style blends **Minimalism** with subtle **Tactile Precision**. Rather than an airy, sprawling lifestyle aesthetic, the system embraces dense, purposeful structure—space-efficient, clean-cut micro-surfaces that organize high-value mental health insights without demanding excessive vertical scrolling or sustained cognitive effort. Interfaces evoke clarity, restorative calm, and structured composure.

## Colors

The palette establishes an organic, grounded light environment rooted in restorative botanicals and warm mineral foundations.

- **Primary (`#2E7D5B`)**: Eucalyptus green. Used for intentional actions, primary CTA controls, active status markers, and grounded metrics.
- **Secondary (`#E8F5E9`)**: Pale sage mist. Serves as a soothing tint for contextual badges, selected tile states, and gentle tonal fills.
- **Tertiary (`#E07A5F`)**: Soft terra-cotta/amber coral. Reserved strictly for vital somatic shifts: energy depletion notices, boundary warnings, and overwork thresholds. It signals alertness without inducing cortisol spikes or panic.
- **Neutral Surface Canvas (`#FAFAF8`)**: Alabaster off-white. Softens ocular glare while preserving daylight clarity.
- **Surface Elevation (`#FFFFFF`)**: Pure crisp white for elevated cards and crisp modular containers.
- **Typography & High-Contrast Accents (`#1A202C`, `#4A5568`, `#718096`)**: Deep slate and balanced charcoals delivering WCAG AAA-compliant legibility across text hierarchy.
- **Structural Dividing Borders (`#E2E8F0`)**: Low-energy neutral outlines that establish containment without visual clutter.

## Typography

The type system balances the organic, approachable warmth of **Plus Jakarta Sans** with the engineered legibility and compact density of **Inter**. 

- **Plus Jakarta Sans** shapes all headers and modal summaries. Its subtle curvature counteracts clinical coldness, promoting trust and emotional ease.
- **Inter** supports body copy, micro-metrics, labels, and somatic readouts. Tight vertical metrics and unyielding horizontal consistency ensure instant scanning even during periods of heavy mental fatigue.
- Avoid all-caps typography in narrative text or critical warnings; uppercase is limited strictly to `label-sm` status chips and metric categories with balanced tracking (`+0.02em`).

## Layout & Spacing

The layout philosophy follows a structured, compact fluid grid optimized for zero mental overhead. Information density is intentionally restrained yet efficient: padding is purposeful and tight to avoid endless scanning, yet never crowded.

- **Grid Architecture**: 
  - **Mobile (< 768px)**: 4-column layout with `margin: 1rem` (16px) and `gutter: 0.75rem` (12px). Full-width card stacking keeps vertical flow linear.
  - **Tablet (768px - 1024px)**: 8-column layout with `margin: 1.5rem` (24px) and `gutter: 1rem` (16px). Dual-pane layouts group somatic tracking side-by-side with recommended pauses.
  - **Desktop (> 1024px)**: 12-column layout capped at a maximum width of `1120px` to maintain focused eye lines. Margins scale to `2rem` (32px), with `gutter-desktop: 1rem` (16px).
- **Rhythm Rules**: Elements rely on `space-sm` (8px) for tightly related micro-content, `space-md` (12px) for card body padding, and `space-xl` (24px) to separate logical mental modules.

## Elevation & Depth

To maintain visual restfulness and eliminate eye strain, depth is expressed through **tonal layers** and **whisper-soft ambient outlines**, completely bypassing heavy drop shadows.

- **Base Layer**: Body surface grounded in alabaster (`#FAFAF8`).
- **Container Layer**: Raised interactives and cards leverage crisp white (`#FFFFFF`) with a micro-stroke (`1px solid #E2E8F0`).
- **Tactile Depth (Ambient Softness)**: When elements require elevation (e.g., active floating action, active popover, or focused card), use an ultra-diffused, botanical-tinted ambient shadow:
  - `box-shadow: 0 2px 8px -2px rgba(46, 125, 91, 0.06), 0 1px 3px 0 rgba(0, 0, 0, 0.03);`
- **Active / Dragging State**: Modestly lifts the surface with:
  - `box-shadow: 0 8px 16px -4px rgba(26, 32, 44, 0.06), 0 2px 4px -1px rgba(26, 32, 44, 0.02);`
- In dark and low-stimulus modes, drop shadows collapse to zero, relying exclusively on 1px borders in `#E2E8F0`.

## Shapes

The interface embraces a gentle, organic geometry (`roundedness: 2` — 8px standard corner radius). Corners feel polished and softly sculpted without appearing infantile or toy-like.

- **Standard Components**: Checkboxes, text inputs, segmented pills, micro-cards, and system notifications inherit `rounded: 0.5rem` (8px).
- **Major Surfaces**: Dashboard widgets, somatic summary cards, and bottom sheets scale up to `rounded-lg: 1rem` (16px).
- **Mindful Badges & Floating Pills**: Energy status badges, quick tags, and floating action chips use full pill geometry (`rounded-full: 9999px`) to visually signal self-contained, lightweight tokens.

## Components

### Buttons
- **Primary**: Solid eucalyptus `#2E7D5B` fill with `#FFFFFF` text. Height: 36px (compact) or 42px (standard). Padding: `0 14px`. Subtle active state transforms opacity to `0.92`.
- **Secondary**: Tinted sage `#E8F5E9` background with `#2E7D5B` text and no border.
- **Outline / Quiet**: White background, 1px border `#E2E8F0`, slate text `#1A202C`.

### Chips & Mindful Badges
- **Status Badges**: Pill-shaped (`rounded-full`), height 24px, padding `0 10px`. 
  - Restored/Optimal: `#E8F5E9` background with `#2E7D5B` text.
  - Caution/Warning: `#FFF3EE` background with `#E07A5F` text.
  - Passive/Muted: `#F1F5F9` background with `#4A5568` text.

### Cards
- Constructed with `#FFFFFF` backgrounds, `rounded-lg` (16px), 1px `#E2E8F0` border, and tight interior padding (`12px` to `16px`). Never exceed 20px padding to avoid unnecessary footprint. Card headers use `headline-sm` with right-aligned status chips.

### Form Inputs & Text Fields
- Surface: `#FAFAF8`. Border: `1px solid #E2E8F0`. Corner radius: `8px`. Height: 38px. Active focus: crisp outline transitions to `1px solid #2E7D5B` with an ambient glow (`box-shadow: 0 0 0 3px rgba(46, 125, 91, 0.12)`). Typography: `body-md`.

### Checkboxes & Segmented Radios
- Size: 18x18px. Default border `#CBD5E1`. Selected state fills with `#2E7D5B` featuring a crisp white 1.5px checkmark. Transition curves are instantaneous or linear-eased (120ms) to preserve immediate tactile feedback.

### Somatic Breathing & Rest Pulse Component
- Custom micro-component: 48px concentric ring container with alternating soft sage waves (`#E8F5E9`) that gently expand using a calm 4-second cubic-bezier animation, offering an ambient pacing cue without demanding active interaction.