# Technical, Accessibility, Multi-Curriculum & Demo Review (Run 03A)

**Reviewed Target:** `aff6ab0c003995a0b2382bb04c8083359ae81597`
**Scope:** Architecture, state persistence, content versioning, security, performance, accessibility (WCAG/assistive technology), multi-curriculum readiness (CBD, MMA, COP), and institutional demonstration (`platform/demo.html`).

---

## 1. Architecture, State Persistence & Content Versioning (`E02`, `E03`, `E04`, `E24`)

### A. Three-Key Browser-Local Storage Architecture
The application intentionally isolates browser-local state across three `localStorage` keys:

| Key | Owning Runtime | Schema & Capabilities | Identified Technical Gaps |
|---|---|---|---|
| `carana_cbd_lab_v1` | `js/storage/lab-storage.js` (Original Workbenches `module1`–`6`) | Schema `1.0.0`. Deep merge, corrupted-JSON backup quarantine (`_corrupted_backup`), multi-tab `storage` event reconciliation, full JSON export **and** validated JSON import (`importLabFromJson`), HTML-escaped print dossier. | None inside the workbench; however, no read-only bridge or user-consented import from `carana_learning_v1` exists (`E09`). |
| `carana_cbd_course_v1` | `course/app.js` (Lesson 1 Studio) | Version `1`. Tracks `completed` (0..5), `visited` (`"s:n"`), `activityOpened`, `lessonComplete`, `lastSection`, `lastScreen`, `lastKind`. Reads `carana_cbd_lab_v1.module1.confirmed`. Has JSON export (`exportProgress`). | Not read by `/platform/?course=cbd` catalog (`E04`); has no JSON import/restore control (`E03`). |
| `carana_learning_v1` | `platform/platform.js` (Lessons 2–6 & future curricula) | Version `1`. Per-lesson map `{contentVersion, completed, section, screen, view, drafts, previousProgress}`. Validates draft bounds via `learningTools.validDraft`. Has JSON export (`exportProgress`). | **Drops `raw.drafts` on `contentVersion` mismatch (`E02`)**; has no JSON import/restore control (`E03`); exports raw JSON only (`E07`). |

### B. Exact Code Defect in `safeProgress()` (`E02`)
In `platform/platform.js` (lines 22–28):
```js
function safeProgress(data){
 const raw=store.lessons[data.id];
 const previous=Array.isArray(raw?.previousProgress)?raw.previousProgress.filter(p=>typeof p?.contentVersion==='string'&&Array.isArray(p.completed)).slice(-4):[];
 const oldRecord=raw&&typeof raw.contentVersion==='string'&&Array.isArray(raw.completed)?{
  contentVersion:raw.contentVersion.slice(0,80),completed:raw.completed.filter(n=>Number.isInteger(n)&&n>=0&&n<100),
  section:Number.isInteger(raw.section)?raw.section:0,screen:Number.isInteger(raw.screen)?raw.screen:0}:null;
 if(!raw || raw.contentVersion!==data.version) return {contentVersion:data.version,completed:[],section:0,screen:0,view:'screen',drafts:{},previousProgress:oldRecord?[...previous,oldRecord].slice(-5):previous};
```
When `raw.contentVersion !== data.version`:
1. `oldRecord` omits `raw.drafts`.
2. Even if an older `previousProgress` entry had `drafts`, any sanitized archive needs explicit bounds validation so malformed or oversized storage payloads cannot bloat `localStorage`.
3. **Fix Specification (`E02`):** Include a sanitized, size-bounded `drafts` object (`archiveDrafts(raw.drafts)`) in `oldRecord` and preserve `p.drafts` in `previous`, capped at 5 historical versions and `<= 1200` chars per field. Expose archived drafts in a read-only disclosure panel on builder screens.

