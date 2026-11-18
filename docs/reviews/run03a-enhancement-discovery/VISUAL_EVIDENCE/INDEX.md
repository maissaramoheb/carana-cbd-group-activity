# Run 03A Visual & Probe Evidence Index

**Target Commit:** `aff6ab0c003995a0b2382bb04c8083359ae81597`
**Directory:** `docs/reviews/run03a-enhancement-discovery/VISUAL_EVIDENCE/`

This index maps the evidence identifiers referenced in `ENHANCEMENT_REGISTER.md` and the Run 03A review reports to the captured browser screenshots, DOM metric logs, and JSON probe outputs.

---

## 1. Targeted Diagnostic Probes (`VISUAL_EVIDENCE/probes/`)

| Evidence ID / File | Target Surface / Condition | Linked Enhancements | Key Observation |
|---|---|---|---|
| `probes/targeted-probes.json` | Automated Playwright probe output across `/platform/`, `/course/`, and `/platform/demo.html` | `E01`, `E02`, `E03`, `E05`, `E06`, `E14`, `E18` | Records `homeCopyComingLater: 5`, `hasPlatformReturnLink: 0`, `oldDraftRetained: false`, `importControls: 0`, `mobileLeadDistance390: 785`, `mobileLeadDistance768: 716`, and `nonsenseDraftFeedback`. |
| `probes/performance.json` | 3-trial cold-cache CDP throttled runs (`150ms` latency, `200KiB/s`, `4×` CPU, web fonts blocked) | `E31` | `/platform/?course=cbd`: LCP `528–556ms`, CLS `0.378`, `35,232` bytes (4 requests). `/course/`: LCP `1796–1828ms`, CLS `0.000`, `275,253` bytes (19 requests). |
| `probes/layout-shift-attribution.json` | LayoutShift attribution entries for `/platform/?course=cbd` | `E31` | Attributes CLS `0.378` to `#app` expanding from `27.2px` (`<p>Loading learning catalog…</p>`) to `771px` and pushing `<footer>` downward. |
| `probes/probe-old-home.jpg` | Catalog → Open Lesson 1 → `← COURSE HOME` (`/course/#home`) | `E01`, `E04`, `E24` | Shows legacy landing page with `01/06 SELF-PACED LESSONS LIVE`, five `"Self-paced lesson coming later"` cards, and zero links back to `/platform/`. |
| `probes/probe-draft-x.png` | Lesson 2 Screen `02-04` (`Draft an objective you can defend`) with `"x"` in all 5 fields | `E06`, `E12`, `E26` | Clicking `Review my draft` renders a green-bordered feedback box (`Your draft is ready for self-review, not automatically approved...`) identical in visual weight to a passed decision. |
| `probes/probe-priority-tie.png` | Lesson 2 Screen `02-03` (`Test how a priority changes`) with all 4 sliders set to `0` | `E14` | Both options display `0 weighted points` in a deterministic alphabetical order without a tie or zero-information notice. |
| `probes/probe-mobile-390.jpg` | Lesson 3 Screen `03-10` at `390×900` mobile viewport | `E05`, `E10` | Full header and 3-section rail stack above content; `<h1>` starts at `785px` vertical offset. |
| `probes/probe-mobile-768.jpg` | Lesson 3 Screen `03-10` at `768×900` tablet viewport | `E05`, `E10` | Uncollapsed rail precedes `<article class="screen">`; `<h1>` starts at `716px` vertical offset. |
| `probes/probe-demo.jpg` | `/platform/demo.html` with `#scene` set to `cbd2` | `E18` | Full `/platform/?course=cbd&lesson=cbd-2` workspace (including header, rail, and checkpoint gates) rendered inside a `750px` iframe. |

---

## 2. Lesson 1 Baseline Evidence (`VISUAL_EVIDENCE/lesson1/`)

