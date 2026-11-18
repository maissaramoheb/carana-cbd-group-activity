# CARANA E-Learning — Run 03B Enhancement Register Disposition (`E01`–`E31`)

This register tracks the final implementation disposition of every enhancement identified in the Run 03A baseline ([ENHANCEMENT_REGISTER.md](file:///Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD%20E%20Lap/CARANA-CBD-E-Learning/docs/reviews/run03a-enhancement-discovery/ENHANCEMENT_REGISTER.md)) against the owner's Run 03B authorization (**Package 1 + Package 2** and **Stage 3 isolated `E08` prototype**).

| ID | Title (Run 03A Baseline) | Run 03B Disposition | Stage | Primary Implementation & Verification |
| --- | --- | --- | --- | --- |
| `E01` | One course-home route | Implemented | Stage 1 | Canonical catalog at `/platform/?course=cbd`; `course/app.js` `#back-home` and Phases 2–6 route updates; verified in `browser.cjs` |
| `E02` | Preserve draft work across content revisions | Implemented | Stage 1 | `progress-core.js` `safeProgress()` archives prior revisions up to 5 entries without false mastery; read-only archive drawer in `learning-tools.js` |
| `E03` | Make an export actually recoverable by learners | Implemented | Stage 1 | Dry-run JSON restore preview, cross-product rejection, version migration, conflict archive, auto pre-restore backup in platform & Lesson 1 |
| `E04` | Make resume and completion precise | Implemented | Stage 1 | Live Lesson 1 & Lessons 2–6 status/draft/resume labels in `catalog.js` + `progress-core.js`; verified across `progress-recovery.cjs` & screenshots |
| `E05` | Put mobile learning before the full navigation rail | Implemented | Stage 1 | Collapsible `#rail-toggle` single-row mobile header; `h1Top < 350px` across all 38 screens at `320px` and `768px` (`layout.cjs`) |
| `E06` | Name draft feedback honestly and make it usable | Implemented | Stage 1 | Neutral `.self-review` guidance, inline jump links, field-specific `check` prompts on all 34 builder fields |
| `E07` | Create a readable study-work export | Implemented | Stage 1 | `#study-summary-modal` with print/HTML export, HTML escaping, and RTL safety (`progress-recovery.cjs`) |
| `E08` | A connected evidence-to-decision notebook | Prototyped (Isolated) | Stage 3 | `platform/notebook.html`, `notebook-core.js`, `notebook.js`, `notebook.css`; isolated `carana_notebook_v1`; `notebook.cjs` & `browser.cjs` |
| `E09` | A reviewable handoff to the existing workbench | Implemented | Stage 2 | `platform/handoff.js` side-by-side mapping, copy/download, dry-run staged write + pre-handoff backup & undo (`handoff.cjs`) |
| `E10` | Vary the learning rhythm by cognitive task | Implemented | Stage 2 | Explicit `explain` / `investigate` / `construct` ordering + badges + distinct visual titles across all 38 screens |
| `E11` | Give frameworks their actual relational structure | Implemented | Stage 2 | Bespoke `logframe-row`, `system-deps`, `toc-bridge`, `problem-loop`, `principle-hub` visuals + explored counter preserving `[data-node]` |
| `E12` | Transparent review of learner reasoning | Design Input Only / Deferred | Deferred | Three self-check tags inform `E08` design; standalone reasoning rubric implementation deferred per owner decision |
| `E13` | An evolving, bounded professional case | Deferred | Deferred | Deferred per owner authorization |
| `E14` | Teach ties and sensitivity explicitly | Implemented | Stage 2 | Explicit competition-rank ties, all-zero weight pause, Snapshot A vs Current compare, live `onchange` narration (`learning-tools.cjs`) |
| `E15` | Turn risk rating into response reasoning | Implemented | Stage 2 | Risk response strategy selector (`prevent`/`mitigate`/`contingency`) and asymmetric `(1,3)` vs `(3,1)` explanation |
| `E16` | Use checkpoints for retrieval and justification | Implemented | Stage 2 | Option-specific `optionFeedback` across all 36 Lesson 1 items (`lesson1-data.js`, `app.js`, `v05-smoke.cjs`); 6/6 gate intact |
| `E17` | Storyboard before producing the 14 new scenes | Implemented (`spec-only`) | Stage 2 | Differentiated all 14 `artwork.teachingPrompt` entries while keeping `status: "specification-only"` and zero media generation |
| `E18` | A bounded institutional demo, not a course inside a course | Implemented | Stage 2 | Added ungated interactive `demo-showcase.html` (Priority, SMART, Logframe tabs) as default `demo.html` frame |
| `E19` | Separate reading, practice and practical review | Outside Stage 1–3 Scope | Deferred | Focused structural separation handled via `E10` rhythm & `E09` handoff; no structural course overhaul performed |
| `E20` | Readable source information on demand | Implemented | Stage 2 | Human-readable `lesson.source.label` + collapsible `<details class="source-details">` in `platform.js` |
| `E21` | Define a deliberate offline distribution profile | Not Authorized / Deferred | Deferred | Excluded outside Package 1 + Package 2 scope |
| `E22` | Independent assisted-user acceptance | Automated Verified / Native AT Pending | Stage 2 | `axe-core` WCAG 2.1 AA (`0` violations across platform/demo/E08/Lesson 1) + keyboard/Escape focus tests; physical VoiceOver/NVDA manual limits recorded |
| `E23` | Bring construction back into Lesson 1 selectively | Explicitly Deferred | Deferred | Deferred per Lesson 1 protection directive until `E08` design review |
| `E24` | Versioned content contract and factual build checks | Implemented | Stage 2 | `validate-content.cjs` enforces unique 14 prompts, distinct visual titles, valid rhythms, `source.label`, and canonical routes |
| `E25` | Explain revisions once with useful differences | Implemented | Stage 1 | Dismissible `.version-note` notice + persistent `.revision-badge` summary (`platform.js`) |
| `E26` | Expose local drafting limits and intent | Implemented | Stage 1 | Honest `1200`-char live counters + warning at `<=150` chars + explicit non-grading status text |
| `E27` | Motion only for meaningful state change | Preserved / Maintained | Maintained | Existing `prefers-reduced-motion: reduce` CSS & test contexts preserved cleanly |
| `E28` | Do not auto-grade policing judgement with a new AI service | Enforced Guardrail | Maintained | Zero remote/AI calls; local heuristic-free neutral reflection tools throughout Stages 1–3 |
| `E29` | Do not migrate frameworks or require accounts now | Enforced Guardrail | Maintained | Plain static HTML/JS/CSS architecture and browser-local storage only; zero login gates |
| `E30` | Do not commission every media opportunity at once | Enforced Guardrail | Maintained | Zero paid audio or image generation invoked; 18 locked Lesson 1 MP3s intact (`build-integrity.cjs`) |
| `E31` | Stabilise the initial catalog layout | Implemented | Stage 1 | `.app-boot` skeleton geometry reduced `/platform/?course=cbd` synthetic CLS from `0.378` (Run 03A) to `0.0104` |

## Before-vs-After Key Verified Indicators

| Metric / Behaviour | Run 03A Baseline | Run 03B Final Verified State |
| --- | --- | --- |
| `/platform/?course=cbd` synthetic CLS | `0.378` (observed Run 03A probe) | `0.01039777286638413` (~`0.0104`, across 3 trials) |
| `/course/` synthetic CLS | `0` | `0` |
| Mobile `cbd-2`–`cbd-6` initial `h1` vertical offset (`320px` & `768px`) | Above viewport fold (`> 350px`, up to ~1600px on initial review) | `< 350px` across all 38 screens (`layout.cjs` pass) |
| Content structure & validation gates | Basic field presence checks | Enforced `38` distinct visual titles, `3` rhythms, `14` unique artwork prompts, `34` `f.check` criteria, `36` Lesson 1 `optionFeedback` arrays |
| Automated unit / integration tests | 65 workbench + L1 smoke + initial platform tests | 65 workbench + 33 L1 smoke + build-integrity + 2 content + 5 learning-tools + 6 progress-recovery + 4 handoff + 5 notebook tests (0 failed) |
