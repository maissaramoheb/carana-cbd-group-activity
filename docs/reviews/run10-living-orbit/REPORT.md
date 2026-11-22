# CARANA CBD — Run 10 Implementation & Verification Report
## The Living CBD Orbit

- **Branch:** `run10/cbd-cycle-spatial-depth`
- **Source Commit:** `29ee584b9097051f5e2cf59928e3bc673c67c24b`
- **Isolated Preview Deployment:** `dpl_DW2Dvko3mMZn7tuf5dFga1Xaouu4` (`target: null`, `READY`)
  - Home Preview URL: https://carana-cbd-elearning-arndzwap0-delta4ce20-5830s-projects.vercel.app/course/
  - Review Comparison Gallery: https://carana-cbd-elearning-arndzwap0-delta4ce20-5830s-projects.vercel.app/platform/review/run10/
  - Vercel Inspector: https://vercel.com/delta4ce20-5830s-projects/carana-cbd-elearning/DW2Dvko3mMZn7tuf5dFga1Xaouu4
- **Production Baseline (Untouched):** Commit `e956a9750e0e69d8d505e613f57353417d29c1af` (`dpl_3DCvskSyfmKNUFa8nzftoqPR2CLz`), https://e-learning.maissara.tech/ and https://cbd.maissara.tech/
- **Release Mode:** Isolated branch + isolated Vercel preview only (not merged to `main`, not promoted to production).

## 1. Summary of Changes
- `course/run10-living-orbit.css` (`19,908` bytes raw / `4,274` bytes gzip): Scoped spatial-depth instrumentation styling for `.curriculum-visual` including machined central dial (`.cycle-core`, `.cycle-core-dial`), 3-tier orbital hierarchy, beveled direct-navigation phase cards (`a.cycle-stage`), single-active connector lighting via `[data-active-phase]`, zero-shift CSS Grid intrinsic sizer layout for `.cycle-detail`, `@supports (transform-style: preserve-3d)` depth separation, `@media (prefers-reduced-motion: reduce)` flattening, `@media (forced-colors: active)` fallback, RTL launch-arrow mirroring, and 2-column/1-column mobile reflow (`<= 650px` and `<= 360px`, with uniform `:hover`/`focus-visible`/`[data-active="true"]` `min-height: 68px`).
- `course/app.js` (`+4,999` bytes delta): Converted the six `.cycle-stage` elements from toggle `<button>`s into semantic `<a>` navigation links (`#lesson-1` for Phase 01, `../platform/?course=cbd&lesson=cbd-2..6` preserving `&lang=`), added data-driven inline SVG 3-level orbital rings/ticks/spokes/chevrons (`viewBox="0 0 560 484"`), rendered `.cycle-detail-live` plus 7 `aria-hidden="true" inert` `.cycle-detail-sizer` layers from shared `getDetailState()` logic to keep panel height constant across all phases/languages/widths, preserved `resume()` clean unmount on Phase 01 navigation, and added `isConnected` safety guards on deferred `focusout` preview resets.
- `course/index.html`: Linked `./run10-living-orbit.css`.
- `platform/review/run10/`: Created owner visual comparison gallery (`index.html` + 17 paired before/after and narrow JPEGs in `comparisons/`) and functional direct-navigation verification matrix.
- `tools/review/deploy-run10-preview.cjs`: Isolated Vercel `--target preview` deployment script reusing the existing healthy AI gateway on port `8766`.
- `tests/i18n/run10-browser.cjs`: Dedicated cross-engine Playwright verification covering desktop, WebKit, 200% zoom, tablet reduced-motion, 390px mobile, and 320px narrow mobile across EN / FR / AR (RTL).

## 2. Verification Results (Local Gates)
- `npm test` — exited `0` (0 failures across all unit/platform/support/i18n Node suites).
- `npm run test:monitoring` — `6/6` passed (`tests/monitoring/privacy.cjs`).
- `npm run check:content` — passed (`lessons: 5, screens: 38, quizzes: 42`).
- `node tools/validate-i18n.cjs` — passed (`packsChecked: 8, uiLeaves: 1432, htmlPagesChecked: 15, englishLeaks: [], missingArabicScript: []`).
- `node tests/i18n/run10-browser.cjs` — passed (`chromium-desktop`, `webkit-desktop`, `chromium-zoom200`, `chromium-tablet-reduced`, `webkit-mobile`, `webkit-narrow`; 0 page errors; 0 Axe WCAG violations; all 6 direct-navigation routes and back-to-home paths verified with language/progress preservation).
- `tests/platform/navigation.cjs` (with local `/` -> `/course/` redirect matching `vercel.json`) — passed (`chromium` & `webkit-mobile`).
- `tests/platform/exploration-browser.cjs` — passed (`chromium` & `webkit-mobile`).
- `tests/support/audio-safety-browser.cjs` — passed (`chromium-desktop`, `webkit-desktop`, `webkit-mobile`).
- `tests/i18n/trilingual-browser.cjs` — passed (`chromium-desktop`, `webkit-desktop`, `webkit-mobile`).