### C. Content Contract & Build Verification (`E24`)
- `tools/validate-content.cjs`, `tools/build-course.mjs`, and `tools/release/prepare.cjs` provide strong static build guarantees: zero external runtime dependencies, cryptographic SHA-256 verification of all 18 Lesson 1 MP3s and scripts (`tools/narration-lock.json`), and strict exclusion of `.pdf`, `docs/`, `tests/`, and `.env` from `.vercel/output/static`.
- **Enhancement (`E24`):** Extend `tools/validate-content.cjs` to check cross-shell route consistency (ensuring `/course/` and `/platform/` return links resolve and status strings do not contradict `catalog.js`), enforce unique `teachingPrompt` strings across artwork specifications (`E17`), and flag duplicate `screen.title === screen.visual.title` headings (`E10`).

---

## 2. Security, Privacy & Epistemic Integrity (`E28`, `E29`)

- **XSS & Injection Defense:** Both `platform/platform.js` (`esc`), `platform/learning-tools.js` (`esc`), `course/app.js` (`clean`), and `js/storage/lab-storage.js` escape all dynamic and user-authored strings before HTML insertion. Unit test `authored tool HTML escapes content rather than interpreting it as markup` (`tests/platform/learning-tools.cjs`) and `P1-N01: Security — Dossier XSS neutralization` (`tests/run-tests.js`) pass.
- **Zero External Egress / Privacy:** No learner drafts, checkpoints, or analytics are transmitted over the network. In `course/index.html`, web fonts (`fonts.googleapis.com`) are not even loaded via external `<link>` tags; system/local font stacks are used safely.
- **Why External AI Auto-Grading Must Be Rejected (`E28`):** Sending police learners' open-text drafts to an external LLM API would create data-egress/privacy liabilities, require API keys/backend infrastructure, and risk hallucinated doctrinal approval. Keep all draft review local, rubric-based, and human-transparent (`E06`, `E12`).

---

## 3. Performance & Cold-Cache Layout Stability (`E31`, `E21`)

From `VISUAL_EVIDENCE/probes/performance.json` and `layout-shift-attribution.json` (3 trials per route under throttled cold-cache emulation: `150ms` RTT, `200KiB/s` down, `4×` CPU):

| Route | Requests | Transfer Size | DOMContentLoaded | LCP | Lab CLS | Root Cause of CLS |
|---|---:|---:|---:|---:|---:|---|
| `/course/` | 19 | `275.3 KB` | `1,715–1,725 ms` | `1,796–1,828 ms` | **`0.000`** | Stable initial shell layout; audio uses `preload="none"`, images declare `width="1672" height="941"`. |
| `/platform/?course=cbd` | 4 | `35.2 KB` | `507–553 ms` | `528–556 ms` | **`0.378`** | `<div id="app"><p>Loading learning catalog…</p></div>` (`27.2px` tall) is replaced synchronously/asynchronously by the full catalog (`771px` tall), shifting `<footer>` down from `y=756px`. |

