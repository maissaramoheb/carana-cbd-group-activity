# CARANA CBD — Run 10 Design Notes: The Living CBD Orbit

## Scope and Baseline
- **Branch:** `run10/cbd-cycle-spatial-depth`
- **Production Baseline Preserved:** Commit `e956a9750e0e69d8d505e613f57353417d29c1af` (`dpl_3DCvskSyfmKNUFa8nzftoqPR2CLz`), https://e-learning.maissara.tech/
- **Inspirational Reference Note:** The Run 10 handover brief referenced a previously approved Run 10 inspirational image, which was not attached in the handover prompt and is not present in workspace storage or prior release archives. Implementation follows the Section 2 architectural, visual, and interaction specifications anchored to the verified Run 09 production baseline.

## Visual & Spatial Architecture (`course/run10-living-orbit.css` + `course/app.js`)
1. **Palette & Surface Preservation**
   - Preserves the existing CARANA dark navy/teal/mint palette (`--orbit-navy-deep`, `--orbit-navy-surface`, `--orbit-navy-top`, `--orbit-teal-edge`, `--orbit-mint`), branding, typography, hero composition, CTA controls, and six phase titles/positions.
2. **Engineered Central CBD Hub**
   - Styled via `.cycle-core` and nested `.cycle-core-dial` with concentric surface layers, physical machined bezel rim, directional highlight (`--hub-angle` oriented toward the hovered/focused phase), and layered contact shadow against the orbital bed.
3. **Three-Level Orbital Structure (Inline SVG, `viewBox="0 0 560 484"`)**
   - **Level 1 — Inner recessed ring:** `.orbit-recessed-well`, `.orbit-recessed-trough`, calibrated `.orbit-recessed-ticks`, and `.orbit-recessed-lip` forming an instrument housing beneath the dial.
   - **Level 2 — Raised interactive orbital pathway:** `.orbit-pathway-shadow` and `.orbit-pathway-base` paired with six data-driven radial spoke connectors, station nodes, and unoccluded midpoint flow chevrons. Hovering or focusing a phase illuminates only that single phase's radial spoke and node via `[data-active-phase]` selectors.
   - **Level 3 — Outer atmospheric ring:** `.orbit-atmosphere-band` and dashed `.orbit-outer-ring` bounding the spatial instrument.
4. **3D Perspective, Motion, High Contrast & Fallbacks**
   - `@supports (transform-style: preserve-3d)` applies restrained Z-depth separation (`translateZ`) to orbital layers and active phase cards.
   - Zero continuous rotation, zero WebGL, and zero external dependencies.
   - `@media (prefers-reduced-motion: reduce)` suppresses spatial transforms while retaining color/border clarity.
   - `@media (forced-colors: active)` provides explicit system-keyword borders and focus rings when shadows/gradients are stripped.

## Direct-Navigation Interaction Model
- **Semantic Links:** Each of the six `.cycle-stage` cards in `course/app.js` is rendered as a native `<a class="cycle-stage" data-cycle-phase="0..5" href="...">`:
  - Phase 01 (`stage-01`): `#lesson-1` (handled cleanly by `resume()` when leaving home view while allowing modified/middle clicks).
  - Phases 02–06 (`stage-02`..`stage-06`): `../platform/?course=cbd&lesson=cbd-2` through `cbd-6`, preserving `&lang=` query parameter when active and maintaining the `.rail-back` return path to `../course/#home`.
- **Single-Action Mobile & Keyboard Flow:** Hover (`pointerType !== 'touch'`) and keyboard `focus` preview the phase in `#cycle-detail`, elevate the card, and illuminate its spoke/hub arc; clicking, tapping mobile cards directly, or pressing `Enter` navigates immediately to the station.
- **Availability Accuracy:** Phase 01 retains `SELF-PACED LESSON LIVE` labeling; Phases 02–06 retain `REVIEW + PRACTICE` labeling and translated equivalents across EN / `fr-FR` / `ar`.
- **Responsive Reflow & RTL:** Desktop `484px` orbit height (`180px` wide cards, `top: 12.6%..87.4%`) avoids long-label clipping in French (`Analyse de la situation`). Mobile (`<= 650px` 2-column grid, `<= 360px` single-column stack) reserves `margin-inline-end: 14px` on `.cycle-stage-copy` so titles such as `Implementation` stay clear of `.cycle-stage-launch`, and `[dir="rtl"] .cycle-stage-launch svg` mirrors launch geometry for Arabic RTL.
