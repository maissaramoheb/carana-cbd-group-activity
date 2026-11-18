# Prioritized Top Enhancements — CARANA E-Learning (Run 03A)

**Reviewed Target:** `aff6ab0c003995a0b2382bb04c8083359ae81597`
**Prioritization Rubric:**
- **Educational value:** `30%`
- **Learner experience:** `25%`
- **Institutional/professional value:** `15%`
- **Feasibility:** `15%`
- **Risk and maintainability:** `15%`
*(Each criterion is scored `1–5` where `5` is highest value, highest feasibility, or lowest risk; `Weighted Score = sum(weight × score / 5)` out of `100`. Essential correctness and data-safety fixes take precedence ahead of discretionary enhancements.)*

---

## 1. Top 5 Quick Wins (Low Risk, High Immediate Value — `0.5` to `3` Days Each)

| Rank | ID | Enhancement Title | Target Screen / Component | Weighted Score (`30/25/15/15/15`) | Effort & Risk | Why It Is a Quick Win & Expected Benefit |
|---:|---|---|---|---:|---|---|
| **1** | **E01** | **Unify Course-Home Navigation & Reconcile Legacy Availability Copy** | `platform/catalog.js` → `course/app.js` (`#back-home`, `#home`, `#activities`) | **`94.0`** `[4, 5, 5, 5, 5]` | `1–2 days` · Low risk | Eliminates the #1 learner journey trap (`probe-old-home.jpg`) where clicking `← COURSE HOME` in Lesson 1 strands the learner on `/course/#home` with five *"Self-paced lesson coming later"* cards and zero links back to `/platform/?course=cbd`. Preserves all Lesson 1 teaching screens and keys intact. |
| **2** | **E06** *(+ E26)* | **Name Builder Feedback Honestly, Place Self-Check Criteria by Field & Show Character Bounds** | `platform/learning-tools.js` (`builder` type across all 9 scaffolds: `02-04`, `02-08`, `03-10`, `03-07`, `04-02`, `05-03`, `05-04`, `06-05`, `06-07`) | **`86.0`** `[4, 4, 4, 5, 5]` | `1–2 days` · Low risk | Fixes the misleading green success banner shown when typing `"x"` (`probe-draft-x.png`). Renames button to `"Open self-review prompts"`, uses neutral informational styling, places specific self-check criteria adjacent to each field, and adds a remaining-character counter near the `1,200`-char cap (`E26`). |
| **3** | **E07** | **Create a Readable & Printable Study-Work Export** | `platform/platform.js` (`exportProgress`) & all 9 builder / 6 classifier outputs | **`83.0`** `[4, 4, 5, 4, 4]` | `2–3 days` · Low risk | Learners currently can only export raw JSON (`carana-learning-progress.json`). Adds an HTML-escaped, print-ready study sheet summarizing their drafted objectives, indicators, logframe row, evaluation responses, and handover notes for syndicate or facilitator review, while keeping raw JSON for state recovery. |
| **4** | **E04** | **Make Catalog Resume, Progress & Completion Labels Precise** | `platform/platform.js` (`catalogHTML`) & read-only adapter for `carana_cbd_course_v1` | **`82.0`** `[3, 5, 4, 5, 4]` | `1–2 days` · Low risk | Replaces vague `"0 checkpoints recorded"` / `"Resume / review lesson"` labels with exact state (`Start lesson`, `Resume: Section 2 · 1/3 checkpoints passed`, `Completed · Review lesson`) and displays Lesson 1's actual checkpoint state on `/platform/?course=cbd` without merging or mutating storage keys. |
| **5** | **E05** *(+ E31)* | **Put Mobile Learning Content Above the Section Rail & Stabilise Initial Catalog Layout** | `platform/platform.css`, `platform/platform.js` (`layout`), `platform/index.html` (`#app`) | **`82.0`** `[3, 5, 4, 5, 4]` | `2–3 days` · Low risk | Collapses the mobile/tablet rail into a compact top bar so `<h1>` appears in the first viewport instead of at `785px` (`probe-mobile-390.jpg`), and reserves catalog skeleton geometry in `platform/index.html` to eliminate the `0.378` cold-cache layout shift (`performance.json`). |

---