- **Fix Specification (`E31`):** Give `#app` in `platform/platform.css` a `min-height: 72vh` (matching `main`'s reserved height) or pre-render the static catalog skeleton inside `platform/index.html` so `<footer>` never shifts during initial script execution.
- **Offline Distribution Profile (`E21` — Defer Until Operational Topology Agreed):** While all assets are static and local-first, neither `/platform/` nor `/course/` registers a Service Worker or downloadable offline zip bundle. Because caching 18 MP3s + JSON + workbenches requires atomic version invalidation to avoid stale script/audio pairing, `E21` should remain deferred until the owner specifies target field-deployment conditions.

---

## 4. UI/UX & Accessibility Assessment (`E05`, `E22`, `E26`, `E27`)

- **Automated Accessibility Evidence:**
  - **25 sampled Axe-core scans** (`3` in `VISUAL_EVIDENCE/lesson1/` + `22` in `VISUAL_EVIDENCE/expanded/` covering every lesson opening and all 17 applied tools) recorded **`0` violations**.
  - **Semantic Controls:** All concept nodes and decision options use native `<button type="button" aria-pressed="false|true">`. Live regions (`role="status"`, `aria-live="polite"`) announce concept reveals, decision feedback, quiz hints, and save status. Focus management (`focus()` in `platform/platform.js` and `focusHeading()` in `course/app.js`) moves focus to `<h1>` on screen navigation.
  - **Responsive & RTL Reflow:** All 38 expanded screens and `demo.html` pass `320px` and `768px` LTR and RTL horizontal-overflow checks (`tests/platform/layout.cjs` and `screen-metrics.jsonl`: `0` overflows).
- **Remaining Accessibility & UX Gaps:**
  1. **Mobile Rail Preceding Content (`E05`):** Moving `<h1>` to `785px` (`390px` viewport) forces touch and mobile screen-reader users to traverse the entire section navigation and export block on every screen view unless they use the skip link or scroll manually.
  2. **Silent `maxlength="1200"` Truncation (`E26`):** Pasting or typing near 1,200 characters in builder `<textarea>` elements gives no remaining-character announcement or visual counter.
  3. **No Full Assistive-Technology / Physical-Device Acceptance (`E22`):** Sampled Axe scans and automated Playwright WebKit runs do not test real macOS/iOS VoiceOver reading order, dynamic `role="status"` verbosity when sliders (`02-03`) fire on every `oninput` tick, or physical touch ergonomics. In fact, on `02-03`, `#priority-result` has `role="status"` and updates on every `oninput` event of `<input type="range">`, which can cause screen readers to queue repetitive live announcements while dragging a slider. Executing a structured VoiceOver + physical device acceptance protocol (`E22`) will catch and refine these live-region nuances.

---

## 5. Multi-Curriculum Ecosystem Assessment (CBD, MMA, COP) (`E24`, `E29`)

- **Honest Readiness Representation:** `platform/catalog.js` and `tools/validate-content.cjs` (line 52: `assert.equal(c.lessons.length, 0, 'Readiness curriculum must not be presented as an available course')`) ensure that **MMA** and **COP** are presented strictly as verified source-inventory pathways (`Conversion readiness · no digital course available`) rather than fake or empty courses.
- **Proven Renderer Reusability:** `tests/platform/mma-orientation.json` and `tests/platform/browser.cjs` prove that the shared `platform/` runtime dynamically renders a second curriculum with a different lesson/section/screen/checkpoint shape while keeping `carana_learning_v1` progress completely isolated by lesson ID.
- **External Activity Integration Boundary:** As documented in `docs/expansion/ACTIVITY_INTEGRATION_MAP.md`, MMA has a separate React/Vite repository (`maissaramoheb/mma-activity-lab` with 3 classroom activities: `MMA-R01`, `MMA-K02`, `MMA-N03`) requiring multi-group projector/role-card privacy safeguards, while COP has no separate activity codebase yet. Preserving the lightweight static catalog without premature LMS/framework migration (`E29`) is the right engineering decision.

---

## 6. Institutional Demonstration Review (`platform/demo.html`) (`E18`)

- **Strengths:** `platform/demo.html` clearly states the training challenge, distinguishes working Lesson 1 implementation from Run 02 review adaptations and MMA/COP source inventories, presents the exact reconciled USD budget scenarios (`$77,880` / `$120,340` / `$202,400` matching `docs/institutional/budget-model.json`), and includes a prominent **Evidence boundary** banner.
- **Verified Flaw (`E18`):**
  - When a reviewer selects `Lesson 2 objective-setting journey (review)` (`value="cbd2"`) in `#scene`, `demo.html` loads `./?course=cbd&lesson=cbd-2` inside the `750px`-high `#learning-demo` iframe (`VISUAL_EVIDENCE/probes/probe-demo.jpg`).
  - Because `/platform/?course=cbd&lesson=cbd-2` renders its own `<header>`, `<aside class="rail">`, and checkpoint-gated sections inside the iframe, a stakeholder trying to preview the new Run 02 applied tools (`02-03` priority lab or `02-04` SMART builder, which are in Section 2) is **blocked by Section 1's 3-question checkpoint gate inside a nested iframe**!
- **Recommended Solution (`E18`):** Replace the full-course iframe option with a bounded, 3-minute guided demonstration mode (or add direct isolated preview targets in `visual-gallery.html` / `demo.html` for the `02-03` Priority Lab, `02-04` SMART Builder, and `03-10` Logframe Row) so stakeholders can experience the best Run 02 innovations immediately without nested headers or checkpoint gates.
