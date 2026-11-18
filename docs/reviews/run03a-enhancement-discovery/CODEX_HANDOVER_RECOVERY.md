# Codex Run 03A Handover Recovery & Verification Report

**Prepared:** 18 November 2026
**Target Commit:** `aff6ab0c003995a0b2382bb04c8083359ae81597` (`codex/carana-run03a-review`)
**Recovery Status:** Complete — all uncommitted Codex scripts, metrics, probe outputs, screenshots, and enhancement registers preserved and verified against source code.

---

## 1. Recovered Working-Tree Inventory

When Codex paused due to credit exhaustion, it was on branch `codex/carana-run03a-review` (branched cleanly from `codex/cbd-instructional-run02` at `aff6ab0c003995a0b2382bb04c8083359ae81597`). Zero tracked application files were modified or corrupted. All uncommitted Run 03A work resided under `docs/reviews/run03a-enhancement-discovery/`:

| Artifact Category | Path | Recovered Contents & Purpose |
|---|---|---|
| **Enhancement Register (Markdown)** | `ENHANCEMENT_REGISTER.md` | Complete 31-item enhancement register (`E01`–`E31`) with weighted scores (`30/25/15/15/15`), locations, observed evidence, proposals, complexity estimates, and acceptance criteria. |
| **Enhancement Register (Machine-Readable)** | `enhancements.json` | Structured JSON backing `ENHANCEMENT_REGISTER.md` (31 records with `selection` tags: `quick`, `substantial`, `substantial/transformative`, `creative`, `optional`, `defer`, `reject`). |
| **Read-Only Journey Instrumentation** | `review-runner.cjs` | Wrapper around `course/tests/browser.cjs` (`legacy`) and `tests/platform/browser.cjs` (`expanded`) that captures per-screen DOM metrics (`screen-metrics.jsonl`) and full-page Chromium JPEGs. |
| **Targeted Issue Probes** | `targeted-probes.cjs` | Playwright probe exercising nonsense draft input (`"x"`), import control count, zero-weight priority tie, cross-version draft loss, Lesson 1 → Course home navigation dead-end, mobile lead distance (`390px`/`768px`), and `demo.html` iframe nesting. |
| **Cold-Cache Layout & Performance Probe** | `performance-probe.cjs` | 3-trial CDP throttled performance and layout-shift probe (`150ms` RTT, `200KiB/s` down, `4×` CPU, web fonts blocked) comparing `/platform/?course=cbd` and `/course/`. |
| **Lesson 1 Visual & Metric Evidence** | `VISUAL_EVIDENCE/lesson1/` | 54 rows in `screen-metrics.jsonl` (18 screens × 3 browser profiles), 18 full-page JPEGs (`screen-L1-01-01.jpg`–`06-03.jpg`), 12 Chromium/WebKit desktop & mobile PNGs, 2 gallery responsive PNGs (`320px`, `768px`), and 3 Axe JSON reports (`0` violations). |
| **Expanded Lessons 2–6 Evidence** | `VISUAL_EVIDENCE/expanded/` | 114 rows in `screen-metrics.jsonl` (38 screens × 3 browser profiles), 38 full-page JPEGs (`screen-L2-02-01.jpg`–`screen-L6-06-06.jpg`), 66 Chromium/WebKit desktop & mobile PNGs for lessons and all 17 tools, and 22 Axe JSON reports (`0` violations). |
| **Probe Outputs & Screenshots** | `VISUAL_EVIDENCE/probes/` | `targeted-probes.json`, `performance.json`, `layout-shift-attribution.json`, and 6 diagnostic screenshots (`probe-draft-x.png`, `probe-priority-tie.png`, `probe-old-home.jpg`, `probe-mobile-390.jpg`, `probe-mobile-768.jpg`, `probe-demo.jpg`). |