## 2. Top 10 Substantial Enhancements (High Pedagogical, UX & Reliability Impact)

| Rank | ID | Enhancement Title | Target Screen / Component | Weighted Score (`30/25/15/15/15`) | Effort & Risk | Core Specification & Verification Method |
|---:|---|---|---|---:|---|---|
| **1** | **E02** *(+ E25)* | **Preserve Learner Draft Work Across Content Revisions** | `platform/platform.js` (`safeProgress`, lines 22–36) & all 17 tools in Lessons 2–6 | **`91.0`** `[5, 5, 5, 4, 3]` | `3–5 days` · Medium risk | **Essential data-safety fix.** Archives sanitized, bounded `drafts` inside `previousProgress` when `contentVersion` changes (instead of wiping `drafts: {}`), displays a one-time revision diff summary (`E25`), and renders a read-only *"Previous version draft"* panel with explicit copy-into-current-field actions. Verified by automated multi-version upgrade tests. |
| **2** | **E03** | **Make Progress Exports Recoverable via Validated Local Import** | `platform/platform.js` & `course/app.js` export/restore controls | **`82.0`** *(Essential)* `[4, 5, 5, 3, 3]` | `5–8 days` · Medium risk | **Essential recovery fix.** Adds `<input type="file" accept=".json">` restore workflow with schema validation, dry-run diff preview (showing lessons, versions, checkpoints, and draft fields to merge/replace), automatic pre-import backup download, and negative-fixture tests (corrupt JSON, oversized strings, wrong schema). |
| **3** | **E09** | **Reviewable Handoff from Lesson Builders to Original CARANA Workbenches** | `02-06` → `module2.html`; `03-07` → `module3.html`; `05-05` → `module5.html`; `06-06` → `module6.html` | **`88.0`** `[5, 5, 5, 3, 3]` | `6–10 days` · Medium risk | Bridges the gap between self-paced study and practical application. Displays a structured handoff comparison (*What you drafted in the lesson* vs *What the CARANA workbench asks*) and offers an explicit, learner-consented local copy with preview—never overwriting `carana_cbd_lab_v1` silently. |
| **4** | **E10** *(+ E20)* | **Vary the Learning Rhythm Across the 38 Expanded Screens by Cognitive Task** | `platform/platform.js` (`render`) & `curricula/cbd/*.json` (all 38 screens) | **`88.0`** `[5, 5, 4, 3, 4]` | `6–9 days` · Medium risk | Replaces the uniform 8-block vertical stack across all 38 screens with three deliberate task patterns (*Explain/Compare*, *Investigate/Classify*, *Construct/Self-Review*), removes the 37 duplicate `h1`/`visual.h2` headings, and formats raw PDF filenames into clean expandable citations (`E20`). |
| **5** | **E22** | **Independent Assistive-Technology & Physical-Device Acceptance Protocol** | macOS/iOS VoiceOver, keyboard focus paths, live regions (`02-03` range slider announcements), touch targets | **`88.0`** `[4, 5, 5, 3, 5]` | `4–7 days` · Low risk | Moves beyond sampled Axe scans (`0` violations) to execute and document a structured VoiceOver + physical mobile/tablet test protocol, debouncing noisy `oninput` live announcements on `02-03` and verifying focus retention across all disclosures and recovery dialogs. |
| **6** | **E11** | **Give Core Frameworks Their True Relational Structure in Lessons 2–6** | `02-01` (SSR system), `03-10` (4-column logframe row), `04-05`/`04-07` (iterative SARA/problem-solving loop), `06-03` (4 transition principles) | **`86.0`** `[5, 4, 5, 3, 4]` | `8–12 days` · Medium risk | Replaces uniform 1- or 2-column button lists (`data-kind="chain|compare|cycle"`) on key anchor screens with purpose-built semantic HTML/SVG diagrams matching Lesson 1's `visual-journey.js` craft (e.g., an interactive 4-column logframe table on `03-10` and a feedback-loop diagram on `04-05`). |
| **7** | **E16** | **Use Checkpoints for Retrieval, Option-Specific Parity & Error Justification** | All 78 checkpoint items (`36` in Lesson 1 + `42` in Lessons 2–6) | **`83.0`** `[5, 4, 5, 3, 3]` | `5–8 days` · Medium risk | Adds option-specific distractor feedback to Lesson 1's 36 items (matching Run 02's 42 items), links wrong attempts to the exact teaching concept, and adds a brief retrieval/justification prompt on retry so mastery reflects reasoning rather than click convergence. |
| **8** | **E18** | **Transform `platform/demo.html` into a Bounded 3-Minute Stakeholder Walkthrough** | `platform/demo.html` & `course/visual-gallery.html` | **`83.0`** `[4, 4, 5, 4, 4]` | `3–5 days` · Low–Med risk | Replaces the `cbd2` selector option that embeds the entire checkpoint-gated Lesson 2 shell inside a `750px` iframe (`probe-demo.jpg`) with direct, ungated interactive previews of the flagship Run 02 tools (`02-03` Priority Lab, `02-04` SMART Builder, `03-10` Logframe Row) alongside Lesson 1's gallery scenes. |
| **9** | **E14 + E15** | **Upgrade Priority Sensitivity (`02-03`) & Risk Matrix (`03-06`) into Deeper Reasoning Tools** | `platform/learning-tools.js` (`priority` on `02-03`, `risk` on `03-06`/`03-07`) | **`80.0`** `[4–5, 4, 4, 3–4, 3–4]` | `6–10 days` · Low–Med risk | On `02-03` (`E14`), explicitly detects ties and all-zero weights (`probe-priority-tie.png`) and lets learners compare two saved weight profiles. On `03-06` (`E15`), connects the 3×3 matrix cells to concrete **Prevention** (likelihood), **Mitigation** (impact), and **Contingency** (`03-07`) choices. |
| **10** | **E17 + E24** *(+ E19, E23)* | **Differentiate the 14 Cinematic Storyboards & Enforce Cross-Shell Content Validation** | `curricula/cbd/*.json` (`artwork`), `tools/validate-content.cjs`, preparation checklist (`E19`) | **`80.0 / 77.0`** `[4, 4, 5, 3–4, 4]` | `6–10 days` · Low–Med risk | Replaces the duplicate lesson-wide `teachingPrompt` strings in Lessons 3–6 and repetitive "people at a desk" briefs with distinct visual dilemmas and non-final storyboards before any paid media production (`E17`), and adds cross-shell route/version/heading checks to `validate-content.cjs` (`E24`). |

