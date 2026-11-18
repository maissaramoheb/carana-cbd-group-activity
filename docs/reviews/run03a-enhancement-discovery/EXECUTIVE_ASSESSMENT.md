# Executive Assessment — CARANA E-Learning (Run 03A)

**Reviewed Target:** `aff6ab0c003995a0b2382bb04c8083359ae81597` (`codex/cbd-instructional-run02` / `codex/carana-run03a-review`)
**Assessment Scope:** Full-platform educational, learner-journey, visual/interaction, technical, accessibility, multi-curriculum, and institutional demonstration review.
**Nature of Assignment:** Discovery and evidence-based enhancement assessment only. Zero application files modified.

---

## 1. Overall Product Verdict

**CARANA E-Learning is a high-craft, doctrinally disciplined, and technically resilient professional learning environment.** It succeeds where conventional e-learning routinely fails: instead of reducing UNPOL Capacity-Building and Development (CBD) training to bullet-point slides and trivial recall quizzes, it treats adult police advisers as reflective practitioners who must diagnose before prescribing, weigh trade-offs under constraints, test causal assumptions, and defend decisions with evidence.

Across **56 total instructional screens** (18 in Lesson 1; 38 in Lessons 2–6), **78 formative checkpoint items**, **17 operational learning tools**, **18 locked English narration tracks**, **3 produced cinematic illustrations** (plus 14 structured scene specifications), and **7 preserved CARANA practical workbenches**, the platform demonstrates:
- **Zero automated test or accessibility regressions** (65 workbench unit/security tests, 32 Lesson 1 smoke assertions, build-integrity locks, 100% pass across Chromium, desktop WebKit, and mobile WebKit, and 0 violations across 25 sampled Axe scans).
- **Exemplary source governance and epistemic honesty:** Every lesson maps explicitly to hash-verified July 2023 UNPOL JST lesson plans while strictly protecting facilitator-only answer keys and refusing to conflate screen completion with observed workplace competence.

At the same time, because the platform evolved rapidly across three distinct architectural layers (the original CARANA workbenches, the standalone Lesson 1 studio in `course/`, and the data-driven Run 01/02 expansion shell in `platform/`), **four high-priority structural seams** now limit the coherence and reliability of the learner experience. Addressing those seams—and selectively elevating the new Lessons 2–6 visual and drafting interactions to match the flagship quality of Lesson 1—will transform a strong review candidate into a flagship institutional platform.

---

## 2. Core Strengths to Preserve

1. **Flagship Lesson 1 Hybrid Visual Storytelling (`course/`):** The three-column studio layout, paired cinematic storyboards + interactive conceptual diagrams (`01-01` Diagnostic Path, `02-01` PESTEL-S Wheel, `02-02` Conflict Tree, `03-02` PIN Iceberg, `04-02` Triangulation Triangle, `05-02` 30-cell 5×6 Matrix, `06-01` SWOT), and 18 disclosed English narration tracks set an exceptional benchmark.
2. **Source-Grounded Applied Tools in Lessons 2–6 (`platform/learning-tools.js`):** Run 02's addition of 9 structured drafting scaffolds, 6 evidence/reasoning classifiers, 1 priority sensitivity explorer, 1 likelihood/impact matrix, and 5 worked `before/after` contrasts moves learners from passive recognition to active formulation.
3. **Preserved Original CARANA Workbenches (`module1.html`–`module6.html`):** Full-featured local-first workbenches with multi-tab reconciliation, corrupted-state quarantine, XSS-safe dossier printing, and strict curriculum alignment remain 100% intact.
4. **Editorial Visual Identity & Zero-Dependency Architecture:** The navy (`#102d46`), teal (`#146981`), and mint (`#def4e8`) palette with `Source Serif 4` and `DM Sans` typography delivers quiet authority with fast local/static execution and no compulsory login or external telemetry.

---

## 3. Verified High-Priority Problems