| Evidence File / Group | Scope | Linked Enhancements | Summary |
|---|---|---|---|
| `lesson1/screen-metrics.jsonl` | 54 metric records (18 screens × `chromium`, `webkit-desktop`, `webkit-mobile`) | `E10`, `E23` | Median `224` words/screen (`min: 176`, `max: 355`); desktop median height `1,737px` (`1.83×` viewport); mobile median height `2,055px` (`3.09×` viewport); `0` horizontal overflows. |
| `lesson1/screen-L1-01-01.jpg` .. `screen-L1-06-03.jpg` | 18 full-page Chromium captures of every Lesson 1 screen | `E17`, `E23` | Documents the approved hybrid visual storytelling (screens `01-01`, `03-03`, `04-02`), interactive conceptual diagrams, narration player, and formative decisions. |
| `lesson1/chromium-home.png`, `webkit-desktop-home.png`, `webkit-mobile-home.png` | Lesson 1 `/course/` landing page across 3 profiles | `E01`, `E04` | Captures the 6-phase CBD orbit diagram and curriculum cards on `/course/#home`. |
| `lesson1/chromium-01-01.png`, `03-03.png`, `04-02.png` (+ WebKit desktop/mobile equivalents) | Hybrid cinematic + conceptual screens across 3 profiles | `E17`, `E23` | Confirms visual continuity and responsive behavior of the three approved Lesson 1 storyboards. |
| `lesson1/gallery-320.png`, `gallery-768.png` | `course/visual-gallery.html` at `320px` and `768px` | `E11`, `E22` | Confirms narrow and tablet reflow of the standalone visual gallery. |
| `lesson1/home-axe.json`, `checkpoint-axe.json`, `matrix-axe.json` | Sampled Axe-core accessibility scans on Lesson 1 | `E22` | `[]` (`0` automated violations across home, checkpoint, and 5×6 matrix views). |

---

## 3. Expanded Lessons 2–6 & Applied Tools Evidence (`VISUAL_EVIDENCE/expanded/`)

| Evidence File / Group | Scope | Linked Enhancements | Summary |
|---|---|---|---|
| `expanded/screen-metrics.jsonl` | 114 metric records (38 screens × `chromium`, `webkit-desktop`, `webkit-mobile`) | `E05`, `E10`, `E11` | Median `270–282` words/screen (`min: 184`, `max: 359`); desktop median height `1,880px` (`1.98×` viewport); mobile median height `2,641px` (`3.13×` viewport, max `4.31×`); `0` horizontal overflows. |
| `expanded/screen-L2-02-01.jpg` .. `screen-L6-06-06.jpg` | 38 full-page Chromium captures of every screen in Lessons 2–6 | `E10`, `E11`, `E17`, `E20` | Documents the uniform vertical screen rhythm (`banner → progress → h1 → lead → visual → points → transcript → lab → decision → takeaway → source`) and repeated `h1`/`h2` titles across 37 of 38 screens. |
| `expanded/chromium-cbd-2.png` .. `chromium-cbd-6.png` (+ WebKit desktop/mobile equivalents) | First screens of Lessons 2–6 across 3 browser profiles (15 PNGs) | `E05`, `E10`, `E11` | Confirms consistent navy/teal/mint typography and layout across Chromium and WebKit. |
| `expanded/chromium-tool-02-03.png` .. `chromium-tool-06-07.png` (+ WebKit desktop/mobile equivalents) | All 17 applied learning tools captured across 3 browser profiles (51 PNGs) | `E06`, `E07`, `E08`, `E09`, `E12`, `E14`, `E15`, `E26` | Captures all 9 builders (`02-04`, `02-08`, `03-10`, `03-07`, `04-02`, `05-03`, `05-04`, `06-05`, `06-07`), 6 classifiers (`02-05`, `03-02`, `03-08`, `04-03`, `05-06`, `06-02`), 1 priority lab (`02-03`), and 1 risk matrix (`03-06`). |
| `expanded/cbd-2-axe.json` .. `cbd-6-axe.json` & `02-03-tool-axe.json` .. `06-07-tool-axe.json` | 22 sampled Axe-core accessibility scans (5 lesson openings + 17 tools) | `E22` | `[]` (`0` automated violations across all 22 sampled states). |