**Missing Files at Interruption:** Codex had not yet written `VISUAL_EVIDENCE/INDEX.md` (referenced on line 3 of `ENHANCEMENT_REGISTER.md`) or the narrative deliverables (`ANTIGRAVITY_PROJECT_CONTEXT.md`, `CODEX_HANDOVER_RECOVERY.md`, `EXECUTIVE_ASSESSMENT.md`, `LEARNER_JOURNEY_REVIEW.md`, `INSTRUCTIONAL_ENHANCEMENTS.md`, `VISUAL_AND_INTERACTION_REVIEW.md`, `TECHNICAL_AND_ACCESSIBILITY_REVIEW.md`, `TOP_ENHANCEMENTS.md`, `IMPLEMENTATION_BLUEPRINT.md`, `OWNER_DECISION_BRIEF.md`). All existing Codex files have been preserved untouched, and the missing deliverables are now completed.

---

## 2. Verification & Deep Analysis of Codex's Preliminary Findings

### Finding 1 — Navigation Inconsistency Between Platform Catalog and Legacy Course Home (`E01`, `E04`)

- **Preliminary Observation:** Opening Lesson 1 from `/platform/?course=cbd` and choosing **Course home** leads to the older landing page (`/course/#home`), which still presents Lessons 2–6 as coming later and has no link back to `/platform/`.
- **Source-Code Verification:**
  1. In `platform/catalog.js` (line 3), Lesson 1 is configured with `href: '../course/#lesson-1'`.
  2. In `platform/index.html` (line 3), the top navigation link **Practice library** points to `../course/#activities`.
  3. In `course/app.js` (lines 75, 276, 280), clicking `← COURSE HOME` (`#back-home`) inside Lesson 1 calls `goHome()`, which sets `window.location.hash = '#home'` and renders `renderHome()` inside `/course/`.
  4. In `course/app.js` (lines 155–162, 174, 180, 215, 221, 232), `CURRICULUM_PHASES` hardcodes Phases 02–06 with `status: 'SELF-PACED LESSON PLANNED'`, badge `'LESSON IN DEVELOPMENT'`, footer `'Self-paced lesson coming later'`, stat `'01/06 SELF-PACED LESSONS LIVE'`, and disclaimer `'Only Lesson 1 is currently available as a self-paced course'`.
  5. Similarly, in `course/app.js` (lines 257–263), the Activities Hub (`/course/#activities`) binds `Course home` (`#activities-home`) and `Back to course home` (`#hub-home`) to `goHome()` (`/course/#home`).
  6. Furthermore, a third hub exists at the repository root (`index.html` — the original CARANA CBD Learning Lab Hub for `module1.html`–`module6.html`).
- **Empirical Evidence:** `VISUAL_EVIDENCE/probes/targeted-probes.json` confirms `homeCopyComingLater: 5` and `hasPlatformReturnLink: 0`. Visual proof is captured in `VISUAL_EVIDENCE/probes/probe-old-home.jpg`.
- **Recommended Solution (`E01` + `E04`):**
  - Keep Lesson 1's internal teaching screens, audio, visuals, and storage key (`carana_cbd_course_v1`) untouched.
  - Establish a single coherent course-home navigation contract: provide an explicit return route from `/course/` (`#lesson-1`, `#home`, and `#activities`) to `/platform/?course=cbd` (or reconcile the `/course/#home` phase cards so Phases 02–06 reflect their actual review-adaptation status and link to `/platform/?course=cbd&lesson=cbd-2`..`cbd-6`).
  - Add a read-only progress adapter in `platform/platform.js` so the CBD catalog card for Lesson 1 displays actual checkpoint progress from `carana_cbd_course_v1` alongside Lessons 2–6 (`carana_learning_v1`).

---

### Finding 2 — Silent Loss of Learner Drafts Across Content Versions (`E02`, `E25`)