---

## 3. Top 3 Transformative Opportunities (Strategic Multi-Week Differentiators)

These three larger initiatives can elevate CARANA E-Learning from an exemplary self-paced course into a signature professional decision-support and reflective-practice environment for international policing:

### Transformative Opportunity 1 — Connected Evidence-to-Decision Notebook Across the Six CBD Phases (`E08`)
- **Weighted Score:** **`85.0 / 100`** (`Educational: 5, Learner: 5, Institutional: 5, Feasibility: 2, Risk/Maintainability: 3`)
- **Indicative Effort:** `20–30` engineering days + `8–12` instructional-design/SME days + `6–10` QA days.
- **The Problem It Solves:** In the official UNPOL curriculum, the six CBD lessons form one continuous analytical chain (*Situational Analysis → Objective Setting → Planning → Implementation → Evaluation → Transition*). Currently, even though Lessons 2–6 refer to an invented *"case-file review routine"*, each lesson's drafting tools are isolated silos: a learner's baseline observation in Lesson 1, SMART objective in Lesson 2 (`02-04`), indicator plan (`02-08`), logframe row in Lesson 3 (`03-10`), communication repair in Lesson 4 (`04-02`), evaluation plan/response in Lesson 5 (`05-03`/`05-04`), and phased handover in Lesson 6 (`06-05`) never reference or feed one another.
- **How It Works:**
  1. Introduces a persistent, browser-local **Evidence-to-Decision Notebook** (`carana_learning_v1.notebook`).
  2. When the learner drafts a SMART objective in `02-04`, their selected Lesson 1 diagnostic evidence + uncertainty note (`E23`) is pinned above the scaffold.
  3. When they construct a logframe row in `03-10`, their own `02-04` objective and `02-08` indicator populate the reference header, prompting them to verify whether their measure and assumptions actually match their stated objective.
  4. If they later revise an upstream assumption (e.g., during Lesson 5 Evaluation), downstream notebook cards flag the revision for review and export as a cohesive, portfolio-grade **CBD Advisory Dossier**.