## 3. Live Isolated Preview Verification
- **Routes & Assets (`vercel curl`):**
  - `/` -> `HTTP 307` (redirects to `/course/`)
  - `/course/` -> `HTTP 200` (includes `./run10-living-orbit.css`)
  - `/course/run10-living-orbit.css` -> `HTTP 200` (`19,908` bytes)
  - `/platform/review/run10/` -> `HTTP 200` (`20,343` bytes) and `comparisons/cycle-after.jpg` -> `HTTP 200`
  - `/platform/?course=cbd&lesson=cbd-2&lang=en` and `cbd-6&lang=ar` -> `HTTP 200`
  - `/api/health` -> `HTTP 200`, header `x-carana-node-major: 22`, body `{ ok: true, connected: true, model: "carana-gemma4-text" }`
- **Monitoring Controls on Preview:** `/js/monitoring.js` confirms `sampleRate: 0.1`, `webAnalytics: false`, `speedInsights: true`, and `/platform/review/run10/` excluded (`route()` returns `null`).
- **Playwright Live Verification (`dpl_DW2Dvko3mMZn7tuf5dFga1Xaouu4`):**
  - Review gallery: `17/17` comparison images loaded cleanly (`0` broken), `6` direct demo links, toggle mode switching, `0` Axe WCAG violations.
  - Desktop & Mobile Preview Hover/Focus Stability (`1440px`, `900px`, `390px`, `320px` across EN / `fr-FR` / `ar`): hovering all 6 phases, focusing all 6 phases, and leaving (`mouseleave`) kept `docH`, `scrollY`, `.hero-copy` top, `.cycle-orbit` top, `.cycle-detail` height, `.curriculum-highlights` top, and `#cycle-caption-phase`/`#cycle-caption-title` coordinates invariant within `<= 0.5px` (eliminating the pre-fix `+15.56px` `.cycle-detail` wrap growth, `+7.79px` hero centering shift, and `+12px` `<= 360px` card `min-height` specificity jump).
  - Desktop & WebKit Mobile Direct Navigation: `#lesson-1` and `platform/?course=cbd&lesson=cbd-2..6` roundtrips preserved language (`fr-FR`, `ar`) and learner storage with `0` page errors.
- **Production Invariance Confirmed:** Both `e-learning.maissara.tech` and `cbd.maissara.tech` remain bound to Run 09 production deployment `dpl_3DCvskSyfmKNUFa8nzftoqPR2CLz` (`e956a9750e0e69d8d505e613f57353417d29c1af`).

## 4. Performance Comparison (`PERFORMANCE.json`)
Diagnostic 5-run alternating fresh-context Chromium benchmark on `/course/?lang=en#home`:
- `Run09` medians: `domContentLoadedMs: 19.9`, `loadMs: 21.7`, `fcpMs: 52`, `orbitElementCount: 47`, `svgNodeCount: 6`
- `Run10` medians: `domContentLoadedMs: 19.6`, `loadMs: 21.7`, `fcpMs: 56`, `orbitElementCount: 111`, `svgNodeCount: 57`
- Initial Run 10 CSS footprint (`PERFORMANCE.json`): `18,724` bytes raw / `4,046` bytes gzipped; final hover-stability CSS footprint: `19,908` bytes raw / `4,274` bytes gzipped; zero new external libraries; zero WebGL; zero continuous animations.

## 5. Known Limitations & Rollback Reference
- **Inspirational image disclosure:** The Run 10 prompt referenced a previously approved inspirational image that was not attached in chat or found in workspace files; all visual decisions follow Section 2 specifications anchored to Run 09 (`e956a97`).
- **Rollback target:** Baseline commit `e956a9750e0e69d8d505e613f57353417d29c1af` / live production deployment `dpl_3DCvskSyfmKNUFa8nzftoqPR2CLz` remain untouched.
