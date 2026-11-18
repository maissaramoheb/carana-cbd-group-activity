# Owner Decision Brief — CARANA E-Learning (Run 03A Handover)

**Prepared:** 18 November 2026
**Reviewed Branch & Commit:** `codex/carana-run03a-review` (`aff6ab0c003995a0b2382bb04c8083359ae81597`)
**Current Preview URL:** https://carana-cbd-elearning-a3ga1rbpn-delta4ce20-5830s-projects.vercel.app/platform/?course=cbd
**Production URL (Untouched):** https://cbd.maissara.tech/course/

---

## 1. Executive Summary for the Owner

Your **CARANA E-Learning** platform has a strong foundation:
- **Lesson 1 (`course/`)** is a flagship instructional benchmark (18 screens, 18 locked English narration tracks, 3 cinematic illustrations, 18 interactive visual diagrams including the 5×6 CBD Matrix, and 36 checkpoint items).
- **Lessons 2–6 (`platform/` + `curricula/cbd/`)** were substantially deepened in Run 02 (38 screens, 17 applied tools, 5 worked comparisons, 42 checkpoint items with option-specific feedback, 38 transcripts, and 14 artwork specifications).
- **All 6 original CARANA workbenches (`module1.html`–`module6.html`) and the 60-minute group activity** remain 100% intact and verified (65/65 unit & security tests passing).

We recovered all of Codex's interrupted Run 03A browser probes, DOM metrics, and screenshots (`docs/reviews/run03a-enhancement-discovery/VISUAL_EVIDENCE/`), verified every preliminary finding against the source code, and completed the full 10-dimension enhancement review. **No application files were modified during this review.**

---

## 2. Four Essential Issues Verified by Code & Browser Evidence

Before promoting Lessons 2–6 or commissioning new media, four verified issues should be fixed in the next development run:

1. **Navigation Dead-End Between the New Catalog and Lesson 1 (`E01` — Score `94.0`):**
   - Opening Lesson 1 from `/platform/?course=cbd` and clicking `← COURSE HOME` sends the learner to the older `/course/#home` landing page (`probe-old-home.jpg`), which still displays five *"Self-paced lesson coming later"* cards for Lessons 2–6 and has **zero links back to `/platform/`**.
2. **Silent Loss of Learner Drafts When Content Versions Change (`E02` — Score `91.0`):**
   - In `platform/platform.js` (`safeProgress`, line 28), updating a lesson's `contentVersion` archives prior checkpoint completion in `previousProgress` but **discards `raw.drafts` (`drafts: {}`)**, permanently erasing learner-authored text across all 9 drafting scaffolds on the next save.
3. **Unrecoverable Progress Exports (`E03` — Score `82.0`):**
   - Both `/platform/` and `/course/` prompt learners to export their progress JSON file (`carana-learning-progress.json`), yet neither provides an in-app **Restore / Import** control (`importControls: 0`), and the export is raw JSON rather than a readable study sheet (`E07`).
4. **Misleading Builder Feedback Styling & Mobile Navigation Stacking (`E06` — Score `86.0`; `E05` & `E31` — Score `82.0`):**
   - Typing `"x"` into a drafting tool and clicking `Review my draft` displays a green success-styled banner (`probe-draft-x.png`) with a single generic paragraph rather than field-adjacent self-check criteria.
   - On mobile (`390px`), the full section rail stacks above the lesson screen, pushing `<h1>` down to `785px` (`probe-mobile-390.jpg`), and `/platform/?course=cbd` has a `0.378` cold-cache layout shift (`E31`).

---

## 3. Recommended Decision Packages for the Next Run (Run 03B)

To make approval straightforward, we have organized the prioritized enhancements into **three selectable packages** plus **explicit exclusions**:

### Package 1 — Essential Fixes & Quick Wins (Recommended Baseline for Immediate Execution)
*Estimated effort: ~8–12 engineering days · Low regression risk*
- **`E01` (Score 94.0):** Unify course-home navigation between `/platform/` and `/course/` and update the 5 stale *"coming later"* phase cards on `/course/#home`.
- **`E02` + `E25` (Score 91.0 / 74.0):** Archive bounded prior-version drafts inside `previousProgress` on version changes and provide a read-only *"Previous version draft"* copy-forward panel plus a one-time revision diff summary.
- **`E03` (Score 82.0):** Add a validated local JSON progress restore/import control with dry-run preview and pre-import backup download.
- **`E06` + `E26` (Score 86.0 / 80.0):** Rename builder button to *"Open self-review prompts"*, use neutral self-check styling, place specific review criteria beside each field, and show character-limit counters (`1,200` max).
- **`E07` (Score 83.0):** Add a printable/readable HTML Study-Work Summary alongside raw JSON export.
- **`E04` (Score 82.0):** Display accurate resume/completion states across `/platform/?course=cbd` (including a read-only adapter for Lesson 1's `carana_cbd_course_v1` progress).
- **`E05` + `E31` (Score 82.0 each):** Collapse the mobile/tablet section rail behind a compact top bar above `<h1>` and reserve catalog geometry in `platform/index.html` to eliminate the `0.378` cold-cache layout shift.

### Package 2 — Pedagogical Depth, Relational Visuals & Workbench Bridge (Recommended Substantial Upgrade)
*Estimated effort: ~20–30 combined engineering/design/QA days · Low–Medium risk*
- **`E10` + `E20` + `E24` (Score 88.0 / 66.0 / 77.0):** Vary the 38 expanded screens across three task-specific layouts (*Explain/Compare*, *Investigate/Classify*, *Construct/Self-Review*), eliminate the 37 duplicate `h1`/`visual.h2` headings, format source footers cleanly, and enforce cross-shell build checks.
- **`E11` (Score 86.0):** Upgrade key Lessons 2–6 diagrams (`02-01` SSR system flow, `03-10` horizontal 4-column logframe row, `04-05`/`04-07` iterative problem-solving/SARA loop, `06-03` transition principles) from uniform button lists to bespoke semantic HTML/SVG relational diagrams matching Lesson 1.
- **`E09` + `E19` (Score 88.0 / 77.0):** Add a reviewable **Lesson-to-Workbench Handoff Sheet** (with optional user-consented field copy into `module2.html`–`module6.html`) and a non-graded learner preparation checklist.
- **`E14` + `E15` (Score 80.0 each):** Add explicit tie/zero-weight handling and profile comparison to the `02-03` Priority Lab, and connect the `03-06` 3×3 Risk Matrix to Prevention, Mitigation, and Contingency (`03-07`) reasoning.
- **`E16` (Score 83.0):** Add option-specific distractor feedback parity to Lesson 1's 36 checkpoint items and a brief retrieval/justification step on retry across all 78 items.
- **`E18` (Score 83.0):** Replace the nested full-course Lesson 2 iframe in `platform/demo.html` with a bounded 3-minute guided demonstration of the new interactive tools.
- **`E17` + `E22` (Score 80.0 / 88.0):** Differentiate the 14 cinematic artwork briefs (replacing duplicate lesson-wide `teachingPrompt` strings) before any media production, and run the VoiceOver + physical-device acceptance protocol.

### Package 3 — Transformative Opportunities (Select 0, 1, or More for Strategic Differentiation)
- **Option 3A — `E08` (Score 85.0):** **Connected Evidence-to-Decision Notebook** carrying a learner's diagnosed finding from Lesson 1 through SMART objectives (L2), logframe row (L3), implementation (L4), evaluation (L5), and transition handover (L6).
- **Option 3B — `E12` (Score 85.0):** **Transparent Self / Peer / Facilitator Reasoning Rubric & Version 1 → Version 2 Revision Comparison** for open-text drafts.
- **Option 3C — `E13` (Score 82.0):** **Evolving Bounded Professional Case** with two mid-course evidence contradictions that require revising earlier plans.

---

## 4. Specific Decisions Requested from the Owner

To launch the next implementation run cleanly, please confirm:

1. **Scope Selection:**
   - Approve **Package 1** (Essential Fixes & Quick Wins) only, **Package 1 + Package 2** (Recommended), or include specific **Package 3** transformative tracks (`E08`, `E12`, `E13`)?
2. **Canonical Course-Home Route (`E01`):**
   - When a learner clicks `Course home` inside Lesson 1 (`/course/#lesson-1`) or the Activities Hub (`/course/#activities`), should the primary return destination be the unified CBD catalog (`/platform/?course=cbd`) while keeping the 6-phase orbit diagram accessible, or should `/course/#home` remain the primary CBD landing page with its cards updated to launch Lessons 2–6 directly?
3. **Lesson 1 Boundary (`E16`, `E23`):**
   - May we add non-disruptive option-specific quiz feedback (`E16`) and an optional bounded evidence note (`E23`) to Lesson 1 while keeping its 18 audio tracks, 3 cinematic illustrations, and `carana_cbd_course_v1` progress schema 100% intact, or must `course/` remain strictly limited to the `E01` navigation return fix?
4. **Media Production Gate (`E17`, `E30`):**
   - Confirm that the 14 new cinematic illustrations and 38 narration recordings for Lessons 2–6 remain **unproduced (`specification-only`)** until Package 2's storyboard differentiation (`E17`) and screen-rhythm refinements (`E10`) are reviewed and approved.