- **Preliminary Observation:** A synthetic learner draft from an earlier content version (`contentVersion: 'previous-fixture'`) was lost when the lesson version changed to `'2026.11-run02'`, even though prior checkpoint metadata survived in `previousProgress`.
- **Source-Code Verification:**
  - Inspecting `platform/platform.js` lines 22–36 (`safeProgress(data)`):
    ```js
    const previous=Array.isArray(raw?.previousProgress)?raw.previousProgress.filter(p=>typeof p?.contentVersion==='string'&&Array.isArray(p.completed)).slice(-4):[];
    const oldRecord=raw&&typeof raw.contentVersion==='string'&&Array.isArray(raw.completed)?{
     contentVersion:raw.contentVersion.slice(0,80),completed:raw.completed.filter(n=>Number.isInteger(n)&&n>=0&&n<100),
     section:Number.isInteger(raw.section)?raw.section:0,screen:Number.isInteger(raw.screen)?raw.screen:0}:null;
    if(!raw || raw.contentVersion!==data.version) return {contentVersion:data.version,completed:[],section:0,screen:0,view:'screen',drafts:{},previousProgress:oldRecord?[...previous,oldRecord].slice(-5):previous};
    ```
  - **Root Cause:**
    1. When `raw.contentVersion !== data.version`, `oldRecord` extracts only `contentVersion`, `completed`, `section`, and `screen`. It **omits `raw.drafts`**.
    2. Even if an older entry in `raw.previousProgress` contained drafts, the filter on line 24 (`raw.previousProgress.filter(...)`) is followed on subsequent version bumps by `oldRecord` construction that strips `drafts`.
    3. Immediately upon the first navigation or interaction (`save()` on line 38), `store.lessons[lesson.id] = state` overwrites the `localStorage['carana_learning_v1']` lesson record with `drafts: {}`.
- **Distinguishing Intentional Version Isolation from Unintended Data Loss:**
  - **Intentional (and Correct):** Resetting `completed: []` when `contentVersion` changes is sound governance—completion of an older lesson version must not grant mastery checkpoints for revised instructional content and assessments.
  - **Unintended Data Loss (Defect):** Discarding `raw.drafts` destroys learner-authored text across up to 9 multi-field drafting scaffolds (up to 39 textareas across Lessons 2–6, 1,200 characters each). Because field indices (`0..4`) or prompts may change between content versions, silently injecting old draft strings into new field indices would risk semantic misalignment; however, **failing to archive `drafts` inside `previousProgress` (and failing to expose a read-only "Previous version draft" panel in the UI)** causes permanent, silent loss of learner work.
- **Empirical Evidence:** `VISUAL_EVIDENCE/probes/targeted-probes.json` confirms `oldDraftRetained: false` and shows `versionChangeExport.previousProgress[0]` containing only `{"contentVersion":"previous-fixture","completed":[0],"section":1,"screen":0}`.
- **Recommended Safe Preservation & Migration Approach (`E02` + `E25`):**
  1. Preserve bounded `drafts` (sanitized per screen ID and string-length-capped) inside `oldRecord` when pushing to `previousProgress` (retaining up to 5 prior versions).
  2. Never auto-mark checkpoints passed or silently overwrite changed scaffold structures; instead, when a builder screen has archived text in `previousProgress`, render a collapsible read-only **"Archived draft from version `<X>`"** panel beside the scaffold with a one-click **"Copy into current draft"** action per field or full text block.
  3. Replace the repetitive per-screen `.version-note` banner (`E25`) with a concise revision badge and a one-time summary of what changed and where archived drafts are stored.

---

### Finding 3 — Progress Recovery Usability and Builder Feedback Specificity (`E03`, `E06`, `E07`, `E26`)

Codex grouped two distinct issues under Finding 3. As instructed, we evaluate them separately:

#### Issue 3A — Progress Export Lacks a Learner-Facing Restore Control (`E03`, `E07`)
- **Source-Code Verification:**
  - Both `platform/platform.js` (`exportProgress()`, lines 43–46) and `course/app.js` (`exportProgress()`, lines 127–134) allow learners to download `carana-learning-progress.json` / `carana-cbd-lesson1-progress.json`.
  - When `localStorage.setItem` fails, both shells advise: *"Could not save progress. Export before closing."*
  - Yet neither `/platform/` nor `/course/` provides an `<input type="file">` or restore workflow to import that JSON file back into the browser (`importControls: 0` in `targeted-probes.json`). By contrast, the original CARANA workbench storage manager (`js/storage/lab-storage.js`) already implements strict schema-validated JSON import (`importLabFromJson`).
  - Additionally, the downloaded JSON file is a raw machine structure (`E07`), not a human-readable study sheet that a learner can bring to a syndicate discussion or facilitator debrief.