| ID | Issue | Where Observed | Verified Evidence | Impact |
|---|---|---|---|---|
| **E01** | **Split Course-Home Navigation Dead-End** | `/platform/?course=cbd` → Lesson 1 → `← COURSE HOME` (`/course/#home`) & `Practice library` (`/course/#activities`) | `probe-old-home.jpg`; `targeted-probes.json` (`homeCopyComingLater: 5`, `hasPlatformReturnLink: 0`) | Learners entering Lesson 1 or the Practice Library from the new catalog get stranded on the legacy `/course/#home` page, which claims Lessons 2–6 are *"coming later"* and has no link back to `/platform/`. |
| **E02** | **Silent Loss of Drafts on Content Version Change** | `platform/platform.js` `safeProgress()` (lines 24–28) across all 17 tools in Lessons 2–6 | `targeted-probes.json` (`oldDraftRetained: false`) | When `lesson.version` updates, `safeProgress()` archives prior `completed` checkpoints in `previousProgress` but discards `raw.drafts` (`drafts: {}`), permanently wiping learner-written text on the next save. |
| **E03** | **Unrecoverable Progress Exports** | `platform/platform.js` (`exportProgress`) & `course/app.js` (`exportProgress`) | `targeted-probes.json` (`importControls: 0`) | Both shells tell users to export their JSON progress before clearing browser data or when storage fails, but neither provides an in-app import/restore control. |
| **E06** | **Misleading Builder Feedback Styling & Generic Prompting** | `platform/learning-tools.js` (lines 20, 30–33); all 9 builders (`02-04`, `03-10`, etc.) | `probe-draft-x.png`; `targeted-probes.json` (`nonsenseDraftFeedback`) | Typing `"x"` into each field and clicking `Review my draft` displays a green success-styled banner with a single paragraph prompt, visually resembling validation while offering no field-specific self-check structure. |
| **E05** | **Mobile Navigation Rail Pushes Content Below the Fold** | `platform/platform.css` (`@media(max-width:900px)`); Lessons 2–6 mobile/tablet shell | `probe-mobile-390.jpg`, `probe-mobile-768.jpg` (`mobileLeadDistance390: 785px`, `768: 716px`) | On phones and tablets, the full section rail, checkpoint counter, and export controls stack above `<article class="screen">`, requiring over a full viewport of scrolling to reach `<h1>`. |
| **E31** | **Initial Catalog Layout Shift (Lab CLS `0.378`)** | `platform/index.html` (`#app` loading placeholder → rendered catalog) | `performance.json`, `layout-shift-attribution.json` (3/3 cold-cache trials = `0.378` CLS) | Replacing a `27px` `<p>Loading learning catalog…</p>` with a `771px` catalog grid shifts the footer and main layout abruptly on initial load. |
| **E10 / E11** | **Uniform Screen Rhythm & Generic Button Diagrams in Lessons 2–6** | All 38 screens in `curricula/cbd/lessons-2-3.json` & `lessons-4-6.json`; `platform/platform.js` | `expanded/screen-metrics.jsonl` (`3.13×` mobile viewport median); 37/38 screens duplicate `h1` as `.visual h2` | Every expanded screen repeats the exact same 8-part vertical template, and `chain`/`compare`/`cycle` visuals render as uniform 1- or 2-column button lists rather than relational structures (such as a 4-column logframe row or iterative SARA loop). |
| **E09** | **Disconnected Handoff Between Lesson Drafts and CARANA Workbenches** | Lessons 2–6 builder tools → `module2.html`–`module6.html` | Code inspection of `platform/platform.js` (`carana_learning_v1`) vs `js/storage/lab-storage.js` (`carana_cbd_lab_v1`) | Learners draft SMART objectives (`02-04`), logframe rows (`03-10`), evaluation plans (`05-03`/`05-04`), and transition handovers (`06-05`) in the lesson, then open the workbench to find blank fields with no reference sheet or opt-in handoff. |

---

## 4. Summary of Prioritized Recommendations

All 31 cataloged items (`E01`–`E31`) were scored using the owner's weighted rubric (**Educational value 30% · Learner experience 25% · Institutional/professional value 15% · Feasibility 15% · Risk and maintainability 15%**), with essential correctness and data-safety fixes prioritized first:

### Top 5 Quick Wins (1–3 days each, Low Risk, High Immediate Value)
1. **E01 (Score 94.0 | 1–2d):** Unify the course-home route between `/platform/` and `/course/` and reconcile stale *"Self-paced lesson coming later"* labels on `/course/#home`.
2. **E06 (Score 86.0 | 0.5–1.5d):** Rename builder button to *"Open self-review prompts"*, replace green success styling with neutral self-check styling, and place criteria beside each field (paired with **E26** character-limit indicators).
3. **E07 (Score 83.0 | 2–3d):** Add a printable/readable HTML study-work summary export alongside raw JSON so learners and trainers can review drafted outputs in syndicate sessions.
4. **E04 (Score 82.0 | 1–2d):** Make catalog resume and completion labels precise across Lesson 1 (via read-only `carana_cbd_course_v1` adapter) and Lessons 2–6.
5. **E05 + E31 (Score 82.0 each | 1–3d):** Collapse the mobile/tablet section rail behind a compact section bar above `<h1>` and reserve minimum catalog geometry in `platform/index.html` to eliminate the `0.378` cold-cache CLS.