### Transformative Opportunity 2 — Transparent Self, Peer, and Facilitator Reasoning Rubrics & Revision Comparison (`E12`)
- **Weighted Score:** **`85.0 / 100`** (`Educational: 5, Learner: 5, Institutional: 5, Feasibility: 2, Risk/Maintainability: 3`)
- **Indicative Effort:** `12–18` engineering days + `8–12` SME/design days + `5–8` QA days.
- **The Problem It Solves:** Open-text drafting scaffolds (`02-04`, `03-10`, `04-02`, `05-04`, `06-05`) currently stop at binary non-empty completeness checks (`"x"` passes completeness) while rightly refusing opaque AI auto-grading (`E28`). Learners need structured feedback on the *quality of their reasoning* without surrendering evaluation to a black-box LLM.
- **How It Works:**
  1. After drafting a response, the learner steps through an interactive **Diagnostic Self-Check Rubric** (3–4 source-derived criteria per builder, such as *"Separates activity delivery from operational practice change"*, *"Names who must agree feasibility"*, *"States baseline uncertainty explicitly"*).
  2. For each criterion, the learner tags whether their draft addresses it or marks it *"Needs revision"*, compares their text side-by-side with an annotated contrast (*Weak Draft* vs *Defensible Draft*), and saves a **Version 1 → Version 2 revision diff** with a 1-sentence note on what they changed.
  3. In facilitated or syndicate courses, the exported Study Sheet (`E07`) includes a structured **Peer / Facilitator Challenge Block** so a colleague or instructor can record targeted feedback during debrief.

### Transformative Opportunity 3 — An Evolving, Bounded Professional Case with Mid-Course Evidence Updates (`E13`)
- **Weighted Score:** **`82.0 / 100`** (`Educational: 5, Learner: 5, Institutional: 5, Feasibility: 2, Risk/Maintainability: 2`)
- **Indicative Effort:** `15–25` engineering days + `10–15` SME/design days + `6–10` QA days.
- **The Problem It Solves:** Real capacity-building rarely unfolds linearly; early diagnoses are incomplete, counterparts rotate, and well-intentioned reforms create unintended shift burdens. Currently, screen decisions (`data-choice`) have no memory or downstream consequence.
- **How It Works:**
  1. Threads a single, richly authored fictional advisory case (distinct from the protected CARANA workbench solution keys) across key decision screens (`1.1` → `02-03` → `03-06` → `04-07` → `05-06` → `06-07`).
  2. Introduces **two bounded evidence updates** where new field observations contradict the initial assumption (e.g., in Lesson 4 `04-07`, a counterpart reveals a shift-rota conflict behind "late" reviews; in Lesson 5 `05-06`, aggregate completion rises to 80% while one outlying shift experiences a new participation barrier).
  3. Allows **two defensible advisory pathways** (neither scored as a simplistic single "right" number) and requires the learner to compare how their initial plan must adapt when the evidence changes.

---

## 4. Explicitly Deferred or Rejected Proposals (Governance Safeguards)

| ID | Proposal | Disposition & Score | Rationale |
|---|---|---|---|
| **E28** | Auto-grade learner policing drafts with an external AI/LLM service | **REJECT (`28.0`)** | Violates local-first privacy, creates external API cost/egress dependencies, and risks hallucinating doctrinal approval on sensitive policing judgements. |
| **E29** | Migrate static platform to a heavy SPA framework or add compulsory login/LMS auth now | **REJECT / DEFER (`28.0`)** | Current zero-dependency architecture is fast, offline-buildable, and proven for multi-curriculum JSON rendering (`mma-orientation.json`). |
| **E30** | Commission all 14 cinematic illustrations and 38 audio tracks immediately | **DEFER (`72.0`)** | Producing paid media before completing screen rhythm (`E10`) and storyboard differentiation (`E17`) would waste budget on assets that need re-recording or re-rendering. |
| **E21** | Build Service-Worker offline caching now | **DEFER (`65.0`)** | Defer until the owner specifies target field-deployment topology (downloadable local zip pack vs PWA cache) to avoid stale audio/script caching bugs. |