- **Recommended Solution (`E03` + `E07`):**
  - **Restore Control (`E03`):** Add a local, schema-validated JSON import control on the catalog and lesson rail with a dry-run preview (showing lessons, content versions, checkpoint counts, and draft counts to be merged or replaced), automatic pre-import backup download, and strict isolation of `carana_learning_v1`, `carana_cbd_course_v1`, and `carana_cbd_lab_v1`.
  - **Readable Study Sheet (`E07`):** Add a printable HTML/PDF study-work summary alongside the raw JSON export so learners can review and print their 9 structured drafts, classification notes, and self-review questions for classroom or peer discussion.

#### Issue 3B — Builder Scaffolds Use Generic Self-Review Prompts and Success-Styled Banners (`E06`, `E26`)
- **Source-Code Verification:**
  - In `platform/learning-tools.js` (lines 20, 30–33), every `builder` tool renders a button labelled **`Review my draft`** (`#lab-check`).
  - Clicking `#lab-check` checks only whether any field is empty (`!String(saved[i]||'').trim()`). If all fields contain at least one non-whitespace character (e.g., `"x"`), it unhides `#lab-feedback` (which has `class="feedback"` — styled in `platform/platform.css` line 3 with green background `#e5f4ed` and green border `#277557`, identical to a correct answer in `.decision`) and outputs:
    `"Your draft is ready for self-review, not automatically approved. " + x.review`.
  - Furthermore, while `<textarea>` elements have `maxlength="1200"`, there is no character counter (`E26`) and missing fields are listed only as a semicolon-separated string at the bottom (`"Draft fields still open: ..."`).
- **Empirical Evidence:** `VISUAL_EVIDENCE/probes/probe-draft-x.png` and `targeted-probes.json` (`nonsenseDraftFeedback`).
- **Recommended Solution (`E06` + `E26`, and why `E28` rejects AI auto-grading):**
  - **Honest Naming & Neutral Styling (`E06`):** Rename the button from `"Review my draft"` to **"Open self-review prompts"** (or **"Check completeness & self-review"**) and use a neutral informational callout style rather than the green `.feedback` pass banner.
  - **Field-Adjacent Self-Check Criteria (`E06`):** Display specific self-check criteria beside each drafted field (e.g., checking whether a SMART draft names an observable change rather than a workshop count, or whether a logframe row's measure matches its result level) and link incomplete fields directly to their inputs.
  - **Character Limit Visibility (`E26`):** Show remaining characters when approaching the 1,200-character bound.
  - **No Unvalidated AI Grading (`E28`):** Do **not** connect open-text policing drafts to an external LLM auto-grader; preserve local-first privacy, zero external data egress, and transparent human/peer/facilitator judgement.

---

### Additional Verified Probe Findings Recovered from Codex (`E05`, `E14`, `E18`, `E31`)

1. **Mobile Rail Pushes Content Below the Fold (`E05`):**
   - `targeted-probes.json` and `probe-mobile-390.jpg` / `probe-mobile-768.jpg` confirm that on Lesson 3 Screen `03-10`, the `<aside class="rail panel">` precedes `<article class="screen">`, placing `<h1>` at **`785px` from top on a `390px` viewport** and **`716px` on a `768px` viewport**.
2. **Priority Sensitivity Lab Tie & Zero-Weight Handling (`E14`):**
   - `targeted-probes.json` and `probe-priority-tie.png` confirm that setting all 4 weights to `0` on Screen `02-03` outputs two `0 weighted points` entries sorted alphabetically (`rank()` in `platform/learning-tools.js` line 7) without noting the tie or zero-information state.
3. **Institutional Demo Nested Course Iframe (`E18`):**
   - `targeted-probes.json` and `probe-demo.jpg` confirm that selecting `cbd2` in `platform/demo.html` sets `#learning-demo` `src` to `./?course=cbd&lesson=cbd-2` inside a `750px` iframe, embedding the full gated course shell inside the demo page.
4. **Catalog Cold-Cache Layout Shift (`E31`):**
   - `performance.json` and `layout-shift-attribution.json` confirm that across 3 cold-cache Chromium trials, `/platform/?course=cbd` records **CLS `0.378`** because `<div id="app"><p>Loading learning catalog…</p></div>` (`height: 27px`) is replaced asynchronously by the rendered catalog (`height: 771px`), shifting `<footer>` from `y: 756` out of the viewport. By contrast, `/course/` records **CLS `0.000`**.