### Top 10 Substantial Enhancements (Medium Scope, High Structural & Pedagogical Value)
1. **E02 (Score 91.0 | 3–5d):** Archive bounded prior-version drafts inside `previousProgress` on content version updates and surface a read-only *"Previous version draft"* panel with explicit copy-forward controls.
2. **E03 (Score 82.0 | 5–8d):** Build a schema-validated local JSON progress restore/import workflow with dry-run diff preview and pre-import backup download.
3. **E09 (Score 88.0 | 6–10d):** Build a reviewable Lesson-to-Workbench handoff sheet and explicit learner-consented field copy into `module2.html`–`module6.html`.
4. **E10 (Score 88.0 | 6–9d):** Vary the 38 expanded screens across three task-specific layouts (*Explain/Compare*, *Investigate/Decide*, *Construct/Reflect*) and eliminate duplicate `h1`/`h2` headings.
5. **E22 (Score 88.0 | 4–7d):** Execute a structured native Safari/VoiceOver and physical iOS/Android assistive-technology acceptance protocol.
6. **E11 (Score 86.0 | 8–12d):** Upgrade key Lessons 2–6 diagrams (`02-01` SSR alignment, `03-10` 4-column logframe row, `04-05` iterative problem-solving/SARA loop, `06-03` transition principles) from generic button lists to bespoke semantic HTML/SVG relational diagrams matching Lesson 1's standard.
7. **E16 (Score 83.0 | 5–8d):** Strengthen checkpoints with brief retrieval/justification prompts and targeted concept review links after wrong attempts.
8. **E18 (Score 83.0 | 3–5d):** Replace the nested full-course iframe in `platform/demo.html` with a bounded, 3-minute guided stakeholder walkthrough.
9. **E14 + E15 (Score 80.0 each | 6–10d combined):** Upgrade the `02-03` Priority Lab (explicit tie/zero-weight handling and side-by-side weight comparison) and `03-06` Risk Matrix (connect rating cells to prevention/mitigation/contingency reasoning).
10. **E17 + E23 + E24 (Score 80.0 / 80.0 / 77.0):** Storyboard and differentiate the 14 unproduced cinematic briefs before commissioning media (`E17`), selectively add a bounded evidence note in Lesson 1 if desired (`E23`), and formalize the cross-shell content/version validation contract (`E24`).

### Top 3 Transformative Opportunities (Strategic Multi-Week Differentiators)
1. **E08 (Score 85.0):** **Connected Evidence-to-Decision Notebook** linking a learner's diagnosed finding in Lesson 1 all the way through SMART objective formulation (L2), logframe row & risk response (L3), implementation communication (L4), evaluation interpretation (L5), and phased handover (L6).
2. **E12 (Score 85.0):** **Transparent Self / Peer / Facilitator Reasoning Rubric & Revision Comparison** turning open-text drafts into inspectable professional artifacts with side-by-side revision history—without opaque AI auto-grading.
3. **E13 (Score 82.0):** **Evolving Bounded Professional Case Across the Six Phases** where an invented advisory case introduces mid-course evidence updates and contradictions that require learners to revise earlier assumptions.

---

## 5. Explicit Rejections & Deferrals (Protecting Governance & Budget)

- **Reject `E28` (Score 28.0):** Do **not** add an external LLM/AI service to auto-grade learner policing drafts. It violates local-first privacy, introduces unvalidated scoring risk, and undermines human facilitation.
- **Reject/Defer `E29` (Score 28.0):** Do **not** rewrite the static platform into a heavy SPA framework or add compulsory user accounts/LMS auth now.
- **Defer `E30` (Score 72.0) & `E21` (Score 65.0):** Do **not** commission all 14 cinematic images and 38 audio recordings before interaction/storyboard revisions (`E10`, `E17`) are approved; defer service-worker offline caching (`E21`) until target deployment topology is defined.
