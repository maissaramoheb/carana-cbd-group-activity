# CARANA E-Learning — Run 03B Stage 3 Report: `E08` Connected Evidence-to-Decision Notebook Prototype

**Branch:** `codex/cbd-enhancement-run03b`
**Classification:** Isolated Functional Prototype (Separately Reviewable Candidate; Not Auto-Promoted to Production)
**Design Input:** Informed by `E12` (transparent learner self-review criteria tags; full scoring/rubric model deferred). `E13` remains deferred.

## 1. Purpose & Pedagogical Role

The `E08` Connected Evidence-to-Decision Notebook connects analytical outputs across all six CARANA CBD phases so learners carry grounded observations, explicit assumptions, and rationale from diagnosis (Lesson 1) through objectives (Lesson 2), logframe/risk planning (Lesson 3), MMA implementation (Lesson 4), evaluation (Lesson 5), and handover readiness (Lesson 6).

## 2. Isolation, Rollback & Governance Architecture

- **Self-contained files:**
  - [notebook-core.js](file:///Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD%20E%20Lap/CARANA-CBD-E-Learning/platform/notebook-core.js) (UMD state, propagation, pull-extraction, validation, and printable brief HTML generator)
  - [notebook.js](file:///Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD%20E%20Lap/CARANA-CBD-E-Learning/platform/notebook.js) (DOM workflow controller)
  - [notebook.html](file:///Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD%20E%20Lap/CARANA-CBD-E-Learning/platform/notebook.html) (standalone entry point at `/platform/notebook.html`)
  - [notebook.css](file:///Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD%20E%20Lap/CARANA-CBD-E-Learning/platform/notebook.css) (dedicated layout & print stylesheet)
  - [notebook.cjs](file:///Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD%20E%20Lap/CARANA-CBD-E-Learning/tests/platform/notebook.cjs) (unit & security/XSS negative tests)
- **Dedicated storage namespace:** Stores data exclusively in browser-local `carana_notebook_v1` (with `carana_notebook_v1_pre_restore` pre-import backup). Never writes to `carana_learning_v1`, `carana_cbd_course_v1`, or `carana_cbd_lab_v1`.
- **Full rollback path:** Removing the four `platform/notebook*` files, `tests/platform/notebook.cjs`, and the single prototype banner block in [platform.js](file:///Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD%20E%20Lap/CARANA-CBD-E-Learning/platform/platform.js) restores the pre-Stage-3 platform with zero residual schema or runtime dependency.

## 3. Core Prototype Capabilities

1. **Observed Evidence vs Assumptions Separation:** Separate bounded fields (`1500` chars max) and visual badges for `Observed Evidence & Decisions` vs `Assumptions, Risks & Unresolved Questions`, plus an explicit `Source / Trace Reference` field (`240` chars max).
2. **Explicit Upstream Change Propagation:** Updating any upstream phase (`k`) automatically flags populated downstream phases (`j > k`) with a non-destructive `Needs alignment check` banner (`alignmentNote`) while never modifying downstream text automatically.
3. **Versioned Drafts & Non-Destructive History:** Supports manual milestone snapshots (`revisions[]` up to `10` entries per phase) and archives prior editor text before restoring an earlier snapshot or pulling external lesson drafts.
4. **Explicit Opt-In Draft Pull:** Learners can preview and pull existing Lesson 2–6 builder drafts from `carana_learning_v1` (or read Lesson 1 summary counts) with one-way read-only inspection and field separation between verified outputs vs unresolved assumptions.
5. **Reasoning Self-Check Tags (`E12`-informed):** Three optional learner reflection checkboxes per phase (*sourced evidence*, *assumptions separated*, *upstream link stated*); no automated score or correctness claim is produced.
6. **Portability & Recovery:** JSON backup export, dry-run JSON backup validation (rejecting malformed, >2 MB, prototype-polluting, or cross-product files), merge/replace restore with automatic pre-restore backup and undo, and print / standalone `.html` **Advisory Thread Brief** generation.

## 4. Verification Summary

- `tests/platform/notebook.cjs`: **5/5** tests passed (initial isolation, upstream alignment propagation without downstream mutation, read-only Lesson 2 pull separation, negative JSON validation & merge archive preservation, XSS-escaped printable brief without correctness claims).
- `tests/platform/layout.cjs`: `notebook.html` passes `320px` and `768px` reflow in both `LTR` and `RTL`.
- `tests/platform/browser.cjs`: Interactive notebook flow passes Chromium desktop verification, triggers and clears upstream Phase 1 -> Phase 2 alignment warnings, leaves `carana_cbd_lab_v1` completely untouched (`null`), and passes `axe-core` WCAG 2.1 AA with `0` violations.
- Visual captures saved in `docs/reviews/run03b-enhancement-implementation/evidence/stage3/` (`e08-notebook-desktop.png`, `e08-notebook-mobile-390.png`).
